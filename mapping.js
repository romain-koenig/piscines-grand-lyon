console.log("Script starts here");

mapboxgl.accessToken =
  "pk.eyJ1Ijoicm9tYWlua29lbmlnIiwiYSI6ImNrY2cxazR3dzBubDYycm0ybHQ4NWwwemsifQ.zv3lDYFBK4_zZmZhayc4Vg";

var bounds = [
  [4.6, 45.2], // Southwest coordinates
  [5.1, 45.9] // Northeast coordinates
];

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/basic-v9',
  center: [4.831911, 45.757737],
  zoom: 12,
  maxBounds: bounds
});

map.on('load', function () {
  map.addSource('points', {
    'type': 'geojson',
    'data':
      // 'https://www.data.gouv.fr/fr/datasets/r/79abbab9-67b4-4d8e-afe7-40195f000974'
      './adr_voie_lieu.json' // FASTER, LOCAL - for testing purpose

  });

  map.loadImage(
    './img/logo_piscine_noir_map.png',
    function (error, image) {
      if (error) throw error;
      map.addImage('logo', image);


    });
  map.addLayer({
    'id': 'points',
    'type': 'symbol',
    'source': 'points',
    'layout': {
      // 'icon-image': 'swimming-15',
      'icon-image': 'logo',
      // get the title name from the source's "NOM" property
      'text-field': ['get', 'nom'],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-offset': [0, 0.6],
      'text-anchor': 'top'
    }
  });

  // Display a popup
  map.on('click', 'points', function (e) {
    let coordinates = e.features[0].geometry.coordinates.slice();
    let description =
      `<h2>${e.features[0].properties.nom}</h2>

      ${e.features[0].properties.commentaires === undefined ?
        "" :
        '<p>' + e.features[0].properties.commentaires + '</p>'}`

    // ${e.features[0].properties.tarif === undefined ?
    // "" :
    // '<p>' + e.features[0].properties.tarif + '</p>'}`


    const calendrier = JSON.parse(e.features[0].properties.openinghoursspecification);

    translateDay = {
      'http:\/\/schema.org\/Monday': 'Lundi',
      'http:\/\/schema.org\/Tuesday': 'Mardi',
      'http:\/\/schema.org\/Wednesday': 'Mercredi',
      'http:\/\/schema.org\/Thursday': 'Jeudi',
      'http:\/\/schema.org\/Friday': 'Vendredi',
      'http:\/\/schema.org\/Saturday': 'Samedi',
      'http:\/\/schema.org\/Sunday': 'Dimanche',
    };

    class jourOuverture {
      day = "";
      open = "-";
      close = "-";

      openedToday = false;
      infosValables = true;

      constructor(day, open, close, validFrom, validThrough) {
        const now = new Date();
        const start = new Date(validFrom);
        const end = new Date(validThrough);

        if (now < start || now > end) {
          this.infosValables = false;
          return;
        }
        this.day = translateDay[day];
        if (open !== undefined) {
          this.open = open;
          this.openedToday = true;
        }
        if (close !== undefined) {
          this.close = close;
        }
      }
      toString() {
        return this.notOpened ?
          this.day + " - Fermé" :
          this.day + " - " + this.open + " - " + this.close;
      }
    }

    const horaires = []
    calendrier.forEach(element => {
      let day = new jourOuverture(element.dayOfWeek,
        element.opens,
        element.closes,
        element.validFrom,
        element.validThrough);
      //console.log(day);
      if (day.infosValables) {
        horaires.push(day)
      }
    });


    let answerHoraires = "";
    if (horaires.length > 0) {
      answerHoraires = answerHoraires.concat("<ul>");

      horaires.forEach(element => {
        answerHoraires = answerHoraires.concat("<li>");
        answerHoraires = answerHoraires.concat(element.toString());
        answerHoraires = answerHoraires.concat("</li>");
      });

      answerHoraires = answerHoraires.concat("</ul>");
      description = description.concat(answerHoraires);

      console.log(answerHoraires);
    }
    else {
      description = description.concat("<p><strong>Horaires inconnus</strong></p>");
    }


    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(description)
      .addTo(map);
  });

  // Change the cursor to a pointer when the it enters a feature in the 'symbols' layer.
  map.on('mouseenter', 'points', function () {
    map.getCanvas().style.cursor = 'pointer';
  });

  // Change it back to a pointer when it leaves.
  map.on('mouseleave', 'points', function () {
    map.getCanvas().style.cursor = '';
  });

});


// disable map rotation using right click + drag
map.dragRotate.disable();

// disable map rotation using touch rotation gesture
map.touchZoomRotate.disableRotation();
