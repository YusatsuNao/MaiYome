const { app, BrowserWindow, ipcMain, Menu, MenuItem, Tray, nativeImage, session, dialog, globalShortcut, Notification, shell } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const { ExiftoolProcess } = require('node-exiftool');
let ep = null; // will be created when needed
// const ep = new ExiftoolProcess(path.join(__dirname, 'module/exiftool/exiftool.exe'));
const { Worker } = require("worker_threads");


// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // Module Check
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (path) {
  console.log(">> Requiring:", path);
  return originalRequire.apply(this, arguments);
};
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // Module Check


const isPackaged = app.isPackaged;
const corePATH = isPackaged
  ? path.dirname(process.execPath)	// Build Phase
  : __dirname;						// Development Phase

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // USER CONFIGURATION INITIALIZATION
const ise_userData = path.join(corePATH, "userdata");
const ise_booruDB = path.join(ise_userData, "main.db");
const ise_userCFG = path.join(ise_userData, "config", "user_config.json");
const ise_defTAG = path.join(ise_userData, "tag", "default.json");
const ise_backupDB = path.join(ise_userData, "backup_db");
const ise_thumb = path.join(ise_userData, ".thumbnails");

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // USER CONFIG
const userCFG_default = {
	version: "MaiYome v1.0",
	language: "en-US",
	db_serve: "LOCAL",
	db_name: "userdata/main.db",
	cloud_path: "D:\\CLOUD",
	thumbnail_path: "userdata/.thumbnails",
	fingerprint_hash: "64",
	duplicate_sensitivity: "0.995",
	default_booru_search: "",
	default_filter: "",
	gallery_type: "vert	ical",
	gallery_item_show__type: "",
	gallery_item_show__sorter: "file_name",
	gallery_item_show__order: "asc",
	gallery_item_show__default: ""
};


// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // USER CONFIG
function isephyr_userCFG_init() {

	if (!fs.existsSync(ise_userData)) fs.mkdirSync(ise_userData, { recursive: true });
	if (!fs.existsSync(path.dirname(ise_userCFG))) fs.mkdirSync(path.dirname(ise_userCFG), { recursive: true });
	if (!fs.existsSync(path.dirname(ise_defTAG))) fs.mkdirSync(path.dirname(ise_defTAG), { recursive: true });
	if (!fs.existsSync(ise_backupDB)) fs.mkdirSync(ise_backupDB);
	if (!fs.existsSync(ise_thumb)) fs.mkdirSync(ise_thumb);
  
	if (!fs.existsSync(ise_booruDB)) {
	  const booru_db = new sqlite3.Database(ise_booruDB);
	  booru_db.close();
	}
  
	if (!fs.existsSync(ise_userCFG)) {
		fs.writeFileSync(ise_userCFG, JSON.stringify(userCFG_default, null, 2), "utf-8");
	  }

	if (!fs.existsSync(ise_defTAG)) {
		const userTAG_default = [];
		fs.writeFileSync(ise_defTAG, JSON.stringify(userTAG_default, null, 2), "utf-8");
	}	
}

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // INITIALIZATION
isephyr_userCFG_init();
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // INITIALIZATION

const userCFG = path.join(corePATH, "userdata/config/user_config.json");
const config = JSON.parse(fs.readFileSync(userCFG, "utf-8"));

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // DATABASE VERIFICATION
function GET_BOORU_DATABASE() {
	const ISE_DB_CFG = path.join(corePATH, 'userdata/config/user_config.json');
	const ISE_DB_Default = JSON.parse(fs.readFileSync(ise_userCFG, 'utf-8')).db_name;

	try {
		if (fs.existsSync(ISE_DB_CFG)) {
			const configData = JSON.parse(fs.readFileSync(ISE_DB_CFG, 'utf-8'));
			const { database_type, cloud_path, db_name } = configData;

			if (database_type === 'CLOUD' && cloud_path) {
				return cloud_path;
			}
		}
	} catch (error) {
		console.error('Error reading or parsing database configuration:', error);
	}

	return ISE_DB_Default;
}

const maiyome_db = GET_BOORU_DATABASE();
const booru_db = new sqlite3.Database(maiyome_db);

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // THUMBNAILS VERIFICATION
const rawThumbPath = JSON.parse(fs.readFileSync(ise_userCFG, 'utf-8')).thumbnail_path;
const thumbnailsBasePath = path.isAbsolute(rawThumbPath)
	? rawThumbPath
	: path.join(corePATH, rawThumbPath);

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // DECLARATION
let ise_main;
let currentZoom = 1;
let pendingMismatches = [];
app.setName("com.yusatsunao.maiyome");
app.setAppUserModelId("MaiYome");
app.commandLine.appendSwitch('disable-features', 'AutofillServerCommunication');

let tempSimilarity = parseFloat(config.duplicate_sensitivity) || 1.0;
let tempHash = parseFloat(config.fingerprint_hash) || 64;
if (tempSimilarity > 1.0) tempSimilarity = 1.0;
if (tempSimilarity < 0.9) tempSimilarity = 0.9;
const desiredSimilarity = tempSimilarity;
const HASH_SIZE = tempHash;
const MAX_HAMMING_DIST = Math.round(HASH_SIZE * HASH_SIZE * (1 - desiredSimilarity));
// const MAX_HAMMING_DIST = 0; // 95%+ similarity = max 3 bit differences


// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // BOORU_DB INITIALIZATION
function booru_db_init() {
	booru_db.run(`
		CREATE TABLE IF NOT EXISTS imageDB (
		id TEXT PRIMARY KEY,
		filename TEXT,
		file_format TEXT,
		width INTEGER,
		height INTEGER,
		md5 TEXT,
		date_created INTEGER,
		date_modified INTEGER,
		file_size INTEGER,
		date_imported INTEGER,
		bit_depth INTEGER,
		thumb TEXT,
		relative_path TEXT,
		full_path TEXT,
		final_tag TEXT,
		raw_tag TEXT,
		warnings TEXT,
		fingerprint TEXT
		);
	`);
}


