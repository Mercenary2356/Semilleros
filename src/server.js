var express = require('express');
var webpack = require('webpack');
var webpackdevmiddleware = require('webpack-dev-middleware');
var webpackconfig = require('../webpack.config');


var app = express();

app.set('port', (process.env.port || 3000));
app.use('/static', express.static('dist'));
app.use(webpackdevmiddleware(webpack(webpackconfig)));

app.get('/', function(req,res,next){
    res.send('KJS');
});

app.listen(app.get('port'), ()=>{
    console.log('Servidor activo');
});
