// Load the folder and fetch data
window.redirect.$db_ready(() => {
	loadTableData();
});

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
document.addEventListener("click", (e) => {
	const sorter_type = {
		AA: document.querySelector("#sortAscBtn.nav_header_main"),
		AZ: document.querySelector("#sortDescBtn.nav_header_main"),
		DCA: document.querySelector("#sortAscDateCreatedBtn.nav_header_main"),
		DCZ: document.querySelector("#sortDescDateCreatedBtn.nav_header_main"),
		DMA: document.querySelector("#sortAscDateModifiedBtn.nav_header_main"),
		DMZ: document.querySelector("#sortDescDateModifiedBtn.nav_header_main"),
		DAA: document.querySelector("#sortAscDateAddedBtn.nav_header_main"),
		DAZ: document.querySelector("#sortDescDateAddedBtn.nav_header_main"),
		R: document.querySelector("#sortRandBtn.nav_header_main"),
	};
	const errTrigger = document.querySelector('[data-action="showError"]');
	const untagTrigger = document.querySelector('[data-action="untag"]');
	const duplicateTrigger = document.querySelector('[data-action="duplicate"]');

	const info_search_warning = document.getElementById('info_search');
	
	const target = e.target.closest("button.nav_button, #info_index_error");
	if (!target) return;
	
	const action = target.dataset.action;
	if (!action) return;

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
	switch (action) {
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
		case 'controlTAG':
			window.redirect.$send_redirectPAGE('tag_manager');
			break;
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //


		case 'vertical':
			localStorage.setItem("gallery_type", "vertical");
			window.redirect.SET_USER_CFG_SINGLE("gallery_type", "vertical");
			handleViewChange("vertical");
			break;

		case 'horizontal':
			localStorage.setItem("gallery_type", "horizontal");
			window.redirect.SET_USER_CFG_SINGLE("gallery_type", "horizontal");
			handleViewChange("horizontal");
			break;

		case 'grid':
			localStorage.setItem("gallery_type", "grid");
			window.redirect.SET_USER_CFG_SINGLE("gallery_type", "grid");
			handleViewChange("grid");
			break;

		case 'details':
			localStorage.setItem("gallery_type", "details");
			window.redirect.SET_USER_CFG_SINGLE("gallery_type", "details");
			handleViewChange("details");
			break;

		case 'controlImport':
			window.redirect.$data_import();
			loadTableData();
			break;
		case 'controlImportAll':
			window.redirect.$data_importAll();
			loadTableData();
			break;
		case 'controlImportRefresh':
			window.redirect.$data_importFolder();
			loadTableData();
			break;
		case 'controlVerifyPATH':
			window.redirect.$db_PATHverification();
			loadTableData();
			break;
		case 'controlVerifyDUPLICATE':
			window.redirect.$db_DUPLICATEverification().then(result => {
				console.log("Duplicate Check Result:", result);
			  });
			break;
		case 'controlResetDUPLICATE':
			window.redirect.$db_DUPLICATEreset();
			break;
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //

		case 'controlPreEntryDEL':
			showWarning({
				message_header: "⚠ WARNING ⚠",
				message: "You are about to remove the selected entry from the database.",
				message_bottom: "The Selected item(s) will be deleted from the entry, Are you sure?",
				nextAction: "controlEntryDEL",
				message_color: "rgba(169, 0, 0, 0.6)"
			});
			break;

		case 'controlEntryDEL':
			handleControlEntryOnlyDEL();
			break;

		case `controlPreFileDEL`:
			showWarning({
				message_header: "⚠ WARNING ⚠",
				message: "You are about to DELETE FILE!",
				message_bottom: "The Selected item(s) will be deleted from entries and will be moved to Recycle Bin, Are you sure?",
				nextAction: "controlDataDEL",
				message_color: "rgba(169, 0, 0, 0.6)"
			});
			break;

		case 'controlDataDEL':
			handleControlPrefileDEL();
			break;
			

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
		case `exportPreClean`:
			showWarning({
				message_header: "CLEAN TAG EXPORT | ALL",
				message: "You are about to Export CLEAN_TAG into ALL File",
				message_bottom: "THIS WILL SAVE THE CURRENT CLEAN_TAG from the DB, REGENERATE FILE HASH AND THE ORIGINAL HASH WILL BE SAVED in XMP:OriginalImageMD5",
				nextAction: "exportClean",
				message_color: "rgba(11, 0, 135, 0.6)"
			});
			break;

		case `exportPreRAW`:
			showWarning({
				message_header: "RAW TAG EXPORT | ALL",
				message: "You are about to Export RAW_TAG into ALL File",
				message_bottom: "THIS WILL SAVE THE CURRENT CLEAN_TAG from the DB, REGENERATE FILE HASH AND THE ORIGINAL HASH WILL BE SAVED in XMP:OriginalImageMD5",
				nextAction: "exportRAW",
				message_color: "rgba(11, 0, 135, 0.6)"
			});
			break;

		case `exportPreCleanSelection`:
			showWarning({
				message_header: "CLEAN TAG EXPORT | SELECTION",
				message: "You are about to Export CLEAN_TAG into the Selected File",
				message_bottom: "THIS WILL SAVE THE CURRENT CLEAN_TAG from the DB, REGENERATE FILE HASH AND THE ORIGINAL HASH WILL BE SAVED in XMP:OriginalImageMD5",
				nextAction: "exportCleanSelection",
				message_color: "rgba(11, 0, 135, 0.6)"
			});
			break;

		case `exportPreRAWSelection`:
			showWarning({
				message_header: "RAW TAG EXPORT | SELECTION",
				message: "You are about to Export RAW_TAG into the Selected File",
				message_bottom: "THIS WILL SAVE THE CURRENT RAW_TAG from the DB, REGENERATE FILE HASH AND THE ORIGINAL HASH WILL BE SAVED in XMP:OriginalImageMD5",
				nextAction: "exportRAWSelection",
				message_color: "rgba(11, 0, 135, 0.6)"
			});
			break;

		case 'exportTAGtoJSON':
			window.redirect.exportProcessTAGtoJSON();
			break;
		case 'exportClean':
			window.redirect.exportProcessClean();
			break;
		case 'exportRAW':
			window.redirect.exportProcessRAW();
			break;
		case 'exportCleanSelection':
			window.redirect.exportProcessCleanSelection();
			break;
		case 'exportRAWSelection':
			window.redirect.exportProcessRAWSelection();
			break;
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
		case 'controlPreJson':
			showWarning({
				message_header: "⚠ WARNING ⚠",
				message: "YOU ARE ABOUT TO CHANGE A JSON DATA !!",
				message_bottom: `IF YOU DON'T KNOW WHAT ARE YOU DOING, PRESS "CANCEL" / CLICK ON THE RED AREA TO CANCEL THE ACTION`,
				nextAction: "controlJson",
				message_color: "rgba(169, 0, 0, 0.6)"
			});
			break;

		case 'controlPreReset':
			showWarning({
				message_header: "⚠ WARNING ⚠",
				message: "YOU ARE ABOUT TO RESET THE DATABASE !!",
				message_bottom: `IF YOU DON'T KNOW WHAT ARE YOU DOING, PRESS "CANCEL" / CLICK ON THE RED AREA TO CANCEL THE ACTION`,
				nextAction: "controlReset",
				message_color: "rgba(169, 0, 0, 0.6)"
			});
			break;

		case 'controlJson':
			const DirectCFGPath = window.redirect.$receive_corePATH() + '/userdata/config/user_config.json';
			window.redirect.$send_redirectFILE(DirectCFGPath);
			break;

		case 'controlReset':
			window.redirect.$db_reset();
			loadTableData();
			break;
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
		case "sortAscBtn":
			localStorage.setItem("gallery_item_show_sorter", "file_name");
			localStorage.setItem("gallery_item_show_order", "asc");
			window.redirect.SET_USER_CFG_MULTI({
				gallery_item_show__sorter: "file_name",
				gallery_item_show__order: "asc"
			});
			Object.values(sorter_type).forEach(btn => btn.classList.remove("active"));
			sorter_type.AA.classList.add("active");
			loadTableData("file_name", "asc");
			break;

		case "sortDescBtn":
			localStorage.setItem("gallery_item_show_sorter", "file_name");
			localStorage.setItem("gallery_item_show_order", "desc");
			window.redirect.SET_USER_CFG_MULTI({
				gallery_item_show__sorter: "file_name",
				gallery_item_show__order: "desc"
			});
			Object.values(sorter_type).forEach(btn => btn.classList.remove("active"));
			sorter_type.AZ.classList.add("active");
			loadTableData("file_name", "desc");
			break;

		case "sortAscDateCreatedBtn":
			localStorage.setItem("gallery_item_show_sorter", "date_created");
			localStorage.setItem("gallery_item_show_order", "asc");
			window.redirect.SET_USER_CFG_MULTI({
				gallery_item_show__sorter: "date_created",
				gallery_item_show__order: "asc"
			});
			Object.values(sorter_type).forEach(btn => btn.classList.remove("active"));
			sorter_type.DCA.classList.add("active");
			loadTableData("date_created", "asc");
			break;

		case "sortDescDateCreatedBtn":
			localStorage.setItem("gallery_item_show_sorter", "date_created");
			localStorage.setItem("gallery_item_show_order", "desc");
			window.redirect.SET_USER_CFG_MULTI({
				gallery_item_show__sorter: "date_created",
				gallery_item_show__order: "desc"
			});
			Object.values(sorter_type).forEach(btn => btn.classList.remove("active"));
			sorter_type.DCZ.classList.add("active");
			loadTableData("date_created", "desc");
			break;

		case "sortAscDateModifiedBtn":
			localStorage.setItem("gallery_item_show_sorter", "date_modified");
			localStorage.setItem("gallery_item_show_order", "asc");
			window.redirect.SET_USER_CFG_MULTI({
				gallery_item_show__sorter: "date_modified",
				gallery_item_show__order: "asc"
			});
			Object.values(sorter_type).forEach(btn => btn.classList.remove("active"));
			sorter_type.DMA.classList.add("active");
			loadTableData("date_modified", "asc");
			break;

		case "sortDescDateModifiedBtn":
			localStorage.setItem("gallery_item_show_sorter", "date_modified");
			localStorage.setItem("gallery_item_show_order", "desc");
			window.redirect.SET_USER_CFG_MULTI({
				gallery_item_show__sorter: "date_modified",
				gallery_item_show__order: "desc"
			});
			Object.values(sorter_type).forEach(btn => btn.classList.remove("active"));
			sorter_type.DMZ.classList.add("active");
			loadTableData("date_modified", "desc");
			break;

		case "sortAscDateAddedBtn":
			localStorage.setItem("gallery_item_show_sorter", "date_imported");
			localStorage.setItem("gallery_item_show_order", "asc");
			window.redirect.SET_USER_CFG_MULTI({
				gallery_item_show__sorter: "date_imported",
				gallery_item_show__order: "asc"
			});
			Object.values(sorter_type).forEach(btn => btn.classList.remove("active"));
			sorter_type.DAA.classList.add("active");
			loadTableData("date_imported", "asc");
			break;

		case "sortDescDateAddedBtn":
			localStorage.setItem("gallery_item_show_sorter", "date_imported");
			localStorage.setItem("gallery_item_show_order", "desc");
			window.redirect.SET_USER_CFG_MULTI({
				gallery_item_show__sorter: "date_imported",
				gallery_item_show__order: "desc"
			});
			Object.values(sorter_type).forEach(btn => btn.classList.remove("active"));
			sorter_type.DAZ.classList.add("active");
			loadTableData("date_imported", "desc");
			break;
			
		case "sortRandBtn":
			localStorage.setItem("gallery_item_show_order", "random");
			window.redirect.SET_USER_CFG_SINGLE("gallery_item_show__order", "random");
			Object.values(sorter_type).forEach(btn => btn.classList.remove("active"));
			sorter_type.R.classList.add("active");
			loadTableData('file_name', 'RANDOM');
			break;

		case "defaultExclude":
			const defaultBtn = document.querySelector('[data-action="defaultExclude"]');
			const isDefaultActive = defaultBtn.classList.toggle("active");
		
			const defaultShowType = isDefaultActive ? "active" : "";
			localStorage.setItem("gallery_item_show_default", defaultShowType);
			window.redirect.SET_USER_CFG_SINGLE("gallery_item_show__default", defaultShowType);
		
			loadTableData();
			break;

		case "showError":
			const errActive = errTrigger.classList.toggle("active");
			[untagTrigger, duplicateTrigger].forEach(el => el.classList.remove("active"));

			const errType = errActive ? "ERR" : "";
			localStorage.setItem("gallery_item_show_type", errType);

			localStorage.setItem("gallery_item_show_sorter", "date_imported");
			localStorage.setItem("gallery_item_show_order", "desc");
			window.redirect.SET_USER_CFG_SINGLE("gallery_item_show__type", errType);
			window.redirect.SET_USER_CFG_MULTI({
				gallery_item_show__sorter: "date_imported",
				gallery_item_show__order: "desc"
			});

			loadTableData("date_imported", "desc");
			break;

		case "untag":
			const untagActive = untagTrigger.classList.toggle("active");
			[errTrigger, duplicateTrigger].forEach(el => el.classList.remove("active"));

			const showType = untagActive ? "tag_null" : "";
			localStorage.setItem("gallery_item_show_type", showType);

			localStorage.setItem("gallery_item_show_sorter", "date_imported");
			localStorage.setItem("gallery_item_show_order", "desc");
			window.redirect.SET_USER_CFG_SINGLE("gallery_item_show__type", showType);
			window.redirect.SET_USER_CFG_MULTI({
				gallery_item_show__sorter: "date_imported",
				gallery_item_show__order: "desc"
			});

			loadTableData("date_imported", "desc");
			break;

		case "duplicate":
			const duplicateActive = duplicateTrigger.classList.toggle("active");
			[errTrigger, untagTrigger].forEach(el => el.classList.remove("active"));
		
			if (duplicateActive) {
				localStorage.setItem("gallery_item_show_sorter", "fingerprint");
				localStorage.setItem("gallery_item_show_order", "asc");
				window.redirect.SET_USER_CFG_MULTI({
					gallery_item_show__sorter: "fingerprint",
					gallery_item_show__order: "asc"
				});
				localStorage.setItem("gallery_item_show_type", "DUPLICATE");
				window.redirect.SET_USER_CFG_SINGLE("gallery_item_show__type", "DUPLICATE");
				loadTableData("fingerprint", "asc");
			} else {
				localStorage.setItem("gallery_item_show_sorter", "date_imported");
				localStorage.setItem("gallery_item_show_order", "desc");
				window.redirect.SET_USER_CFG_MULTI({
					gallery_item_show__sorter: "date_imported",
					gallery_item_show__order: "desc"
				});
				localStorage.setItem("gallery_item_show_type", "");
				window.redirect.SET_USER_CFG_SINGLE("gallery_item_show__type", "");
				loadTableData("date_imported", "desc");
			}
			break;
			
		case "genLoad":
			loadMoreImages();
			break;

		case 'compare':
			ImageCompare();
			break;

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //

		case 'controlPreTAG_replace':
			showWarning({
				message_header: "REPLACE ALL TAGS | SELECTION",
				message: "You are about to REPLACE current selection's TAGS",
				message_bottom: "are you sure want to replace it?",
				nextAction: "preTAG_replace",
				message_color: "rgba(169, 0, 0, 0.6)"
			});
			break;	

		case "preTAG_replace":
			(async () => {
				const selected = JSON.parse(localStorage.getItem("current_selection") || "[]");
				const rawTagArray = JSON.parse(localStorage.getItem("raw_tag_set") || "[]");
				const currentTagArray = JSON.parse(localStorage.getItem("current_tag_set") || "[]");
		
				if (selected.length === 0 || rawTagArray.length === 0) {
					info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: #F7374F;">⚠ No images selected or no Tags to replace with</span>`;
					return;
				} else {
					info_search_warning.innerHTML = ``;
				}
		
				const rawTagString = rawTagArray.join(",");
				const currentTagString = currentTagArray.join(",");
		
				await window.redirect.TAG_replace(selected, rawTagString, currentTagString);
		
				await refreshRowsAfterTagChange(selected); // ✅ updated logic
				await refreshSelectedFromDB(); // ✅ key step: re-fetch and rebind
				
			})();
			break;

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
		case 'preTAG_add':
			(async () => {
				const selected = JSON.parse(localStorage.getItem("current_selection") || "[]");
				const rawTagArray = JSON.parse(localStorage.getItem("raw_tag_set") || "[]");
				const currentTagArray = JSON.parse(localStorage.getItem("current_tag_set") || "[]");
		
				if (selected.length === 0 || rawTagArray.length === 0) {
					info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: #F7374F;">⚠ No images selected or no tags to add</span>`;
					return;
				} else {
					info_search_warning.innerHTML = ``;
				}
		
				const result = await window.redirect.TAG_add(selected, rawTagArray, currentTagArray);
				const { applied, skipped } = result;
		
				let report = "✅ Tags appended\n";
				report += `Applied Tags:\n${applied.map(i => `${i.id}: ${i.tags.join(",")}`).join("\n")}\n\n`;
				if (skipped.length) {
					report += `Skipped (already exist):\n${skipped.map(i => `${i.id}: ${i.tags.join(",")}`).join("\n")}`;
				}
		
				const updatedRows = await window.redirect.$data_fetch_by_ids(selected);
		
				for (const updated of updatedRows) {
					const i1 = allImageRows.findIndex(r => r.id === updated.id);
					if (i1 !== -1) allImageRows[i1] = updated;
		
					const i2 = filteredImageRows.findIndex(r => r.id === updated.id);
					if (i2 !== -1) filteredImageRows[i2] = updated;
				}
				
				await refreshSelectedFromDB();
				updateTagListDisplay();
			})();
			break;

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
		case 'preTAG_remove':
			(async () => {
				const selected = JSON.parse(localStorage.getItem("current_selection") || "[]");
				const rawTagArray = JSON.parse(localStorage.getItem("raw_tag_set") || "[]");
				const currentTagArray = JSON.parse(localStorage.getItem("current_tag_set") || "[]");
		
				if (selected.length === 0 || rawTagArray.length === 0) {
					info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: #F7374F;">⚠ No images selected or tags to remove</span>`;
					return;
				} else {
					info_search_warning.innerHTML = ``;
				}
		
				const result = await window.redirect.TAG_remove(selected, rawTagArray, currentTagArray);
		
				let report = "🗑️ Tags removed:\n";
				report += result.map(i => `${i.id}: ${[...(i.removed_raw || []), ...(i.removed_final || [])].join(", ")}`).join("\n");
		
				await refreshRowsAfterTagChange(selected);
				await refreshSelectedFromDB();
			})();
			break;

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
		case 'controlPreTAG_reset':
			showWarning({
				message_header: "RESET ALL TAGS | SELECTION",
				message: "You are about to RESET current selection's TAGS",
				message_bottom: "are you sure want to reset it?",
				nextAction: "preTAG_reset",
				message_color: "rgba(169, 0, 0, 0.6)"
			});
			break;	
			
		case "preTAG_reset":
			(async () => {
				const selected = JSON.parse(localStorage.getItem("current_selection") || "[]");
		
				if (selected.length === 0) {
					info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: #F7374F;">⚠ No images selected</span>`;
					return;
				} else {
					info_search_warning.innerHTML = ``;
				}
		
				await window.redirect.TAG_reset(selected);
		
				const message = `Cleared tags for:\n${selected.join("\n")}`;
				console.log(message);
				window.redirect.$send_console(message);
		
				await refreshRowsAfterTagChange(selected); // ✅ updated logic
				await refreshSelectedFromDB(); // ✅ key step: re-fetch and rebind
			})();
			break;
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
//		TAG MANAGER
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
		case "controlResetFilter":
				realInput.value = '';
				applyCurrentFilter();
			break;
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
//		TAG FILTER
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
	case "controlGallery_FilterR":
		realInput.value = '';
		currentTags = [];
		rawTags = [];
		localStorage.removeItem("current_tag");
		localStorage.removeItem("raw_tag");

		const codes_A = tagInput.querySelectorAll("#tag-input code");
		codes_A.forEach(code => code.remove());

		sortTags();         // Reset sorting
		filterImageData();  // Refresh gallery
		break;

	case "controlGallery_StrictR":
		restrictInput.value = '';
		restrictTags = [];
		restrictRawTags = [];
		localStorage.removeItem("current_tag_restrict");
		localStorage.removeItem("raw_tag_restrict");

		const codes = restrictInputWrapper.querySelectorAll("#tag-input-restrict code");
		codes.forEach(code => code.remove());
	
		sortRestrictTags();   // Reset sorting
		filterImageData();    // Refresh gallery
		break;

	case "controlGallery_EditorR":
		realInputSet.value = '';
		currentTagsSet = [];
		rawTagsSet = [];
		localStorage.removeItem("current_tag_set");
		localStorage.removeItem("raw_tag_set");

		const codes_C = tagSetInput.querySelectorAll("#tag-set-input code");
		codes_C.forEach(code => code.remove());
		break;
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
	case 'About':
		showWarning({
			message_header: "About",
			message: "MaiYome Version 1.0β | Public Channel",
			message_bottom: "MaiYome © 2025 YusatsuNao</br><a class='link' href='https://yusatsunao.github.io/'>→ Yusatsu Nao Official Site ←</a>",
			nextAction: "",
			message_color: "rgba(22,22,22,0.5)"

		});
		const AboutBtn = document.querySelector(".warning_bottom");
		AboutBtn.style.display = "none";
		break;	
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
	}
});
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //


