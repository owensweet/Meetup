async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

   map = new Map(document.getElementById("map"), {
        center: {lat: 49.282730, lng: -123.120735},
        zoom: 19,
        tilt: 45,
        mapId: "90f87356969d889c" ,
    });
    google.maps.event.addListenerOnce(map, 'idle', function() {
        map.setTilt(45);
    });
}
// Wait for the Google Maps API to load
function loadGoogleMaps() {
    if (typeof google === 'object' && typeof google.maps === 'object') {
        initMap();
    } else {
        setTimeout(loadGoogleMaps, 100);
    }
}

document.addEventListener("DOMContentLoaded", loadGoogleMaps);