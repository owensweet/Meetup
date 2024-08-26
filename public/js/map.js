function getDirection(prevCoord, currCoord) {
  //calculations to get angle between previous position and current
  const diffLat = currCoord.lat - prevCoord.lat;
  const diffLng = currCoord.lng - prevCoord.lng;

  //if there is no movement, set the angle to upright
  if (Math.abs(diffLat) < 0.0000001 && Math.abs(diffLng) < 0.0000001) {
    return 0;
  }

  const antiClockwiseEastAngle = toDegrees(Math.atan2(diffLat, diffLng));
  const clockwiseNorthAngle = 90 - antiClockwiseEastAngle;
  return clockwiseNorthAngle;

  user1Marker.content.style.transform = `rotate(45deg)`; 
}

function toDegrees(radian) {
  return (radian * 180) / Math.PI;
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

              //previous position is the current value for usermarker position
              const prevPos = user1Marker.position
              
              //here we update usermarker position to current geolocation position
              user1Marker.position = new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
              console.log("Current position", position.coords.latitude, position.coords.longitude);

              const angle = getDirection(prevPos, user1Marker.position);
              console.log("Angle: ", angle);
              user1Marker.content.style.transform = `rotate(${angle}deg)`; 

              map.panTo(user1Marker.position);

              

            };
            
            function error() {
              alert("Sorry, no position available.");
            }
            
            const options = {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 3000,
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
