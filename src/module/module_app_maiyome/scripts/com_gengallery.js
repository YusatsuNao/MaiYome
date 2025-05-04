let allImageRows = [];
let filteredImageRows = [];
let loadedIndex = 0;
let anchorIndex = null;
const batchSize = 20;

async function loadTableData(sortBy = 'file_name', order = 'ASC') {
    const imageGallery = document.getElementById('imageGallery');
    const info_search_warning = document.getElementById('info_search');
    
    imageGallery.innerHTML = '';
    loadedIndex = 0;

    const sorterType = localStorage.getItem("gallery_item_show_sorter") || file_name;
    const orderType = localStorage.getItem("gallery_item_show_order") || asc;
    const showType = localStorage.getItem("gallery_item_show_type") || "null";
    const showDefault = localStorage.getItem("gallery_item_show_default") || "";
    const defaultTagToExclude = window.default_tag?.def_tag || "";

    let data = await window.redirect.$data_fetch(sorterType, orderType.toUpperCase());

    if (showType === "tag_null") {
        data = data.filter(row =>
            row.raw_tag === null ||
            row.raw_tag === undefined ||
            (typeof row.raw_tag === "string" && row.raw_tag.trim().length === 0)
        );
    } else if (showType === "ERR") {
        data = data.filter(row =>
            typeof row.warnings === "string" && row.warnings.includes("ERR")
        );
    } else if (showType === "DUPLICATE") {
        data = data.filter(row =>
            typeof row.warnings === "string" &&
            row.warnings.includes("DUPLICATE") &&
            !row.warnings.includes("EXCLUDE")
        );
        sortBy = 'fingerprint';
        order = 'ASC';
    }

    if (showDefault === "active" && defaultTagToExclude) {
        data = data.filter(row => {
            const tags = (row.raw_tag || "").split(",").map(t => t.trim().toLowerCase());
            return !tags.includes(defaultTagToExclude.toLowerCase());
        });
    }

    allImageRows = data;

    if (data.length === 0) {
        imageGallery.innerHTML = `<span class="filter_no-data">ITEM NOT FOUND WITH THIS TAG/CONFIGURATION</span>`;
        info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: gray;">No images matched the current tag.</span>`;
        console.log("No matching images found.");
        return;
    } else {
        info_search_warning.innerHTML = ``;
    }

    const currentTagFilter = JSON.parse(localStorage.getItem("raw_tag") || "[]");
    if (currentTagFilter.length > 0) {
        filterImageData();
    } else {
        loadMoreImages();
    }
}

