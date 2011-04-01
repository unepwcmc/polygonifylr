$(document).ready(function() {
  loadMap();
});

function loadMap() {
  var mapOptions = {
    zoom: 5,
    disableDefaultUI: true,
    scrollwheel:true,
    mapTypeId: google.maps.MapTypeId.TERRAIN
  };
  map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);


  loadOverlays();

  var map_data_str = $('#map_data').text();
  var bounds = new google.maps.LatLngBounds();
  var map_data = {};
  if (map_data_str != "") {
    map_data = jQuery.parseJSON(map_data_str);
    var geojson = jQuery.parseJSON(map_data.geojson);
    var polygonSet = geojson.coordinates[0];
    for (var i = 0; i < polygonSet.length; i++) {
      var polygon = polygonSet[i];
      for (var j = 0; j < polygon.length - 1; j++) {
        var point = polygon[j];
        var latLong = new google.maps.LatLng(point[1], point[0]);
        addPointUsingLatLong(latLong);
        bounds.extend(latLong);
      }
    }
    if (bounds.isEmpty()) {
      bounds.extend(new google.maps.LatLng(map_data.y, map_data.x)); // Center point.
    }
  }

  map.fitBounds(bounds);
  if (bounds.isEmpty() && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
    });
  } else {
    map.setCenter(bounds.getCenter());
  }

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
 * Add overlays here. Tip: add the URL constant to "environment/*.js".
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

var poly;
var markers = [];
var path = new google.maps.MVCArray;

var vertexIcon = new google.maps.MarkerImage('/images/icons/delete_vertex_noover.png',
        new google.maps.Size(12, 12), // The origin for this image
        new google.maps.Point(0, 0), // The anchor for this image
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
  });


  google.maps.event.addListener(marker, 'dragend', function() {
    for (var i = 0, I = markers.length; i < I && markers[i] != marker; ++i);
    path.setAt(i, marker.getPosition());
  });

  //do we have a polygon?
  if (markers.length > 2) {
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
  if (MAX_POLYGON_AREA_KM2 > 0) {
    var area = google.maps.geometry.spherical.computeArea(poly.getPath());
    if (area > MAX_POLYGON_AREA_KM2 * 1000 * 1000) {
      alert("Your polygon is too large (" + Math.round(area / 1000 / 1000) + " km2), please limit its area to " + MAX_POLYGON_AREA_KM2 + " km2.");
      $('#done').removeClass('loading');
      return false;
    }
  }

  var geojson = polys2geoJson([poly]);
  var dataObj = {"geometry": geojson};
  $.ajax({
    type: 'POST',
    url: "/polygons",
    data: dataObj,
    cache: false,
    dataType: 'json',
    success: function(result) {
      if (typeof(result.id) != "undefined") {
        window.location = '/polygons';
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
