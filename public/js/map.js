function updateMarkerRotation(position) {
    //heading could be null on some devices (or all)
      let heading = position.coords.heading; 
      if (typeof heading === 'number') {
          //new google map markers need to be styled instead of using setRotation()
          user1Marker.content.style.transform = `rotate(${heading}deg)`; 
      }
}

let map;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

   map = new Map(document.getElementById("map"), {
        center: {lat: 49.222177, lng: -122.686493},
        zoom: 16.5,
        tilt: 45,
        mapId: "90f87356969d889c",
        disableDefaultUI: true,
        gestureHandling: "greedy",
    });
    google.maps.event.addListenerOnce(map, 'idle', function() {
        map.setTilt(90);
    });

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            const user1Marker = new AdvancedMarkerElement({
              map,
              position: pos,
              title: 'Your Location',
              content: document.createElement("div"), // This is necessary for AdvancedMarkerElement
            });
          
            // Set the content of the marker
            const markerContent = user1Marker.content;
            markerContent.innerHTML = `<img src="/images/pointer.png" style="width: 50px; height: 50px;">`;
            markerContent.style.transform = 'rotate(0deg)';

            console.log(user1Marker.position);
            
            map.setCenter(user1Marker.position);

            //watchposition function with extra parameters
            function success(position) {
              console.log("Success: location watchposition changed");
              console.log("Position", position.coords);
              user1Marker.position = new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
              map.setCenter(user1Marker.position);
              updateMarkerRotation(position);

            };
            
            function error() {
              alert("Sorry, no position available.");
            }
            
            const options = {
              enableHighAccuracy: true,
              maximumAge: 30000,
              timeout: 27000,
            };
            
            navigator.geolocation.watchPosition(success, error, options);
            
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
