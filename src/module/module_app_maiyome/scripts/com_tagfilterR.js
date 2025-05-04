const restrictInputWrapper = document.getElementById("tag-input-restrict");
const restrictInput = document.getElementById("real-input-restrict");
const restrictSuggestionBox = document.getElementById("suggestion-box-restrict");

function sortRestrictTags() {
    const combined = restrictRawTags.map(raw => {
        const [prefix, value] = raw.split('$');
        return { raw, value, prefix: prefix + "$" };
    });
    combined.sort((a, b) => PRIORITY_ORDER.indexOf(a.prefix) - PRIORITY_ORDER.indexOf(b.prefix));

    restrictRawTags = combined.map(item => item.raw);
    restrictTags = combined.map(item => item.value);

    localStorage.setItem("raw_tag_restrict", JSON.stringify(restrictRawTags));
    localStorage.setItem("current_tag_restrict", JSON.stringify(restrictTags));

    filterImageData();
}

function updateRestrictSuggestions(value) {
    restrictSuggestionBox.innerHTML = "";
    restrictSuggestionBox.style.display = "none";

    const cleanValue = value.trim().toLowerCase();
    if (!cleanValue) return;

    restrictFiltered = database
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

    if (restrictFiltered.length === 0) return;

    restrictFiltered.forEach((item, i) => {
        const div = document.createElement("div");
        div.textContent = item.raw.split('$')[1];
        div.classList.toggle("active", i === 0);
        div.addEventListener("click", () => {
            addRestrictTag(item);
            clearRestrictInput();
        });
        restrictSuggestionBox.appendChild(div);
    });

    const rect = restrictInputWrapper.getBoundingClientRect();
    restrictSuggestionBox.style.left = rect.left + "px";
    restrictSuggestionBox.style.top = "auto";
    restrictSuggestionBox.style.display = "block";
}

function addRestrictTag(tagObj) {
    const tagValue = tagObj.raw.split('$')[1];
    const rawTag = tagObj.raw;

    if (restrictTags.includes(tagValue)) return;

    const codeEl = document.createElement("code");
    codeEl.textContent = tagValue;
    restrictInputWrapper.insertBefore(codeEl, restrictInput);

    restrictTags.push(tagValue);
    restrictRawTags.push(rawTag);

    sortRestrictTags();
    clearRestrictInput();
}

function removeLastRestrictTag() {
    const codes = restrictInputWrapper.querySelectorAll("code");
    if (codes.length > 0) {
        const last = codes[codes.length - 1];
        const text = last.textContent;
        restrictInputWrapper.removeChild(last);
        const index = restrictTags.indexOf(text);
        if (index !== -1) {
            restrictTags.splice(index, 1);
            restrictRawTags.splice(index, 1);
        }
        sortRestrictTags();
    }
}

function clearRestrictInput() {
    restrictInput.value = "";
    restrictSuggestionBox.innerHTML = "";
    restrictSuggestionBox.style.display = "none";
    restrictSelectedIndex = 0;
}

restrictInputWrapper.addEventListener("click", (e) => {
    if (e.target.tagName === "CODE") {
        const tagValue = e.target.textContent;
        const index = restrictTags.indexOf(tagValue);
        if (index === -1) {
            index = rawTags.findIndex(raw => raw === tagValue);
        }

        if (index !== -1) {
            restrictTags.splice(index, 1);
            restrictRawTags.splice(index, 1);
        }

        e.target.remove();
    }
});

restrictInput.addEventListener("input", e => updateRestrictSuggestions(e.target.value));
restrictInput.addEventListener("keydown", e => {
    const items = restrictSuggestionBox.querySelectorAll("div");

    if (e.key === "ArrowDown") {
        e.preventDefault();
        restrictSelectedIndex = (restrictSelectedIndex + 1) % items.length;
    } else if (e.key === "ArrowUp") {
        e.preventDefault();
        restrictSelectedIndex = (restrictSelectedIndex - 1 + items.length) % items.length;
    } else if (e.key === "Enter") {
        e.preventDefault();
        if (restrictFiltered.length > 0) {
            addRestrictTag(restrictFiltered[restrictSelectedIndex]);
            clearRestrictInput();
        }
    } else if (e.key === "Backspace" && restrictInput.value === "") {
        removeLastRestrictTag();
    }

    items.forEach((el, i) => el.classList.toggle("active", i === restrictSelectedIndex));
});

restrictInputWrapper.addEventListener("click", () => restrictInput.focus());
window.addEventListener("click", e => {
    if (!restrictInputWrapper.contains(e.target) && !restrictSuggestionBox.contains(e.target)) {
        restrictSuggestionBox.style.display = "none";
    }
});