function handleViewChange(view) {
	const imageGallery = document.getElementById('imageGallery');
	const compare = document.querySelector('[data-action="compare"]');

	localStorage.setItem("gallery_type", view);
	window.redirect.SET_USER_CFG_SINGLE("gallery_type", view);
	applyGalleryLayout(view);

	imageGallery.innerHTML = '';
	loadedIndex = 0;

	switch (view) {
		case 'vertical':
			compare.classList.remove("disabled");
			updateGallerySize(slider.value);
			loadMoreImages();
			break;

		case 'horizontal':
			compare.classList.remove("disabled");
			updateGallerySize(slider.value);
			loadMoreImages();
			break;

		case 'grid':
			compare.classList.remove("disabled");
			updateGallerySize(slider.value);
			loadMoreImages();
			break;

		case 'details':
			compare.classList.add("disabled");
			updateGallerySize(slider.value);
			loadMoreImages();
			break;

		default:
			console.warn(`Unknown gallery type: ${view}`);
			break;
	}
}

['vertical', 'horizontal', 'grid', 'details'].forEach(view => {
	const btn = document.getElementById(`${view}View`);
	if (btn) {
		btn.addEventListener('click', () => handleViewChange(view));
	}
});

function showWarning({ message_header, message, message_bottom, nextAction, message_color, mismatchTable = null }) {
	const warnEl = document.getElementById("warn");
	const warnE2 = document.getElementById("warn_container");
	const messageHeader = document.querySelector("#warn_header span");
	const messageMain = document.querySelector("#warn .warning_top span");
	const messageChild = document.querySelector("#warn .warning_middle span");
	const proceedBtn = document.querySelector("#warn .proceed");
	const AboutBtn = document.querySelector(".warning_bottom");

	messageHeader.textContent = message_header;
	messageMain.textContent = message;
	messageChild.innerHTML = mismatchTable || message_bottom;
	warnEl.style.background = message_color || "rgba(169, 0, 0, 0.6)";

	proceedBtn.removeAttribute("data-action");
	proceedBtn.removeAttribute("id");
	proceedBtn.onclick = null;

	if (nextAction) {
		proceedBtn.setAttribute("data-action", nextAction);
		proceedBtn.onclick = () => {
			document.getElementById(nextAction)?.click();
			closeWarning();
		};
	}

	AboutBtn.style.display = "block";
	warnEl.style.display = "block";
	warnE2.style.width = mismatchTable ? "700px" : "";
	warnE2.style.height = mismatchTable ? "min-content" : "";
	warnE2.style.maxHeight = mismatchTable ? "500px" : "";
	warnEl.style.opacity = "0";

	const importAllBtn = document.querySelector(".nav_button.importAll");

	if (importAllBtn) {
		importAllBtn.style.display = mismatchTable ? "inline-block" : "none";
	}

	setTimeout(() => {
		warnEl.style.transition = "opacity 0.2s ease-in-out";
		warnEl.style.opacity = "1";
	}, 10);

	document.getElementById("warn_cancel").onclick = closeWarning;
}