// ――――― // ――――― // ――――― // ――――― // ――――― // ――――― // ――――― // ――――― // ――――― // ――――― // ――――― // ――――― //
//  PRIMARY WINDOW  // ―――――――――――――――――――― //  PRIMARY WINDOW  // ―――――――――――――――――――― //  PRIMARY WINDOW  //
// ――――― // ――――― // ――――― // ――――― // ――――― // ――――― // ――――― // ――――― // ――――― // ――――― // ――――― // ――――― //
function isephyr_win_main() {
	//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//
	// ――――――――――――――― \\  MAIN WINDOW  // ――――――――――――――― \\  MAIN WINDOW  // ――――――――――――――― //
	//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//
	ise_main = new BrowserWindow({
		width: 1280,
		height: 720,
		backgroundColor: '#222222',
		icon: __dirname + '/module/module_app_maiyome/resources/maiyome.ico',
		webPreferences: {
			nodeIntegration: true,
			preload: __dirname + '/maiyome_bridge.js',
			additionalArguments: [`--corePath=${corePATH}`]
		},
		autoHideMenuBar: false, // Remove the menu bar
		frame: false,
		transparent: false
	});


	ise_main.loadFile('app.html');
	ise_main.setMinimumSize(1024, 576);

	ise_main.webContents.once('did-finish-load', () => {
		validateImagePaths(booru_db, (missingList) => {
			ise_main.webContents.send('file-missing-count', missingList.length);
		});
	});
	
	ipcMain.on('window-minimize', () => ise_main.minimize());
	ipcMain.on('window-maximize', (event) => {
		const window = ise_main;
		if (window.isMaximized()) {
			window.unmaximize();
		} else {
			window.maximize();
		}
	});
	
	ise_main.on('maximize', () => {
		ise_main.webContents.send('window-is-maximized');
	});
	
	ise_main.on('unmaximize', () => {
		ise_main.webContents.send('window-is-restored');
	});
	ipcMain.on('window-close', () => ise_main.close());
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
}

//	▚▞	▛▜	▛▜
//	▞▚	▙▟	▙▟
app.on('ready', async () => {
	isephyr_win_main();
	booru_db_init();
});

