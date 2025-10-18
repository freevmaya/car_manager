<?

html::AddJsCode("
	const play = (frequency = 300, duration = 1e3) => {
		const context = new AudioContext();
		const gainNode = context.createGain();
		const oscillator = context.createOscillator();
		oscillator.frequency.value = frequency;
		oscillator.connect(gainNode);
		gainNode.connect(context.destination);
		try {
			oscillator.start(0);
			setTimeout(() => oscillator.stop(), duration);
		} catch (e) {
			alert('You need to allow the audio play');
		}
	};
	//play(8000, 1e3);

	$('#PlayButton').click((e)=>{
		const context = new AudioContext();
		if (context.state == 'running') {
			play(500, 1e3);
		}
	});
");

?>
<div class="pageContent">
	<div class="sliderView">
		<a class="button" id="PlayButton">Play begin</a>
	</div>
</div>