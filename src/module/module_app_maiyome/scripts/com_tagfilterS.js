const tagSetInput = document.getElementById("tag-set-input");
const realInputSet = document.getElementById("real-input-set");
const suggestionBoxSet = document.getElementById("suggestion-box-set");

let rawTagsSet = [], currentTagsSet = [], filteredSet = [], selectedIndexSet = 0;

function sortSetTags() {
    const combined = rawTagsSet.map(raw => {
        const [prefix, value] = raw.split('$');
        return { raw, value, prefix: prefix + "$" };
    });
    combined.sort((a, b) => PRIORITY_ORDER.indexOf(a.prefix) - PRIORITY_ORDER.indexOf(b.prefix));

    rawTagsSet = combined.map(item => item.raw);
    currentTagsSet = combined.map(item => item.value);

    localStorage.setItem("raw_tag_set", JSON.stringify(rawTagsSet));
    localStorage.setItem("current_tag_set", JSON.stringify(currentTagsSet));
}

function updateSuggestionSet(value) {
    suggestionBoxSet.innerHTML = "";
    suggestionBoxSet.style.display = "none";

    const cleanValue = value.trim().toLowerCase();
    if (!cleanValue) return;

    filteredSet = database
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

    if (filteredSet.length === 0) return;

    filteredSet.forEach((item, i) => {
        const div = document.createElement("div");
        div.textContent = item.raw.split('$')[1];
        div.classList.toggle("active", i === 0);
        div.addEventListener("click", () => {
            addSetTag(item);
            clearInputSet();
        });
        suggestionBoxSet.appendChild(div);
    });

    const rect = tagSetInput.getBoundingClientRect();
    suggestionBoxSet.style.left = rect.left + "px";
    suggestionBoxSet.style.top = "auto";
    suggestionBoxSet.style.display = "block";
}

function addSetTag(tagObj) {
    const tagValue = tagObj.raw.split('$')[1];
    const rawTag = tagObj.raw;

    if (currentTagsSet.includes(tagValue)) return;

    const codeEl = document.createElement("code");
    codeEl.textContent = tagValue;
    tagSetInput.insertBefore(codeEl, realInputSet);

    currentTagsSet.push(tagValue);
    rawTagsSet.push(rawTag);

    sortSetTags();
}

tagSetInput.addEventListener("click", (e) => {
    if (e.target.tagName === "CODE") {
        const tagValue = e.target.textContent;
        const index = currentTagsSet.indexOf(tagValue);

        if (index === -1) {
            index = rawTags.findIndex(raw => raw === tagValue);
        }

        if (index !== -1) {
            currentTagsSet.splice(index, 1);
            rawTagsSet.splice(index, 1);
        }

        e.target.remove();
        localStorage.setItem("current_tag_set", JSON.stringify(currentTagsSet));
        localStorage.setItem("raw_tag_set", JSON.stringify(rawTagsSet));
    }
});


function clearInputSet() {
    realInputSet.value = "";
    suggestionBoxSet.innerHTML = "";
    suggestionBoxSet.style.display = "none";
    selectedIndexSet = 0;
}

function removeLastTagSet() {
    const codes = tagSetInput.querySelectorAll("code");
    if (codes.length > 0) {
        const last = codes[codes.length - 1];
        const text = last.textContent;
        tagSetInput.removeChild(last);
        const index = currentTagsSet.indexOf(text);
        if (index !== -1) {
            currentTagsSet.splice(index, 1);
            rawTagsSet.splice(index, 1);
        }
        sortSetTags();
    }
}

function clearAllTagsSet() {
    currentTagsSet = [];
    rawTagsSet = [];
    localStorage.removeItem("current_tag_set");
    localStorage.removeItem("raw_tag_set");

    const codes = tagSetInput.querySelectorAll("code");
    codes.forEach(code => code.remove());

    sortSetTags();        // Reset sorting
    filterImageData();    // Refresh gallery
}

realInputSet.addEventListener("input", (e) => updateSuggestionSet(e.target.value));
realInputSet.addEventListener("keydown", (e) => {
    const items = suggestionBoxSet.querySelectorAll("div");

    if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndexSet = (selectedIndexSet + 1) % items.length;
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndexSet = (selectedIndexSet - 1 + items.length) % items.length;
    } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredSet.length > 0) {
            addSetTag(filteredSet[selectedIndexSet]);
            clearInputSet();
        }
    } else if (e.key === "Backspace" && realInputSet.value === "") {
        removeLastTagSet();
    }

    items.forEach((el, i) => el.classList.toggle("active", i === selectedIndexSet));
});

tagSetInput.addEventListener("click", () => realInputSet.focus());
window.addEventListener("click", (e) => {
    if (!tagSetInput.contains(e.target) && !suggestionBoxSet.contains(e.target)) {
        suggestionBoxSet.style.display = "none";
    }
});