// =====================
// Configuración inicial
// =====================
const map = L.map('map').setView([-43.2489, -65.3051], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let geojsonLayer;
let marker;

// =====================
// Diccionarios
// =====================
const diasTexto = {
  'LU': 'Lunes',
  'MA': 'Martes',
  'MI': 'Miércoles',
  'JU': 'Jueves',
  'VI': 'Viernes',
  'SA': 'Sábado'
};

const colores = {
  'LU': '#1f78b4',
  'MA': '#33a02c',
  'MI': '#ffcc00',
  'JU': '#ff7f00',
  'VI': '#e31a1c',
  'SA': '#6a3d9a'
};

// =====================
// Estilo de polígonos
// =====================
function estilo(feature) {
  const dia = feature.properties.DIA; // ← ajustar si el campo se llama distinto
  return {
    color: '#555',
    weight: 1,
    fillColor: colores[dia] || '#ccc',
    fillOpacity: 0.6
  };
}

// =====================
// Cargar zonas
// =====================
fetch('SECOASHEdit.geojson')
  .then(res => res.json())
  .then(data => {
    geojsonLayer = L.geoJSON(data, {
      style: estilo
    }).addTo(map);
  });

// =====================
// Buscar dirección
// =====================
function buscarDireccion() {
  const dir = document.getElementById('direccion').value;

  if (!dir) return;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dir + ', Trelew, Chubut, Argentina')}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.length === 0) {
        document.getElementById('resultado').innerText = 'Dirección no encontrada.';
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      if (marker) map.removeLayer(marker);

      marker = L.marker([lat, lon]).addTo(map);
      map.setView([lat, lon], 15);

      evaluarZona(lat, lon);
    });
}

// =====================
// Evaluar punto en polígono
// =====================
function evaluarZona(lat, lon) {
  const punto = turf.point([lon, lat]);
  let encontrado = false;

  geojsonLayer.eachLayer(layer => {
    const poligono = layer.toGeoJSON();

    if (turf.booleanPointInPolygon(punto, poligono)) {
      const diaAbrev = poligono.properties.DIA;
      const dia = diasTexto[diaAbrev] || diaAbrev;

      document.getElementById('resultado').innerHTML =
        `🗓️ <strong>Día de recolección de residuos secos:</strong> ${dia}`;

      encontrado = true;
    }
  });

  if (!encontrado) {
    document.getElementById('resultado').innerText =
      'La dirección no se encuentra dentro de una zona de recolección.';
  }
}
