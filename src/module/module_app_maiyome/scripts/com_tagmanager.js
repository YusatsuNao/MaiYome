const tagListing = document.getElementById('tag-listing');
const tagContainer = document.getElementById('tagContainer');
const newTagsInput = document.getElementById('newTagsInput');
let tagType = '';
const addTagsBtn = document.getElementById('addTags');

const COLORS = {
    'c': 'tag_c',
    'h': 'tag_h',
    'a': 'tag_a',
    'g': 'tag_g',
    's': 'tag_s'
};

let fileList = [];
let lastSelectedTagIndex = null;

window.addEventListener('DOMContentLoaded', async () => {
    fileList = await window.api.getJsonFiles();
    if (!fileList.length) return;

    renderFileList(fileList);

    let defaultFile = fileList.includes('default.json') ? 'default.json' : fileList[0];
    localStorage.setItem('tagfile_active', defaultFile);
    loadTags(defaultFile);
});

function renderFileList(files) {
    tagListing.innerHTML = '';
    files.forEach(file => {
        const code = document.createElement('code');
        code.className = 'tag_file';
        code.textContent = file;
        code.tabIndex = 0;
        code.addEventListener('click', (e) => {
            selectSingleFile(code);
            localStorage.setItem('tagfile_active', file);
            loadTags(file);
        });
        tagListing.appendChild(code);
    });
}

function selectSingleFile(selectedCode) {
    document.querySelectorAll('#tag-listing code').forEach(code => {
        code.classList.remove('active');
    });
    selectedCode.classList.add('active');
}

function highlightSelectedFile(selectedFile) {
    document.querySelectorAll('#tag-listing .tag_file').forEach(item => {
        item.classList.toggle('active', item.textContent === selectedFile);
    });
}

async function loadTags(filename) {
    if (!filename) return;
    const data = await window.api.readJsonFile(filename);
    if (data && Array.isArray(data)) {
        const sorted = sortTags(data);
        renderTags(sorted);
        highlightSelectedFile(filename);
    }
}

function sortTags(tags) {
    const priorityOrder = { 'c': 1, 'h': 2, 'a': 3, 'g': 4, 's': 5 };
    return tags.sort((a, b) => {
        const typeA = a.split('$')[0].toLowerCase();
        const typeB = b.split('$')[0].toLowerCase();
        return (priorityOrder[typeA] || 99) - (priorityOrder[typeB] || 99);
    });
}

function renderTags(tags) {
    tagContainer.innerHTML = '';

    tags.forEach((tagString, idx) => {
        const [type, value] = tagString.split('$');
        const code = document.createElement('code');
        code.className = COLORS[type.toLowerCase()] || '';
        code.dataset.type = type.toLowerCase();
        code.setAttribute('aria-selected', 'false');
        code.dataset.index = idx;
        code.innerText = value;
        tagContainer.appendChild(code);

        code.addEventListener('click', (e) => handleTagClick(e, code));
    });
}

function handleTagClick(e, code) {
    const allCodes = Array.from(tagContainer.querySelectorAll('code'));
    const currentIndex = parseInt(code.dataset.index);

    if (e.shiftKey && lastSelectedTagIndex !== null) {
        const [start, end] = [Math.min(lastSelectedTagIndex, currentIndex), Math.max(lastSelectedTagIndex, currentIndex)];
        allCodes.forEach((c, idx) => {
            if (idx >= start && idx <= end) {
                c.setAttribute('aria-selected', 'true');
            }
        });
    } else if (e.ctrlKey || e.metaKey) {
        const selected = code.getAttribute('aria-selected') === 'true';
        code.setAttribute('aria-selected', String(!selected));
    } else {
        allCodes.forEach(c => c.setAttribute('aria-selected', 'false'));
        code.setAttribute('aria-selected', 'true');
    }

    lastSelectedTagIndex = currentIndex;
    updateSelectedTags();
}

