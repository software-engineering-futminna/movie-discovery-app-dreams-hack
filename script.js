// TMDB API Configuration
// Insert your TMDB API Read Access Token (v4 Bearer auth) here:
const TMDB_READ_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjODBiNTc3MTY1MTE4OTM4MjA2ODQ5NmFjYTFkNjdjNiIsIm5iZiI6MTc4MjMwMDA3NS4xNTM5OTk4LCJzdWIiOiI2YTNiYmRhYjU3M2RiZmQ2NzNjMmJjODIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.9IAG3r9ZcJO8d-tiZoIBzvYaKAMvMGVnfq8z9W7oWnM";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_ORIGINAL_IMAGE_URL = "https://image.tmdb.org/t/p/original";

// Genre ID mapping for TMDB
const GENRE_MAP = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const GENRE_NAME_TO_ID = {
  action: 28,
  drama: 18,
  scifi: 878,
  "sci-fi": 878,
  comedy: 35,
  horror: 27,
  animation: 16,
  thriller: 53,
  mystery: 9648,
};

// State
let currentGenre = "all";
let watchlist = JSON.parse(
  localStorage.getItem("cinemaflix_watchlist") || "[]",
);
let currentTab = "home"; // 'home' or 'watchlist'
let currentPage = 1;
let totalPages = 1;
let currentSearchQuery = "";

// DOM Elements
const searchForm = document.querySelector(".search-box");
const searchInput = searchForm ? searchForm.querySelector("input") : null;
const searchBtn = document.querySelector(".search-btn");

const heroSection = document.querySelector(".hero");
const heroTitle = document.querySelector(".hero-title");
const heroMeta = document.querySelector(".hero-meta");
const heroDesc = document.querySelector(".hero-description");
const heroAddBtn = document.querySelector(".hero-actions .btn");

const browseGrid = document.getElementById("browse-grid");
const sectionTitle = document.querySelector(".section-title");
const filterBtns = document.querySelectorAll(".filter");
const navLinks = document.querySelectorAll(".nav-links a");
const loadMoreBtn = document.getElementById("load-more-btn");
const loadMoreContainer = document.getElementById("load-more-container");

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  loadAppContent();
});

function setupEventListeners() {
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      loadNextPage();
    });
  }
  // Navigation (Home vs Watchlist)
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      const target = link.textContent.trim().toLowerCase();
      if (target === "watchlist") {
        currentTab = "watchlist";
        renderWatchlist();
      } else {
        currentTab = "home";
        if (sectionTitle) sectionTitle.textContent = "Browse Movies";
        document.querySelector(".genre-filters").style.display = "flex";
        loadBrowseMovies(currentGenre);
      }
    });
  });

  // Search submit
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const query = searchInput ? searchInput.value.trim() : "";
      if (query) {
        searchMovies(query);
      }
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const query = searchInput ? searchInput.value.trim() : "";
      if (query) {
        searchMovies(query);
      }
    });
  }

  // Genre Filters
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentGenre = (btn.dataset.genre || "").toLowerCase().trim();
      currentSearchQuery = "";
      if (sectionTitle) sectionTitle.textContent = "Browse Movies";
      loadBrowseMovies(currentGenre, 1, false);
    });
  });
}

// Fetch helper strictly using API Read Access Token (v4 Bearer authentication)
async function fetchTMDB(endpoint, params = {}) {
  console.log("fetching from tmdb")
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
  };

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }

  try {
    const response = await fetch(url, { headers });
    console.log("response from tmdb:", response)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("TMDB Fetch Error:", error);
    return null;
  }
}

async function loadAppContent() {
  loadTrendingHero();
  loadBrowseMovies(currentGenre);
}

