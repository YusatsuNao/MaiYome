const { parentPort, workerData } = require("worker_threads");
const { imageData, config } = workerData;

let tempSimilarity = parseFloat(config.duplicate_sensitivity) || 1.0;
let tempHash = parseFloat(config.fingerprint_hash) || 64;
if (tempSimilarity > 1.0) tempSimilarity = 1.0;
if (tempSimilarity < 0.9) tempSimilarity = 0.9; // optional lower limit

const desiredSimilarity = tempSimilarity;
const HASH_SIZE = tempHash;
const MAX_HAMMING_DIST = Math.round(HASH_SIZE * HASH_SIZE * (1 - desiredSimilarity));

function hammingDistance(a, b) {
	let dist = 0;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) dist++;
	}
	return dist;
}

(async () => {
	try {
		parentPort.postMessage({
			type: "log",
			log: `[DUPLICATE CONFIG] Sensitivity: ${desiredSimilarity}, Hash Size: ${HASH_SIZE}, Max Hamming Distance: ${MAX_HAMMING_DIST}`
		});
		parentPort.postMessage({ log: "[DUPLICATE] Cleanup done. Starting comparison..." });
		parentPort.postMessage({
			type: "comparison_start",
			count: 0,
			total: imageData.length,
			text: `Starting fingerprint comparison...`,
		});

		const duplicatesMap = new Map();
		let progress = 0;

		for (let i = 0; i < imageData.length; i++) {
			const idA = imageData[i].id;
			const hashA = imageData[i].fingerprint;
			if (!hashA) continue;

			for (let j = i + 1; j < imageData.length; j++) {
				const idB = imageData[j].id;
				const hashB = imageData[j].fingerprint;
				if (!hashB) continue;

				const dist = hammingDistance(hashA, hashB);
				if (dist <= MAX_HAMMING_DIST) {
					duplicatesMap.set(idA, true);
					duplicatesMap.set(idB, true);
				}
			}

			progress++;
			parentPort.postMessage({
				type: "comparison",
				count: progress,
				total: imageData.length,
				text: `${progress} of ${imageData.length} images compared`,
			});
		}

		const duplicateIds = [...duplicatesMap.keys()];

		parentPort.postMessage({
			type: "fingerprint_done",
			count: duplicateIds.length,
			total: imageData.length,
			text: `Total ${duplicateIds.length} duplicates found`,
		});
		parentPort.postMessage({ log: `[DUPLICATE REPORT] Duplicates detected (by ID): ${duplicateIds.join(", ")}` });

		parentPort.postMessage({ result: { count: duplicateIds.length, duplicates: duplicateIds } });
		parentPort.postMessage({ type: 'data-duplicate-count', count: duplicateIds.length });
		parentPort.postMessage({ log: `PROCESS FINISHED` });
	} catch (error) {
		parentPort.postMessage({ error: error.message });
	}
})();
