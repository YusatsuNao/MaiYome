class app extends HTMLElement {
	constructor() { super(); }}
class thegallery extends HTMLElement {
	constructor() { super(); }}
class appstatus extends HTMLElement {
	constructor() { super(); }}
	
// Register the custom element with the browser
customElements.define('app-internal', app);
customElements.define('main-gallery', thegallery);
customElements.define('status-bar', appstatus);