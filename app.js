const container = document.getElementById("pokemonContainer");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const typeFilter = document.getElementById("typeFilter");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageIndicator = document.getElementById("pageIndicator");

const modal = document.getElementById("pokemonModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.querySelector(".closeModal");

let page = 1;
const limit = 50;

async function createCard(pokemon) {
    const card = document.createElement("div");
    card.className = "pokemon-card";

    const img = pokemon.sprites.other["official-artwork"].front_default;
    const info = await getDetails(pokemon);

    card.innerHTML = `
        <h3>#${pokemon.id} • ${pokemon.name.toUpperCase()}</h3>

        <img src="${img}" alt="${pokemon.name}">

        <div class="types">
            ${pokemon.types
                .map(t => `<span class="type ${t.type.name}">${t.type.name}</span>`)
                .join("")}
        </div>

        <div class="extra-info">
            <p><b>Altura:</b> ${(pokemon.height / 10).toFixed(1)} m</p>
            <p><b>Peso:</b> ${(pokemon.weight / 10).toFixed(1)} kg</p>
            <p><b>Habilidad:</b> ${pokemon.abilities[0].ability.name}</p>
            <p><b>Género:</b> ${info.genderIcons}</p>

            <p class="category">${info.category}</p>
        </div>
    `;

    card.addEventListener("click", () => openModal(pokemon));
    container.appendChild(card);
}

async function getDetails(pokemon) {
    const species = await fetch(pokemon.species.url).then(r => r.json());

    const genderRate = species.gender_rate;

    let genderIcons = "";
    if (genderRate === -1) {
        genderIcons = "—";
    } else {
        genderIcons = "♂ ♀";
    }

    return {
        category: species.genera.find(g => g.language.name === "es")?.genus || "—",
        genderIcons
    };
}

async function fetchMultiplePokemon(list) {
    const promises = list.map(async (item) => {
        const poke = await fetch(item.url).then(r => r.json());
        return poke;
    });

    return await Promise.all(promises);
}

async function loadPokemons() {
    const offset = (page - 1) * limit;

    container.innerHTML = "<h3>Cargando...</h3>";

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        const data = await res.json();

        const pokemons = await fetchMultiplePokemon(data.results);

        container.innerHTML = "";

        for (const p of pokemons) {
            await createCard(p);
        }

        pageIndicator.textContent = page;

    } catch {
        container.innerHTML = "<h3>Error al cargar Pokémon</h3>";
    }
}

async function searchPokemon() {
    const value = searchInput.value.trim().toLowerCase();

    if (!value) {
        loadPokemons();
        return;
    }

    container.innerHTML = "<h3>Buscando...</h3>";

    try {
        if (!isNaN(value)) {
            const pokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${value}`).then(r => r.json());

            container.innerHTML = "";
            await createCard(pokemon);

            pageIndicator.textContent = "—";
            return;
        }

        const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=2000");
        const data = await res.json();

        const filtered = data.results.filter(p => p.name.includes(value));

        if (filtered.length === 0) throw new Error();

        container.innerHTML = "";

        for (const entry of filtered.slice(0, 50)) {
            const pokemon = await fetch(entry.url).then(r => r.json());
            await createCard(pokemon);
        }

        pageIndicator.textContent = "—";

    } catch {
        container.innerHTML = "<h3>No encontrado</h3>";
        setTimeout(loadPokemons, 1200);
    }
}

searchBtn.addEventListener("click", searchPokemon);
searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") searchPokemon();
});

typeFilter.addEventListener("change", async () => {
    const type = typeFilter.value;

    if (!type) return loadPokemons();

    container.innerHTML = "<h3>Cargando...</h3>";

    try {
        const data = await fetch(`https://pokeapi.co/api/v2/type/${type}`).then(r => r.json());
        const filtered = data.pokemon.slice(0, 50);

        container.innerHTML = "";

        for (const entry of filtered) {
            const pokemon = await fetch(entry.pokemon.url).then(r => r.json());
            await createCard(pokemon);
        }

        pageIndicator.textContent = "—";

    } catch {
        container.innerHTML = "<h3>Error al filtrar</h3>";
        setTimeout(loadPokemons, 1200);
    }
});

nextBtn.addEventListener("click", () => {
    page++;
    loadPokemons();
});

prevBtn.addEventListener("click", () => {
    if (page > 1) page--;
    loadPokemons();
});

async function getStrengths(types) {
    let list = [];

    for (const t of types) {
        const data = await fetch(t.type.url).then(r => r.json());
        const strong = data.damage_relations.double_damage_to.map(x => x.name);
        list.push(...strong);
    }

    return [...new Set(list)];
}

async function openModal(pokemon) {
    modal.style.display = "flex";

    const strengths = await getStrengths(pokemon.types);
    const info = await getDetails(pokemon);

    modalBody.innerHTML = `
        <h2>${pokemon.name.toUpperCase()}</h2>

        <img src="${pokemon.sprites.other["official-artwork"].front_default}" class="modal-img">

        <p><b>Tipos:</b> ${pokemon.types.map(t => t.type.name).join(", ")}</p>
        <p><b>Fortalezas:</b> ${strengths.join(", ")}</p>

        <p><b>Altura:</b> ${(pokemon.height / 10).toFixed(1)} m</p>
        <p><b>Peso:</b> ${(pokemon.weight / 10).toFixed(1)} kg</p>

        <p><b>Habilidad:</b> ${pokemon.abilities[0].ability.name}</p>
        <p><b>Categoría:</b> ${info.category}</p>

        <p><b>Género:</b> ${info.genderIcons}</p>
    `;
}

closeModal.addEventListener("click", () => {
    modal.style.display = "none";
});

modal.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
});

loadPokemons();