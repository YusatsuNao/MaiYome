const fileLink = "../resources/maiyome.png";

const zoomInValue = 1.1;
const zoomOutValue = 0.9;
const zoomDisplay = document.querySelector('.viewer_zoomval span');

const keyZoomMap = {
	"4": 1,
	"3": 0.75,
	"2": 0.5,
	"1": 0.25,
};

const img = document.getElementById("mainImage");
const wrapper = document.getElementById("imageWrapper");
const container = document.getElementById("containerViewer");

img.src = fileLink;

let scale = 1;
let posX = 0;
let posY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let imgWidth = 0;
let imgHeight = 0;
let fitMode = "";

function updateTransform() {
	wrapper.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
	updateImageRendering();
}

function fitBasedOnOrientation() {
	if (!imgWidth || !imgHeight) return;
	const aspectImg = imgWidth / imgHeight;
	const aspectContainer = container.clientWidth / container.clientHeight;

	if (aspectImg > aspectContainer) {
		fitToWidth();
		fitMode = "width";
	} else {
		fitToHeight();
		fitMode = "height";
	}
}

function updateZoomDisplay() {
	const percent = Math.round(scale * 100);
	zoomDisplay.textContent = `${percent}%`;
}

function updateImageRendering() {
	if (scale > 1) {
		img.style.imageRendering = "pixelated";
	} else {
		img.style.imageRendering = "auto";
	}
}

function zoomToOriginal(centered = true) {
	scale = 1;

	if (centered) {
	const cx = (container.clientWidth - imgWidth) / 2;
	const cy = (container.clientHeight - imgHeight) / 2;
	posX = cx;
	posY = cy;
	} else {
	posX = 0;
	posY = 0;
	}

	updateTransform(); updateZoomDisplay();
}

function fitToWidth() {
	scale = container.clientWidth / imgWidth;
	posX = 0;
	posY = (container.clientHeight - imgHeight * scale) / 2;
	updateTransform(); updateZoomDisplay();
	fitMode = "width";
}

function fitToHeight() {
	scale = container.clientHeight / imgHeight;
	posX = (container.clientWidth - imgWidth * scale) / 2;
	posY = 0;
	updateTransform(); updateZoomDisplay();
	fitMode = "height";
}

container.addEventListener("wheel", (e) => {
	e.preventDefault();
	const zoomFactor = e.deltaY < 0 ? zoomInValue : zoomOutValue;
	const rect = wrapper.getBoundingClientRect();
	const offsetX = e.clientX - rect.left;
	const offsetY = e.clientY - rect.top;

	const prevScale = scale;
	scale *= zoomFactor;
	scale = Math.max(0.1, Math.min(scale, 10));

	posX -= offsetX * (scale / prevScale - 1);
	posY -= offsetY * (scale / prevScale - 1);

	updateTransform(); updateZoomDisplay();
}, { passive: false });

container.addEventListener("mousedown", (e) => {
	isDragging = true;
	startX = e.clientX;
	startY = e.clientY;
	container.style.cursor = "grabbing";
});

container.addEventListener("mouseup", () => {
	isDragging = false;
	container.style.cursor = "grab";
});

container.addEventListener("mouseleave", () => {
	isDragging = false;
	container.style.cursor = "grab";
});

container.addEventListener("mousemove", (e) => {
	if (!isDragging) return;
	let dx = e.clientX - startX;
	let dy = e.clientY - startY;
	posX += dx;
	posY += dy;
	startX = e.clientX;
	startY = e.clientY;
	updateTransform();
});

function toggleFitOrZoom() {
	if (scale === 1) {
	fitBasedOnOrientation();
	} else {
	zoomToOriginal(true);
	}
}

container.addEventListener("dblclick", (e) => {
	if (e.button === 0) toggleFitOrZoom();
});

document.addEventListener("keydown", (e) => {
	if (keyZoomMap[e.key]) {
	scale = keyZoomMap[e.key];

	const viewW = container.clientWidth;
	const viewH = container.clientHeight;
	const imgW = imgWidth * scale;
	const imgH = imgHeight * scale;

	posX = (viewW - imgW) / 2;
	posY = (viewH - imgH) / 2;

	updateTransform(); updateZoomDisplay();
	}
});

img.onload = () => {
	imgWidth = img.naturalWidth;
	imgHeight = img.naturalHeight;
	fitBasedOnOrientation();
};

function closeViewer() {
	const viewer = document.getElementById("MainViewer");
	const comparator = document.getElementById("MainComparator");
	viewer.style.display = "none";
	comparator.style.display = "none";

	const mainImage = document.getElementById("mainImage");
	mainImage.src = "";
	
	localStorage.removeItem("current_selection");
	updateTagListDisplay();
}