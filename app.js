// =====================
// Inicializar mapa
// =====================
const map = L.map('map').setView([-43.2489, -65.3051], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let geojsonLayer = null;
let marker = null;

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
  .then(res => res.json())
  .then(data => {
    geojsonLayer = L.geoJSON(data, {
      style: estilo
    }).addTo(map);

    console.log('GeoJSON cargado');
  })
  .catch(err => {
    console.error('Error cargando GeoJSON:', err);
  });

// =====================
// Buscar dirección
// =====================
function buscarDireccion() {
  const direccion = document.getElementById('direccion').value;
  if (!direccion) return;

  const url =
    'https://nominatim.openstreetmap.org/search?format=json&q=' +
    encodeURIComponent(direccion + ', Trelew, Chubut, Argentina');

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        mostrarResultado(
          'Dirección no encontrada',
          null,
          null
        );
        return;
      }

      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      // Quitar marcador previo
      if (marker) {
        map.removeLayer(marker);
      }

      // Nuevo marcador
      marker = L.marker([lat, lon]).addTo(map);
      map.setView([lat, lon], 15);

      evaluarZona(lat, lon);
    })
    .catch(err => {
      console.error('Error geocodificando:', err);
    });
}

// =====================
// Evaluar punto en polígono
// =====================
function evaluarZona(lat, lon) {
  if (!geojsonLayer) {
    mostrarResultado(
      'Las zonas todavía no cargaron',
      lat,
      lon
    );
    return;
  }

  const punto = turf.point([lon, lat]);
  let encontrado = false;

  geojsonLayer.eachLayer(layer => {
    const poligono = layer.toGeoJSON();

    if (turf.booleanPointInPolygon(punto, poligono)) {
      const dia = poligono.properties.dia;

      const texto =
        '🗓️ <strong>Día de recolección:</strong> ' + dia;

      mostrarResultado(texto, lat, lon);
      encontrado = true;
    }
  });

  if (!encontrado) {
    mostrarResultado(
      'La dirección no se encuentra dentro de una zona de recolección.',
      lat,
      lon
    );
  }
}

// =====================
// Mostrar resultado (popup + recuadro)
// =====================
function mostrarResultado(texto, lat, lon) {
  // Recuadro inferior
  document.getElementById('resultado').innerHTML = texto;

  // Popup (solo si hay coordenadas)
  if (lat !== null && lon !== null) {
    L.popup({ closeButton: true })
      .setLatLng([lat, lon])
      .setContent(texto)
      .openOn(map);
  }
}


