// ==========================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
let allStations = [];
let currentFiltered = [];
let currentIndex = -1;
let favorites = JSON.parse(localStorage.getItem('mr_favs') || '[]');
let currentView = 'home';
let currentCountry = 'all';

const audioPlayer = document.getElementById('audioPlayer') || new Audio();

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
});

async function initApp() {
  try {
    const res = await fetch('./radios.json?v=' + Date.now());
    if (!res.ok) throw new Error('No se pudo cargar radios.json');
    const data = await res.json();
    
    // Adaptar según el formato del JSON
    if (Array.isArray(data)) {
      allStations = data;
    } else if (data && Array.isArray(data.stations)) {
      allStations = data.stations;
    } else {
      allStations = [];
    }

    renderCountries();
    renderChips();
    applyFilter();
    setupCarousel(data.ads || []);

  } catch (err) {
    console.error('Error al inicializar:', err);
    document.getElementById('radioGrid').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-triangle-exclamation"></i>
        <p>No se pudieron cargar las emisoras. Verifica radios.json</p>
      </div>
    `;
  }
}

// ==========================================
// RENDERIZADO DE LA INTERFAZ
// ==========================================
function applyFilter() {
  let list = [...allStations];

  // Filtro por Vista / Menú
  if (currentView === 'favorites') {
    list = list.filter(s => favorites.includes(s.name));
    updateHeader('Mis Favoritos', `${list.length} emisoras guardadas`);
  } else if (currentView === 'history') {
    const hist = JSON.parse(localStorage.getItem('mr_hist') || '[]');
    list = list.filter(s => hist.includes(s.name));
    updateHeader('Historial', 'Escuchadas recientemente');
  } else {
    // Filtro por País
    if (currentCountry !== 'all') {
      list = list.filter(s => (s.country || '').toLowerCase() === currentCountry.toLowerCase());
      updateHeader(`Radios de ${currentCountry}`, `${list.length} emisoras encontradas`);
    } else {
      updateHeader('Todas las emisoras', 'Radio en vivo · sin cortes');
    }
  }

  currentFiltered = list;
  renderGrid(list);
}

function renderGrid(stations) {
  const grid = document.getElementById('radioGrid');
  if (!grid) return;

  if (stations.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-radio"></i>
        <p>No se encontraron emisoras en esta sección.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = stations.map((st, i) => {
    const isFav = favorites.includes(st.name);
    const isPlaying = currentIndex >= 0 && currentFiltered[currentIndex]?.name === st.name && !audioPlayer.paused;

    return `
      <div class="radio-card ${isPlaying ? 'active playing' : ''}" onclick="playByIndex(${i})">
        <div class="card-art">
          <img src="${st.img || 'icon-192.png'}" alt="${st.name}" onerror="this.src='icon-192.png'">
          ${st.country ? `<span class="card-country">${st.country}</span>` : ''}
          <button class="card-fav ${isFav ? 'on' : ''}" onclick="toggleFav(event, '${st.name}')">
            <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
          </button>
          <button class="card-play">
            <i class="fas ${isPlaying ? 'fa-pause' : 'fa-play'}"></i>
          </button>
          <div class="eq"><span></span><span></span><span></span><span></span></div>
        </div>
        <div class="card-title">${st.name}</div>
        <div class="card-meta">${st.genre || st.city || 'En vivo'}</div>
      </div>
    `;
  }).join('');
}

function renderCountries() {
  const container = document.getElementById('countryList');
  if (!container) return;

  const countries = [...new Set(allStations.map(s => s.country).filter(Boolean))];
  
  let html = `
    <button class="country-btn ${currentCountry === 'all' ? 'active' : ''}" onclick="selectCountry('all')">
      <span><i class="fas fa-globe" style="margin-right:8px;"></i> Todos</span>
      <span class="cnt">${allStations.length}</span>
    </button>
  `;

  countries.forEach(c => {
    const count = allStations.filter(s => s.country === c).length;
    html += `
      <button class="country-btn ${currentCountry === c ? 'active' : ''}" onclick="selectCountry('${c}')">
        <span>${c}</span>
        <span class="cnt">${count}</span>
      </button>
    `;
  });

  container.innerHTML = html;
}

function renderChips() {
  const container = document.getElementById('mobileChips');
  if (!container) return;

  const genres = ['Todos', ...new Set(allStations.map(s => s.genre).filter(Boolean))];
  container.style.display = 'flex';
  
  container.innerHTML = genres.map(g => `
    <button class="chip ${g === 'Todos' ? 'active' : ''}" onclick="filterByGenre('${g}', this)">${g}</button>
  `).join('');
}

function updateHeader(title, sub) {
  const t = document.getElementById('sectionTitle');
  const s = document.getElementById('sectionSub');
  if (t) t.textContent = title;
  if (s) s.textContent = sub;
}

// ==========================================
// CONTROL DE REPRODUCCIÓN Y JUGADOR
// ==========================================
function playByIndex(index) {
  if (index < 0 || index >= currentFiltered.length) return;
  
  currentIndex = index;
  const st = currentFiltered[index];

  // Actualizar Player Bar
  document.getElementById('pTitle').textContent = st.name;
  document.getElementById('pGenre').textContent = st.genre || st.city || 'En vivo';
  document.getElementById('pImg').src = st.img || 'icon-192.png';
  
  // Actualizar Full Player
  document.getElementById('fpTitle').textContent = st.name;
  document.getElementById('fpSub').textContent = st.city || st.country || 'Radio en vivo';
  document.getElementById('fpGenre').textContent = st.genre || '';
  document.getElementById('fpArt').src = st.img || 'icon-512.png';
  document.getElementById('fpBgImg').style.backgroundImage = `url(${st.img || 'icon-512.png'})`;

  updateFavIcons(st.name);

  // Cargar Audio
  audioPlayer.src = st.url;
  audioPlayer.play().then(() => updatePlayState(true)).catch(err => {
    console.error('Error al reproducir stream:', err);
    updatePlayState(false);
  });

  // Guardar en Historial
  addToHistory(st.name);
  renderGrid(currentFiltered);
}

function togglePlay() {
  if (audioPlayer.paused) {
    if (audioPlayer.src) {
      audioPlayer.play();
      updatePlayState(true);
    } else if (currentFiltered.length > 0) {
      playByIndex(0);
    }
  } else {
    audioPlayer.pause();
    updatePlayState(false);
  }
}

function updatePlayState(isPlaying) {
  const pIcon = document.getElementById('playIcon');
  const fpIcon = document.getElementById('fpPlayIcon');
  const wave = document.getElementById('wave');
  const fpArt = document.getElementById('fpArt');

  const iconClass = isPlaying ? 'fa-pause' : 'fa-play';
  if (pIcon) pIcon.className = `fas ${iconClass}`;
  if (fpIcon) fpIcon.className = `fas ${iconClass}`;

  if (wave) wave.classList.toggle('playing', isPlaying);
  if (fpArt) fpArt.classList.toggle('beating', isPlaying);

  renderGrid(currentFiltered);
}

// ==========================================
// CARRUSEL DE PUBLICIDAD
// ==========================================
function setupCarousel(ads) {
  const carousel = document.getElementById('adCarousel');
  const track = document.getElementById('adTrack');
  const dots = document.getElementById('adDots');
  if (!carousel || !track || !ads || ads.length === 0) return;

  carousel.style.display = 'block';
  let slideIndex = 0;

  track.innerHTML = ads.map(ad => `
    <div class="ad-slide">
      <a href="${ad.link || '#'}" target="_blank">
        <img src="${ad.img}" alt="Publicidad">
      </a>
    </div>
  `).join('');

  dots.innerHTML = ads.map((_, i) => `
    <button class="${i === 0 ? 'on' : ''}" onclick="goToSlide(${i})"></button>
  `).join('');

  window.goToSlide = (idx) => {
    slideIndex = idx;
    track.style.transform = `translateX(-${slideIndex * 100}%)`;
    Array.from(dots.children).forEach((d, i) => d.classList.toggle('on', i === slideIndex));
  };

  document.getElementById('adNext')?.addEventListener('click', () => {
    slideIndex = (slideIndex + 1) % ads.length;
    window.goToSlide(slideIndex);
  });

  document.getElementById('adPrev')?.addEventListener('click', () => {
    slideIndex = (slideIndex - 1 + ads.length) % ads.length;
    window.goToSlide(slideIndex);
  });

  setInterval(() => {
    slideIndex = (slideIndex + 1) % ads.length;
    window.goToSlide(slideIndex);
  }, 5000);
}

// ==========================================
// ACCIONES Y EVENTOS GLOBAL
// ==========================================
function setupEventListeners() {
  // Play / Pausa
  document.getElementById('playBtn')?.addEventListener('click', togglePlay);
  document.getElementById('fpPlay')?.addEventListener('click', togglePlay);

  // Siguiente / Anterior
  document.getElementById('nextBtn')?.addEventListener('click', () => playByIndex(currentIndex + 1));
  document.getElementById('prevBtn')?.addEventListener('click', () => playByIndex(currentIndex - 1));
  document.getElementById('fpNext')?.addEventListener('click', () => playByIndex(currentIndex + 1));
  document.getElementById('fpPrev')?.addEventListener('click', () => playByIndex(currentIndex - 1));

  // Desplegar Full Player
  document.getElementById('barTrackInfo')?.addEventListener('click', openFullPlayer);
  document.getElementById('barExpand')?.addEventListener('click', openFullPlayer);
  document.getElementById('fpClose')?.addEventListener('click', closeFullPlayer);

  // Volumen
  const volSliders = [document.getElementById('vol'), document.getElementById('fpVol')];
  volSliders.forEach(slider => {
    if (slider) {
      slider.addEventListener('input', (e) => {
        const val = e.target.value;
        audioPlayer.volume = val;
        volSliders.forEach(s => s && (s.value = val));
      });
    }
  });

  // Búsqueda
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allStations.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.genre && s.genre.toLowerCase().includes(q)) ||
      (s.country && s.country.toLowerCase().includes(q))
    );
    renderGrid(filtered);
  });

  // Menú Lateral Mobile
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  
  document.getElementById('hamburger')?.addEventListener('click', () => {
    sidebar?.classList.add('open');
    scrim?.classList.add('show');
  });

  const closeSide = () => {
    sidebar?.classList.remove('open');
    scrim?.classList.remove('show');
  };

  document.getElementById('sideClose')?.addEventListener('click', closeSide);
  scrim?.addEventListener('click', closeSide);

  // Navegación Sidebar
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      currentCountry = 'all';
      applyFilter();
      closeSide();
    });
  });
}

// Funciones auxiliares de UI
function openFullPlayer() {
  document.getElementById('fullPlayer')?.classList.add('open');
}

function closeFullPlayer() {
  document.getElementById('fullPlayer')?.classList.remove('open');
}

function selectCountry(c) {
  currentCountry = c;
  renderCountries();
  applyFilter();
}

function filterByGenre(g, el) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  if (g === 'Todos') {
    renderGrid(allStations);
  } else {
    renderGrid(allStations.filter(s => s.genre === g));
  }
}

function toggleFav(e, name) {
  e.stopPropagation();
  if (favorites.includes(name)) {
    favorites = favorites.filter(f => f !== name);
  } else {
    favorites.push(name);
  }
  localStorage.setItem('mr_favs', JSON.stringify(favorites));
  if (currentIndex >= 0) updateFavIcons(currentFiltered[currentIndex]?.name);
  applyFilter();
}

function updateFavIcons(currentName) {
  const isFav = favorites.includes(currentName);
  const barFav = document.getElementById('barFav');
  const fpFav = document.getElementById('fpFav');

  if (barFav) barFav.innerHTML = `<i class="${isFav ? 'fas' : 'far'} fa-heart"></i>`;
  if (barFav) barFav.classList.toggle('on', isFav);

  if (fpFav) fpFav.innerHTML = `<i class="${isFav ? 'fas' : 'far'} fa-heart"></i> ${isFav ? 'Guardado' : 'Guardar'}`;
  if (fpFav) fpFav.classList.toggle('on', isFav);
}

function addToHistory(name) {
  let hist = JSON.parse(localStorage.getItem('mr_hist') || '[]');
  hist = hist.filter(h => h !== name);
  hist.unshift(name);
  localStorage.setItem('mr_hist', JSON.stringify(hist.slice(0, 20)));
}
