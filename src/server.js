const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackConfig = require('../webpack.config');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();

// Configuración del puerto
app.set('port', process.env.PORT || 3000);

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CONFIGURAR CORS para aceptar credenciales
app.use(cors({
    origin: 'http://localhost:3000', // Cambia si usas otro dominio
    credentials: true
}));

// Configurar sesiones
app.use(session({
    secret: 'mi_secreto_super_seguro',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../src/cliente')));
app.use(express.static(path.join(__dirname, '../dist')));

// Middleware de Webpack
app.use(webpackDevMiddleware(webpack(webpackConfig)));

// ==========================================
// Conexión a la base de datos
// ==========================================
const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'explora_bogota'
});

conexion.connect(error => {
    if (error) {
        console.error('Error de conexión a la base de datos:', error);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// ==========================================
// Configuración de Nodemailer
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bogotaentumano40@gmail.com',
        pass: 'qfdm xdka ugoh wvhr'
    }
});

const enviarCorreo = (asunto, mensaje) => {
    const mailOptions = {
        from: 'bogotaentumano40@gmail.com',
        to: 'bogotaentumano40@gmail.com',
        subject: asunto,
        text: mensaje
    };
    return transporter.sendMail(mailOptions);
};

// ==========================================
// RUTAS
// ==========================================

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/cliente/index.html'));
});

// Página de login
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/cliente/login.html'));
});

// API para obtener el usuario actual
app.get('/api/usuario', (req, res) => {
    if (req.session.usuario) {
        res.json({ usuario: req.session.usuario });
    } else {
        res.json({ usuario: null });
    }
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ mensaje: 'Error al cerrar sesión' });
        }
        res.redirect('/');
    });
});

// Registrar usuario
app.post('/registro', async (req, res) => {
    const { nombre, correo, contraseña, confirmar_contraseña } = req.body;

    if (contraseña !== confirmar_contraseña) {
        return res.status(400).json({ mensaje: 'Las contraseñas no coinciden.' });
    }

    conexion.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error de base de datos.' });
        if (results.length > 0) {
            return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(contraseña, 8);
        conexion.query('INSERT INTO usuarios SET ?', { nombre, correo, contraseña: hashedPassword }, (error) => {
            if (error) return res.status(500).json({ mensaje: 'Error al registrar usuario.' });
            res.json({ mensaje: 'Usuario registrado exitosamente.' });
        });
    });
});

// Iniciar sesión
app.post('/login', (req, res) => {
    const { correo, contraseña } = req.body;

    conexion.query('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, results) => {
        if (err) return res.status(500).json({ mensaje: 'Error de base de datos.' });
        if (results.length === 0) return res.status(400).json({ mensaje: 'Correo no encontrado.' });

        const usuario = results[0];
        const contraseñaCorrecta = await bcrypt.compare(contraseña, usuario.contraseña);

        if (!contraseñaCorrecta) {
            return res.status(400).json({ mensaje: 'Contraseña incorrecta.' });
        }

        // Guardar usuario en la sesión
        req.session.usuario = {
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo
        };

        res.json({ mensaje: `¡Bienvenido, ${usuario.nombre}!`, usuario: req.session.usuario });
    });
});

// Guardar soporte
app.post('/soporte', async (req, res) => {
    const { nombre_usuario, correo, problema, categoria } = req.body;
    const asunto = 'Nueva solicitud de soporte';
    const mensaje = `Nombre: ${nombre_usuario}\nCorreo: ${correo}\nProblema: ${problema}\nCategoría: ${categoria}`;

    try {
        await enviarCorreo(asunto, mensaje);
        conexion.query('INSERT INTO soporte SET ?', { nombre_usuario, correo, problema, categoria }, (error) => {
            if (error) {
                console.error('Error en base de datos:', error);
                return res.status(500).json({ mensaje: 'Error al guardar el soporte.' });
            }
            res.json({ mensaje: 'Solicitud de soporte enviada.' });
        });
    } catch (error) {
        console.error('Error al enviar correo:', error);
        res.status(500).json({ mensaje: 'Error al enviar correo.' });
    }
});

// Guardar sugerencia
app.post('/sugerencias', async (req, res) => {
    const { nombre, correo, sugerencia } = req.body;
    const asunto = 'Nueva sugerencia';
    const mensaje = `Nombre: ${nombre}\nCorreo: ${correo}\nSugerencia: ${sugerencia}`;

    try {
        await enviarCorreo(asunto, mensaje);
        conexion.query('INSERT INTO sugerencias SET ?', { nombre, correo, sugerencia }, (error) => {
            if (error) {
                console.error('Error en base de datos:', error);
                return res.status(500).json({ mensaje: 'Error al guardar la sugerencia.' });
            }
            res.json({ mensaje: '¡Gracias por tu sugerencia!' });
        });
    } catch (error) {
        console.error('Error al enviar correo:', error);
        res.status(500).json({ mensaje: 'Error al enviar sugerencia.' });
    }
});

// Iniciar el servidor
app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en http://localhost:${app.get('port')}`);
});






