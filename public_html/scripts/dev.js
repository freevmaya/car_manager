
setTimeout(()=>{
	if (typeof(v_map) != 'undefined')
		v_map.map.addListener('click', (e)=>{
			v_map.setMainPosition(e.latLng);
		});
}, 3000);