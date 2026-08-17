// ==========================================
// 1. API OCH HTML-ELEMENT
// ==========================================

const API_URL =
  "https://cdn.jsdelivr.net/npm/world-countries@5.1.0/countries.json";

// Sökning och filter
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const resetButton = document.querySelector("#reset-button");
const regionFilter = document.querySelector("#region-filter");
const languageFilter = document.querySelector("#language-filter");
const sortSelect = document.querySelector("#sort-select");

// Resultat och meddelanden
const countriesContainer = document.querySelector("#countries-container");
const resultCount = document.querySelector("#result-count");
const resultsHeading = document.querySelector("#results-heading");
const message = document.querySelector("#message");

// Sparade länder
const savedContainer = document.querySelector("#saved-container");
const savedEmptyMessage = document.querySelector("#saved-empty-message");
const savedCount = document.querySelector("#saved-count");

// Modal
const modal = document.querySelector("#country-modal");
const modalBody = document.querySelector("#modal-body");
const closeModalButton = document.querySelector("#close-modal-button");

// ==========================================
// 2. APPENS DATA
// ==========================================

let countries = [];
let visibleCountries = [];
let savedCountries = loadSavedCountries();

// ==========================================
// 3. LOCALSTORAGE
// ==========================================

function loadSavedCountries() {
  try {
    const saved = localStorage.getItem("savedCountries");

    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Kunde inte läsa sparade länder:", error);

    localStorage.removeItem("savedCountries");

    return [];
  }
}

function saveSavedCountries() {
  localStorage.setItem(
    "savedCountries",
    JSON.stringify(savedCountries)
  );

  updateSavedCount();
  renderSavedCountries();
}

function updateSavedCount() {
  savedCount.textContent = savedCountries.length;

  if (savedCountries.length === 0) {
    savedEmptyMessage.classList.remove("hidden");
    savedContainer.innerHTML = "";
  } else {
    savedEmptyMessage.classList.add("hidden");
  }
}

function renderSavedCountries() {
  savedContainer.innerHTML = "";

  savedCountries.forEach((country) => {
    const savedItem = document.createElement("div");

    savedItem.className = "saved-item";

    savedItem.innerHTML = `
      <img
        src="${country.flag}"
        alt="Flagga för ${country.name}"
      >

      <div class="saved-item-info">
        <h3>${country.name}</h3>
      </div>

      <button
        class="remove-button"
        data-cca3="${country.cca3}"
        aria-label="Ta bort ${country.name}"
      >
        Ta bort
      </button>
    `;

    savedContainer.appendChild(savedItem);
  });

  document.querySelectorAll(".remove-button").forEach((button) => {
    button.addEventListener("click", () => {
      removeSavedCountry(button.dataset.cca3);
    });
  });
}

// ==========================================
// 4. MEDDELANDEN
// ==========================================

function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
  message.classList.remove("hidden");
}

function hideMessage() {
  message.classList.add("hidden");
}

// ==========================================
// 5. HJÄLPFUNKTIONER
// ==========================================

function getFlagUrl(country) {
  if (!country.cca2) {
    return "";
  }

  return `https://flagcdn.com/${country.cca2.toLowerCase()}.svg`;
}

function getCountryLanguages(country) {
  if (!country.languages) {
    return [];
  }

  return Object.values(country.languages);
}

function getCountryCurrencies(country) {
  if (!country.currencies) {
    return [];
  }

  return Object.values(country.currencies).map((currency) => {
    const name = currency.name || "Okänd valuta";
    const symbol = currency.symbol ? ` (${currency.symbol})` : "";

    return `${name}${symbol}`;
  });
}

function formatNumber(number) {
  if (typeof number !== "number") {
    return "Saknas";
  }

  return number.toLocaleString("sv-SE");
}

// ==========================================
// 6. HÄMTA ALLA LÄNDER
// ==========================================

async function fetchAllCountries() {
  showMessage("Laddar länder...", "loading");

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Det gick inte att hämta länderna.");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("API:et skickade ett oväntat svar.");
    }

    countries = data;

    countries.sort((a, b) =>
      a.name.common.localeCompare(
        b.name.common,
        "sv",
        { sensitivity: "base" }
      )
    );

    visibleCountries = [...countries];

    createLanguageOptions();
    applyFiltersAndSorting();
    hideMessage();
  } catch (error) {
    console.error("Fel vid hämtning:", error);

    showMessage(
      "Länderna kunde inte hämtas. Kontrollera internetanslutningen och försök igen.",
      "error"
    );

    countriesContainer.innerHTML = "";
    resultCount.textContent = "";
  }
}

// ==========================================
// 7. SPRÅKFILTER
// ==========================================