//	▛▜	▛▜	▚▞
//	▙▟	▙▟	▞▚
app.on('window-all-closed', async () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
//	▛▜	▚▞	▛▜
//	▙▟	▞▚	▙▟
app.whenReady().then(() => {
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
	ipcMain.on('ACC_USER_CFG_SINGLE', (event, data) => {
		fs.readFile(userCFG, 'utf-8', (err, configData) => {
			if (err) return console.error(err);

			let config = JSON.parse(configData);
			if (config[data.key] === data.value) {
				return;
			}

			config[data.key] = data.value;
			fs.writeFile(userCFG, JSON.stringify(config, null, 2), 'utf-8', (err) => {
				if (err) return console.error(err);
				console.log(`${data.key} updated to ${JSON.stringify(data.value, null, 2)}`);
			});
		});
	});
	ipcMain.on('ACC_USER_CFG_MULTI', (event, updates) => {
		fs.readFile(userCFG, 'utf-8', (err, configData) => {
			if (err) {
				console.error(err);
				return;
			}
	
			let config = JSON.parse(configData);
	
			for (const [key, value] of Object.entries(updates)) {
				config[key] = value;
			}
	
			fs.writeFile(userCFG, JSON.stringify(config, null, 2), 'utf-8', (err) => {
				if (err) {
					console.error(err);
					return;
				}
	
				for (const [key, value] of Object.entries(updates)) {
					console.log(`${key} updated to ${JSON.stringify(value, null, 2)}`);
				}
			});
		});
	});
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
	ipcMain.on('log-to-terminal', (event, msg) => {
		console.log(`Renderer Log:\n${msg}`);
	});
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
});

//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//
// ―――――――――――――――――――――――――――――― \\  DATABASE HANDLER  // ――――――――――――――――――――――――――――――― //
//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//

ipcMain.handle('get-image-data', async (event, sortBy = 'filename', order = 'ASC') => {
	let sql;

	const allowedSortFields = ['filename', 'date_created', 'date_modified', 'date_imported', 'fingerprint'];
	const upperOrder = order.toUpperCase();
	const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'filename';

	if (upperOrder === 'RANDOM') {
		sql = `SELECT * FROM imageDB ORDER BY RANDOM()`;
	} else {
		const safeOrder = upperOrder === 'DESC' ? 'DESC' : 'ASC';
		sql = `SELECT * FROM imageDB ORDER BY ${safeSortBy} ${safeOrder}`;
	}

	return new Promise((resolve, reject) => {
		booru_db.all(sql, [], (err, rows) => {
			if (err) reject(err);
			else resolve(rows);
		});
	});
});

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
// Function to get MD5 hash
function getFileMD5(filePath) {
	const hash = crypto.createHash('md5');
	const fileBuffer = fs.readFileSync(filePath);
	hash.update(fileBuffer);
	return hash.digest('hex');
}
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
// Get image dimensions using ExifTool
async function getImageDimensions(filePath, ep) {
	try {
		const { data } = await ep.readMetadata(filePath);

		const width = data[0].ImageWidth || 0;
		const height = data[0].ImageHeight || 0;
		console.log(`Dimensions for ${filePath}: Width: ${width}, Height: ${height}`);
		return { width, height };
	} catch (error) {
		console.error('Error getting dimensions:', error);
		return { width: 0, height: 0 };
	}
}
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
// Get image bit depth using ExifTool (Debug Version)
async function getImageBitDepth(filePath, ep) {
	try {
		const { data } = await ep.readMetadata(filePath);
		const bitDepth = data[0].BitsPerSample || data[0]['BitDepth'] || data[0]['ColorDepth'] || 8;
		console.log(`Detected bit depth for ${filePath}:`, bitDepth);
		return bitDepth;
	} catch (error) {
		console.error('Error getting bit depth:', error);
		return 8;
	}
}

//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//
// ――――――――――――――――――――――――――――――― \\  CUSTOMs HANDLER  // ――――――――――――――――――――――――――――――― //
//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//

const walkDir = async (dir) => {
	let files = [];
	for (const file of await fs.readdir(dir)) {
		const fullPath = path.join(dir, file);
		const stat = await fs.stat(fullPath);
		if (stat.isDirectory()) {
			files = files.concat(await walkDir(fullPath));
		} else {
			files.push(fullPath);
		}
	}
	return files;
};

ipcMain.handle('load-folder', async (event) => {
	const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
	if (result.canceled || !result.filePaths.length) return;

	const folderPath = result.filePaths[0];
	const imageFiles = (await fs.readdir(folderPath))
		.filter(file => ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']
		.includes(path.extname(file).toLowerCase()))
		.map(file => path.join(folderPath, file));

	const mismatches = [];
	const total = imageFiles.length;
	let count = 0;
	
	ep = new ExiftoolProcess(path.join(__dirname, 'module/exiftool/exiftool.exe'));	
	try { await ep.open();
		console.log("ExifTool process opened successfully.");
	} catch (error) {
		console.error("Failed to open ExifTool process:", error);
	}

	for (const filePath of imageFiles) {
		const mismatch = await importAndVerify(filePath, ep);
		if (mismatch) mismatches.push(mismatch);

		count++;
		ise_main.webContents.send("export-progress", { type: "import", count, total });
	}

	if (mismatches.length > 0) {
		showPathMismatchDialog(mismatches);
	}

	await generateThumbnails();
	
	try { await ep.close();
		console.log("ExifTool process closed successfully.");
	} catch (error) {
		console.error("Failed to close ExifTool process:", error);
	}
	ep = null;

	await updateImportPathsFromImages(imageFiles);
	event.sender.send('folder-loaded');
});

ipcMain.handle('load-folder-all', async (event) => {
	const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
	if (result.canceled || !result.filePaths.length) return;

	const allFiles = await walkDir(result.filePaths[0]);
	const imageFiles = allFiles.filter(f =>
		['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(path.extname(f).toLowerCase())
	);

	const mismatches = [];
	const total = imageFiles.length;
	let count = 0;
	
	ep = new ExiftoolProcess(path.join(__dirname, 'module/exiftool/exiftool.exe'));
	try { await ep.open();
		console.log("ExifTool process opened successfully.");
	} catch (error) {
		console.error("Failed to open ExifTool process:", error);
	}


	for (const filePath of imageFiles) {
		const mismatch = await importAndVerify(filePath, ep);
		if (mismatch) mismatches.push(mismatch);

		count++;
		ise_main.webContents.send("export-progress", { type: "import", count, total });
	}

	if (mismatches.length > 0) {
		showPathMismatchDialog(mismatches);
	}

	await generateThumbnails();
	
	try { await ep.close();
		console.log("ExifTool process closed successfully.");
	} catch (error) {
		console.error("Failed to close ExifTool process:", error);
	}
	ep = null;
	
	await updateImportPathsFromImages(imageFiles);
	event.sender.send('folder-loaded');
});

async function updateImportPathsFromImages(imagePaths) {
	const importPath = path.join(corePATH, "userdata/config/import.json");
	let importList = [];

	if (fs.existsSync(importPath)) {
		try {
			importList = JSON.parse(fs.readFileSync(importPath, 'utf-8'));
		} catch (e) {
			console.warn("⚠ Failed to parse existing import.json, resetting.");
		}
	}

	const existingPaths = new Map(importList.map(obj => [obj.path, obj.scan]));
	const newPaths = imagePaths.map(p => path.dirname(p));
	new Set(newPaths).forEach(p => {
		if (!existingPaths.has(p)) {
			importList.push({ scan: true, path: p });
		}
	});

	const unique = [];
	const seen = new Set();
	for (const entry of importList) {
		if (!seen.has(entry.path)) {
			seen.add(entry.path);
			unique.push(entry);
		}
	}

	fs.ensureDirSync(path.dirname(importPath));
	fs.writeFileSync(importPath, JSON.stringify(unique, null, 2), 'utf-8');
}

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
ipcMain.handle('controlImportRefresh', async () => {
	const importPath = path.join(corePATH, "userdata/config/import.json");
	if (!fs.existsSync(importPath)) return;

	let paths = JSON.parse(fs.readFileSync(importPath, 'utf-8'));
	paths = paths.filter(p => p.scan);

	const allImageFiles = [];

	for (const p of paths) {
		if (!fs.existsSync(p.path)) continue;
		const files = await walkDir(p.path);
		const images = files.filter(f =>
			['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(path.extname(f).toLowerCase())
		);
		allImageFiles.push(...images);
	}

	if (allImageFiles.length === 0) return;

	ep = new ExiftoolProcess(path.join(__dirname, 'module/exiftool/exiftool.exe'));
	try { await ep.open(); } catch (err) { console.error("ExifTool open failed:", err); return; }

	const mismatches = [];
	let count = 0;
	const total = allImageFiles.length;

	for (const filePath of allImageFiles) {
		const mismatch = await importAndVerify(filePath, ep);
		if (mismatch) mismatches.push(mismatch);
		count++;
		ise_main.webContents.send("export-progress", { type: "import", count, total });
	}

	if (mismatches.length) showPathMismatchDialog(mismatches);
	await generateThumbnails();

	try { await ep.close(); } catch (err) { console.error("ExifTool close failed:", err); }
	ep = null;
});
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
ipcMain.handle('reset-data', async () => {
	booru_db.run('DELETE FROM imageDB', [], (err) => {
		if (err) console.error('Error resetting data:', err);
	});
});	

//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//
// ―――――――――――――――――――――――――――――――― \\  MENU's HANDLER  // ――――――――――――――――――――――――――――――― //
//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//=====//

ipcMain.on('menu-action', (event, action) => {
	switch (action) {
		case 'backup':
			booru_db_backup();
			break;
		case 'reload':
			ise_main.reload();
			break;
		case 'forceReload':
			ise_main.webContents.reloadIgnoringCache();
			break;
		case 'toggleDevTools':
			ise_main.webContents.toggleDevTools();
			break;
		case 'actualSize':
			currentZoom = 1;
			ise_main.webContents.setZoomFactor(currentZoom);
			break;
		case 'zoomIn':
				currentZoom = Math.min(currentZoom + 0.1, 3);
				ise_main.webContents.setZoomFactor(currentZoom);
			break;
		case 'zoomOut':
				currentZoom = Math.max(currentZoom - 0.1, 0.25);
				ise_main.webContents.setZoomFactor(currentZoom);
			break;
		case 'toggleFullScreen':
			ise_main.setFullScreen(!ise_main.isFullScreen());
			break;
		case 'about':
			ise_main.loadFile('help.html');
			break;
		case 'about':
			ise_main.loadFile('about.html');
			break;
		}
});
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
ipcMain.handle("apply-tags", async (event, { ids, raw_tag, final_tag }) => {
	const booru_db = new sqlite3.Database(maiyome_db);
	const placeholders = ids.map(() => '?').join(',');
	const sql = `UPDATE imageDB SET raw_tag = ?, final_tag = ? WHERE id IN (${placeholders})`;

	return new Promise((resolve, reject) => {
		booru_db.run(sql, [raw_tag, final_tag, ...ids], function (err) {
			if (err) {
				console.error("Failed to apply tags:", err);
				return reject(err);
			}
			resolve({ success: true, changes: this.changes });
		});
	});
});
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
ipcMain.handle("add-tags", async (event, { ids, raw_tag, final_tag }) => {
	const applied = [], skipped = [];

	const rawTags = Array.isArray(raw_tag) ? raw_tag : String(raw_tag).split(",");
	const finalTags = Array.isArray(final_tag) ? final_tag : String(final_tag).split(",");

	for (const id of ids) {
		booru_db.get("SELECT raw_tag, final_tag FROM imageDB WHERE id = ?", [id], (err, row) => {
			if (err || !row) return;

			const existingRawTags = (row.raw_tag || "").split(",").map(t => t.trim()).filter(Boolean);
			const existingFinalTags = (row.final_tag || "").split(",").map(t => t.trim()).filter(Boolean);

			const addableRawTags = rawTags.filter(t => !existingRawTags.includes(t));
			const addableFinalTags = finalTags.filter(t => !existingFinalTags.includes(t));

			if (addableRawTags.length || addableFinalTags.length) {
				const updatedRaw = [...existingRawTags, ...addableRawTags].join(",");
				const updatedFinal = [...existingFinalTags, ...addableFinalTags].join(",");

				booru_db.run("UPDATE imageDB SET raw_tag = ?, final_tag = ? WHERE id = ?", [updatedRaw, updatedFinal, id]);
				applied.push({ id, raw_tag: addableRawTags, final_tag: addableFinalTags });
			} else {
				skipped.push({ id, raw_tag: rawTags, final_tag: finalTags });
			}
		});
	}

	return { applied, skipped };
});

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
ipcMain.handle("remove-tags", async (event, { ids, raw_tag, final_tag }) => {
	const results = [];

	const rawTagsToRemove = Array.isArray(raw_tag) ? raw_tag : String(raw_tag).split(",");
	const finalTagsToRemove = Array.isArray(final_tag) ? final_tag : String(final_tag).split(",");

	const promises = ids.map(id => new Promise((resolve) => {
		booru_db.get("SELECT raw_tag, final_tag FROM imageDB WHERE id = ?", [id], (err, row) => {
			if (err || !row) return resolve(null);

			let rawCurrent = (row.raw_tag || "").split(",").map(t => t.trim()).filter(Boolean);
			let finalCurrent = (row.final_tag || "").split(",").map(t => t.trim()).filter(Boolean);

			const rawRemoved = rawTagsToRemove.filter(t => rawCurrent.includes(t));
			const finalRemoved = finalTagsToRemove.filter(t => finalCurrent.includes(t));

			rawCurrent = rawCurrent.filter(t => !rawTagsToRemove.includes(t));
			finalCurrent = finalCurrent.filter(t => !finalTagsToRemove.includes(t));

			booru_db.run("UPDATE imageDB SET raw_tag = ?, final_tag = ? WHERE id = ?", [rawCurrent.join(","), finalCurrent.join(","), id], () => {
				results.push({ id, removed_raw: rawRemoved, removed_final: finalRemoved });
				resolve(true);
			});
		});
	}));

	await Promise.all(promises);
	return results;
});
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
ipcMain.handle("clear-tags", async (event, ids) => {
	const placeholders = ids.map(() => '?').join(',');

	return new Promise((resolve, reject) => {
		booru_db.run(`UPDATE imageDB SET raw_tag = '', final_tag = '' WHERE id IN (${placeholders})`, ids, function (err) {
			if (err) {
				console.error("Failed to clear tags:", err);
				return reject(err);
			}
			resolve({ success: true, changes: this.changes });
		});
	});
});
// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ //
async function importAndVerify(filePath, ep) {
	const ext = path.extname(filePath).toLowerCase();
	const fileName = path.basename(filePath, ext);
	const fullPath = filePath.replace(/\\/g, '\\\\');
	const relativePath = filePath;
	const md5 = getFileMD5(filePath);
	const stats = await fs.statSync(filePath);
	const { width, height } = await getImageDimensions(filePath, ep);
	const bitDepth = await getImageBitDepth(filePath, ep);
	const dateCreated = Math.floor(stats.birthtimeMs / 1000);
	const dateModified = Math.floor(stats.mtimeMs / 1000);
	const fileSize = stats.size;
	const dateImported = Math.floor(Date.now() / 1000);

	const newMeta = {
		md5,
		filename: fileName,
		file_format: ext.slice(1),
		full_path: fullPath,
		relative_path: fullPath,
		width,
		height,
		bit_depth: bitDepth,
		date_created: dateCreated,
		date_modified: dateModified,
		file_size: fileSize,
		date_imported: dateImported
	};

	const existing = await new Promise((resolve) => {
		booru_db.all("SELECT * FROM imageDB WHERE md5 = ?", [md5], (err, rows) => {
			resolve(rows || []);
		});
	});

	for (const row of existing) {
		const isSame = (
			row.filename === newMeta.filename &&
			row.file_format === newMeta.file_format &&
			row.full_path === newMeta.full_path
		);

		if (!isSame) {
			return {
				id: row.id,
				old: row,
				new: newMeta
			};
		} else {
			return null;
		}
	}

	const conflict = await new Promise((resolve) => {
		booru_db.all(
			`SELECT * FROM imageDB WHERE 
				filename = ? AND file_format = ? AND full_path = ?`,
			[fileName, ext.slice(1), fullPath],
			(err, rows) => resolve(rows || [])
		);
	});

	if (conflict.length > 0) {
		return {
			id: conflict[0].id,
			old: conflict[0],
			new: newMeta
		};
	}

	const id = uuidv4();
	booru_db.run(`
		INSERT INTO imageDB (
			id, filename, file_format, width, height, md5,
			date_created, date_modified, file_size, date_imported,
			bit_depth, relative_path, full_path
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			id, newMeta.filename, newMeta.file_format, width, height, md5,
			dateCreated, dateModified, fileSize, dateImported,
			bitDepth, relativePath, fullPath
		]
	);
	console.log(`Imported: ${filePath}`);
	return null;
}



function showPathMismatchDialog(mismatches, isStrictMatch = false) {
	const detail = isStrictMatch
		? "All metadata match, only the path is different."
		: "Image content matches but name or path is different.";

	pendingMismatches = mismatches;

	ise_main.webContents.send('show-mismatch-warning', {
		type: isStrictMatch ? "strict" : "loose",
		mismatches,
		message_header: "⚠ IMPORT CONFLICT ⚠",
		message_top: "There is a mismatch detected for imported image(s).",
		message_bottom: detail
	});
}

ipcMain.on("apply-mismatch-decision", async (event, { action, ids }) => {
	if (action === "replace") {
		let updatePromises = [];

		for (const id of ids) {
			const mismatch = pendingMismatches.find(m => m.id === id);
			if (!mismatch) continue;

			const newFullPath = mismatch.new.full_path;
			const newRelativePath = path.relative(app.getPath('userData'), mismatch.new.full_path);
			const newFilename = mismatch.new.filename;
			const newFormat = mismatch.new.file_format;

			const updatePromise = new Promise((resolve) => {
				booru_db.run(
					`UPDATE imageDB SET 
						full_path = ?, 
						relative_path = ?, 
						filename = ?, 
						file_format = ? 
						WHERE id = ?`,
					[newFullPath, newRelativePath, newFilename, newFormat, id],
					(err) => {
						if (err) {
							console.error("Update error:", err);
							resolve(false);
						} else {
							console.log(`Updated record for ID ${id}`);
							resolve(true);
						}
					}
				);
			});

			updatePromises.push(updatePromise);
		}

		await Promise.all(updatePromises);
		console.log("All path + filename updates complete. Generating thumbnails...");
		generateThumbnails();
	}

	else if (action === "importAll") {
		let insertPromises = [];

		for (const id of ids) {
			const mismatch = pendingMismatches.find(m => m.id === id);
			if (!mismatch) continue;

			const newID = require("uuid").v4();
			const newEntry = mismatch.new;
			const newRelativePath = path.relative(app.getPath('userData'), newEntry.full_path);

			const insertPromise = new Promise((resolve) => {
				booru_db.run(
					`INSERT INTO imageDB (
						id, filename, file_format, width, height,
						md5, date_created, date_modified, file_size, date_imported,
						bit_depth, thumb, relative_path, full_path,
						final_tag, raw_tag, warnings, fingerprint
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					[
						newID, newEntry.filename, newEntry.file_format, newEntry.width, newEntry.height,
						newEntry.md5, newEntry.date_created, newEntry.date_modified, newEntry.file_size,
						Date.now(), newEntry.bit_depth, "", newRelativePath, newEntry.full_path,
						newEntry.final_tag || "", newEntry.raw_tag || "", newEntry.warnings || "", newEntry.fingerprint || ""
					],
					(err) => {
						if (err) {
							console.error("Insert error:", err);
							resolve(false);
						} else {
							console.log(`Inserted new duplicate as ID ${newID}`);
							resolve(true);
						}
					}
				);
			});

			insertPromises.push(insertPromise);
		}

		await Promise.all(insertPromises);
		console.log("All duplicates inserted as new entries. Generating thumbnails...");
		generateThumbnails();
	}

	pendingMismatches = [];
});