document.getElementById("warn_bg").addEventListener("click", (e) => {
	const container = document.getElementById("warn_container");
	if (!container.contains(e.target)) {
		closeWarning();
	}
});

function closeWarning() {
	const warnEl = document.getElementById("warn");
	warnEl.style.transition = "opacity 0.2s ease-in-out";
	warnEl.style.opacity = "0";
	setTimeout(() => {
		warnEl.style.display = "none";
	}, 500);
}

function openLink(url) {
	window.location.href = url;
}

async function refreshRowsAfterTagChange(selectedIds) {
	if (!selectedIds.length) return;

	const updatedRows = await window.redirect.$data_fetch_by_ids(selectedIds);

	for (const updated of updatedRows) {
		const i1 = allImageRows.findIndex(r => r.id === updated.id);
		if (i1 !== -1) allImageRows[i1] = updated;

		const i2 = filteredImageRows.findIndex(r => r.id === updated.id);
		if (i2 !== -1) filteredImageRows[i2] = updated;
	}

	updateTagListDisplay();
}

async function refreshSelectedFromDB() {
	const selected = JSON.parse(localStorage.getItem("current_selection") || "[]");
	if (selected.length === 0) return;

	const updatedRows = await window.redirect.$data_fetch_by_ids(selected);

	for (const updated of updatedRows) {
		const i1 = allImageRows.findIndex(r => r.id === updated.id);
		if (i1 !== -1) allImageRows[i1] = updated;

		const i2 = filteredImageRows.findIndex(r => r.id === updated.id);
		if (i2 !== -1) filteredImageRows[i2] = updated;
	}

	refreshSelectedRows();
	updateTagListDisplay();
}