function createLanguageOptions() {
  const languages = new Set();

  countries.forEach((country) => {
    getCountryLanguages(country).forEach((language) => {
      languages.add(language);
    });
  });

  const sortedLanguages = [...languages].sort((a, b) =>
    a.localeCompare(b, "sv", { sensitivity: "base" })
  );

  // Behåll bara alternativet "Alla språk"
  languageFilter.innerHTML =
    '<option value="all">Alla språk</option>';

  sortedLanguages.forEach((language) => {
    const option = document.createElement("option");

    option.value = language;
    option.textContent = language;

    languageFilter.appendChild(option);
  });
}

// ==========================================
// 8. FILTER OCH SORTERING
// ==========================================

function applyFiltersAndSorting() {
  let filteredCountries = [...countries];

  const selectedRegion = regionFilter.value;
  const selectedLanguage = languageFilter.value;
  const selectedSort = sortSelect.value;

  // Filtrera efter region
  if (selectedRegion !== "all") {
    filteredCountries = filteredCountries.filter(
      (country) => country.region === selectedRegion
    );
  }

  // Filtrera efter språk
  if (selectedLanguage !== "all") {
    filteredCountries = filteredCountries.filter((country) =>
      getCountryLanguages(country).includes(selectedLanguage)
    );
  }

  // Sortera resultatet
  filteredCountries.sort((a, b) => {
    switch (selectedSort) {
      case "name-desc":
        return b.name.common.localeCompare(
          a.name.common,
          "sv",
          { sensitivity: "base" }
        );

      case "population-desc":
        return (b.population || 0) - (a.population || 0);

      case "population-asc":
        return (a.population || 0) - (b.population || 0);

      case "name-asc":
      default:
        return a.name.common.localeCompare(
          b.name.common,
          "sv",
          { sensitivity: "base" }
        );
    }
  });

  visibleCountries = filteredCountries;

  const hasFilter =
    selectedRegion !== "all" ||
    selectedLanguage !== "all";

  resultsHeading.textContent = hasFilter
    ? "Filtrerade länder"
    : "Alla länder";

  resultCount.textContent =
    `${visibleCountries.length} land/länder`;

  renderCountries(visibleCountries);
}

// ==========================================
// 9. SÖKNING
// ==========================================

async function handleSearch(event) {
  event.preventDefault();

  const originalSearchTerm = searchInput.value.trim();
  const searchTerm = originalSearchTerm.toLowerCase();

  if (!searchTerm) {
    showMessage(
      "Vänligen skriv in ett land att söka efter.",
      "error"
    );

    return;
  }

  showMessage("Söker efter land...", "loading");

  try {
    // Nytt fetch-anrop vid varje sökning
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Sökningen kunde inte genomföras.");
    }

    const data = await response.json();

    const searchResults = data.filter((country) => {
      const commonName =
        country.name?.common?.toLowerCase() || "";

      const officialName =
        country.name?.official?.toLowerCase() || "";

      const translatedNames = country.translations
        ? Object.values(country.translations)
            .flatMap((translation) => [
              translation.common,
              translation.official
            ])
            .filter(Boolean)
            .map((name) => name.toLowerCase())
        : [];

      return (
        commonName.includes(searchTerm) ||
        officialName.includes(searchTerm) ||
        translatedNames.some((name) =>
          name.includes(searchTerm)
        )
      );
    });

    searchResults.sort((a, b) =>
      a.name.common.localeCompare(
        b.name.common,
        "sv",
        { sensitivity: "base" }
      )
    );

    visibleCountries = searchResults;

    resultsHeading.textContent =
      `Sökresultat för "${originalSearchTerm}"`;

    resultCount.textContent =
      `${visibleCountries.length} träff(ar)`;

    renderCountries(visibleCountries);

    if (visibleCountries.length === 0) {
      showMessage(
        `Inget land hittades med namnet "${originalSearchTerm}".`,
        "error"
      );
    } else {
      hideMessage();
    }
  } catch (error) {
    console.error("Fel vid sökning:", error);

    showMessage(
      "Något gick fel vid sökningen. Försök igen.",
      "error"
    );

    countriesContainer.innerHTML = "";
    resultCount.textContent = "";
  }
}

// ==========================================
// 10. ÅTERSTÄLL SÖKNING OCH FILTER
// ==========================================

function handleReset() {
  searchInput.value = "";
  regionFilter.value = "all";
  languageFilter.value = "all";
  sortSelect.value = "name-asc";

  resultsHeading.textContent = "Alla länder";

  visibleCountries = [...countries];

  applyFiltersAndSorting();
  hideMessage();
}

// ==========================================
// 11. VISA LANDKORT
// ==========================================