async function generateThumbnails() {
	const db = new sqlite3.Database(maiyome_db);

	db.all("SELECT rowid, md5, full_path, thumb FROM imageDB", async (err, rows) => {
		if (err) {
			console.error("DB error while reading for thumbnails:", err);
			return;
		}

		if (!fs.existsSync(thumbnailsBasePath)) {
			fs.mkdirSync(thumbnailsBasePath, { recursive: true });
		}

		let total = rows.length;
		let count = 0;

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const groupNum = String(Math.floor(i / 500) + 1).padStart(3, "0"); // "001", "002", ...
			const thumbFolder = path.join(thumbnailsBasePath, groupNum);
			const outputFileName = `${row.md5}.webp`;
			const outputPath = path.join(thumbFolder, outputFileName);

			if (row.thumb === groupNum && fs.existsSync(outputPath)) {
				count++;
				ise_main.webContents.send("export-progress", {
					type: "thumb",
					count,
					total,
					text: `${count} of ${total} thumbnail generated`
				});
				continue;
			}

			if (!fs.existsSync(thumbFolder)) {
				fs.mkdirSync(thumbFolder, { recursive: true });
			}

			try {
				await sharp(row.full_path)
					.resize(600, 600, { fit: 'inside' })
					.toFormat('webp')
					.toFile(outputPath);
				console.log(`Generated thumbnail for ${outputFileName}`);

				db.run("UPDATE imageDB SET thumb = ? WHERE rowid = ?", [`${groupNum}`, row.rowid]);
			} catch (error) {
				console.error(`Error processing ${row.full_path}:`, error.message);
			}

			count++;
			ise_main.webContents.send("export-progress", {
				type: "thumb",
				count,
				total,
				text: `${count} of ${total} thumbnail generated`
			});
		}
	});
}

