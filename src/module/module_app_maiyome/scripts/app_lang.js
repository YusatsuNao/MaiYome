window.addEventListener("DOMContentLoaded", () => {
	if (window.i18n.lang.toLowerCase() === 'en-us') return;

	document.querySelectorAll('[data-i18n]').forEach(el => {
		const key = el.getAttribute('data-i18n');
		const translated = window.i18n.get(key);
		if (translated) el.textContent = translated;
	});
});