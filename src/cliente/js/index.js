import "../css/styles.css"; 

// Inicializa el mapa
function initMap() {
    const bogota = { lat: 4.711, lng: -74.0721 };
    const map = new google.maps.Map(document.getElementById("map"), {
        center: bogota,
        zoom: 12,
    });

    new google.maps.Marker({
        position: bogota,
        map,
        title: "Bogotá, Colombia",
    });
}

window.initMap = initMap;

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const destinationCards = document.querySelectorAll(".destination-card");
    const recommendationsSection = document.querySelector(".recommendations");
    
    // Elementos del carrusel
    const destinationsGrid = document.querySelector(".destinations-grid");
    const leftButton = document.querySelector(".carousel-btn.left");
    const rightButton = document.querySelector(".carousel-btn.right");

    // Evento de búsqueda en destinos
    searchInput.addEventListener("input", function () {
        const query = searchInput.value.toLowerCase();
        let found = false;

        destinationCards.forEach(card => {
            const title = card.querySelector("h3");
            const description = card.querySelector("p");
            const cardContent = title.innerText.toLowerCase() + " " + description.innerText.toLowerCase();

            if (cardContent.includes(query)) {
                card.style.display = "block"; // Mostrar la tarjeta
                highlightText(title, query);
                highlightText(description, query);
                found = true;
            } else {
                card.style.display = "none"; // Ocultar si no coincide
            }
        });

        showNoResultsMessage(found);
    });

    function highlightText(element, query) {
        if (query === "") {
            element.innerHTML = element.innerText; // Restaurar texto original
            return;
        }
        const regex = new RegExp(`(${query})`, "gi");
        element.innerHTML = element.innerText.replace(regex, "<span class='highlight'>$1</span>");
    }

    function showNoResultsMessage(found) {
        let noResultsMessage = document.getElementById("noResultsMessage");

        if (!found) {
            if (!noResultsMessage) {
                noResultsMessage = document.createElement("p");
                noResultsMessage.id = "noResultsMessage";
                noResultsMessage.innerText = "No se encontraron resultados.";
                noResultsMessage.style.color = "red";
                noResultsMessage.style.fontSize = "18px";
                recommendationsSection.appendChild(noResultsMessage);
            }
        } else if (noResultsMessage) {
            noResultsMessage.remove();
        }
    }

    // Funcionalidad del carrusel
    let scrollAmount = 0;
    const scrollStep = 300; // Cuántos píxeles se mueve el carrusel

    leftButton.addEventListener("click", function () {
        destinationsGrid.scrollBy({ left: -scrollStep, behavior: "smooth" });
    });

    rightButton.addEventListener("click", function () {
        destinationsGrid.scrollBy({ left: scrollStep, behavior: "smooth" });
    });
});

