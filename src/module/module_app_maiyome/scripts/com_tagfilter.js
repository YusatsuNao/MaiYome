const database = window.redirect.$dataTAG_fetch();
const PRIORITY_ORDER = ["c$", "h$", "a$", "g$", "s$"];

const tagInput = document.getElementById("tag-input");
const realInput = document.getElementById("real-input");
const suggestionBox = document.getElementById("suggestion-box");

let filtered = [], selectedIndex = 0, currentTags = [], rawTags = [];
let restrictFiltered = [], restrictSelectedIndex = 0, restrictTags = [], restrictRawTags = [];

function sortTags() {
    const combined = rawTags.map(raw => {
        const [prefix, value] = raw.split('$');
        return { raw, value, prefix: prefix + "$" };
    });
    
    combined.sort((a, b) =>
        PRIORITY_ORDER.indexOf(a.prefix) - PRIORITY_ORDER.indexOf(b.prefix)
    );
    
    rawTags = combined.map(item => item.raw);
    currentTags = combined.map(item => item.value);
    
    localStorage.setItem("current_tag", JSON.stringify(currentTags));
    localStorage.setItem("raw_tag", JSON.stringify(rawTags));
    
    filterImageData();
}


function filterImageData() {
    const tagFilter = JSON.parse(localStorage.getItem("raw_tag") || "[]");
    const restrictFilter = JSON.parse(localStorage.getItem("raw_tag_restrict") || "[]");

    const imageGallery = document.getElementById('imageGallery');
    const info_search_warning = document.getElementById('info_search');
    imageGallery.innerHTML = '';
    loadedIndex = 0;

    const md5Query = tagFilter.find(tag => tag.toLowerCase().startsWith("md5:"));
    const nameQuery = tagFilter.find(tag => tag.toLowerCase().startsWith("name:"));
    const md5Value = md5Query ? md5Query.slice(4).trim().toLowerCase() : null;
    const nameValue = nameQuery ? nameQuery.slice(5).trim().toLowerCase() : null;

    filteredImageRows = allImageRows.filter(row => {
        const tagsInRow = (row.raw_tag || "").split(',').map(t => t.trim().toLowerCase());

        let includeMatch = true;
        let excludeMatch = true;

        const normalTags = tagFilter.filter(tag => !tag.toLowerCase().startsWith("md5:") && !tag.toLowerCase().startsWith("name:"));
        if (normalTags.length > 0) {
            includeMatch = normalTags.every(tag => tagsInRow.includes(tag.toLowerCase()));
        }

        if (restrictFilter.length > 0) {
            excludeMatch = restrictFilter.every(tag => !tagsInRow.includes(tag.toLowerCase()));
        }

        if (md5Value && row.md5) {
            includeMatch = includeMatch && row.md5.toLowerCase().includes(md5Value);
        }

        if (nameValue && row.filename) {
            includeMatch = includeMatch && row.filename.toLowerCase().includes(nameValue);
        }

        return includeMatch && excludeMatch;
    });

    if (filteredImageRows.length === 0) {
        imageGallery.innerHTML = `<span class="filter_no-data">ITEM NOT FOUND WITH THIS TAG/CONFIGURATION</span>`;
        info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: gray;">No images matched the current tag.</span>`;
        console.log("No matching images found.");
        return;
    } else {
        info_search_warning.innerHTML = ``;
    }

    loadMoreImages();
    window.scrollTo(0, 0);
}

