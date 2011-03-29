$(document).ready(function() {
  loadMap();
});

function loadMap() {
  var map_data = $('#search_map_data').text().replace('\\', '');
  var map_data_JSON = {};
  if (map_data != "") {
    map_data_JSON = jQuery.parseJSON(map_data);
  }
  initialize(map_data_JSON);

  startPolygon();

  if ($.browser.msie && $.browser.version.substr(0, 3) == "7.0") {
    var zIndexNumber = 1000;

    $('ul').each(function() {
      $(this).css('zIndex', zIndexNumber);
      zIndexNumber -= 10;
    });
    $('li').each(function() {
      $(this).css('zIndex', zIndexNumber);
      zIndexNumber -= 10;
    });
    $('a').each(function() {
      $(this).css('zIndex', zIndexNumber);
      zIndexNumber -= 10;
    });
  }


  if ($('div.search_Container span.search_input input').val() != "Search for Protected Areas, Points of interest, Countries, etc..") {
    $('div.search_Container span.search_input input').css('color', '#666666');
  }

  $('div.search_Container span.search_input input').click(function() {
    if ($('div.search_Container span.search_input input').val() == "Search for Protected Areas, Points of interest, Countries, etc..") {
      $('div.search_Container span.search_input input').val('');
      $('div.search_Container span.search_input input').css('color', '#666666');
    }
  });

  $('#zoom_in').click(function() {
    map.setZoom(map.getZoom() + 1);
  });
  $('#zoom_out').click(function() {
    map.setZoom(map.getZoom() - 1);
  });
}

var map;
var bounds;
var lastMask = 1000;

//var ppeOverlay;
/**
 * Add overlays here. Add the URL constant to "environment/*.js".
 */
function loadOverlays() {
  /*ppeOverlay = new SparseTileLayerOverlay();
   ppeOverlay.setUrl = function SetUrl(xy, z) {
   var q = [];
   q[0] = OVERLAY_UTILITY_SERVER_URL + "/blue/" + z + "/" + xy.x + "/" + xy.y;
   return q;
   };
   ppeOverlay.setMap(map);
   google.maps.event.addListener(map, "idle", function() {
   ppeOverlay.idle();
   });*/
}

/**
 * Initializes map data.
 */
function initialize(data) {
  var mapOptions = {
    zoom: 5,
    //center: new google.maps.LatLng(0, 0),
    disableDefaultUI: true,
    scrollwheel:true,
    mapTypeId: google.maps.MapTypeId.TERRAIN
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
  var bounds = new google.maps.LatLngBounds();


  loadOverlays();


  $.each(data, function(i, val) {
    var latLong = new google.maps.LatLng(val.y, val.x);
    bounds.extend(latLong); // Center point.
    new SearchMarker({latlng: latLong, map: map, paInformation: val});
    var poly = createGeoJsonPolygon(val.the_geom);
    poly.setMap(map);
    coords = val.the_geom.coordinates[0][0];
    for (var i = 0; i < coords.length; i++) {
      bounds.extend(new google.maps.LatLng(coords[i][1], coords[i][0]));
    }
  });

  map.fitBounds(bounds);
  map.setCenter(bounds.getCenter());
}

/*drawing polygon*/
var poly;
var markers = [];
var path = new google.maps.MVCArray;

var vertexIcon = new google.maps.MarkerImage('/images/icons/delete_vertex_noover.png',
        new google.maps.Size(12, 12),
  // The origin for this image
        new google.maps.Point(0, 0),
  // The anchor for this image
        new google.maps.Point(6, 6)
        );

function addPoint(event) {
  addPointUsingLatLong(event.latLng)
}
function addPointUsingLatLong(latLng) {
  path.insertAt(path.length, latLng);

  var marker = new google.maps.Marker({
    position: latLng,
    map: map,
    draggable: true,
    icon: vertexIcon
  });
  markers.push(marker);
  marker.setTitle("#" + path.length);

  google.maps.event.addListener(marker, 'click', function() {
    if (markers.length < 4) {
      if (!$('#done').hasClass('disabled')) {
        $('#done').addClass('disabled');
      }
    }

    marker.setMap(null);
    for (var i = 0, I = markers.length; i < I && markers[i] != marker; ++i);
    markers.splice(i, 1);
    path.removeAt(i);
  }

          );


  google.maps.event.addListener(marker, 'dragend', function() {
    for (var i = 0, I = markers.length; i < I && markers[i] != marker; ++i);
    path.setAt(i, marker.getPosition());
  }
          );

  if (markers.length > 2) //do we have a polygon?
  {
    if ($('#done').hasClass('disabled')) {
      $('#done').removeClass('disabled');
    }
  }
}

// destroy old polygon?
function startPolygon() {
  poly = new google.maps.Polygon({
    strokeWeight: 2,
    fillColor: '#FF6600',
    strokeColor: '#FF6600'
  });
  poly.setMap(map);
  poly.setPaths(new google.maps.MVCArray([path]));

  google.maps.event.addListener(map, 'click', addPoint);
}

function submitPolygon() {
  $('#done').addClass('loading');
  var geojson = polys2geoJson([poly]);
  var sources = [];
  $('#layers input:checkbox:checked').each(function() {
    sources.push($(this).val());
  });

  if (MAX_POLYGON_AREA_KM2 > 0) {
    var area = google.maps.geometry.spherical.computeArea(poly.getPath());
    if (area > MAX_POLYGON_AREA_KM2 * 1000 * 1000) {
      alert("Your polygon is too large (" + Math.round(area / 1000 / 1000) + " km2), please limit its area to " + MAX_POLYGON_AREA_KM2 + " km2.");
      $('#done').removeClass('loading');
      return false;
    }
  }

  var dataObj = {"geojson": geojson, "sources": sources};
  $.ajax({
    type: 'POST',
    url: "polygon/create",
    data: dataObj,
    cache: false,
    dataType: 'json',
    success: function(result) {
      if (typeof(result.id) != "undefined") {
        window.location = 'polygons/' + result.id;
      } else {
        alert(result.error || "Unknown error while uploading polygon.\nIs the polygon too big?\nOr perhaps its edges intersect each-other?");
      }
      $('#done').removeClass('loading');
    },
    error:function (xhr, ajaxOptions, thrownError) {
      alert(thrownError || "Error submitting data.");
      $('#done').removeClass('loading');
    }
  });
}

/*adapted from Lifeweb's calculator.js*/
function polys2geoJson(polygons) {
  var polys = [];
  for (var i = 0; i < polygons.length; i++) {
    var pol = polygons[i];
    var polyArray = [];
    var pathArray = [];
    var numPoints = path.length;
    for (var i = 0; i < numPoints; i++) {
      var lat = path.getAt(i).lat();
      var lng = path.getAt(i).lng();
      pathArray.push([lng,lat]);
    }

    var first = path.getAt(0);
    pathArray.push([first.lng(),first.lat()]); //google maps will automatically close the polygon; PostGIS requires the last coordinate to be repeated
    polyArray.push(pathArray);
    polys.push(polyArray);
  }

  return $.toJSON({
    "type":"MultiPolygon",
    "coordinates":polys
  });
}