function renderCountries(listToRender) {
  countriesContainer.innerHTML = "";

  if (listToRender.length === 0) {
    countriesContainer.innerHTML = `
      <p>Inga länder matchar dina kriterier.</p>
    `;

    return;
  }

  listToRender.forEach((country) => {
    const isSaved = savedCountries.some(
      (savedCountry) => savedCountry.cca3 === country.cca3
    );

    const countryCard = document.createElement("article");

    countryCard.className = "country-card";

    countryCard.innerHTML = `
      <div class="flag-wrapper">
        <img
          src="${getFlagUrl(country)}"
          alt="Flagga för ${country.name.common}"
          class="country-flag"
          loading="lazy"
        >
      </div>

      <div class="country-card-body">
        <h3>${country.name.common}</h3>

        <p class="country-meta">
          ${country.region || "Okänd region"}
        </p>

        <div class="country-card-actions">
          <button
            class="details-button"
            data-cca3="${country.cca3}"
          >
            Visa mer
          </button>

          <button
            class="save-button"
            data-cca3="${country.cca3}"
            ${isSaved ? "disabled" : ""}
          >
            ${isSaved ? "Sparad" : "Spara"}
          </button>
        </div>
      </div>
    `;

    countriesContainer.appendChild(countryCard);
  });

  addCountryButtonListeners();
}

function addCountryButtonListeners() {
  document.querySelectorAll(".details-button").forEach((button) => {
    button.addEventListener("click", () => {
      const countryCode = button.dataset.cca3;

      const country = visibleCountries.find(
        (item) => item.cca3 === countryCode
      );

      if (country) {
        openModal(country);
      }
    });
  });

  document.querySelectorAll(".save-button").forEach((button) => {
    button.addEventListener("click", () => {
      const countryCode = button.dataset.cca3;

      const country = visibleCountries.find(
        (item) => item.cca3 === countryCode
      );

      if (country) {
        saveCountry(country);
      }
    });
  });
}

// ==========================================
// 12. MODAL MED MER INFORMATION
// ==========================================

function openModal(country) {
  const capital =
    country.capital && country.capital.length > 0
      ? country.capital.join(", ")
      : "Saknas";

  const languages = getCountryLanguages(country);

  const languageText =
    languages.length > 0
      ? languages.join(", ")
      : "Okänt";

  const currencies = getCountryCurrencies(country);

  const currencyText =
    currencies.length > 0
      ? currencies.join(", ")
      : "Okänd";

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
          ${country.name.official || country.name.common}
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
          ${
            country.subregion
              ? `(${country.subregion})`
              : ""
          }
        </dd>
      </div>

      <div class="detail">
        <dt>Befolkning</dt>
        <dd>
          ${formatNumber(country.population)} invånare
        </dd>
      </div>

      <div class="detail">
        <dt>Area</dt>
        <dd>
          ${formatNumber(country.area)} km²
        </dd>
      </div>

      <div class="detail">
        <dt>Språk</dt>
        <dd>${languageText}</dd>
      </div>

      <div class="detail">
        <dt>Valuta</dt>
        <dd>${currencyText}</dd>
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
// 13. SPARA OCH TA BORT LÄNDER
// ==========================================

function saveCountry(country) {
  const alreadySaved = savedCountries.some(
    (savedCountry) => savedCountry.cca3 === country.cca3
  );

  if (alreadySaved) {
    showMessage(
      "Detta land är redan sparat.",
      "error"
    );

    return;
  }

  const countryToSave = {
    cca3: country.cca3,
    name: country.name.common,
    flag: getFlagUrl(country)
  };

  savedCountries.push(countryToSave);

  saveSavedCountries();

  showMessage(
    `${country.name.common} har lagts till i Mina länder!`,
    "success"
  );

  const saveButton = document.querySelector(
    `.save-button[data-cca3="${country.cca3}"]`
  );

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "Sparad";
  }

  setTimeout(hideMessage, 3000);
}

function removeSavedCountry(countryCode) {
  savedCountries = savedCountries.filter(
    (country) => country.cca3 !== countryCode
  );

  saveSavedCountries();

  showMessage(
    "Landet har tagits bort från dina favoriter.",
    "success"
  );

  const saveButton = document.querySelector(
    `.save-button[data-cca3="${countryCode}"]`
  );

  if (saveButton) {
    saveButton.disabled = false;
    saveButton.textContent = "Spara";
  }

  setTimeout(hideMessage, 3000);
}

// ==========================================
// 14. STARTA APPEN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  updateSavedCount();
  renderSavedCountries();

  searchForm.addEventListener("submit", handleSearch);
  resetButton.addEventListener("click", handleReset);

  regionFilter.addEventListener(
    "change",
    applyFiltersAndSorting
  );

  languageFilter.addEventListener(
    "change",
    applyFiltersAndSorting
  );

  sortSelect.addEventListener(
    "change",
    applyFiltersAndSorting
  );

  closeModalButton.addEventListener("click", closeModal);

  modal.addEventListener("click", (event) => {
    if (
      event.target === modal ||
      event.target.classList.contains("modal-overlay")
    ) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !modal.classList.contains("hidden")
    ) {
      closeModal();
    }
  });

  fetchAllCountries();
});