ipcMain.handle('verify-file-paths', async (event) => {
	return new Promise((resolve) => {
		validateImagePaths(booru_db, (missingList) => {
			event.sender.send('file-missing-count', missingList.length); // <-- Send count
			resolve(missingList);
		});
	});
});

function validateImagePaths(booru_db, callback) {
	const fileNotFoundList = [];

	booru_db.all("SELECT id, relative_path, warnings FROM imageDB", (err, rows) => {
		if (err) {
			console.error("Failed to fetch image data:", err);
			return callback([]);
		}

		const updateWarnings = booru_db.prepare("UPDATE imageDB SET warnings = ? WHERE id = ?");

		rows.forEach(row => {
			const filePath = path.resolve(corePATH, row.relative_path);
			let warnings = (row.warnings || "").split(",").map(w => w.trim()).filter(Boolean);

			if (!fs.existsSync(filePath)) {
				fileNotFoundList.push(row.id);
				if (!warnings.includes("ERR")) warnings.push("ERR");
			} else {
				warnings = warnings.filter(w => w !== "ERR");
			}

			const updated = warnings.length > 0 ? warnings.join(", ") : null;
			updateWarnings.run(updated, row.id);
		});

		updateWarnings.finalize(() => {
			callback(fileNotFoundList);
		});
	});
}

