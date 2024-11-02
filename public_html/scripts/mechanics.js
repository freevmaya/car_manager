function Mechanics() {

	var startDialog;

	async function getPlaceDetails(placeId) {

		const place = new v_map.Classes["Place"]({
			id: placeId,
			requestedLanguage: user.language_code, // optional
		});

		await place.fetchFields({ fields: ["displayName", "formattedAddress"] });
		return place;
	}

	v_map.map.addListener("click", (e) => {
		
		if (e.domEvent.ctrlKey) {
			v_map.driverManager.CreateRandomCar(e.latLng);
		} else 
		{
			if (e.placeId) {
				getPlaceDetails(e.placeId).then((place)=>{
					place = $.extend(place, e);
					SelectPlace(place);
				});
			} else SelectPlace(e);
		}
	});

	function showPickMeUpDialog(place) {
		return viewManager.Create({curtain: $('#map'), content: [
				{
					class: GroupFields,
					classes: ['btn-block'],
					content: [
						{
							label: "Right now",
							class: ButtonField,
							action: () => { showTargetDialog(place); }
						},{
							label: "Set a time",
							class: ButtonField,
							action: () => { }
						},{
							label: "In detail",
							class: ButtonField,
							action: () => { }
						}
					]
				}
			]
		});
	}

	function showTargetDialog(startPlace) {
		let dlg, rpath;
		return dlg = viewManager.Create({
			name: "targetDialog",
			startPlace: startPlace
		}, ViewTarget);
	}

	function showOfferTripDialog(coord) {
	}

	function showCarDialog() {
		let v;
		return v = viewManager.Create({title: 'Dialog', curtain: $('#map'), actions: {
				Ok: () => { v.Close(); },
				Cancel: () => { v.Close(); }
			}, content: [
				{
					class: GroupFields,
					content: [
						{
							name: 'carBrand',
							label: "Car brand",
							class: FormField
						},{
							name: 'carNumber',
							label: "Car number",
							class: FormField
						},{
							name: 'color',
							label: "Car color",
							class: FormField
						}
					]
				},
				{
					class: GroupFields,
					content: [
						{
							name: 'Driver',
							label: "Driver",
							class: FormField
						}
					]
				}
			]
		});
	}

	function showDriverDialog() {
		if (!viewManager.CurrentView()) {
			let v = viewManager.Create({title: 'Driver', curtain: $('#map'), 
				content: [
					{
						text: "ManualForDriver",
						class: TextField
					}, 
					{
						class: GroupFields,
						classes: ['btn-block'],
						content: [{
							label: "Finish work",
							class: ButtonField,
							action: () => {
								Ajax({
									action: 'finishWork',
									data: {
										user_id: user.id
									}
								}).then((result) => {
									delete user.asDriver;
									HideDriverMenu();
									v_map.MarkerManager.ClearAllUsers();
								});
							}
						}]
					}
				]
			});
		}
	}

	window.ShowDriverSubmenu = () => {
		showDriverDialog();
	}
}