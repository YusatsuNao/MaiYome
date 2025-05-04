const gallery = document.getElementById("imageGallery");
const galleryheader = document.getElementById("imageGallery-header");
const viewA = document.getElementById("verticalView");
const viewB = document.getElementById("horizontalView");
const viewC = document.getElementById("gridView");
const viewD = document.getElementById("detailsView");
const sidebar_TAG = document.getElementById("section-tag");
const galleryType = localStorage.getItem("gallery_type");
const viewer = document.getElementById("MainViewer");

function applyGalleryLayout(type) {
    const gallery = document.getElementById("imageGallery");
    const galleryheader = document.getElementById("imageGallery-header");

    switch (type) {
        case 'vertical':
            gallery.classList.remove("masonry-horizontal", "grid-view", "table-view");
            galleryheader.classList.remove("visible");
            gallery.classList.add("masonry-vertical");
            [viewB, viewC, viewD].forEach(view => view.classList.remove("active"));
            viewA.classList.add("active");
            sidebar_TAG.style.display = "block";
            break;
        case 'horizontal':
            gallery.classList.remove("masonry-vertical", "grid-view", "table-view");
            galleryheader.classList.remove("visible");
            gallery.classList.add("masonry-horizontal");
            [viewA, viewC, viewD].forEach(view => view.classList.remove("active"));
            viewB.classList.add("active");
            sidebar_TAG.style.display = "block";
            break;
        case 'grid':
            gallery.classList.remove("masonry-vertical", "masonry-horizontal", "table-view");
            galleryheader.classList.remove("visible");
            gallery.classList.add("grid-view");
            [viewA, viewB, viewD].forEach(view => view.classList.remove("active"));
            viewC.classList.add("active");
            sidebar_TAG.style.display = "block";
            break;
        case 'details':
            gallery.classList.remove("masonry-vertical", "masonry-horizontal", "grid-view");
            galleryheader.classList.add("visible");
            gallery.classList.add("table-view");
            [viewA, viewB, viewC].forEach(view => view.classList.remove("active"));
            viewD.classList.add("active");
            sidebar_TAG.style.display = "none";
            viewer.style.display = "none";
            break;

        default:
            console.warn(`Unknown gallery layout type: ${type}`);
            break;
    }
}

applyGalleryLayout(galleryType);

const slider = document.getElementById('sizeSlider');

let dynamicStyle = document.getElementById("dynamic-style");
if (!dynamicStyle) {
    dynamicStyle = document.createElement("style");
    dynamicStyle.id = "dynamic-style";
    document.head.appendChild(dynamicStyle);
}

function updateGallerySize(value) {
    const currentType = localStorage.getItem("gallery_type");

    if (currentType === "details") {
        gallery.style.columnWidth = value + "px";
        dynamicStyle.textContent = `
            #imageGallery img {
                width: 50px !important;
                margin-bottom: -0.25em;
                border-radius: 5px;
                break-inside: avoid;
            }
            .gallery-item {
                margin-bottom: 0em; }
            #section-tag {
                display: none; }
            .gallery-item {
                margin-bottom: 1px;
            }
        }`;
    } else {
        gallery.style.columnWidth = value + "px";
        dynamicStyle.textContent = `
            .masonry-horizontal img {
                height: ${value}px !important;
                width: auto !important;
                border-radius: 5px;
                break-inside: avoid;
                object-fit: cover;
            }
            .masonry-vertical {
                column-count: auto;
                column-gap: 1em;
                width: 100%;
            }
            .grid-view {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(${value}px, 1fr)) !important;
                gap: 1em;
            }
            .grid-view img {
                width: 100% !important;
                height: ${value}px !important;
                object-fit: cover;
                object-position: center;
                border-radius: 5px;
            }
            #section-tag {
                display: block; }
        `;
    }
}

slider.addEventListener('input', () => {
    const value = slider.value;
    localStorage.setItem('gallery_view_size', value);
    updateGallerySize(slider.value);
});

window.addEventListener("load", () => {
    const storedSize = localStorage.getItem('gallery_view_size') || 240;
    slider.value = storedSize;
    updateGallerySize(storedSize);
    
    const currentType = localStorage.getItem("gallery_type");
    updateGallerySize(slider.value);
});