function booru_db_backup() {
	const dbPath = GET_BOORU_DATABASE();
	if (!fs.existsSync(dbPath)) {
		console.error('Database file not found:', dbPath);
		return;
	}

	const dbName = path.basename(dbPath, '.db');
	const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15); // yyyymmddhhmmss
	const backupDir = path.join(corePATH, 'userdata/backup_db');

	if (!fs.existsSync(backupDir)) {
		fs.mkdirSync(backupDir, { recursive: true });
	}

	const backupFileName = `${dbName}_${timestamp.slice(0, 8)}_${timestamp.slice(8)}.db`;
	const backupPath = path.join(backupDir, backupFileName);

	fs.copyFileSync(dbPath, backupPath);
	console.log(`Backup created at ${backupPath}`);
}

ipcMain.removeHandler('exportClean');
ipcMain.handle('exportClean', async () => {
	await export_clean_tag();
});

ipcMain.removeHandler('exportRAW');
ipcMain.handle('exportRAW', async () => {
	await export_raw_tag();
});

ipcMain.removeHandler('exportCleanS');
ipcMain.handle('exportCleanS', async () => {
	await export_clean_tag_selection();
});

ipcMain.removeHandler('exportRAWS');
ipcMain.handle('exportRAWS', async () => {
	await export_raw_tag_selection();
});

ipcMain.handle('export_TAGtoJSON', async () => {
	booru_db.all("SELECT full_path, md5, final_tag, raw_tag FROM imageDB", async (err, rows) => {
		if (err) {
			console.error("Error fetching data for exportTAGtoJSON:", err);
			return;
		}

		const groupedByPath = {};
		let count = 0;
		let total = 0;

		for (const row of rows) {
			if (!row.full_path || !row.md5 || !row.raw_tag) continue;

			const folder = path.dirname(row.full_path);
			if (!groupedByPath[folder]) groupedByPath[folder] = [];

			groupedByPath[folder].push({
				md5: row.md5,
				clean_tag: (row.final_tag || '').split(',').map(t => t.trim()).join(', '),
				raw_tag: row.raw_tag.split(',').map(t => t.trim()).join(', ')
			});
		}

		total = Object.keys(groupedByPath).length;

		for (const folderPath in groupedByPath) {
			const outputFile = path.join(folderPath, "tag_config.json");
			try {
				await fs.writeFile(outputFile, JSON.stringify(groupedByPath[folderPath], null, 2), 'utf-8');
				console.log(`Exported tag_config.json to: ${outputFile}`);
			} catch (e) {
				console.error(`Failed to write tag_config.json for ${folderPath}:`, e);
			}

			count++;
			ise_main.webContents.send("export-progress", { type: "tag_json", count, total });
		}
	});
});

function export_clean_tag() {
	booru_db.all("SELECT relative_path, final_tag, md5 FROM imageDB", async (err, rows) => {
		if (err) {
			console.error("Error fetching data for export_clean_tag:", err);
			return;
		}

		let total = rows.length;
		let count = 0;

		for (const row of rows) {
			if (!row.relative_path || !row.final_tag || !row.md5) continue;

			const fullPath = path.resolve(corePATH, row.relative_path);
			if (!fs.existsSync(fullPath)) continue;

			const keywords = row.final_tag.split(',').map(tag => tag.trim()).filter(Boolean);

			try {
				await ep.writeMetadata(fullPath, {
					'IPTC:Keywords': keywords,
					'XMP:HierarchicalSubject': keywords,
					'XMP-et:OriginalImageMD5': row.md5
				}, ['-overwrite_original', '-preserve']);
				console.log(`Clean tag written to: ${fullPath}`);
			} catch (e) {
				console.error(`Failed to write clean tag for ${fullPath}:`, e);
			}

			count++;
			ise_main.webContents.send("export-progress", { type: "clean", count, total });
		}
	});
}

function export_raw_tag() {
	booru_db.all("SELECT relative_path, raw_tag, md5 FROM imageDB", async (err, rows) => {
		if (err) {
			console.error("Error fetching data for export_raw_tag:", err);
			return;
		}

		let total = rows.length;
		let count = 0;

		for (const row of rows) {
			if (!row.relative_path || !row.raw_tag || !row.md5) continue;

			const fullPath = path.resolve(corePATH, row.relative_path);
			if (!fs.existsSync(fullPath)) continue;

			const keywords = row.raw_tag.split(',').map(tag => tag.trim()).filter(Boolean);

			try {
				await ep.writeMetadata(fullPath, {
					'IPTC:Keywords': keywords,
					'XMP:HierarchicalSubject': keywords,
					'XMP-et:OriginalImageMD5': row.md5
				}, ['-overwrite_original', '-preserve']);
				console.log(`Raw tag written to: ${fullPath}`);
			} catch (e) {
				console.error(`Failed to write raw tag for ${fullPath}:`, e);
			}

			count++;
			ise_main.webContents.send("export-progress", { type: "raw", count, total });
		}
	});
}

