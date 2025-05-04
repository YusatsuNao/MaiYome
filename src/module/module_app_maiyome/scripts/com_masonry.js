function animateGalleryReflow(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const items = Array.from(container.querySelectorAll('img'));

    const firstRects = new Map();
    items.forEach((item, i) => {
        firstRects.set(item, item.getBoundingClientRect());
    });

    requestAnimationFrame(() => {
        items.forEach((item) => {
            const firstRect = firstRects.get(item);
            const lastRect = item.getBoundingClientRect();

            const deltaX = firstRect.left - lastRect.left;
            const deltaY = firstRect.top - lastRect.top;

            item.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

            requestAnimationFrame(() => {
                item.style.transform = '';
            });
        });
    });
}

function updateMasonryLayout(type) {
    const gallery = document.getElementById('masonry-gallery');
    if (!gallery) return;

    const images = gallery.querySelectorAll('img');

    if (type === 'vertical') {
        let containerWidth = gallery.clientWidth;
        let numColumns = Math.floor(containerWidth / 200);
        if (numColumns < 1) numColumns = 1;

        const columnWidth = Math.max(150, Math.min(200, containerWidth / numColumns));

        images.forEach(img => {
            img.style.width = `${columnWidth}px`;
            img.style.height = 'auto';
        });

        gallery.style.columnCount = numColumns;
        gallery.style.columnGap = '8px';

    } else if (type === 'horizontal') {
        images.forEach(img => {
            let aspectRatio = img.naturalWidth / img.naturalHeight;
            let newHeight = Math.floor(Math.random() * (200 - 150 + 1) + 150);
            let newWidth = newHeight * aspectRatio;

            img.style.height = `${newHeight}px`;
            img.style.width = `${newWidth}px`;
        });

        gallery.style.columnCount = 'auto';
    }
}

function toggleLayout(layout) {
    const gallery = document.getElementById('masonry-gallery');
    if (!gallery) return;

    gallery.dataset.layout = layout;
    updateMasonryLayout(layout);
}

window.addEventListener('resize', () => {
    const gallery = document.getElementById('masonry-gallery');
    if (!gallery || !gallery.dataset.layout) return;

    const currentLayout = gallery.dataset.layout;
    updateMasonryLayout(currentLayout);

    if (currentLayout === 'vertical') {
        gallery.style.columnCount = 'auto';
    }

    setTimeout(() => {
        animateGalleryReflow('#masonry-gallery');
    }, 100);
});
