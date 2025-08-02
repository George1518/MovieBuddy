const API_KEY = "da9cbb30f2f4c0c92f85a4bdfd6ce881";
const BASE_URL = "https://api.themoviedb.org/3";
const displayer = document.getElementById("displayer");
const loading = document.getElementById("loading");
const genreContainer = document.getElementById('genreContainer');
const genreList = document.createElement('ul');
genreList.classList.add('genreList');
genreContainer.appendChild(genreList);

let currentPage = 1;
let currentDisplay = "movie/popular";
let currentSearchQuery = "";
let currentId = null;
let isGenreListVisible = false;
let genresLoaded = false;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  fetchPopularMovies();
  
  // Add keyboard support for search
  document.getElementById('movieName').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchMovies();
  });
});

async function genreFetchMovies(id) {
  currentDisplay = "discover/movie";
  currentId = id;
  currentPage = 1;
  currentSearchQuery = "";
 
  await fetchMovies();
  toggleGenreListVisibility();
}

async function fetchPopularMovies() {
  currentDisplay = "movie/popular";
  currentSearchQuery = "";
  currentId = null;
  currentPage = 1;
  await fetchMovies();
}

async function fetchTopratedMovies() {
  currentDisplay = "movie/top_rated";
  currentSearchQuery = "";
  currentId = null;
  currentPage = 1;
  await fetchMovies();
}

async function searchMovies() {
  const keyword = document.getElementById("movieName").value.trim();
  if (!keyword) return;

  currentDisplay = "search/movie";
  currentSearchQuery = keyword;
  currentId = null;
  currentPage = 1;
  await fetchMovies();
}

async function fetchMovies() {
  displayer.textContent = '';
  showLoading();
  
  let url = "";
  if (currentDisplay === "search/movie") {
    url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
      currentSearchQuery
    )}&page=${currentPage}`;
  } 
  else if(currentDisplay === "discover/movie") {
    url = `${BASE_URL}/${currentDisplay}?api_key=${API_KEY}&with_genres=${currentId}&page=${currentPage}`;
  }
  else {
    url = `${BASE_URL}/${currentDisplay}?api_key=${API_KEY}&page=${currentPage}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Network error");
    const data = await response.json();
    displayMovies(data);
  } catch (error) {
    displayError(error.message);
  } finally {
    hideLoading();
  }
}

function displayMovies(data) {
  const listContainer = document.createElement('div');
  const list = document.createElement("ul");
  listContainer.appendChild(list);

  if (!data.results || data.results.length === 0) {
    displayError("No movies found. Try a different search.");
    return;
  }

  data.results.forEach((movie, index) => {
    const item = document.createElement("li");
    item.classList.add("item");
    item.setAttribute('data-id', movie.id);
    item.setAttribute('aria-label', `${movie.title}, rating ${movie.vote_average}`);

    const poster = document.createElement("img");
    poster.src = movie.poster_path
      ? "https://image.tmdb.org/t/p/w500" + movie.poster_path
      : "https://placehold.co/500x750?text=No+Poster";
    poster.alt = `${movie.title} Poster`;
    poster.classList.add("poster");
    poster.loading = "lazy";

    const textBox = document.createElement("div");
    textBox.classList.add("textbox");

    const title = document.createElement("h2");
title.innerText = movie.title;

    const rate = document.createElement("h4");
    rate.innerHTML = `<span role="img" aria-label="Rating">⭐</span> ${movie.vote_average}/10`;

    const date = document.createElement("h4");
    date.innerText = `Released: ${movie.release_date || 'Unknown'}`;

    const overview = document.createElement("p");
    overview.innerText = movie.overview || "No overview available.";
    overview.classList.add("sm-t");

    textBox.append(title, rate, date, overview);
    item.append(poster, textBox);
    list.appendChild(item);
  });

  displayer.innerHTML = '';
  displayer.appendChild(listContainer);

  const cBtn = document.getElementById("controls");
  if (data.total_pages > 1) {
    cBtn.classList.remove("none");
    cBtn.classList.add("controls");
  } else {
    cBtn.classList.add("none");
    cBtn.classList.remove("controls");
  }

  setupItemClickHandlers();
}

function setupItemClickHandlers() {
  const items = document.querySelectorAll(".item");
  
  items.forEach((item) => {
    item.addEventListener("click", () => {
      items.forEach((i) => i.classList.remove("clicked-item"));
      item.classList.add("clicked-item");
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
}

async function fetchGenre() {
  if (genresLoaded) {
    toggleGenreListVisibility();
    return;
  }

  showLoading();
  try {
    const response = await fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`);
    const data = await response.json();
    displayGenre(data);
    genresLoaded = true;
    isGenreListVisible = true;
  } catch (error) {
    displayError("Failed to load genres");
  } finally {
    hideLoading();
  }
}

function toggleGenreListVisibility() {
  isGenreListVisible = !isGenreListVisible;
  genreList.style.display = isGenreListVisible ? 'flex' : 'none';
}

function displayGenre(data) {
  genreList.innerHTML = '';
  
  data.genres.forEach(genre => {
    const genreItem = document.createElement('li');
    genreItem.classList.add('btn');
    genreItem.innerText = genre.name;
    genreItem.addEventListener("click", () => {
      genreFetchMovies(genre.id);
    });
    genreList.appendChild(genreItem);
  });
  
  genreList.style.display = 'flex';
}

function showLoading() {
  loading.classList.remove('none');
  displayer.innerHTML = '';
}

function hideLoading() {
  loading.classList.add('none');
}

function displayError(msg = "An error occurred. Please try again later.") {
  displayer.innerHTML = `
    <div style="text-align: center; padding: 2rem; color: var(--accent);">
      <h3>${msg}</h3>
    </div>
  `;
}

async function nextPage() {
  currentPage++;
  await fetchMovies();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    await fetchMovies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}