async function export_clean_tag_selection() {
	const selectionRaw = await ise_main.webContents.executeJavaScript("localStorage.getItem('current_selection')");
	const selection = JSON.parse(selectionRaw || "[]");

	if (!Array.isArray(selection) || selection.length === 0) {
		console.log("No selected IDs found for clean tag export.");
		return;
	}

	const placeholders = selection.map(() => '?').join(',');
	const sql = `SELECT id, relative_path, final_tag, md5 FROM imageDB WHERE id IN (${placeholders})`;

	booru_db.all(sql, selection, async (err, rows) => {
		if (err) {
			console.error("Error fetching selected data:", err);
			return;
		}

		let total = rows.length;
		let count = 0;

		for (const row of rows) {
			if (!row.relative_path || !row.final_tag || !row.md5) continue;

			const fullPath = path.resolve(corePATH, row.relative_path);
			if (!fs.existsSync(fullPath)) continue;

			const keywords = row.final_tag.split(',').map(tag => tag.trim()).filter(Boolean);

			try {
				await ep.writeMetadata(fullPath, {
					'IPTC:Keywords': keywords,
					'XMP:HierarchicalSubject': keywords,
					'XMP-et:OriginalImageMD5': row.md5
				}, ['-overwrite_original', '-preserve']);
				console.log(`Clean tag written to: ${fullPath}`);
			} catch (e) {
				console.error(`Failed to write clean tag for ${fullPath}:`, e);
			}

			count++;
			ise_main.webContents.send("export-progress", { type: "clean_selection", count, total });
		}
	});
}

async function export_raw_tag_selection() {
	const selectionRaw = await ise_main.webContents.executeJavaScript("localStorage.getItem('current_selection')");
	const selection = JSON.parse(selectionRaw || "[]");

	if (!Array.isArray(selection) || selection.length === 0) {
		console.log("No selected IDs found for raw tag export.");
		return;
	}

	const placeholders = selection.map(() => '?').join(',');
	const sql = `SELECT id, relative_path, raw_tag, md5 FROM imageDB WHERE id IN (${placeholders})`;

	booru_db.all(sql, selection, async (err, rows) => {
		if (err) {
			console.error("Error fetching selected data:", err);
			return;
		}

		let total = rows.length;
		let count = 0;

		for (const row of rows) {
			if (!row.relative_path || !row.raw_tag || !row.md5) continue;

			const fullPath = path.resolve(corePATH, row.relative_path);
			if (!fs.existsSync(fullPath)) continue;

			const keywords = row.raw_tag.split(',').map(tag => tag.trim()).filter(Boolean);

			try {
				await ep.writeMetadata(fullPath, {
					'IPTC:Keywords': keywords,
					'XMP:HierarchicalSubject': keywords,
					'XMP-et:OriginalImageMD5': row.md5
				}, ['-overwrite_original', '-preserve']);
				console.log(`Raw tag written to: ${fullPath}`);
			} catch (e) {
				console.error(`Failed to write raw tag for ${fullPath}:`, e);
			}

			count++;
			ise_main.webContents.send("export-progress", { type: "raw_selection", count, total });
		}
	});
}

ipcMain.on('open-page', (event, pageName) => {
    if (ise_main) {
        ise_main.loadFile(path.join(__dirname, `${pageName}.html`));
    }
});

ipcMain.on('open-link', (event, url) => {
	require('electron').shell.openExternal(url);
});

ipcMain.on('open-file', (event, filePath) => {
	if (!filePath || typeof filePath !== 'string') {
		console.error('Invalid file path');
		return;
	}

	fs.access(filePath, fs.constants.F_OK, (err) => {
		if (err) {
			console.error('File does not exist:', filePath);
			return;
		}
		shell.openPath(filePath);
	});
});

ipcMain.handle('data_fetch_by_ids', async (event, idArray) => {
	return new Promise((resolve, reject) => {
		if (!Array.isArray(idArray) || idArray.length === 0) return resolve([]);

		const placeholders = idArray.map(() => '?').join(',');
		const sql = `SELECT * FROM imageDB WHERE id IN (${placeholders})`;

		booru_db.all(sql, idArray, (err, rows) => {
			if (err) {
				console.error('[DB] Error fetching rows:', err);
				return reject(err);
			}
			resolve(rows);
		});
	});
});

ipcMain.handle('get-file-info', async (event, id) => {
	return new Promise((resolve, reject) => {
		booru_db.get("SELECT id, relative_path FROM imageDB WHERE id = ?", [id], (err, row) => {
			if (err) {
				console.error(`[DB ERR] while fetching ID ${id}:`, err);
				return reject(err);
			}
			resolve(row || null);
		});
	});
});

ipcMain.handle('delete-from-db', async (event, id) => {
	return new Promise((resolve, reject) => {
		booru_db.run("DELETE FROM imageDB WHERE id = ?", [id], function (err) {
			if (err) {
				console.error(`[DB ERR] delete ID ${id}:`, err);
				return reject(err);
			}
			resolve(true);
		});
	});
});

ipcMain.handle('send-to-trash', async (event, relativePath) => {
	const fullPath = path.resolve(corePATH, relativePath);

	const delay = (ms) => new Promise(res => setTimeout(res, ms));
	const maxAttempts = 3;

	try {
		if (!fs.existsSync(fullPath)) {
			console.warn(`[MISS] File not found for trash: ${fullPath}`);
			return;
		}

		if (global.gc) global.gc();

		await delay(300);

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				await shell.trashItem(fullPath);
				console.log(`[RECYCLE] Sent to trash: ${fullPath}`);
				return;
			} catch (err) {
				console.warn(`[TRASH WARN] Attempt ${attempt} failed for ${fullPath}:`, err);
				if (attempt < maxAttempts) {
					await delay(500);
				} else {
					throw err;
				}
			}
		}
	} catch (errFinal) {
		console.error(`[TRASH ERR] ${fullPath}:`, errFinal);
	}
});


function getImagePath(row) {
	const thumbPath = path.join(thumbnailsBasePath, `${row.thumb}/${row.md5}.webp`);
	if (thumbPath && fs.existsSync(thumbPath)) return thumbPath;
	if (fs.existsSync(row.full_path)) return row.relative_path;
	return null;
}

