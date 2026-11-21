console.log("Pokédex iniciada correctamente");

const API_BASE_URL = "https://pokeapi.co/api/v2/pokemon";
const MAX_COLLECTION = 6;

const pokemonNameInput = document.getElementById("pokemonName");
const searchButton = document.getElementById("searchButton");
const randomButton = document.getElementById("randomButton");
const pokemonInfoDiv = document.getElementById("pokemonInfo");
const detailsButton = document.getElementById("detailsButton");
const addButton = document.getElementById("addButton");
const collectionBody = document.getElementById("collectionBody");
const collectionCount = document.getElementById("collectionCount");

let currentPokemon = null;
let collection = [];
let lastRequestId = 0; // evita que una respuesta lenta pise a una más reciente

// "special-attack" -> "special attack"
function formatName(name) {
    return String(name).replace(/-/g, " ");
}

// Crea el modal de detalles una sola vez en el DOM
function ensureDetailsModal() {
    if (document.getElementById("pokemonModal")) return;

    const modal = document.createElement("div");
    modal.id = "pokemonModal";
    modal.className = "poke-modal-backdrop";
    modal.hidden = true;
    modal.innerHTML = `
        <div class="poke-modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <div class="poke-modal-header">
                <h3 id="modalTitle">Detalles del Pokémon</h3>
                <button type="button" id="closeModalBtn" aria-label="Cerrar">✕</button>
            </div>
            <div id="modalBody" class="poke-modal-body"></div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeModalBtn").addEventListener("click", closeDetailsModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeDetailsModal();
    });
}

function openDetailsModal() {
    if (!currentPokemon) return;
    ensureDetailsModal();

    const modal = document.getElementById("pokemonModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalBody = document.getElementById("modalBody");

    const imageUrl =
        currentPokemon.sprites?.other?.["official-artwork"]?.front_default ||
        currentPokemon.sprites?.front_default ||
        "";
    const types = currentPokemon.types.map(t => t.type.name).join(", ");

    const abilities = currentPokemon.abilities
        .map(a => `${formatName(a.ability.name)}${a.is_hidden ? " (oculta)" : ""}`)
        .join(", ");

    const statsHtml = currentPokemon.stats
        .map(s => `<li><strong class="poke-capitalize">${formatName(s.stat.name)}:</strong> ${s.base_stat}</li>`)
        .join("");

    modalTitle.textContent = `#${currentPokemon.id} - ${currentPokemon.name.toUpperCase()}`;
    modalBody.innerHTML = `
        ${imageUrl ? `<img src="${imageUrl}" alt="${currentPokemon.name}">` : ""}
        <p><strong>Tipo:</strong> <span class="poke-capitalize">${types}</span></p>
        <p><strong>Altura:</strong> ${(currentPokemon.height / 10).toFixed(1)} m</p>
        <p><strong>Peso:</strong> ${(currentPokemon.weight / 10).toFixed(1)} kg</p>
        <p><strong>Experiencia base:</strong> ${currentPokemon.base_experience ?? "N/A"}</p>
        <p><strong>Habilidades:</strong> <span class="poke-capitalize">${abilities || "Ninguna"}</span></p>
        <h4>Estadísticas base</h4>
        <ul class="poke-stats-list">${statsHtml}</ul>
    `;

    modal.hidden = false;
    document.getElementById("closeModalBtn").focus();
}

function closeDetailsModal() {
    const modal = document.getElementById("pokemonModal");
    if (modal) modal.hidden = true;
}

function setActionButtonsEnabled(enabled) {
    detailsButton.disabled = !enabled;
    addButton.disabled = !enabled;
}

function renderPokemonCard(pokemon) {
    const imageUrl =
        pokemon.sprites?.other?.["official-artwork"]?.front_default ||
        pokemon.sprites?.front_default ||
        "";
    const types = pokemon.types.map(t => t.type.name).join(", ");

    pokemonInfoDiv.innerHTML = `
        <div class="poke-card-content">
            ${imageUrl ? `<img src="${imageUrl}" alt="${pokemon.name}" class="poke-card-img">` : "<p>Sin imagen disponible</p>"}
            <div>
                <p><strong>ID:</strong> #${pokemon.id}</p>
                <p><strong>Nombre:</strong> <span class="poke-capitalize">${pokemon.name}</span></p>
                <p><strong>Tipo:</strong> <span class="poke-capitalize">${types}</span></p>
            </div>
        </div>
    `;

    setActionButtonsEnabled(true);
}

function renderStatusMessage(message, isError = false) {
    pokemonInfoDiv.innerHTML = `<p class="${isError ? "poke-error" : ""}">${message}</p>`;
    setActionButtonsEnabled(false);
}

async function handleSearch(query) {
    const cleanQuery = String(query).trim().toLowerCase();
    if (!cleanQuery) {
        renderStatusMessage("Por favor, escribe un nombre o ID de Pokémon.", true);
        return;
    }

    const requestId = ++lastRequestId;
    renderStatusMessage("Buscando Pokémon...");
    currentPokemon = null;

    try {
        const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(cleanQuery)}`);
        if (!response.ok) {
            throw new Error("Pokémon no encontrado. Verifica el nombre o ID.");
        }

        const data = await response.json();
        if (requestId !== lastRequestId) return; // llegó una búsqueda más nueva

        currentPokemon = data;
        renderPokemonCard(data);
    } catch (error) {
        if (requestId !== lastRequestId) return;
        renderStatusMessage(error.message || "Error al consultar la PokéAPI.", true);
    }
}

function handleRandomSearch() {
    const randomId = Math.floor(Math.random() * 150) + 1;
    pokemonNameInput.value = randomId;
    handleSearch(randomId);
}

function updateCollectionCounter() {
    collectionCount.textContent = `Pokémon agregados: ${collection.length}/${MAX_COLLECTION}`;
}

function renderCollection() {
    collectionBody.innerHTML = collection
        .map(item => `
            <tr>
                <td>#${item.id}</td>
                <td>
                    ${item.sprite
                        ? `<img src="${item.sprite}" alt="${item.name}" width="44" height="44">`
                        : "Sin imagen"}
                </td>
                <td class="poke-capitalize">${item.name}</td>
                <td class="poke-capitalize">${item.types}</td>
            </tr>
        `)
        .join("");

    updateCollectionCounter();
}

function handleAddToCollection() {
    if (!currentPokemon) return;

    if (collection.length >= MAX_COLLECTION) {
        alert(`Solo puedes agregar hasta ${MAX_COLLECTION} Pokémon a tu colección.`);
        return;
    }

    const exists = collection.some(item => item.id === currentPokemon.id);
    if (exists) {
        alert(`${currentPokemon.name} ya está en tu colección.`);
        return;
    }

    collection.push({
        id: currentPokemon.id,
        name: currentPokemon.name,
        sprite: currentPokemon.sprites?.front_default || "",
        types: currentPokemon.types.map(t => t.type.name).join(", ")
    });

    renderCollection();
}

// Eventos
searchButton.addEventListener("click", () => handleSearch(pokemonNameInput.value));

pokemonNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleSearch(pokemonNameInput.value);
    }
});

// Escape cierra el modal
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDetailsModal();
});

randomButton.addEventListener("click", handleRandomSearch);
detailsButton.addEventListener("click", openDetailsModal);
addButton.addEventListener("click", handleAddToCollection);

updateCollectionCounter();