function watchPosition(action) {
    return navigator.geolocation.watchPosition((result)=>{
        user = $.extend(user, toLatLngF(result.coords));
        action(result.coords);
    });
}

function clearWatchPosition(watchId) {
    navigator.geolocation.clearWatch(watchId);
}

function getLocation(action) {
    navigator.geolocation.getCurrentPosition((result)=>{
        user = $.extend(user, toLatLngF(result.coords));
        action(result.coords);
    });
}