function hashImage(filePath) {
	return new Promise((resolve, reject) => {
		sharp(filePath)
			.resize(HASH_SIZE, HASH_SIZE, { fit: 'fill' })
			.grayscale()
			.raw()
			.toBuffer((err, buffer, info) => {
				if (err) return reject(err);
				const avg = buffer.reduce((sum, val) => sum + val, 0) / buffer.length;
				const bits = buffer.map(val => (val > avg ? 1 : 0)).join('');
				resolve(bits);
			});
	});
}

  
function hammingDistance(hash1, hash2) {
	return [...hash1].reduce((acc, bit, idx) => acc + (bit !== hash2[idx]), 0);
}
  
ipcMain.handle("generateFingerprints", async () => {
	const booru_db = new sqlite3.Database(maiyome_db);
	const selectQuery = `SELECT id, filename, md5, thumb, full_path, fingerprint, warnings FROM imageDB`;

	const runtimeConfig = JSON.parse(fs.readFileSync(userCFG, "utf-8"));
	
	const cleanupWarningsQuery = `
		UPDATE imageDB
		SET warnings = 
			TRIM(REPLACE(REPLACE(REPLACE(warnings, 'DUPLICATE,', ''), ',DUPLICATE', ''), 'DUPLICATE', ''))
		WHERE warnings LIKE '%DUPLICATE%'`;
	booru_db.run(cleanupWarningsQuery, (err) => {
		if (err) console.warn("[WARN] Cleanup of old DUPLICATE tags failed:", err.message);
		else console.log("[CLEANUP] Previous DUPLICATE warnings removed from imageDB");
	});

	const total = await new Promise((res, rej) => {
		booru_db.get(`SELECT COUNT(*) as total FROM imageDB`, (err, row) => {
			if (err) rej(err);
			else res(row.total);
		});
	});

	return new Promise((resolve, reject) => {
		booru_db.all(selectQuery, async (err, rows) => {
			if (err) return reject(err);

			const idToHash = {};
			const imageData = [];
			let count = 0;

			console.log("Fingerprint Hash currently using value:", HASH_SIZE);
			ise_main.webContents.send("export-progress", {
				type: "fingerprint_start",
				count: 0,
				total,
				text: `Starting fingerprint generation...`
			});

			for (let row of rows) {
				const filePath = getImagePath(row);
				if (!filePath) continue;

				if (!row.fingerprint) {
					try {
						const hash = await hashImage(filePath);
						idToHash[row.id] = hash;
						console.log(`[FINGERPRINT] ID: ${row.id}, File: ${row.filename}`);
						booru_db.run(`UPDATE imageDB SET fingerprint = ? WHERE id = ?`, [hash, row.id]);
					} catch (e) {
						console.warn(`[ERROR] Cannot hash file: ${filePath}`);
						continue;
					}
				} else {
					idToHash[row.id] = row.fingerprint;
				}

				imageData.push({ ...row, fingerprint: idToHash[row.id] });
				count++;

				ise_main.webContents.send("export-progress", {
					type: "fingerprint",
					count,
					total,
					text: `${count} of ${total} fingerprints indexed`
				});
			}

			console.log("[FINGERPRINT] Completed, now starting duplicate comparison...");

			const worker = new Worker(path.join(__dirname, "checkAndMarkDuplicates.js"), {
				workerData: {
					imageData,
					config: runtimeConfig
				}
			});

			worker.on("message", (msg) => {
				if (msg.result) {
					for (let row of imageData) {
						if (!msg.result.duplicates.includes(row.id)) continue;
						let currentWarnings = row.warnings || "";
						let parts = currentWarnings.split(",").map(x => x.trim()).filter(Boolean);
						if (!parts.includes("DUPLICATE")) parts.push("DUPLICATE");
						const newWarning = parts.join(", ");
						booru_db.run(`UPDATE imageDB SET warnings = ? WHERE id = ?`, [newWarning, row.id]);
					}
					resolve(msg.result);
				} else if (msg.log) {
					console.log(msg.log);
				} else if (msg.type === "data-duplicate-count") {
					ise_main.webContents.send("data-duplicate-count", msg.count);
				} else if (msg.type) {
					ise_main.webContents.send("export-progress", msg);
				} else if (msg.error) {
					console.error("[Worker Error]", msg.error);
					reject(msg.error);
				}
			});

			worker.on("error", reject);
			worker.on("exit", (code) => {
				if (code !== 0) {
					reject(new Error(`Worker exited with code ${code}`));
				}
			});
		});
	});
});

ipcMain.handle('get-json-files', async () => {
    const dir = path.join(corePATH, 'userdata', 'tag');
    return fs.readdirSync(dir).filter(f => f.endsWith('.json'));
});

ipcMain.handle('read-json-file', async (event, filename) => {
    const filePath = path.join(corePATH, 'userdata', 'tag', filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
});

ipcMain.handle('append-tags', async (event, { filename, newTags }) => {
    const filePath = path.join(corePATH, 'userdata', 'tag', filename);
    const currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const updatedData = [...currentData, ...newTags];
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
});

ipcMain.handle('delete-tags', async (event, { filename, tagsToDelete }) => {
    const filePath = path.join(corePATH, 'userdata', 'tag', filename);
    const currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const updatedData = currentData.filter(tag => !tagsToDelete.includes(tag));
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2), 'utf-8');
});

ipcMain.handle("resetfingerprint", async () => {
	return new Promise((resolve, reject) => {
	const sql1 = `UPDATE imageDB SET fingerprint = NULL`;
	const sql2 = `
		UPDATE imageDB
		SET warnings = 
		TRIM(REPLACE(REPLACE(REPLACE(warnings, 'DUPLICATE;', ''), ';DUPLICATE', ''), 'DUPLICATE', ''))
		WHERE warnings LIKE '%DUPLICATE%'`;

	booru_db.serialize(() => {
		booru_db.run(sql1, function(err1) {
		if (err1) return reject(err1);
		booru_db.run(sql2, function(err2) {
			if (err2) return reject(err2);
			console.log("[CONSOLE REPORT] Fingerprints cleared and 'DUPLICATE' flags removed");
			resolve("Done");
		});
		});
	});``
	});
});