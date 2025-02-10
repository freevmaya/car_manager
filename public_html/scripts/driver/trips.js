function cancelTrip(view) {

	app.showQuestion(toLang('Do you want to reject this order?'), ()=>{
		Ajax({
			action: 'setState',
			data: {
				id: view.data('id'),
				state: 'rejected'
			}
		}).then((e)=>{
			if (e) view.remove();
		})
	});
}