function getUserDevPosition() {
    let latLng = toLatLngF(user.asDriver ? {lat: 55.190449, lng: 61.279631 } : 
                                    {lat: 55.19068764669877, lng: 61.28231993933741});

    if (typeof(v_map) != 'undefined')
        latLng = v_map.getMainPosition();
    return latLng;
}

function watchPosition(action) {
    user = $.extend(user, getUserDevPosition());
    return setInterval(()=>{
        action(toCoordinates(getUserDevPosition(), Math.random() * 400));
    }, 500);
}

function clearWatchPosition(watchId) {
    clearInterval(watchId);
}

function getLocation(action) {
    action(toCoordinates(getUserDevPosition(), Math.random() * 400));
}