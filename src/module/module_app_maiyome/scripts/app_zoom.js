(function () {
	const slider = document.getElementById('sizeSlider');
	const mainViewer = document.getElementById('MainList');

	if (!slider || !mainViewer) {
		console.warn("Slider or MainViewer not found.");
		return;
	}

	mainViewer.addEventListener('wheel', function (event) {
		if (!event.ctrlKey || getComputedStyle(mainViewer).display === 'none') return;

		event.preventDefault();

		const current = parseInt(slider.value, 10);
		const step = parseInt(slider.step || 20, 10);
		const min = parseInt(slider.min || 100, 10);
		const max = parseInt(slider.max || 360, 10);

		let newValue = current;

		if (event.deltaY < 0) {
			newValue = Math.min(current + step, max);
		} else {
			newValue = Math.max(current - step, min);
		}

		if (newValue !== current) {
			slider.value = newValue;
			localStorage.setItem('gallery_view_size', newValue);
			slider.dispatchEvent(new Event('input'));
			console.log(`Zoom adjusted to: ${newValue}`);
		}
	}, { passive: false });
})();