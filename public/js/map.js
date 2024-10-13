//initializing global variables
let map;
var user1Marker;
var user2Marker;
var meetupMarker;

var directionsService;
let directionsRenderer1;
let directionsRenderer2;

var distanceService;

var geocoder;

var pannedOut = false;

var autocomplete;
var autocompleteLatLng;

var meTravelMode;
var themTravelMode;

var middlepos;

var listener;

// getDirection uses math to calculate the 
// angle between the two inputted coordinates
function getDirection(prevCoord, currCoord) {
  //calculations to get angle between previous position and current
  const diffLat = currCoord.lat - prevCoord.lat;
  const diffLng = currCoord.lng - prevCoord.lng;

  const antiClockwiseEastAngle = toDegrees(Math.atan2(diffLat, diffLng));
  const clockwiseNorthAngle = 90 - antiClockwiseEastAngle;
  return clockwiseNorthAngle;
}

//converts degrees to radians using math formula
function toDegrees(radian) {
  return (radian * 180) / Math.PI;
}


//Initializes the map with markers, directionsRenderer objects, and then
//current position and using watchPosition to watch for position changes.
async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    geocoder = new google.maps.Geocoder();

    directionsService = new google.maps.DirectionsService({
      preserveViewport: true
    });

    distanceService = new google.maps.DistanceMatrixService({
      preserveViewport: true
    });


  //initialize map
   map = new Map(document.getElementById("map"), {
        center: {lat: 49.222177, lng: -122.686493},
        zoom: 16.5,
        tilt: 45,
        // mapId: "25b1316f79a00934",
        mapId: "25b1316f79a00934",
        disableDefaultUI: true,
        gestureHandling: "greedy",
        animatedZoom: true,
    });


    directionsRenderer1 = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: "purple"},
      preserveViewport: true
    });
    directionsRenderer2 = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: "purple"},
      preserveViewport: true
    })
    meetupRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      poly
    })

    initCenterButton()


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

            initMeetupClickable();
          
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
        // browser doesn't support Geolocation
        console.log("Browser doesn't support Geolocation");
        return
      }
}
window.initMap = initMap;

//setThem function is called when a user2 locaiton is chosen. it sets
//the new user2Marker positon and then fits the map view to the whole
//route. Then renderers the route from each user to the meetup point
//
async function setThem(themlatlng) {
  console.log("pannedOut: ", pannedOut);
  user2Marker.position = themlatlng;
  
 
//if user2Marker position is not null, call the function to update
//the meetup point
  if (!user2Marker.position) {
    console.error("No user2 position");
    return;
  }

  await updateMeetupPoint();  

  const bounds = new google.maps.LatLngBounds();
  bounds.extend(user1Marker.position);
  bounds.extend(user2Marker.position);
  bounds.extend(meetupMarker.position);

  if (pannedOut) {
    //could i make this smoother / slower animation with timeout?
      map.fitBounds(bounds);
  }
    

  pannedOut = true;
  

  meTravelMode = checkMyTravelMode();
  themTravelMode = checkMyTravelMode();
  
  //calculate route from each user coordinate to the meetup coordinate
  calcRoute(user1Marker.position, meetupMarker.position, directionsRenderer1, meTravelMode);
  calcRoute(user2Marker.position, meetupMarker.position, directionsRenderer2, themTravelMode);

}

//themToLatLng function
async function themToLatLng() {
  var them = document.getElementById('them').value;
  if (them == "friend1") {
    return new google.maps.LatLng(123, 123);
  } 
  return;
}

async function updateMeetupPoint() {

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
    return result;
  })
}

//returns location of the middle point
async function calcMeetupRoute(start, end, render) {

  var user1Duration;
  var user2Duration;
  var totalDuration;
  var meetupRatio;

  const user1Mode = checkMyTravelMode();
  const user2Mode = checkTheirTravelMode();

  console.log("user1modw: ", user1Mode);

  await getDuration(start, end, user1Mode, function(res) {
    user1Duration = res;
  });
  await getDuration(end, start, user2Mode, function(res) {
    user2Duration = res;
  });


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

      console.log("user1inf: ", user1Duration);

      totalDuration = user1Duration + user2Duration;

      //why does it only work when user2 is the top of the ratio
      meetupRatio = user2Duration / totalDuration;

      const meetupDistance = totalDistance * meetupRatio;


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

/*initializes the input for "them" input field and 
attaches the google maps place API autocomplete Object to the input*/
function initInput() {
  let input = document.getElementById("them");
  const center = user1Marker.position;

  //setting non-strict bounds for the autocomplete to
  //prioritize nearby places first
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
    pannedOut = true;
    setThem(autocompleteLatLng);
  });

  document.querySelectorAll("#meTravelMode, #themTravelMode").forEach(form => {
    form.addEventListener('click', (event) => {
      console.log("onchange");
      pannedOut = true;
      setThem(autocompleteLatLng);
    })
  });
}

//checking the user 2 travel mode
function checkMyTravelMode() {
  var mymode;
  document.querySelectorAll('input[name="meTravel"]').forEach(radio => {
    if (radio.checked == true) {
      mymode = radio.value;
    }
  })
  return mymode;
}

//checking the user 1 travel mode
function checkTheirTravelMode() {
  var theirmode;
  document.querySelectorAll('input[name="themTravel"]').forEach(radio => {
    if (radio.checked == true) {
      theirmode = radio.value;
    }
  })
  return theirmode;
}

//Get the center point between two coordinates, and multiplying
//the lat and lng by a ratio defined in CalcMeetupRoute() function
function interpolate(start, end, ratio) {
  const lat = start.lat() + (end.lat() - start.lat()) * ratio;
  const lng = start.lng() + (end.lng() - start.lng()) * ratio;
  return new google.maps.LatLng(lat, lng);
}

//Attaching event listener to the button for centering the map onto the user
function initCenterButton() {
  const centerButton = document.getElementById("centerButton");
  centerButton.addEventListener('click', function() {
    google.maps.event.removeListener(listener);
    pannedOut = false;
    map.panTo(user1Marker.position);

    //zoom one time after the map is idle
    google.maps.event.addListenerOnce(map, 'idle', function() {
      map.setZoom(18);
      map.setTilt(70);
  });
  })
}

//Attaching event listener to button that sets map center to
//meetup location and changes button style if no meetup is created
function initMeetupClickable() {
  meetupMarker.addListener('click', function() {
    google.maps.event.removeListener(listener);
    pannedOut = false;
    map.panTo(meetupMarker.position);
    map.setZoom(16);
  })
  const meetupButton = document.getElementById("meetupButton");
  meetupButton.addEventListener('click', function() {
    google.maps.event.removeListener(listener);
    if (!meetupMarker.position) {
      console.log("nomeetup");
      meetupButton.classList.add('meetup-button');
      setTimeout(() => {
        meetupButton.classList.remove('meetup-button');
      }, 500);
    } else {
    pannedOut = false;
    map.panTo(meetupMarker.position);
    map.setZoom(16);
    }
  })
}

async function getDuration(start, end, travelMode, func) {
  await distanceService.getDistanceMatrix(
    {
      origins: [start],
      destinations: [end],
      travelMode: travelMode,
    }, function(response) {
      console.log(response.rows[0].elements[0].duration.value);
      func(response.rows[0].elements[0].duration.value);
    });
}