function refreshSelectedRows() {
	const selected = JSON.parse(localStorage.getItem("current_selection") || "[]");
	if (selected.length === 0) return;

	for (const id of selected) {
		const row =
			filteredImageRows.find(r => r.id === id) ||
			allImageRows.find(r => r.id === id);

		if (!row) continue;

		const galleryItem = document.querySelector(`img[data-file-id="${id}"]`)?.closest(".gallery-item");
		if (!galleryItem) continue;

		const PRIORITY_ORDER = ["c$", "h$", "a$", "g$", "s$"];
		const colors = {
			"c$": "tag_c", "h$": "tag_h", "a$": "tag_a", "g$": "tag_g", "s$": "tag_s"
		};
		const tagData = (row.raw_tag || "").split(",").map(t => t.trim()).filter(Boolean);
		let tagHTML = "";

		PRIORITY_ORDER.forEach(prefix => {
			tagData.filter(tag => tag.startsWith(prefix)).forEach(tag => {
				const clean = tag.replace(prefix, "").replace(/_/g, " ");
				tagHTML += `<code class="${colors[prefix]}">${clean}</code>`;
			});
		});

		const tagContainer = galleryItem.querySelector(".details-col0 span");
		if (tagContainer) tagContainer.innerHTML = tagHTML;
	}
}
async function handleControlEntryOnlyDEL() {
	const selectedIds = JSON.parse(localStorage.getItem("current_selection") || "[]");
	const info_search_warning = document.getElementById('info_search');
	if (!selectedIds.length) return;

	let deleteCount = 0;

	for (const id of selectedIds) {
		try {
			await window.redirect.$delete_file_by_id(id);
			const item = document.querySelector(`.gallery-item img[data-file-id="${id}"]`)?.closest('.gallery-item');
			if (item) item.remove();
			deleteCount++;
		} catch (err) {
			console.error(`[ERR] Failed to remove entry ID ${id}`, err);
		}
	}

	localStorage.removeItem("current_selection");
	updateStatusBar();

	if (deleteCount > 0) {
		info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: lightgreen;">🚮 ${deleteCount} entr${deleteCount > 1 ? "ies" : "y"} deleted from the list</span>`;
	}
}

