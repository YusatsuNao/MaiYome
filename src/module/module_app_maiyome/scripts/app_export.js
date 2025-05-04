window.redirect.$receive_ExportProgress(({ type, count, total, text }) => {
	let statusMessage = "";

	if (!type) {
		console.warn("⚠️ Received progress update with missing 'type'", { count, total, text });
		return;
	}

	switch (type) {
		case "import":
			statusMessage = `${count} of ${total} Files Imported`;
			break;
		case "tag_json":
			statusMessage = `${count} of ${total} JSON Exported`;
			break;
		case "thumb":
			statusMessage = text || `${count} of ${total} Thumbnails Generated`;
			break;
		case "raw":
		case "raw_selection":
			statusMessage = `${count} of ${total} Raw Tags exported`;
			break;
		case "fingerprint":
			statusMessage = text || `${count} of ${total} Fingerprints Indexed`;
			break;
		case "fingerprint_done":
			statusMessage = text || `Total ${count} duplicates found`;
			break;
		default:
			statusMessage = `${count} of ${total} Data Processed`;
			break;
	}

	document.getElementById("info_search").textContent = statusMessage;
	updateStatusBar();
});

  