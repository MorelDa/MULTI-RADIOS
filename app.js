// Variable global para almacenar las radios
let allStations = [];
const audioPlayer = document.getElementById('audioPlayer') || new Audio();

// Cargar radios.json al iniciar
document.addEventListener('DOMContentLoaded', () => {
  fetchRadiosData();
});

async function fetchRadiosData() {
  const grid = document.getElementById('radioGrid');
  if (grid) {
    grid.innerHTML = '<p style="color:#8B93A7; text-align:center; grid-column:1/-1; padding:40px;">⏳ Cargando emisoras...</p>';
  }

  try {
    // Petición al archivo JSON
    const res = await fetch('./radios.json?v=' + Date.now());
    if (!res.ok) throw new Error(`No se encontró radios.json (Error ${res.status})`);
    
    const data = await res.json();
    
    // Si radios.json tiene un objeto { stations: [...] } o es un array directo [...]
    if (Array.isArray(data)) {
      allStations = data;
    } else if (data && Array.isArray(data.stations)) {
      allStations = data.stations;
    } else {
      throw new Error("El formato de radios.json no es correcto (debe ser un array o incluir 'stations').");
    }

    if (allStations.length === 0) {
      if (grid) grid.innerHTML = '<p style="color:#8B93A7; text-align:center; grid-column:1/-1;">El archivo radios.json está vacío.</p>';
      return;
    }

    // Dibujar las radios en la pantalla
    renderRadios(allStations);

  } catch (err) {
    console.error("❌ Error al cargar las radios:", err);
    if (grid) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; background: rgba(239, 68, 68, 0.1); border: 1px solid #EF4444; color: #FCA5A5; padding: 20px; border-radius: 12px; text-align: center;">
          <b style="font-size: 1.1rem;">⚠️ Error al cargar las radios</b>
          <p style="margin-top: 6px; font-size: 0.9rem;">${err.message}</p>
        </div>
      `;
    }
  }
}

// Función para pintar las tarjetas de radio en el HTML
function renderRadios(stations) {
  const grid = document.getElementById('radioGrid');
  if (!grid) return;

  grid.innerHTML = stations.map((st, index) => {
    const name = st.name || 'Emisora';
    const img = st.img || 'icon-192.png';
    const country = st.country || '';
    const genre = st.genre || st.city || 'En vivo';
    const url = st.url || '';

    return `
      <div class="radio-card" onclick="playStation('${url}', '${name}', '${img}', '${genre}')">
        <div class="card-art">
          <img src="${img}" alt="${name}" onerror="this.src='icon-192.png'">
          ${country ? `<span class="card-country">${country}</span>` : ''}
          <button class="card-play"><i class="fas fa-play"></i></button>
        </div>
        <div class="card-title">${name}</div>
        <div class="card-meta">${genre}</div>
      </div>
    `;
  }).join('');
}

// Función para reproducir el stream de audio
function playStation(url, name, img, genre) {
  if (!url) {
    alert("Esta emisora no tiene una URL de reproduccion válida.");
    return;
  }

  // Actualizar reproductor en la barra inferior
  const pTitle = document.getElementById('pTitle');
  const pGenre = document.getElementById('pGenre');
  const pImg = document.getElementById('pImg');
  const playIcon = document.getElementById('playIcon');

  if (pTitle) pTitle.textContent = name;
  if (pGenre) pGenre.textContent = genre;
  if (pImg) pImg.src = img;

  // Iniciar reproductor
  audioPlayer.src = url;
  audioPlayer.play().then(() => {
    if (playIcon) playIcon.className = 'fas fa-pause';
  }).catch(e => {
    console.error("Error al reproducir audio:", e);
    alert("No se pudo conectar con el servidor de esta radio.");
  });
}

// Control del botón de Play/Pausa principal
const playBtn = document.getElementById('playBtn');
if (playBtn) {
  playBtn.addEventListener('click', () => {
    const playIcon = document.getElementById('playIcon');
    if (audioPlayer.paused) {
      if (audioPlayer.src) {
        audioPlayer.play();
        if (playIcon) playIcon.className = 'fas fa-pause';
      }
    } else {
      audioPlayer.pause();
      if (playIcon) playIcon.className = 'fas fa-play';
    }
  });
}
