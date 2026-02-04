// =====================
// Inicializar mapa
// =====================
const map = L.map('map').setView([-43.2489, -65.3051], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let geojsonLayer;
let marker;

// =====================
// Colores por día
// =====================
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
  const dia = feature.properties.dia;

  return {
    color: '#555',
    weight: 1,
    fillColor: colores[dia] || '#cccccc',
    fillOpacity: 0.6
  };
}

// =====================
// Cargar GeoJSON
// =====================
fetch('SECOASHEdit.geojson')
  .then(response => response.json())
  .then(data => {
    geojsonLayer = L.geoJSON(data, {
      style: estilo
    }).addTo(map);
  })
  .catch(error => {
    console.error('Error cargando el GeoJSON:', error);
  });

// =====================
// Buscar dirección
// =====================
function buscarDireccion() {
  const direccion = document.getElementById('direccion').value;

  if (!direccion) return;

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    direccion + ', Trelew, Chubut, Argentina'
  )}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.length === 0) {
        document.getElementById('resultado').innerText =
          'Dirección no encontrada.';
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      if (marker) {
        map.removeLayer(marker);
      }

      marker = L.marker([lat, lon]).addTo(map);
      map.setView([lat, lon], 15);

      evaluarZona(lat, lon);
    });
}

// =====================
// Evaluar punto en polígono
// =====================
function evaluarZona(lat, lon) {
  if (!geojsonLayer) return;

  const punto = turf.point([lon, lat]);
  let encontrado = false;

  geojsonLayer.eachLayer(layer => {
    const poligono = layer.toGeoJSON();

    if (turf.booleanPointInPolygon(punto, poligono)) {
      const dia = poligono.properties.dia;

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