async function handleControlPrefileDEL() {
	const selectedIds = JSON.parse(localStorage.getItem("current_selection") || "[]");
	const info_search_warning = document.getElementById('info_search');
	if (!selectedIds.length) return;

	let deleteCount = 0;

	for (const id of selectedIds) {
		try {
			const fileEntry = await window.redirect.$get_file_info_by_id(id);
			if (!fileEntry || !fileEntry.relative_path) continue;
			
			const item = document.querySelector(`.gallery-item img[data-file-id="${id}"]`)?.closest('.gallery-item');
			await new Promise(resolve => setTimeout(resolve, 300)); // brief delay before deletion
			await window.redirect.$move_to_trash(fileEntry.relative_path);
			await new Promise(resolve => setTimeout(resolve, 500)); // allow system to release handle
			await window.redirect.$delete_file_by_id(id);

			if (item) item.remove();

			deleteCount++;
			console.log(`[DEL] ID ${id} removed: ${fileEntry.relative_path}`);
		} catch (err) {
			console.error(`[ERR] Failed to delete ID ${id}`, err);
		}
	}

	localStorage.removeItem("current_selection");
	updateStatusBar();

	if (deleteCount > 0) {
		info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: tomato;">🚮 ${deleteCount} entr${deleteCount > 1 ? "ies" : "y"} deleted from the list and folder</span>`;
	}
}


