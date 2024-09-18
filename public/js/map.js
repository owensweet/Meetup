let map;
var user1Marker;
var user2Marker;
var meetupMarker;

var directionsService;
let directionsRenderer1;
let directionsRenderer2;

var geocoder;

var pannedOut = false;


function getDirection(prevCoord, currCoord) {
  //calculations to get angle between previous position and current
  const diffLat = currCoord.lat - prevCoord.lat;
  const diffLng = currCoord.lng - prevCoord.lng;

  //if there is no movement, set the angle to upright
  if (Math.abs(diffLat) < (1 / 111139) && Math.abs(diffLng) < (1 / (111320 * Math.cos(currCoord.lat * (Math.PI / 180))))) {
    return 0;
  }

  const antiClockwiseEastAngle = toDegrees(Math.atan2(diffLat, diffLng));
  const clockwiseNorthAngle = 90 - antiClockwiseEastAngle;
  return clockwiseNorthAngle;
}

function toDegrees(radian) {
  return (radian * 180) / Math.PI;
}


async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    geocoder = new google.maps.Geocoder();

    directionsService = new google.maps.DirectionsService();
    

  //initialize map
   map = new Map(document.getElementById("map"), {
        center: {lat: 49.222177, lng: -122.686493},
        zoom: 16.5,
        tilt: 45,
        // mapId: "25b1316f79a00934",
        mapId: "90f87356969d889c",
        disableDefaultUI: true,
        gestureHandling: "greedy",
    });
    google.maps.event.addListenerOnce(map, 'idle', function() {
        map.setTilt(90);
    });

    directionsRenderer1 = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: "purple"}
    });
    directionsRenderer2 = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: "purple"}
    })

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            user1Marker = new AdvancedMarkerElement({
              map,
              position: pos,
              title: 'Your Location',
              content: document.createElement("div"),
            });
            user2Marker = new AdvancedMarkerElement({
              map,
              position: null,
              title: 'Their Location',
              content: document.createElement("div"),
            })
            meetupMarker = new AdvancedMarkerElement({
              map,
              position: null,
              title: 'Meetup spot',
              content: document.createElement("div")
            })
          
            // set the content of the marker
            const marker1Content = user1Marker.content;
            marker1Content.innerHTML = `<img src="/images/pointer.png" style="width: 50px; height: 50px;">`;
            marker1Content.style.transform = 'rotate(0deg)';

            const marker2Content = user2Marker.content;
            marker2Content.innerHTML = `<img src="/images/pointer2.png" style="width: 50px; height: 50px">`;
            marker2Content.style.transform = 'rotate(0deg)';

            const meetupMarkerContent = meetupMarker.content;
            meetupMarkerContent.innerHTML = `<img src="/images/meetuppoint.png" style="width: 35px; height: 50px">`;
            meetupMarkerContent.style.transform = 'rotate(0deg)';

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

              if (pannedOut == false) {
                map.panTo(user1Marker.position);
              }

            };
            
            function error() {
              alert("Sorry, no position available.");
            }
            
            const options = {
              enableHighAccuracy: true,
              maximumAge: 0,
              timeout: 1000,
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

function setThem() {
  user2Marker.position = themToLatLng();

  updateMeetupPoint();
  calcRoute(user1Marker.position, meetupMarker.position, directionsRenderer1, "WALKING");
  calcRoute(user2Marker.position, meetupMarker.position, directionsRenderer2, "WALKING");

  const bounds = new google.maps.LatLngBounds();
  bounds.extend(user1Marker.position);
  bounds.extend(user2Marker.position);
  map.fitBounds(bounds);
  pannedOut = true;
  
  google.maps.event.addListenerOnce(map, 'idle', function() {
      map.setTilt(90);
  });
}

function themToLatLng() {
  return new google.maps.LatLng(49.23024, -122.68955);
  //fix this geocode shit
  var them = document.getElementById('them').value;
  console.log("THEM LOCATION: ", them);
  geocoder.geocode( {'address': them}, function(results, status) {
    if (status == 'OK') {
      console.log("GEOCODER RESULTS: ", results[0].geometry.location)
      const themLatLng = new google.maps.LatLng(
        results[0].geometry.location.lat,
        results[0].geometry.location.lng
      )
      return themLatLng;
    }
  })
}

function updateMeetupPoint() {
  const user1pos = user1Marker.position;
  const user2pos = user2Marker.position;

  if (user1pos && user2pos) {
    const middlepos = {
      lat: (user1pos.lat + user2pos.lat) / 2,
      lng: (user1pos.lng + user2pos.lng) / 2
    }
    meetupMarker.position = middlepos;
  }
}

function calcRoute(start, end, render, travelMode) {
  var request = {
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode[travelMode]
  };
  directionsService.route(request, function(result, status) {
    if (status == 'OK') {
      render.setDirections(result);
    } else {
      window.alert("Directions request failed due to " + status);
    }
  });
}