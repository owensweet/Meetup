let map;
let directionsService;
let directionsRendererUser;
let directionsRendererOther;
let userMarker;
let otherUserMarker;
let meetupMarker;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: { lat: 0, lng: 0 },
  });

  directionsService = new google.maps.DirectionsService();
  directionsRendererUser = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
    polylineOptions: { strokeColor: "#0000FF" }
  });
  directionsRendererOther = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
    polylineOptions: { strokeColor: "#00FF00" }
  });

  userMarker = new google.maps.Marker({
    map: map,
    icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
  });

  otherUserMarker = new google.maps.Marker({
    map: map,
    icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
  });

  meetupMarker = new google.maps.Marker({
    map: map,
    icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
  });

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(updateUserPosition, handleLocationError);
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

function updateUserPosition(position) {
  const userPos = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };
  userMarker.setPosition(userPos);
  map.setCenter(userPos);
  updateMeetupPoint();
}

function handleLocationError(error) {
  console.warn(`ERROR(${error.code}): ${error.message}`);
}

function updateOtherUserPosition() {
  const otherUserPos = {
    lat: parseFloat(document.getElementById("otherUserLat").value),
    lng: parseFloat(document.getElementById("otherUserLng").value)
  };
  otherUserMarker.setPosition(otherUserPos);
  updateMeetupPoint();
}

function updateMeetupPoint() {
  const userPos = userMarker.getPosition();
  const otherUserPos = otherUserMarker.getPosition();

  if (userPos && otherUserPos) {
    const meetupPos = {
      lat: (userPos.lat() + otherUserPos.lat()) / 2,
      lng: (userPos.lng() + otherUserPos.lng()) / 2
    };

    meetupMarker.setPosition(meetupPos);

    const travelMode = document.getElementById("travelMode").value;
    calculateAndDisplayRoute(userPos, meetupPos, directionsRendererUser, travelMode);
    calculateAndDisplayRoute(otherUserPos, meetupPos, directionsRendererOther, travelMode);

    // Fit the map to show all markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userPos);
    bounds.extend(otherUserPos);
    bounds.extend(meetupPos);
    map.fitBounds(bounds);
  }
}

function calculateAndDisplayRoute(start, end, renderer, travelMode) {
  directionsService.route(
    {
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode[travelMode]
    },
    (response, status) => {
      if (status === "OK") {
        renderer.setDirections(response);
      } else {
        window.alert("Directions request failed due to " + status);
      }
    }
  );
}