window.redirect.$showMismatchWarning(({ mismatches, message_header, message_top, message_bottom, type }) => {
	const highlightIfDifferent = (oldVal, newVal) => oldVal !== newVal
		? [`<td style="background:#400">` + oldVal + `</td>`, `<td style="background:#040">` + newVal + `</td>`]
		: [`<td>` + oldVal + `</td>`, `<td>` + newVal + `</td>`];
		
	const escapePath = str => str.replace(/\\\\/g, '\\');

	const tableHTML = mismatches.map((item, i) => {
		const [nameOld, nameNew] = highlightIfDifferent(
			`${item.old.filename} [${item.old.file_format}]`,
			`${item.new.filename} [${item.new.file_format}]`
		);
		const [createdOld, createdNew] = highlightIfDifferent(
			new Date(item.old.date_created * 1000).toLocaleString(),
			new Date(item.new.date_created * 1000).toLocaleString()
		);
		const [modifiedOld, modifiedNew] = highlightIfDifferent(
			new Date(item.old.date_modified * 1000).toLocaleString(),
			new Date(item.new.date_modified * 1000).toLocaleString()
		);
		const [md5Old, md5New] = highlightIfDifferent(item.old.md5, item.new.md5);
		const [dimOld, dimNew] = highlightIfDifferent(
			`${item.old.width} x ${item.old.height} px`,
			`${item.new.width} x ${item.new.height} px`
		);
		const [sizeOld, sizeNew] = highlightIfDifferent(
			(item.old.file_size / 1024).toFixed(1) + " KB",
			(item.new.file_size / 1024).toFixed(1) + " KB"
		);
		const [relOld, relNew] = highlightIfDifferent(
			(item.old.relative_path),
			escapePath(item.new.relative_path)
		);
		const [fullOld, fullNew] = highlightIfDifferent(item.old.full_path, item.new.full_path);
		
		return `
		<table border="1" style="width:100%; margin-bottom: 1em; font-family: monospace;">
			<tr><th colspan="2">Mismatch #${i + 1} - ${item.id}</th></tr>
			<tr>${nameOld}${nameNew}</tr>
			<tr>${createdOld}${createdNew}</tr>
			<tr>${modifiedOld}${modifiedNew}</tr>
			<tr>${md5Old}${md5New}</tr>
			<tr>${dimOld}${dimNew}</tr>
			<tr>${sizeOld}${sizeNew}</tr>
			<tr>${relOld}${relNew}</tr>
			<tr>${fullOld}${fullNew}</tr>
		</table>`;
	}).join("");

	showWarning({
		message_header,
		message: message_top,
		message_bottom,
		nextAction: "resolveMismatchProceed",
		message_color: "rgba(169, 0, 0, 0.6)",
		mismatchTable: tableHTML
	});

	const proceedBtn = document.querySelector('[data-action="resolveMismatchProceed"]');
	if (proceedBtn) {
		proceedBtn.onclick = () => {
			const ids = mismatches.map(m => m.id);
			window.redirect.$applyMismatchResolve("replace", ids);
			closeWarning();
			loadTableData?.();
		};
	}
	
	const importAllBtn = document.querySelector("#warn_importAll");
	if (importAllBtn) {
		importAllBtn.onclick = () => {
			const ids = mismatches.map(m => m.id);
			window.redirect.$applyMismatchResolve("importAll", ids);
			closeWarning();
			loadTableData?.();
		};
	}

	document.getElementById("warn_cancel").onclick = () => {
		window.redirect.$applyMismatchResolve("skip", mismatches.map(m => m.id));
		closeWarning();
	};
});

