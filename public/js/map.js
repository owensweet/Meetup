let map;
var user1Marker;
var user2Marker;
var meetupMarker;

var directionsService;
let directionsRenderer1;
let directionsRenderer2;

var geocoder;

var pannedOut = false;

var autocomplete;
var autocompleteLatLng;

var meTravelMode;
var themTravelMode;

var middlepos;

function getDirection(prevCoord, currCoord) {
  //calculations to get angle between previous position and current
  const diffLat = currCoord.lat - prevCoord.lat;
  const diffLng = currCoord.lng - prevCoord.lng;

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
    meetupRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
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

            initInput();

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

async function setThem(themlatlng) {
  user2Marker.position = themlatlng;

  if (user2Marker.position) {
    await updateMeetupPoint();  
  }
  

  meTravelMode = checkMyTravelMode();
  themTravelMode = checkMyTravelMode();
  calcRoute(user1Marker.position, meetupMarker.position, directionsRenderer1, meTravelMode);
  calcRoute(user2Marker.position, meetupMarker.position, directionsRenderer2, themTravelMode);

  const bounds = new google.maps.LatLngBounds();
  bounds.extend(user1Marker.position);
  bounds.extend(user2Marker.position);
  map.fitBounds(bounds, { padding: 50 });
  pannedOut = true;

  // google.maps.event.addListenerOnce(map, 'idle', function() {
  //     map.setTilt(90);
  // });
}

async function themToLatLng() {
  //create data base of friends and if entered word is not in the session variable of friends then search from autocomplete
  var them = document.getElementById('them').value;
  if (them == "friend1") {
    return new google.maps.LatLng(123, 123);
  } 
  return;
}

async function updateMeetupPoint() {
  //find the meetup point in a different way, i should use
  // a directions render to render a route from user1pos to user2pos,
  // find the floor divide by two of the direction steps array and then
  // set the meetupMarker position to that leg's position

  const user1pos = user1Marker.position;
  const user2pos = user2Marker.position;

  if (!user1pos || !user2pos) {
    console.error("Both user positions need to be set before calculating the meetup point.");
    return;
  }

  meetupMarker.position = await calcMeetupRoute(user1pos, user2pos, meetupRenderer);
}

function calcRoute(start, end, render, travelMode) {
  var request = {
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode[travelMode]
  };
  directionsService.route(request).then((result) => {
    render.setDirections(result);
  })
}

//returns location of the middle leg
async function calcMeetupRoute(start, end, render) {
  const request = {
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode.WALKING
  };
  await directionsService.route(request)
    .then((result) => {

      const theroute = result.routes[0].legs[0];
      const totalDistance = theroute.distance.value;
      console.log(checkMyTravelMode());
      console.log(checkTheirTravelMode());
      const meetupDistance = totalDistance / 2;
      let distanceCounter = 0;
      const steps = theroute.steps;

      for (let i = 0; i < steps.length; i++) {
        const stepDistance = steps[i].distance.value;

        //if adding the next step breaks past half, then we are on the middle step
        if (distanceCounter + stepDistance >= meetupDistance) {
          const remainingDistance = meetupDistance - distanceCounter;

          //bigger ratio if remaining distance is bigger compared to stepDistance
          const ratio = remainingDistance / stepDistance

          const start = steps[i].start_location;
          const end = steps[i].end_location;

          middlepos = interpolate(start, end, ratio);
          break;

        }

        distanceCounter += stepDistance;

      }
  })
  .catch((err) => {
    console.error("Error fetching directions: ", err);
  })

  return middlepos;
}

function initInput() {
  let input = document.getElementById("them");
  const center = user1Marker.position;
  const options = {
    bounds: {
      north: center.lat + 0.1,
      south: center.lat - 0.1,
      east: center.lng + 0.1,
      west: center.lng - 0.1,
    },
    fields: ["name", "geometry"],
    strictbounds: false,
  }
  autocomplete = new google.maps.places.Autocomplete(input, options)

  autocomplete.addListener('place_changed', function() {
    const place = autocomplete.getPlace();
    console.log("PLACEINFO: ",place);
    autocompleteLatLng = place.geometry.location;
    console.log("PLACEGEOMETRYLOCATION: ", autocompleteLatLng);
    setThem(autocompleteLatLng);
  })
}

function checkMyTravelMode() {
  var mymode;
  document.querySelectorAll('input[name="meTravel"]').forEach(radio => {
    if (radio.checked == true) {
      mymode = radio.value;
    }
  })
  return mymode;
}

function checkTheirTravelMode() {
  var theirmode;
  document.querySelectorAll('input[name="themTravel"]').forEach(radio => {
    if (radio.checked == true) {
      theirmode = radio.value;
    }
  })
  return theirmode;
}

function interpolate(start, end, ratio) {
  const lat = start.lat() + (end.lat() - start.lat()) * ratio;
  const lng = start.lng() + (end.lng() - start.lng()) * ratio;
  return new google.maps.LatLng(lat, lng);
}