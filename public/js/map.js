function updateMarkerRotation(position) {
    if (position.coords.speed > 0) {
      console.log('You are moving!');
      const heading = position.coords.heading; // Get the direction of movement in degrees
      if (typeof heading === 'number') {
        const userMarker = map.getMarkers().find(marker => marker.getTitle() === 'Your Location'); // Find the user marker
        if (userMarker) {
            userMarker.setRotation(heading); // Set rotation angle to movement direction
        } 
      }
      
    }
}

let map;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

   map = new google.maps.Map(document.getElementById("map"), {
        center: {lat: 49.222177, lng: -122.686493},
        zoom: 16.5,
        tilt: 45,
        mapId: "90f87356969d889c",
        disableDefaultUI: true,
    });
    google.maps.event.addListenerOnce(map, 'idle', function() {
        map.setTilt(45);
    });

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            const user1Marker = new google.maps.Marker({
                map: map,
                enableHighAccuracy: true,
                position: pos,
                title: 'Your Location',
                icon: {
                    url: '/images/pointer.png',
                    size: new google.maps.Size(50, 50),
                    scaledSize: new google.maps.Size(50, 50),
                    anchor: new google.maps.Point(25, 25),
                    tilt: 45,

                }
            });
            map.setCenter(user1Marker.position);
            map.setTilt(75);
            navigator.geolocation.watchPosition(updateMarkerRotation);
          },
          () => {
            handleLocationError(true, map.getCenter());
          },
        );
      } else {
        // Browser doesn't support Geolocation
        console.log("Browser doesn't support Geolocation");
        return
      }
}

window.initMap = initMap;

// Wait for the Google Maps API to load
function loadGoogleMaps() {
    if (typeof google === 'object' && typeof google.maps === 'object') {
        initMap();
    } else {
        setTimeout(loadGoogleMaps, 100);
    }
}


document.addEventListener("DOMContentLoaded", loadGoogleMaps);