function ImageCompare() {
    const selection = JSON.parse(localStorage.getItem("current_selection") || "[]");
	const info_search_warning = document.getElementById('info_search');
	const basePath = window.thumbs_path.thumbnailsBasePath;

    if (selection.length !== 2) {
        info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: #F7374F;">You need to select 2 images first to start comparing</span>`;
        return;
    }

    const [idA, idB] = selection;

    const sourceData = filteredImageRows.length ? filteredImageRows : allImageRows;
    const imageA = sourceData.find(img => img.id === idA);
    const imageB = sourceData.find(img => img.id === idB);

    if (!imageA || !imageB) {
		info_search_warning.innerHTML = `<span class="alert" style="text-align:center; padding: 2em; color: #F7374F;">Selected Images is not Found</span>`;
        return;
    }

    const imageAPath = `file://${basePath}/${imageA.thumb}/${imageA.md5}.webp`;
    const imageBPath = `file://${basePath}/${imageA.thumb}/${imageB.md5}.webp`;

    const imageComparator = document.getElementById("imageComparator");
    imageComparator.innerHTML = "";

    const comparatorWrapper = document.createElement('div');
    comparatorWrapper.id = 'comparator-wrapper';
    comparatorWrapper.style.position = 'relative';
    comparatorWrapper.style.width = '100%';
    comparatorWrapper.style.height = '100%';
    comparatorWrapper.style.overflow = 'hidden';

    const imgB = document.createElement('img');
    imgB.src = imageBPath;
    imgB.style.width = '100%';
    imgB.style.height = '100%';
    imgB.style.objectFit = 'contain';
    imgB.style.position = 'absolute';
    imgB.style.top = '0';
    imgB.style.left = '0';

    const imgA = document.createElement('img');
    imgA.src = imageAPath;
    imgA.style.width = '100%';
    imgA.style.height = '100%';
    imgA.style.objectFit = 'contain';
    imgA.style.position = 'absolute';
    imgA.style.top = '0';
    imgA.style.left = '0';
    imgA.style.clipPath = 'inset(0 50% 0 0)';

    const revealLine = document.createElement('div');
    revealLine.id = 'reveal-line';
    revealLine.style.position = 'absolute';
    revealLine.style.top = '0';
    revealLine.style.bottom = '0';
    revealLine.style.width = '1px';
    revealLine.style.background = '#0075e2';
    revealLine.style.left = '50%';
    revealLine.style.cursor = 'ew-resize';
    revealLine.style.zIndex = '5';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = '50';
    slider.style.position = 'absolute';
    slider.style.top = '10px';
    slider.style.left = '50%';
    slider.style.transform = 'translateX(-50%)';
    slider.style.zIndex = '10';
    slider.style.width = '300px';

    slider.addEventListener('input', () => {
        const percent = slider.value;
        imgA.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
        revealLine.style.left = `${percent}%`;
    });

    let isDragging = false;

    revealLine.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const rect = comparatorWrapper.getBoundingClientRect();
        let offsetX = e.clientX - rect.left;
        let percent = (offsetX / rect.width) * 100;

        percent = Math.max(0, Math.min(100, percent));

        imgA.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
        revealLine.style.left = `${percent}%`;
        slider.value = percent;
    });

    comparatorWrapper.appendChild(imgB);
    comparatorWrapper.appendChild(imgA);
    comparatorWrapper.appendChild(revealLine);
    comparatorWrapper.appendChild(slider);
    imageComparator.appendChild(comparatorWrapper);

    document.getElementById("MainComparator").style.display = "block";
    document.getElementById("MainViewer").style.display = "none";
}