function loadMoreImages() {
    const galleryType = localStorage.getItem("gallery_type") || "vertical";
    const imageGallery = document.getElementById('imageGallery');

    const source = filteredImageRows.length ? filteredImageRows : allImageRows;
    const nextBatch = source.slice(loadedIndex, loadedIndex + batchSize);

    function formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
    }
    
    function formatUnixDate(unix) {
        if (!unix || isNaN(unix)) return "-";
        const date = new Date(unix * 1000);
        const options = { year: 'numeric', month: 'long', day: '2-digit' };
        return date.toLocaleDateString('en-US', options);
    }
    
    nextBatch.forEach(row => {
        if (galleryType === "details") {
            const PRIORITY_ORDER = ["c$", "h$", "a$", "g$", "s$"];
            const colors = {
                "c$": "tag_c",
                "h$": "tag_h",
                "a$": "tag_a",
                "g$": "tag_g",
                "s$": "tag_s"
            };

            
            const tagData = (row.raw_tag || "").split(",").map(t => t.trim()).filter(Boolean);
            const tagElements = [];

            PRIORITY_ORDER.forEach(prefix => {
                tagData
                    .filter(tag => tag.startsWith(prefix))
                    .forEach(tag => {
                        const clean = tag.replace(prefix, "").replace(/_/g, " ");
                        tagElements.push(`<code class="${colors[prefix]}">${clean}</code>`);
                    });
            });
            
            const imgWidth = row.width;
            const imgHeight = row.height;
            const tooltip = `${row.relative_path}, ${imgWidth}x${imgHeight}, ${row.file_size}`;
            const fileSizeFormatted = formatFileSize(row.file_size);
            const dateCreatedFormatted = formatUnixDate(row.date_created);
            const dateModifiedFormatted = formatUnixDate(row.date_imported);
            const basePath = window.thumbs_path.thumbnailsBasePath;

            const wrapper = document.createElement('div');
            wrapper.classList.add("gallery-item");
            wrapper.setAttribute('data-masonrycell', 'false');

            wrapper.innerHTML = `
                <div class="thumbnail thumbnail-details" aria-selected="false">
                    <div class="details-col1 global-col">
                        <img src="file://${basePath}/${row.thumb}/${row.md5}.webp" alt="" data-file-id="${row.id}">
                    </div>
                    <div class="details-col2 global-col">
                        <div class="details-col2-top"><span class="data_txt">${row.filename}</span></div>
                        <div class="details-col2-bottom"<span class="data_txt">${row.file_format} | ${row.width} x ${row.height} px</span></div>
                    </div>
                    <div class="details-col3 global-col"><span>${row.file_format}</span></div>
                    <div class="details-col4 global-col"><span>${row.width} x ${row.height} px</span></div>
                    <!-- <div class="details-col5 global-col"><span>${row.md5}</span></div> -->
                    <div class="details-col6 global-col"><span>${formatFileSize(row.file_size)}</span></div>
                    <!-- <div class="details-col7 global-col"><span>${row.bit_depth}</span></div> -->
                    <div class="details-col8 global-col"><span>${formatUnixDate(row.date_created)}</span></div>
                    <div class="details-col9 global-col"><span>${formatUnixDate(row.date_imported)}</span></div>
                    <div class="details-col0 global-col"><span id="tag-list">${tagElements.join("")}</span></div>
                </div>
            `;

            if (row.warnings && row.warnings.includes("ERR")) {
                wrapper.classList.add("file-missing");
            }

            wrapper.addEventListener('click', (e) => {
                const thumbnail = wrapper.querySelector('.thumbnail');
                const isCtrlPressed = e.ctrlKey || e.metaKey;
                const isShiftPressed = e.shiftKey;

                const thumbnails = getAllThumbnailElements();
                const currentIndex = getThumbnailIndex(thumbnail);

                if (isShiftPressed && anchorIndex !== null) {
                    getAllThumbnailElements().forEach(el => el.setAttribute("aria-selected", "false"));
                    localStorage.removeItem("current_selection");

                    selectRangeBetween(anchorIndex, currentIndex);
                } else {
                    const isSelected = thumbnail.getAttribute('aria-selected') === 'true';
                    const newSelectionState = !isSelected;

                    if (!isCtrlPressed && !isShiftPressed) {
                        thumbnails.forEach(el => el.setAttribute("aria-selected", "false"));
                        localStorage.removeItem("current_selection");
                    }

                    thumbnail.setAttribute("aria-selected", String(newSelectionState));
                    handleImageSelection(thumbnail, newSelectionState, row);

                    if (!isShiftPressed) {
                        anchorIndex = currentIndex;
                    }
                }

                lastSelectedIndex = currentIndex;
                updateStatusBar();
                updateTagListDisplay();

                
            });

            imageGallery.appendChild(wrapper);
        } else {
            const imgWidth = row.width;
            const imgHeight = row.height;
            const tooltip = `${row.relative_path}, ${imgWidth}x${imgHeight}, ${row.file_size}`;
            const basePath = window.thumbs_path.thumbnailsBasePath;

            const wrapper = document.createElement('div');
            wrapper.classList.add("gallery-item");
            wrapper.setAttribute('data-masonrycell', 'false');

            wrapper.innerHTML = `
                <div class="thumbnail" aria-selected="false">
                    <img src="file://${basePath}/${row.thumb}/${row.md5}.webp" alt="" data-file-id="${row.id}">
                </div>
            `;

            if (row.warnings && row.warnings.includes("ERR")) {
                wrapper.classList.add("file-missing");
            }

            wrapper.addEventListener('click', (e) => {
                const thumbnail = wrapper.querySelector('.thumbnail');
                const isCtrlPressed = e.ctrlKey || e.metaKey;
                const isShiftPressed = e.shiftKey;

                const thumbnails = getAllThumbnailElements();
                const currentIndex = getThumbnailIndex(thumbnail);

                if (isShiftPressed && anchorIndex !== null) {
                    getAllThumbnailElements().forEach(el => el.setAttribute("aria-selected", "false"));
                    localStorage.removeItem("current_selection");

                    selectRangeBetween(anchorIndex, currentIndex);
                } else {
                    const isSelected = thumbnail.getAttribute('aria-selected') === 'true';
                    const newSelectionState = !isSelected;

                    if (!isCtrlPressed && !isShiftPressed) {
                        thumbnails.forEach(el => el.setAttribute("aria-selected", "false"));
                        localStorage.removeItem("current_selection");
                    }

                    thumbnail.setAttribute("aria-selected", String(newSelectionState));
                    handleImageSelection(thumbnail, newSelectionState, row);

                    if (!isShiftPressed) {
                        anchorIndex = currentIndex;
                    }
                }

                lastSelectedIndex = currentIndex;
                updateStatusBar();
                updateTagListDisplay();
            });


            wrapper.addEventListener('dblclick', async (e) => {
                const selectedId = row.id;
                localStorage.setItem("current_selection", JSON.stringify([selectedId]));

                const fullPath = row.full_path || row.relative_path;
                if (!fullPath) {
                    console.warn("No valid path found for image.");
                    return;
                }

                const mainImage = document.getElementById("mainImage");
                mainImage.src = `file://${fullPath}`;

                const viewer = document.getElementById("MainViewer");
                viewer.style.display = "block";
                
                updateTagListDisplay();
            });

            imageGallery.appendChild(wrapper);
        }
    });

    loadedIndex += batchSize;
    updateStatusBar();
}

