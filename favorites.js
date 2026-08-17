const API_URL =
  "https://cdn.jsdelivr.net/npm/world-countries@5.1.0/countries.json";

const favoritesContainer =
  document.querySelector("#favorites-container");

const favoritesMessage =
  document.querySelector("#favorites-message");

const favoritesCount =
  document.querySelector("#favorites-count");

const modal =
  document.querySelector("#country-modal");

const modalBody =
  document.querySelector("#modal-body");

const closeModalButton =
  document.querySelector("#close-modal-button");

let savedCountries = [];
let allCountries = [];

// ==========================================
// LOCALSTORAGE
// ==========================================

function loadSavedCountries() {
  try {
    const saved =
      localStorage.getItem("savedCountries");

    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error(
      "Kunde inte läsa sparade länder:",
      error
    );

    return [];
  }
}

function saveSavedCountries() {
  localStorage.setItem(
    "savedCountries",
    JSON.stringify(savedCountries)
  );
}

// ==========================================
// HJÄLPFUNKTIONER
// ==========================================

function getFlagUrl(country) {
  if (!country.cca2) {
    return country.flag || "";
  }

  return `https://flagcdn.com/${country.cca2.toLowerCase()}.svg`;
}

function formatNumber(number) {
  if (typeof number !== "number") {
    return "Saknas";
  }

  return number.toLocaleString("sv-SE");
}

function getCountryLanguages(country) {
  if (!country.languages) {
    return "Okänt";
  }

  return Object.values(country.languages).join(", ");
}

function getCountryCurrencies(country) {
  if (!country.currencies) {
    return "Okänd";
  }

  return Object.values(country.currencies)
    .map((currency) => {
      const symbol =
        currency.symbol
          ? ` (${currency.symbol})`
          : "";

      return `${currency.name}${symbol}`;
    })
    .join(", ");
}

// ==========================================
// HÄMTA LANDSDATA
// ==========================================

async function fetchCountries() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(
        "Det gick inte att hämta länderna."
      );
    }

    allCountries = await response.json();

    renderFavorites();
  } catch (error) {
    console.error(error);

    favoritesContainer.innerHTML = `
      <p class="message error">
        Länderna kunde inte hämtas.
      </p>
    `;
  }
}

// ==========================================
// VISA FAVORITER
// ==========================================

function renderFavorites() {
  favoritesContainer.innerHTML = "";

  favoritesCount.textContent =
    `${savedCountries.length} sparade`;

  if (savedCountries.length === 0) {
    favoritesMessage.classList.remove("hidden");
    favoritesContainer.classList.add("hidden");

    return;
  }

  favoritesMessage.classList.add("hidden");
  favoritesContainer.classList.remove("hidden");

  savedCountries.forEach((savedCountry) => {
    const fullCountry = allCountries.find(
      (country) =>
        country.cca3 === savedCountry.cca3
    );

    const country = fullCountry || savedCountry;

    const card =
      document.createElement("article");

    card.className = "favorite-card";

    card.innerHTML = `
      <div class="favorite-image-wrapper">
        <img
          src="${getFlagUrl(country)}"
          alt="Flagga för ${
            country.name?.common ||
            country.name
          }"
        >

        <button
          class="favorite-heart-button"
          data-remove="${savedCountry.cca3}"
          aria-label="Ta bort ${
            country.name?.common ||
            country.name
          }"
          title="Ta bort från Mina länder"
        >
          ♥
        </button>
      </div>

      <div class="favorite-card-body">

        <div class="favorite-card-heading">

          <div>
            <h2>
              ${
                country.name?.common ||
                country.name
              }
            </h2>

            <p>
              ${country.region || "Sparat land"}
            </p>
          </div>

          <span class="favorite-badge">
            Sparad
          </span>

        </div>

        ${
          fullCountry
            ? `
              <div class="favorite-info">

                <p>
                  <strong>Huvudstad:</strong>
                  ${
                    country.capital?.[0] ||
                    "Saknas"
                  }
                </p>

                <p>
                  <strong>Befolkning:</strong>
                  ${formatNumber(
                    country.population
                  )}
                </p>

              </div>
            `
            : ""
        }

        <div class="favorite-actions">

          <button
            class="details-button"
            data-details="${savedCountry.cca3}"
          >
            Visa mer
          </button>

          <button
            class="remove-button favorite-remove-button"
            data-remove="${savedCountry.cca3}"
          >
            Ta bort
          </button>

        </div>

      </div>
    `;

    favoritesContainer.appendChild(card);
  });

  addFavoriteListeners();
}

// ==========================================
// EVENT LISTENERS FÖR KORT
// ==========================================

function addFavoriteListeners() {
  document
    .querySelectorAll("[data-remove]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        removeFavorite(
          button.dataset.remove
        );
      });
    });

  document
    .querySelectorAll("[data-details]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const country =
          allCountries.find(
            (item) =>
              item.cca3 ===
              button.dataset.details
          );

        if (country) {
          openModal(country);
        }
      });
    });
}

// ==========================================
// TA BORT FAVORIT
// ==========================================

function removeFavorite(countryCode) {
  savedCountries =
    savedCountries.filter(
      (country) =>
        country.cca3 !== countryCode
    );

  saveSavedCountries();
  renderFavorites();
}

// ==========================================
// MODAL
// ==========================================

function openModal(country) {
  const capital =
    country.capital?.join(", ") ||
    "Saknas";

  const mapUrl =
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      country.name.common
    )}`;

  modalBody.innerHTML = `
    <div class="modal-country-header">

      <img
        src="${getFlagUrl(country)}"
        alt="Flagga för ${country.name.common}"
      >

      <div>
        <h2 id="modal-title">
          ${country.name.common}
        </h2>

        <p>
          ${country.name.official}
        </p>
      </div>

    </div>

    <dl class="details-grid">

      <div class="detail">
        <dt>Huvudstad</dt>
        <dd>${capital}</dd>
      </div>

      <div class="detail">
        <dt>Region</dt>
        <dd>
          ${country.region || "Okänd"}
        </dd>
      </div>

      <div class="detail">
        <dt>Befolkning</dt>
        <dd>
          ${formatNumber(
            country.population
          )} invånare
        </dd>
      </div>

      <div class="detail">
        <dt>Area</dt>
        <dd>
          ${formatNumber(
            country.area
          )} km²
        </dd>
      </div>

      <div class="detail">
        <dt>Språk</dt>
        <dd>
          ${getCountryLanguages(country)}
        </dd>
      </div>

      <div class="detail">
        <dt>Valuta</dt>
        <dd>
          ${getCountryCurrencies(country)}
        </dd>
      </div>

    </dl>

    <div class="modal-actions">

      <a
        href="${mapUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="map-link"
      >
        🗺️ Öppna i Google Maps
      </a>

    </div>
  `;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

// ==========================================
// STARTA SIDAN
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    savedCountries =
      loadSavedCountries();

    closeModalButton.addEventListener(
      "click",
      closeModal
    );

    modal.addEventListener(
      "click",
      (event) => {
        if (
          event.target === modal ||
          event.target.classList.contains(
            "modal-overlay"
          )
        ) {
          closeModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape" &&
          !modal.classList.contains("hidden")
        ) {
          closeModal();
        }
      }
    );

    fetchCountries();
  }
);