function updateSelectedTags() {
    const selected = Array.from(tagContainer.querySelectorAll('code[aria-selected="true"]'))
        .map(code => `${code.dataset.type}$${code.innerText}`);
    localStorage.setItem('tag_current_selection', JSON.stringify(selected));
}

document.addEventListener('keydown', async (e) => {
    if (e.key === 'Escape') {
        tagContainer.querySelectorAll('code').forEach(code => code.setAttribute('aria-selected', 'false'));
        localStorage.removeItem('tag_current_selection');
        lastSelectedTagIndex = null;
    }

    if (e.key === 'Delete') {
        const selectedTags = JSON.parse(localStorage.getItem('tag_current_selection') || '[]');
        if (!selectedTags.length) return;

        const currentFile = localStorage.getItem('tagfile_active');
        if (!currentFile) return;

        selectedTags.forEach(tag => {
            const [type, value] = tag.split('$');
            const codeElements = Array.from(tagContainer.querySelectorAll(`code.${COLORS[type]}`));
            codeElements.forEach(code => {
                if (code.innerText === value) {
                    code.remove();
                }
            });
        });

        await window.api.deleteTags(currentFile, selectedTags);
        localStorage.removeItem('tag_current_selection');
    }
});

addTagsBtn.addEventListener('click', async () => {
    const type = tagType;
    const inputLines = newTagsInput.value.trim().split('\n').map(line => line.trim()).filter(Boolean);
	const info_search_warning = document.getElementById('info_search');

	if (!inputLines.length) {
		info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: #F7374F;">⚠ Fill Tags Input first the add a new Tag</span>`;
		return;
	}
	if (!type) {
		info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: #F7374F;">⚠ Choose Tag Type First before adding a new Tag</span>`;
		return;
	}
    const formattedTags = inputLines.map(line => `${type}$${line}`);
    const currentFile = localStorage.getItem('tagfile_active');

    const currentTags = Array.from(tagContainer.querySelectorAll('code')).map(code => {
        return `${code.dataset.type}$${code.innerText}`;
    });

    const updatedTags = [...currentTags, ...formattedTags];
    const sorted = sortTags(updatedTags);

    renderTags(sorted);

    applyCurrentFilter();

    await window.api.appendTags(currentFile, formattedTags);

    newTagsInput.value = '';
});


document.addEventListener("click", (e) => {
	const target = e.target.closest("button[data-action]");
	if (!target) return;

	const action = target.dataset.action;

	switch (action) {
		case "tagtype-c":
		case "tagtype-h":
		case "tagtype-a":
		case "tagtype-g":
		case "tagtype-s":
			tagType = action.split('-')[1];
			newTagsInput.className = '';
			const className = COLORS[tagType];
			if (className) {
				newTagsInput.classList.add(className + '_bg');
			}
			break;
	}
});


const realInput = document.getElementById('real-input');

realInput.addEventListener('input', () => {
    const query = realInput.value.trim().toLowerCase().replace(/_/g, ' ');
    const keywords = query.split(/\s+/).filter(Boolean);

    const tags = tagContainer.querySelectorAll('code');

    tags.forEach(code => {
        const text = code.innerText.toLowerCase().replace(/_/g, ' ');

        const matched = keywords.every(kw => text.includes(kw));

        if (matched) {
            code.style.display = '';
        } else {
            code.style.display = 'none';
        }
    });
});

function applyCurrentFilter() {
    const query = realInput.value.trim().toLowerCase().replace(/_/g, ' ');
    const keywords = query.split(/\s+/).filter(Boolean);

    const tags = tagContainer.querySelectorAll('code');

    tags.forEach(code => {
        const text = code.innerText.toLowerCase().replace(/_/g, ' ');

        const matched = keywords.every(kw => text.includes(kw));

        if (matched) {
            code.style.display = '';
        } else {
            code.style.display = 'none';
        }
    });
}