document.getElementById("section-gallery").addEventListener("scroll", () => {
    const container = document.getElementById("section-gallery");
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
        loadMoreImages();
    }
});

function handleImageSelection(thumbnailEl, selected, rowData) {
    const id = rowData.id;
    let selection = JSON.parse(localStorage.getItem("current_selection") || "[]");

    if (selected) {
        if (!selection.includes(id)) {
            selection.push(id);
        }
    } else {
        selection = selection.filter(existingId => existingId !== id);
    }



    if (selection.length > 0) {
        localStorage.setItem("current_selection", JSON.stringify(selection));
    } else {
        localStorage.removeItem("current_selection");
    }

    console.log(`[SELECT] ${rowData.filename} ${selected ? "added" : "removed"} to selection`);
    updateStatusBar();
    updateTagListDisplay();
}


let lastSelectedIndex = null;

function getAllThumbnailElements() {
    return Array.from(document.querySelectorAll('#imageGallery .thumbnail'));
}

function getThumbnailIndex(thumbnailEl) {
    const thumbnails = getAllThumbnailElements();
    return thumbnails.indexOf(thumbnailEl);
}

function selectRangeBetween(startIndex, endIndex, isTable = false) {
    const elements = isTable
        ? Array.from(document.querySelectorAll('#imageGallery .gallery-item.details-style'))
        : getAllThumbnailElements();

    const [from, to] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
    let selectedIDs = [];

    for (let i = from; i <= to; i++) {
        const el = elements[i];
        if (!el) continue;

        if (isTable) {
            el.setAttribute("aria-selected", "true");
            const fileId = el.getAttribute("data-id");
            if (fileId) selectedIDs.push(fileId);
        } else {
            el.setAttribute("aria-selected", "true");
            const fileId = el.querySelector("img")?.getAttribute("data-file-id");
            if (fileId) selectedIDs.push(fileId);
        }
    }

    localStorage.setItem("current_selection", JSON.stringify(selectedIDs));
    updateStatusBar();
    updateTagListDisplay();
}



document.getElementById("section-gallery").addEventListener("click", (e) => {
    const isCtrlPressed = e.ctrlKey || e.metaKey;
    const isClickInsideThumbnail = e.target.closest(".thumbnail");

    if (!isClickInsideThumbnail && !isCtrlPressed) {
        document.querySelectorAll('.thumbnail[aria-selected="true"]').forEach(el => {
            el.setAttribute('aria-selected', 'false');
        });

        localStorage.removeItem("current_selection");
        lastSelectedIndex = null;
        console.log("🔹 Selection cleared due to outside click.");
        updateTagListDisplay();
        updateStatusBar();
    }
});