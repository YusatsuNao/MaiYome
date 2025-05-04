document.querySelectorAll('.dropdown_item').forEach(item => {
	item.addEventListener('click', () => {
		const action = item.getAttribute('data-action');
		console.log("Sorting by:", action);
	});
});

function updateStatusBar() {
	const totalIndexed = allImageRows.length;
	const fileNotFound = parseInt(localStorage.getItem("file_not_found") || 0, 10);
	const selectedItems = JSON.parse(localStorage.getItem("current_selection") || "[]").length;
	const duplicateItems = parseInt(localStorage.getItem("data_duplicate_found") || 0, 10);;

	document.getElementById("info_index_full").textContent = `${totalIndexed} Indexed`;
	document.getElementById("info_index_error").textContent = `${fileNotFound} ${fileNotFound === 1 ? "Error" : "Errors"}`;
	document.getElementById("info_selection").textContent = `${selectedItems} Selected`;
	document.getElementById("info_duplicate").textContent = `${duplicateItems} Duplicates Exist`;
}

function updateTagListDisplay() {
	const selected = JSON.parse(localStorage.getItem("current_selection") || "[]");

	const tagList = document.getElementById("tag-list");
	const metadataList = document.getElementById("metadata-list");

	tagList.innerHTML = "";
	metadataList.innerHTML = "";

	if (selected.length !== 1) {
		tagList.innerHTML = `<code>list of tag will be displayed here</code>`;
		metadataList.innerHTML = `<code>Metadata will be displayed here</code>`;
		return;
	}

	const row = allImageRows.find(r => r.id === selected[0]);
	if (!row) {
		tagList.innerHTML = `<code>list of tag will be displayed here</code>`;
		metadataList.innerHTML = `<code>Metadata will be displayed here</code>`;
		return;
	}

	if (row.raw_tag) {
		const PRIORITY_ORDER = ["c$", "h$", "a$", "g$", "s$"];
		const colors = {
			"c$": "tag_c",
			"h$": "tag_h",
			"a$": "tag_a",
			"g$": "tag_g",
			"s$": "tag_s"
		};

		const tagData = row.raw_tag.split(",").map(t => t.trim()).filter(Boolean);
		const sortedTags = [];

		PRIORITY_ORDER.forEach(prefix => {
			tagData
				.filter(tag => tag.startsWith(prefix))
				.forEach(tag => {
					const clean = tag.replace(prefix, "").replace(/_/g, " ");
					const code = document.createElement("code");
					code.className = colors[prefix];
					code.textContent = clean;
					sortedTags.push(code);
				});
		});

		sortedTags.forEach(tagEl => tagList.appendChild(tagEl));
	}

	function formatFileSize(bytes) {
		if (bytes < 1024) return `${bytes} B`;
		const kb = bytes / 1024;
		if (kb < 1024) return `${kb.toFixed(1)} KB`;
		const mb = kb / 1024;
		return `${mb.toFixed(1)} MB`;
	}

	const metadata = [
		{ label: "Filename", value: row.filename },
		{ label: "MD5", value: row.md5 },
		{ label: "Dimension", value: `${row.width} x ${row.height}` },
		{ label: "Format", value: row.file_format },
		{ label: "Size", value: formatFileSize(row.file_size) },
		{ label: "File Path", value: row.relative_path },
	];

	for (const { label, value } of metadata) {
		const code = document.createElement("code");

		const top = document.createElement("div");
		top.className = "code_top";
		top.textContent = `${label} :`;

		const bottom = document.createElement("textarea");
		bottom.setAttribute('autocorrect','off');
		bottom.setAttribute('autocapitalize','off');
		bottom.setAttribute('spellcheck','false');
		bottom.setAttribute("readonly", true);
		bottom.className = "code_bottom";
		bottom.textContent = value;
		bottom.contentEditable = false;

		code.appendChild(top);
		code.appendChild(bottom);
		metadataList.appendChild(code);
	}
}

document.addEventListener("click", function(e) {
	const info_search_warning = document.getElementById('info_search');
	if (e.target && e.target.classList.contains("code_bottom")) {
		const textarea = e.target;
		textarea.select();
		textarea.setSelectionRange(0, 99999);
	
		navigator.clipboard.writeText(textarea.value)
		.then(() => {
			showTemporaryMessage("Metadata is Copied");
		})
		.catch(err => {
			showTemporaryMessage("Failed to Copy Metadata");
		});
	}

	function showTemporaryMessage(message) {
		info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: lightgreen;">${message}</span>`;
		
		const alert = info_search_warning.querySelector('.alert');

		alert.classList.remove("fade-out");

		setTimeout(() => {
			alert.classList.add("fade-out");
		}, 2000);

		setTimeout(() => {
			info_search_warning.innerHTML = "";
		}, 11000);
	}
});