// Load Trending Movie for Hero Banner
async function loadTrendingHero() {
  const data = await fetchTMDB("/trending/movie/day");
  if (data && data.results && data.results.length > 0) {
    const movie = data.results[0];

    // Fetch detailed movie info for runtime
    const details = await fetchTMDB(`/movie/${movie.id}`);
    const runtimeStr =
      details && details.runtime
        ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
        : "";
    const yearStr = movie.release_date ? movie.release_date.split("-")[0] : "";
    const genreStr =
      movie.genre_ids && movie.genre_ids.length > 0
        ? GENRE_MAP[movie.genre_ids[0]] || ""
        : "";

    if (heroSection && movie.backdrop_path) {
      heroSection.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4)), url(${TMDB_ORIGINAL_IMAGE_URL}${movie.backdrop_path})`;
      heroSection.style.backgroundSize = "cover";
      heroSection.style.backgroundPosition = "center";
    }

    if (heroTitle) heroTitle.textContent = movie.title;
    if (heroMeta) {
      heroMeta.innerHTML = `
        <span class="rating">★ ${movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
        <span>${yearStr}</span>
        <span>${genreStr}</span>
        ${runtimeStr ? `<span>${runtimeStr}</span>` : ""}
      `;
    }
    if (heroDesc) heroDesc.textContent = movie.overview;

    if (heroAddBtn) {
      const isSaved = watchlist.some((m) => m.id === movie.id);
      heroAddBtn.textContent = isSaved
        ? "✓ In Watchlist"
        : "+ Add to Watchlist";
      heroAddBtn.onclick = () => toggleWatchlist(movie, heroAddBtn);
    }
  }
}

// Load Browse Movies by genre
async function loadBrowseMovies(genreKey, page = 1, append = false) {
  currentPage = page;
  currentSearchQuery = "";
  let endpoint = "/movie/popular";
  const params = { page: page };

  if (genreKey !== "all" && GENRE_NAME_TO_ID[genreKey]) {
    endpoint = "/discover/movie";
    params.with_genres = GENRE_NAME_TO_ID[genreKey];
  }

  if (!append) {
    browseGrid.innerHTML = '<div class="loading">Loading movies...</div>';
  } else if (loadMoreBtn) {
    loadMoreBtn.textContent = "Loading...";
    loadMoreBtn.disabled = true;
  }

  const data = await fetchTMDB(endpoint, params);
  if (loadMoreBtn) {
    loadMoreBtn.textContent = "Load More Movies";
    loadMoreBtn.disabled = false;
  }

  if (data && data.results) {
    totalPages = data.total_pages || 1;
    renderMovieGrid(data.results, append);
    updateLoadMoreVisibility();
  } else if (!append) {
    browseGrid.innerHTML =
      '<div class="error-msg">Failed to load movies. Check connection.</div>';
    if (loadMoreContainer) loadMoreContainer.style.display = "none";
  }
}

// Search Movies
async function searchMovies(query, page = 1, append = false) {
  currentTab = "home";
  currentPage = page;
  currentSearchQuery = query;
  if (sectionTitle) sectionTitle.textContent = `Search results for "${query}"`;
  document.querySelector(".genre-filters").style.display = "none";

  if (!append) {
    browseGrid.innerHTML = '<div class="loading">Searching...</div>';
  } else if (loadMoreBtn) {
    loadMoreBtn.textContent = "Loading...";
    loadMoreBtn.disabled = true;
  }

  const data = await fetchTMDB("/search/movie", { query: query, page: page });
  if (loadMoreBtn) {
    loadMoreBtn.textContent = "Load More Movies";
    loadMoreBtn.disabled = false;
  }

  if (data && data.results) {
    totalPages = data.total_pages || 1;
    renderMovieGrid(data.results, append);
    updateLoadMoreVisibility();
  } else if (!append) {
    browseGrid.innerHTML = '<div class="error-msg">No movies found.</div>';
    if (loadMoreContainer) loadMoreContainer.style.display = "none";
  }
}

// Load Next Page
function loadNextPage() {
  if (currentPage < totalPages) {
    const nextPage = currentPage + 1;
    if (currentSearchQuery) {
      searchMovies(currentSearchQuery, nextPage, true);
    } else {
      loadBrowseMovies(currentGenre, nextPage, true);
    }
  }
}

function updateLoadMoreVisibility() {
  if (!loadMoreContainer) return;
  if (currentTab === "watchlist" || currentPage >= totalPages) {
    loadMoreContainer.style.display = "none";
  } else {
    loadMoreContainer.style.display = "flex";
  }
}

// Render Grid of Movie Cards
function renderMovieGrid(movies, append = false) {
  if (!append && (!movies || movies.length === 0)) {
    browseGrid.innerHTML = '<div class="empty-msg">No movies found.</div>';
    return;
  }

  const cardsHtml = movies
    .map((movie) => {
      const posterUrl = movie.poster_path
        ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
        : "https://via.placeholder.com/500x750?text=No+Poster";

      const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
      const year = movie.release_date
        ? movie.release_date.split("-")[0]
        : "N/A";
      const primaryGenre =
        movie.genre_ids && movie.genre_ids.length > 0
          ? GENRE_MAP[movie.genre_ids[0]] || "Movie"
          : "Movie";
      const isSaved = watchlist.some((m) => m.id === movie.id);

      return `
      <article class="movie-card" data-id="${movie.id}" onclick="openMovieDetails(${movie.id})">
        <div class="poster" style="background-image: url('${posterUrl}'); background-size: cover; background-position: center;">
          <span class="poster-rating">★ ${rating}</span>
          <button class="add-btn ${isSaved ? "added" : ""}" aria-label="Toggle Watchlist" onclick="handleCardWatchlistClick(event, ${movie.id})">
            ${isSaved ? "✓" : "+"}
          </button>
        </div>
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(movie.title)}</h3>
          <p class="card-sub">${year} · ${primaryGenre}</p>
        </div>
      </article>
    `;
    })
    .join("");

  if (append) {
    browseGrid.insertAdjacentHTML("beforeend", cardsHtml);
  } else {
    browseGrid.innerHTML = cardsHtml;
  }

  // Cache movies on cards for easy watchlist adding
  movies.forEach((movie) => {
    const card = browseGrid.querySelector(`[data-id="${movie.id}"]`);
    if (card) {
      card._movieData = movie;
    }
  });
}

// Open Movie Details Modal
async function openMovieDetails(movieId) {
  const modal = document.getElementById("movie-modal");
  const modalBody = document.getElementById("modal-body-content");
  const closeBtn = document.getElementById("modal-close-btn");

  if (!modal || !modalBody) return;

  modalBody.innerHTML =
    '<div class="loading" style="padding: 100px 20px;">Loading details...</div>';
  modal.style.display = "flex";

  // Fetch movie details & credits in parallel
  const [details, credits] = await Promise.all([
    fetchTMDB(`/movie/${movieId}`),
    fetchTMDB(`/movie/${movieId}/credits`),
  ]);

  if (!details) {
    modalBody.innerHTML =
      '<div class="error-msg">Failed to load movie details.</div>';
    return;
  }

  const backdropUrl = details.backdrop_path
    ? `${TMDB_ORIGINAL_IMAGE_URL}${details.backdrop_path}`
    : "";
  const posterUrl = details.poster_path
    ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}`
    : "";
  const year = details.release_date ? details.release_date.split("-")[0] : "";
  const runtime = details.runtime
    ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
    : "";
  const genres = details.genres
    ? details.genres.map((g) => g.name).join(", ")
    : "";
  const isSaved = watchlist.some((m) => m.id === details.id);

  const castList = credits && credits.cast ? credits.cast.slice(0, 8) : [];
  const castHtml =
    castList.length > 0
      ? `
    <div class="cast-section">
      <h4>Top Cast</h4>
      <div class="cast-grid">
        ${castList
          .map(
            (c) => `
          <div class="cast-card">
            <img class="cast-img" src="${c.profile_path ? `${TMDB_IMAGE_BASE_URL}${c.profile_path}` : "https://via.placeholder.com/90x110?text=No+Photo"}" alt="${escapeHtml(c.name)}" />
            <div class="cast-name">${escapeHtml(c.name)}</div>
            <div class="cast-character">${escapeHtml(c.character || "")}</div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `
      : "";

  modalBody.innerHTML = `
    <div class="details-banner" style="background-image: url('${backdropUrl}');">
      <div class="details-header-content">
        ${posterUrl ? `<img class="details-poster" src="${posterUrl}" alt="${escapeHtml(details.title)}" />` : ""}
        <div class="details-header-info">
          <h2>${escapeHtml(details.title)}</h2>
          <div class="details-meta-pills">
            <span class="meta-badge rating">★ ${details.vote_average ? details.vote_average.toFixed(1) : "N/A"}</span>
            ${year ? `<span class="meta-badge">${year}</span>` : ""}
            ${runtime ? `<span class="meta-badge">${runtime}</span>` : ""}
            ${genres ? `<span class="meta-badge">${genres}</span>` : ""}
          </div>
          <button class="btn btn-primary" id="modal-watchlist-btn">
            ${isSaved ? "✓ In Watchlist" : "+ Add to Watchlist"}
          </button>
        </div>
      </div>
    </div>
    <div class="details-body">
      ${details.tagline ? `<p class="details-tagline">"${escapeHtml(details.tagline)}"</p>` : ""}
      <div class="details-overview">
        <h4>Overview</h4>
        <p>${escapeHtml(details.overview || "No overview available.")}</p>
      </div>
      ${castHtml}
    </div>
  `;

  // Modal Watchlist Toggle
  const modalWatchlistBtn = document.getElementById("modal-watchlist-btn");
  if (modalWatchlistBtn) {
    modalWatchlistBtn.onclick = () => {
      toggleWatchlist(details, modalWatchlistBtn);
      // update grid card if visible
      const card = browseGrid.querySelector(`[data-id="${details.id}"]`);
      if (card) {
        const btn = card.querySelector(".add-btn");
        if (btn) {
          const isNowSaved = watchlist.some((m) => m.id === details.id);
          btn.textContent = isNowSaved ? "✓" : "+";
          btn.classList.toggle("added", isNowSaved);
        }
      }
    };
  }

  // Close handlers
  closeBtn.onclick = () => {
    modal.style.display = "none";
  };
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = "none";
  };
}

function handleCardWatchlistClick(event, movieId) {
  event.stopPropagation();
  const card = browseGrid.querySelector(`[data-id="${movieId}"]`);
  if (!card || !card._movieData) return;
  const movie = card._movieData;

  toggleWatchlist(movie);

  const btn = event.currentTarget;
  const isSaved = watchlist.some((m) => m.id === movie.id);
  btn.textContent = isSaved ? "✓" : "+";
  btn.classList.toggle("added", isSaved);

  if (currentTab === "watchlist") {
    renderWatchlist();
  }
}

function toggleWatchlist(movie, btnEl = null) {
  const index = watchlist.findIndex((m) => m.id === movie.id);
  if (index >= 0) {
    watchlist.splice(index, 1);
  } else {
    watchlist.push({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      genre_ids: movie.genre_ids,
    });
  }

  localStorage.setItem("cinemaflix_watchlist", JSON.stringify(watchlist));

  if (btnEl) {
    const isSaved = watchlist.some((m) => m.id === movie.id);
    btnEl.textContent = isSaved ? "✓ In Watchlist" : "+ Add to Watchlist";
  }
}

function renderWatchlist() {
  if (sectionTitle) sectionTitle.textContent = "My Watchlist";
  document.querySelector(".genre-filters").style.display = "none";
  updateLoadMoreVisibility();

  if (watchlist.length === 0) {
    browseGrid.innerHTML =
      '<div class="empty-msg">Your watchlist is empty. Browse movies to add titles!</div>';
    return;
  }

  renderMovieGrid(watchlist);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
