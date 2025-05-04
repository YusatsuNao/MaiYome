const fs = require('fs-extra');
const path = require('path');

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // EXPORT
const outputDirectory = path.join('C:', 'Projects', 'MaiYome', 'Main Export');

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // MAIN VARIABLE
const appName = 'MaiYome';
const appVersion = '1.0.0';
const appPublisher = 'Yusatsu Nao';
const appDescription = 'MaiYome';
const appIcon = path.join(__dirname, '/maiyome.ico');
const appWinIcon = path.join(__dirname, '/maiyome.ico');

// ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚ // MAIN CONFIGURATION
module.exports = {
	packagerConfig: {
		name: appName,
		appBundleId: `com.yusatsunao.${appName.toLowerCase()}`,
		icon: appIcon,
		outputDirectory: outputDirectory,
		win32metadata: {
			CompanyName: appPublisher,
			FileDescription: appDescription,
			ProductName: appName,
			ProductVersion: appVersion
		},
		asar: false,
		ignore: [],
	},

	makers: [
		{
			name: '@electron-forge/maker-zip',
			config: {
				outputDirectory: outputDirectory,
				platforms: ['win32', 'darwin', 'linux'],
			}
		}
	]
};