function updateSuggestions(value) {
    suggestionBox.innerHTML = "";
    suggestionBox.style.display = "none";
    
    const cleanValue = value.trim().toLowerCase();
    if (!cleanValue) return;
    
    filtered = database
        .map(tag => {
            const [prefix, val] = tag.split('$');
            return { raw: tag, value: val.toLowerCase(), prefix };
        })
        .filter(item => {
            const cleanTag = item.value.replace(/[_()]/g, " ");
            const keywords = cleanValue.split(/\s+/);
            return keywords.every(k => cleanTag.includes(k));
        })
        .slice(0, 10);
    
    if (filtered.length === 0) return;
    
    filtered.forEach((item, i) => {
        const div = document.createElement("div");
        div.textContent = item.raw.split('$')[1];
        div.classList.toggle("active", i === 0);
        div.addEventListener("click", () => {
        addTag(item);
        clearInput();
        });
        suggestionBox.appendChild(div);
    });
    
    const rect = tagInput.getBoundingClientRect();
    suggestionBox.style.left = rect.left + "px";
    suggestionBox.style.top = "auto";
    suggestionBox.style.display = "block";
}

function addTag(tagObj) {
    let tagValue = "";
    let rawTag = "";

    if (tagObj.raw.includes('$')) {
        tagValue = tagObj.raw.split('$')[1];
        rawTag = tagObj.raw;
    } else if (tagObj.raw.startsWith("md5:") || tagObj.raw.startsWith("name:")) {
        tagValue = tagObj.raw;      // Use entire string for display
        rawTag = tagObj.raw;        // No transformation
    } else {
        return; // Fallback, unsupported format
    }

    if (currentTags.includes(tagValue)) return;

    const codeEl = document.createElement("code");
    codeEl.textContent = tagValue;
    tagInput.insertBefore(codeEl, realInput);

    currentTags.push(tagValue);
    rawTags.push(rawTag);

    sortTags();
    clearInput();        // Ensure no leftover text
    filterImageData();   // Show filtered items immediately
}

tagInput.addEventListener("click", (e) => {
    if (e.target.tagName === "CODE") {
        const tagValue = e.target.textContent;
        let index = currentTags.indexOf(tagValue);

        if (index === -1) {
            index = rawTags.findIndex(raw => raw === tagValue);
        }

        if (index !== -1) {
            currentTags.splice(index, 1);
            rawTags.splice(index, 1);
        }
        
        e.target.remove(); // Remove the tag visually
        sortTags();        // Update order
        filterImageData(); // Refilter image list
    }
});

function clearInput() {
    realInput.value = "";
    suggestionBox.innerHTML = "";
    suggestionBox.style.display = "none";
    selectedIndex = 0;
}

function removeLastTag() {
    const codes = tagInput.querySelectorAll("code");
    if (codes.length > 0) {
        const last = codes[codes.length - 1];
        const text = last.textContent;

        tagInput.removeChild(last);

        const rawIndex = rawTags.findIndex(raw => {
            return raw.includes('$')
                ? raw.split('$')[1] === text
                : raw === text; // handle md5:/name:
        });

        if (rawIndex !== -1) {
            rawTags.splice(rawIndex, 1);
            currentTags.splice(rawIndex, 1);
        }

        sortTags();
        filterImageData();
    }
}

function clearAllTags() {
    currentTags = [];
    rawTags = [];
    localStorage.removeItem("current_tag");
    localStorage.removeItem("raw_tag");

    const codes = tagInput.querySelectorAll("code");
    codes.forEach(code => code.remove());

    sortTags();         // Reset sorting
    filterImageData();  // Refresh gallery
}

realInput.addEventListener("input", e => updateSuggestions(e.target.value));
realInput.addEventListener("keydown", e => {
    const items = suggestionBox.querySelectorAll("div");

    if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
    } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered.length > 0) {
            addTag(filtered[selectedIndex]);
            clearInput();
        } else {
            const typed = realInput.value.trim();
            if (typed.toLowerCase().startsWith("md5:") || typed.toLowerCase().startsWith("name:")) {
                addTag({ raw: typed });
                clearInput();
            }
        }
    } else if (e.key === "Backspace" && realInput.value === "") {
        removeLastTag();
    }

    items.forEach((el, i) => el.classList.toggle("active", i === selectedIndex));
});

tagInput.addEventListener("click", () => realInput.focus());
    window.addEventListener("click", e => {
    if (!tagInput.contains(e.target) && !suggestionBox.contains(e.target)) {
        suggestionBox.style.display = "none";
    }
});