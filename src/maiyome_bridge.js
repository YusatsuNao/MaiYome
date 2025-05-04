const { contextBridge, ipcRenderer, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const sqlite3 = require("sqlite3").verbose();
const corePATH = process.argv.find(arg => arg.startsWith('--corePath=')).replace('--corePath=', '');

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // USER CONFIG
const userCFG = path.join(corePATH, "userdata/config/user_config.json");
const config = JSON.parse(fs.readFileSync(userCFG, "utf-8"));

let userConfig = {};
let translations = {};
let language = 'en-US'; // Default Language
let cfgUpdateTimers = {};

if (fs.existsSync(userCFG)) {
	try {
		userConfig = JSON.parse(fs.readFileSync(userCFG, "utf-8"));
		if (userConfig.language) language = userConfig.language;
	} catch (e) {
		console.error("Failed to read user_config.json", e);
	}
}

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // Thumbs Path
const default_tag_var = config.default_filter;
const rawThumbPath = config.thumbnail_path;
const thumbnailsBasePath = path.isAbsolute(rawThumbPath)
  ? rawThumbPath
  : path.join(corePATH, rawThumbPath);

contextBridge.exposeInMainWorld("thumbs_path", {
  thumbnailsBasePath: thumbnailsBasePath
});

contextBridge.exposeInMainWorld("default_tag", {
	def_tag: default_tag_var
});

contextBridge.exposeInMainWorld("userSettings", {
	getConfig: () => userConfig
});


//	    _     ____   ____       _   _  _____     _     ____   _____  ____  
//	   / \   |  _ \ |  _ \     | | | || ____|   / \   |  _ \ | ____||  _ \ 
//	  / _ \  | |_) || |_) |    | |_| ||  _|    / _ \  | | | ||  _|  | |_) |
//	 / ___ \ |  __/ |  __/     |  _  || |___  / ___ \ | |_| || |___ |  _ < 
//	/_/   \_\|_|    |_|        |_| |_||_____|/_/   \_\|____/ |_____||_| \_|
//	
window.addEventListener('DOMContentLoaded', () => {
	const isAppPage = window.location.pathname.endsWith('app.html');
	
	const titleBar = document.createElement('div');
	titleBar.className = 'title-bar';

	let titleContent = `
		<div class="title-icon" onclick="openLink('app.html')"></div>
		<div class="title-txt" onclick="openLink('app.html')">MaiYome</div>
		<div class="title-btn">
			<button id="minimize"><span></span></button>
			<button id="maximize"><span></span></button>
			<button id="close"><span></span></button>
		</div>
	`;

	if (isAppPage) {
		titleContent += `
		<!-- ELEMENT B STARTS HERE -->
		<div class="topbar" id="menuArea">
			<div class="hamburger" id="menuToggle"><span></span></div>
			<div class="menu-container" id="menuItems">
				<div class="menu-item" id="ise_menu_import">Manage
					<div class="submenu">
						<button class="nav_button nav_header_title control_load" id="controlImport" data-action="controlImport">
							<span class="nav_icon"></span>
							<a class="nav_text" data-i18n="10">Import Selection</a>
						</button>
						<button class="nav_button nav_header_title control_loadAll" id="controlImportAll" data-action="controlImportAll">
							<span class="nav_icon"></span>
							<a class="nav_text" data-i18n="11">Import All</a>
						</button>
						<button class="nav_button nav_header_title control_loadRefresh" id="controlImportRefresh" data-action="controlImportRefresh">
							<span class="nav_icon"></span>
							<a class="nav_text" data-i18n="13">Import Folder Refresh</a>
						</button>
						<button class="nav_button nav_header_title control_verify" id="controlVerify" data-action="controlVerifyPATH">
							<span class="nav_icon"></span>
							<a class="nav_text">Verify Image Existence</a>
						</button>
						<span class="nav_divider"></span>
						<button class="nav_button nav_header_title control_tag" id="controlTAG" data-action="controlTAG">
							<span class="nav_icon"></span>
							<a class="nav_text">TAG Database</a>
							</button>
						<span class="nav_divider"></span>
						<button class="nav_button nav_header_title control_duplicate" id="controlVerifyDUPLICATE" data-action="controlVerifyDUPLICATE">
							<span class="nav_icon"></span><a class="nav_text">GENERATE Fingerprint & Duplicates</a>
						</button>
						<button class="nav_button nav_header_title control_duplicateR" id="controlResetDUPLICATE" data-action="controlResetDUPLICATE">
							<span class="nav_icon"></span><a class="nav_text">RESET Fingerprint & Duplicate</a>
						</button>
						<button class="nav_button nav_header_title control_entries" id="controlPreEntryDEL" data-action="controlPreEntryDEL">
							<span class="nav_icon"></span>
							<a class="nav_text">Remove Entry</a>
						</button>
						<button class="nav_button nav_header_title control_fileDEL" id="controlPreFileDEL" data-action="controlPreFileDEL">
							<span class="nav_icon"></span>
							<a class="nav_text">Remove File</a>
						</button>
					</div>
				</div>
				<div class="menu-item" id="ise_menu_export">Export
					<div class="submenu">
						<button class="nav_button nav_header_title control_backup" id="controlBackup" data-action="backup">
							<span class="nav_icon"></span>
							<a class="nav_text">Backup Database</a>
						</button>
						<button class="nav_button nav_header_title control_exportJ" id="controlPreTAGtoJSON" data-action="exportTAGtoJSON">
							<span class="nav_icon"></span>
							<a class="nav_text">Export ALL TAG to JSON FILE</a>
						</button>
						<button class="nav_button nav_header_title control_exportC disabled" id="controlPreExport" data-action="exportPreClean" disabled>
							<span class="nav_icon"></span>
							<a class="nav_text">Export CLEAN to FILE</a>
						</button>
						<button class="nav_button nav_header_title control_exportR disabled" id="controlPreExportR" data-action="exportPreRAW" disabled>
							<span class="nav_icon"></span>
							<a class="nav_text">Export RAW to FILE</a>
						</button>
						<button class="nav_button nav_header_title control_exportCS disabled" id="controlPreExportCS" data-action="exportPreCleanSelection" disabled>
							<span class="nav_icon"></span>
							<a class="nav_text">Export CLEAN to FILE [ Selection ]</a>
						</button>
						<button class="nav_button nav_header_title control_exportRS disabled" id="controlPreExportRS" data-action="exportPreRAWSelection" disabled>
							<span class="nav_icon"></span>
							<a class="nav_text">Export RAW to FILE [ Selection ]</a>
						</button>
					</div>
				</div>
				<div class="menu-item" id="ise_menu_view">View
					<div class="submenu">
						<button class="nav_button nav_header_title control_view_a" id="verticalView" data-action="vertical">
							<span class="nav_icon"></span>
							<a class="nav_text">Masonry Vertical</a>
						</button>
						<button class="nav_button nav_header_title control_view_b" id="horizontalView" data-action="horizontal">
							<span class="nav_icon"></span>
							<a class="nav_text">Masonry Horizontal</a>
						</button>
						<button class="nav_button nav_header_title control_view_c" id="gridView" data-action="grid">
							<span class="nav_icon"></span>
							<a class="nav_text">Grid</a>
						</button>
						<button class="nav_button nav_header_title control_view_d" id="detailsView" data-action="details">
							<span class="nav_icon"></span>
							<a class="nav_text">Details</a>
						</button>
					</div>
				</div>
				<div class="menu-item" id="ise_menu_sorting">Sorting
					<div class="submenu">
						<button class="nav_button nav_header_title control_sort_a" id="sortAscBtn" data-action="sortAscBtn">
							<span class="nav_icon"></span>
							<a class="nav_text">A-Z Name</a>
						</button>
						<button class="nav_button nav_header_title control_sort_z" id="sortDescBtn" data-action="sortDescBtn">
							<span class="nav_icon"></span>
							<a class="nav_text">Z-A Name</a>
						</button>
						<button class="nav_button nav_header_title control_sort_a" id="sortAscDateCreatedBtn" data-action="sortAscDateCreatedBtn">
							<span class="nav_icon"></span>
							<a class="nav_text">ASC Created</a>
						</button>
						<button class="nav_button nav_header_title control_sort_z" id="sortDescDateCreatedBtn" data-action="sortDescDateCreatedBtn">
							<span class="nav_icon"></span>
							<a class="nav_text">DESC Creatod</a>
						</button>
						<button class="nav_button nav_header_title control_sort_a" id="sortAscDateModifiedBtn" data-action="sortAscDateModifiedBtn">
							<span class="nav_icon"></span>
							<a class="nav_text">ASC Modified</a>
						</button>
						<button class="nav_button nav_header_title control_sort_z" id="sortDescDateModifiedBtn" data-action="sortDescDateModifiedBtn">
							<span class="nav_icon"></span>
							<a class="nav_text">DESC Modified</a>
						</button>
						<button class="nav_button nav_header_title control_sort_a" id="sortAscDateAddedBtn" data-action="sortAscDateAddedBtn">
							<span class="nav_icon"></span>
							<a class="nav_text">ASC Added</a>
						</button>
						<button class="nav_button nav_header_title control_sort_z" id="sortDescDateAddedBtn" data-action="sortDescDateAddedBtn">
							<span class="nav_icon"></span>
							<a class="nav_text">DESC Added</a>
						</button>
						<button class="nav_button nav_header_title control_sort_r" id="sortRandBtn" data-action="sortRandBtn">
							<span class="nav_icon"></span>
							<a class="nav_text">Random</a>
						</button>
					</div>
				</div>
				<div class="menu-item" id="ise_menu_tools">Tools
					<div class="submenu">
						<button class="nav_button nav_header_title control_reload" data-action="reload">
							<span class="nav_icon"></span>
						<a class="nav_text">Reload</a></button>
						<button class="nav_button nav_header_title control_freload" data-action="forceReload">
							<span class="nav_icon"></span>
							<a class="nav_text">Force Reload</a>
						</button>
						<button class="nav_button nav_header_title control_devtools" data-action="toggleDevTools">
							<span class="nav_icon"></span>
							<a class="nav_text">Toggle Developer Tools</a>
						</button>
						<button class="nav_button nav_header_title control_zoom" data-action="actualSize">
							<span class="nav_icon"></span>
							<a class="nav_text">Actual Size</a>
						</button>
						<button class="nav_button nav_header_title control_zoomIn" data-action="zoomIn">
							<span class="nav_icon"></span>
							<a class="nav_text">Zoom In</a>
						</button>
						<button class="nav_button nav_header_title control_zoomOut" data-action="zoomOut">
							<span class="nav_icon"></span>
							<a class="nav_text">Zoom Out</a>
						</button>
						<button class="nav_button nav_header_title control_fullscreen" data-action="toggleFullScreen">
							<span class="nav_icon"></span>
							<a class="nav_text">Toggle Full Screen</a>
						</button>
						<span class="nav_divider"></span>
						<button class="nav_button nav_header_title control_json" id="controlPreJson" data-action="controlPreJson">
							<span class="nav_icon"></span>
							<a class="nav_text">CONFIGURATION</a>
						</button>
						<button class="nav_button nav_header_title control_reset" id="controlPreReset" data-action="controlPreReset">
							<span class="nav_icon"></span>
							<a class="nav_text">RESET Database</a>
						</button>
					</div>
				</div>
				<div class="menu-item" id="ise_menu_help">Help
					<div class="submenu">
						<button class="nav_button nav_header_title control_page external_link" data-action="officialPage" data-url="https://yusatsunao.github.io/maiyome">						
							<span class="nav_icon"></span>
							<a class="nav_text">Official Page</a>
						</button>
						<button class="nav_button nav_header_title control_help disabled" data-action="Help" disabled>
							<span class="nav_icon"></span>
							<a class="nav_text">Help</a>
						</button>
						<button class="nav_button nav_header_title control_about" data-action="About">
							<span class="nav_icon"></span>
							<a class="nav_text">About</a>
						</button>
					</div>
				</div>
			</div>
		</div>
		<!-- ELEMENT B ENDS HERE -->
		`;
	} else {
		titleContent += `
		<!-- ELEMENT A STARTS HERE -->		
		<div class="topbar" id="menuArea">
			<div class="hamburger active disabled" id="menuToggle"><span></span></div>
			<div class="menu-container active" id="menuItems">
				<div class="menu-item" id="ise_menu_home" onclick="openLink('app.html')">Home</div>
			</div>
		</div>
		<!-- ELEMENT A ENDS HERE -->
		`;
	}

	titleBar.innerHTML = titleContent;
	document.body.insertBefore(titleBar, document.body.firstChild);

	document.getElementById('minimize').onclick = () => ipcRenderer.send('window-minimize');
	document.getElementById('maximize').onclick = () => ipcRenderer.send('window-maximize');
	document.getElementById('close').onclick = () => ipcRenderer.send('window-close');
	
	const maximizeBtn = document.getElementById('maximize');
	maximizeBtn.onclick = () => ipcRenderer.send('window-maximize');
	
	ipcRenderer.on('window-is-maximized', () => {
		maximizeBtn.classList.add('active');
	});
	
	ipcRenderer.on('window-is-restored', () => {
		maximizeBtn.classList.remove('active');
	});
	
	const toggle = document.getElementById('menuToggle');
	const menuItems = document.getElementById('menuItems');
	const nav_menu_icon = document.querySelector('.hamburger');

	toggle.addEventListener('click', () => {
		menuItems.classList.toggle('active');
		nav_menu_icon.classList.toggle('active');
	});

	function sendAction(action) {
		ipcRenderer.send('menu-action', action);
	}

	menuItems.querySelectorAll('[data-action]').forEach(item => {
		item.addEventListener('click', () => {
			sendAction(item.getAttribute('data-action'));
		});
	});

	document.querySelectorAll('.external_link').forEach(elem => {
		elem.addEventListener('click', (event) => {
			event.preventDefault();
			const url = elem.getAttribute('data-url');
			if (url) {
				shell.openExternal(url);
			}
		});
	});
});


//	    _      ____    ___        ____      _      _       _     
//	   / \    |  _ \  |_ _|      / ___|    / \    | |     | |    
//	  / _ \   | |_) |  | |      | |       / _ \   | |     | |    
//	 / ___ \  |  __/   | |      | |___   / ___ \  | |___  | |___ 
//	/_/   \_\ |_|     |___|      \____| /_/   \_\ |_____| |_____|
//															  
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
contextBridge.exposeInMainWorld('redirect', {
	//	 ____   ____      ____     _     _      _     
	//	|  _ \ | __ )    / ___|   / \   | |    | |    
	//	| | | ||  _ \   | |      / _ \  | |    | |    
	//	| |_| || |_) |  | |___  / ___ \ | |___ | |___ 
	//	|____/ |____/    \____|/_/   \_\|_____||_____|
	//
	// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
	$db_ready: (callback) =>
		ipcRenderer.on('folder-loaded', callback),
	$data_import: () =>
		ipcRenderer.invoke('load-folder'),
	$data_importAll: () =>
		ipcRenderer.invoke('load-folder-all'),
	$data_importFolder: () => ipcRenderer.invoke('controlImportRefresh'),
	$db_PATHverification: async () => {
		const missingList = await ipcRenderer.invoke('verify-file-paths');
		localStorage.setItem("file_not_found", missingList.length);
		return missingList;
	},
	$db_DUPLICATEverification: () => ipcRenderer.invoke("generateFingerprints"),
	$db_DUPLICATEreset: () => ipcRenderer.invoke("resetfingerprint"),


	$data_fetch: (sortBy, order) =>
		ipcRenderer.invoke('get-image-data', sortBy, order),	
	$dataTAG_fetch: () => {
		const tagDir = path.join(corePATH, 'userdata','tag');
		let allTags = [];

		if (fs.existsSync(tagDir)) {
			const files = fs.readdirSync(tagDir);
			files.forEach(file => {
				if (file.endsWith('.json')) {
					const fullPath = path.join(tagDir, file);
					try {
						const raw = fs.readFileSync(fullPath, 'utf-8');
						const parsed = JSON.parse(raw);

						if (Array.isArray(parsed)) {
							allTags.push(...parsed);
						} else if (typeof parsed === 'object') {
							allTags.push(...Object.values(parsed));
						}
					} catch (err) {
						console.warn(`Failed to load tag file: ${file}`, err);
					}
				}
			});
		}

		return [...new Set(allTags)];
	},
	$db_reset: () =>
		ipcRenderer.invoke('reset-data'),

	
	exportProcessTAGtoJSON: () =>
		ipcRenderer.invoke('export_TAGtoJSON'),
	exportProcessClean: () =>
		ipcRenderer.invoke('exportClean'),
	exportProcessRAW: () =>
		ipcRenderer.invoke('exportRAW'),
	exportProcessCleanSelection: () =>
		ipcRenderer.invoke('exportCleanS'),
	exportProcessRAWSelection: () =>
		ipcRenderer.invoke('exportRAWS'),




//	 ____ __   __ ____      ____     _     _      _     
//	/ ___|\ \ / // ___|    / ___|   / \   | |    | |    
//	\___ \ \ V / \___ \   | |      / _ \  | |    | |    
//	 ___) | | |   ___) |  | |___  / ___ \ | |___ | |___ 
//	|____/  |_|  |____/    \____|/_/   \_\|_____||_____|
//
// connector for system call between renderer and the API
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
	menuAction: (action) =>
		ipcRenderer.send('menu-action', action),
	$send_console: (msg) =>
		ipcRenderer.send('log-to-terminal', msg),	
	$receive_filemissing: (callback) =>
		ipcRenderer.on('file-missing-count', (event, count) => {
			localStorage.setItem("file_not_found", count); callback(count);
		}),
	$receive_dataduplicate: (callback) =>
		ipcRenderer.on('data-duplicate-count', (event, count) => {
			localStorage.setItem("data_duplicate_found", count); callback(count);
		}),
	$receive_ExportProgress: (callback) =>
		ipcRenderer.on('export-progress', (_, data) => callback(data)),
	$send_redirectPAGE: (pageName) => 
		ipcRenderer.send('open-page', pageName),
	$send_redirectFILE: (filePath) =>
		{ ipcRenderer.send('open-file', filePath); },
	$receive_corePATH: () => corePATH,
	SET_USER_CFG_SINGLE: (key, value) => {
		if (cfgUpdateTimers[key]) {
			clearTimeout(cfgUpdateTimers[key]);
		}
		cfgUpdateTimers[key] = setTimeout(() => {
			ipcRenderer.send('ACC_USER_CFG_SINGLE', { key, value });
		}, 100);
	},
	SET_USER_CFG_MULTI: (updates) => {
		ipcRenderer.send('ACC_USER_CFG_MULTI', updates);
	},
	$showMismatchWarning: (callback) => ipcRenderer.on('show-mismatch-warning', (event, data) => callback(data)),
	$applyMismatchResolve: (action, ids) => ipcRenderer.send('apply-mismatch-decision', { action, ids }),





//	 _____   _     ____     _____  ____  ___  _____  ___   ____  
//	|_   _| / \   / ___|   | ____||  _ \|_ _||_   _|/ _ \ |  _ \ 
//	  | |  / _ \ | |  _    |  _|  | | | || |   | | | | | || |_) |
//	  | | / ___ \| |_| |   | |___ | |_| || |   | | | |_| ||  _ < 
//	  |_|/_/   \_\\____|   |_____||____/|___|  |_|  \___/ |_| \_\
//
// this is the connector for tag editor and updater
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
	TAG_replace: (ids, raw_tag, final_tag) =>
		ipcRenderer.invoke("apply-tags", { ids, raw_tag, final_tag }),
	TAG_add: (ids, raw_tag, final_tag) =>
		ipcRenderer.invoke("add-tags", { ids, raw_tag, final_tag }),
	TAG_remove: (ids, raw_tag, final_tag) =>
		ipcRenderer.invoke("remove-tags", { ids, raw_tag, final_tag }),
	TAG_reset: (ids) =>
		ipcRenderer.invoke("clear-tags", ids),

	$get_rows_by_ids: (ids) => ipcRenderer.invoke("get-rows-by-ids", ids),
	$single_row_fetch: (id) => ipcRenderer.invoke("get-single-row", id),
	$data_fetch_by_ids: (idArray) => ipcRenderer.invoke('data_fetch_by_ids', idArray),

	$get_file_info_by_id: (id) => ipcRenderer.invoke('get-file-info', id),
	$move_to_trash: (filePath) => ipcRenderer.invoke('send-to-trash', filePath),
	$delete_file_by_id: (id) => ipcRenderer.invoke('delete-from-db', id),
	

});

//   _          _      _   _    ____   _   _      _       ____   _____ 
//	| |        / \    | \ | |  / ___| | | | |    / \     / ___| | ____|
//	| |       / _ \   |  \| | | |  _  | | | |   / _ \   | |  _  |  _|  
//	| |___   / ___ \  | |\  | | |_| | | |_| |  / ___ \  | |_| | | |___ 
//	|_____| /_/   \_\ |_| \_|  \____|  \___/  /_/   \_\  \____| |_____|
//  																   
// if JSON is not set to en-US then LOAD the stated {name} of the language to replace the text
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
if (language.toLowerCase() !== 'en-us') {
	const langPath = path.join(corePATH, `module/module_app_maiyome/lang/${language}.json`);
	if (fs.existsSync(langPath)) {
		try {
			const langData = fs.readFileSync(langPath, 'utf-8');
			translations = JSON.parse(langData);
		} catch (e) {
			console.error("Failed to load language file:", e);
		}
	}
}

contextBridge.exposeInMainWorld('i18n', {
	get: (id) => translations[id] || null,
	lang: language
});

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
// Temporary ContextBridge API
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
contextBridge.exposeInMainWorld('api', {
    getJsonFiles: () => ipcRenderer.invoke('get-json-files'),
    readJsonFile: (filename) => ipcRenderer.invoke('read-json-file', filename),
    appendTags: (filename, newTags) => ipcRenderer.invoke('append-tags', { filename, newTags }),
    deleteTags: (filename, tagsToDelete) => ipcRenderer.invoke('delete-tags', { filename, tagsToDelete })
});