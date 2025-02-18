function watchPosition(action) {
    let latLng = toLatLngF(user.asDriver ? {lat: 55.190449, lng: 61.279631 } : 
                            {lat: 55.19068764669877, lng: 61.28231993933741});

    user = $.extend(user, latLng);
    return setInterval(()=>{

        if (typeof(v_map) != 'undefined')
            latLng = v_map.getMainPosition();

        action(toCoordinates(latLng, Math.random() * 400));
        
    }, 500);
}

function clearWatchPosition(watchId) {
    clearInterval(watchId);
}

function getLocation(action) {
    let latLng = toLatLngF(user.asDriver ? {lat: 55.190449, lng: 61.279631 } : 
                                    {lat: 55.19068764669877, lng: 61.28231993933741});

    user = $.extend(user, latLng);
    action(toCoordinates(latLng, Math.random() * 400));
}