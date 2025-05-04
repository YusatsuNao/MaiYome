document.addEventListener("keydown", (e) => {
	const key = e.key.toLowerCase();

	switch (key) {
		case "a":
			if (e.ctrlKey) {
				if (
					document.activeElement.tagName === "INPUT" ||
					document.activeElement.tagName === "TEXTAREA"
				) {
					return;
				}

				e.preventDefault();

				const thumbnails = document.querySelectorAll('.thumbnail');
				const selection = [];

				thumbnails.forEach(el => {
					el.setAttribute("aria-selected", "true");
					const id = el.querySelector("img").getAttribute("data-file-id");
					if (id) selection.push(id);
				});

				if (selection.length > 0) {
					localStorage.setItem("current_selection", JSON.stringify(selection));
				} else {
					localStorage.removeItem("current_selection");
				}

				console.log(`[CTRL+A] Selected all (${selection.length}) items`);
				updateStatusBar();
				updateTagListDisplay();
			}
			break;

		case "f":
			if (e.ctrlKey) {
				e.preventDefault();
				document.getElementById("real-input").focus();
			}
			break;

		case "t":
			if (e.ctrlKey) {
				e.preventDefault();
				document.getElementById("real-input-set").focus();
			}
			break;

		case "escape":
			const isTagInputFocused = document.activeElement.id === "real-input";
			const isTagSetInputFocused = document.activeElement.id === "real-input-set";
			const mainViewer = document.getElementById("MainViewer");
			const mainComparator = document.getElementById("MainComparator");

			if (mainViewer && mainViewer.style.display !== "none") {
				closeViewer();
				console.log("[Escape] Closed MainViewer.");
				localStorage.removeItem("current_selection");
				updateTagListDisplay();
				break;
			} else if (mainComparator && mainComparator.style.display !== "none") {
				closeViewer();
				console.log("[Escape] Closed MainComparator.");
				localStorage.removeItem("current_selection");
				updateTagListDisplay();
			}

			if (isTagInputFocused || isTagSetInputFocused) {
				document.activeElement.blur();
				const suggestionBox = document.getElementById("suggestion-box");
				if (suggestionBox) suggestionBox.style.display = "none";
			} else {
				const selected = document.querySelectorAll('.thumbnail[aria-selected="true"]');
				if (selected.length > 0) {
					selected.forEach(el => el.setAttribute("aria-selected", "false"));
					localStorage.removeItem("current_selection");
					updateStatusBar();
					updateTagListDisplay();
					console.log("[Escape] Cleared selection.");
				}
			}
			break;
		case "delete":
			const selected = document.querySelectorAll('.thumbnail[aria-selected="true"]');
			if (selected.length > 0) {
					showWarning({
						message_header: "⚠ WARNING ⚠",
						message: "You are about to DELETE FILE!",
						message_bottom: "The Selected item(s) will be deleted from entries and will be moved to Recycle Bin, Are you sure?",
						nextAction: "controlDataDEL",
						message_color: "rgba(169, 0, 0, 0.6)"
					});
					updateStatusBar();
					updateTagListDisplay();
					console.log("[DELETE] CURRENT SELECTION IS DELETED.");
				}
			break;
	}
});