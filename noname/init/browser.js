import { __vitePreload } from "../../_virtual/preload-helper.js";

async function browserReady({ lib, game }) {
	lib.path = (await __vitePreload(async () => {
		const { default: path } = await import("https://cdn.jsdelivr.net/npm/path-browserify-esm@1.0.6/index.esm.js");
		return { default: path };
	}, true ? [] : void 0, import.meta.url)).default;

	const __DEPLOY_BASE__ = "https://cdn.jsdelivr.net/gh/connectedGraph/wuluxun-simulator@v1.0.6/";

	function toResourceURL(fileName) {
		const text = String(fileName || "").replace(/\\/g, "/");
		if (/^https?:\/\//i.test(text)) return text;
		return __DEPLOY_BASE__ + text.replace(/^\.?\//, "").replace(/^\/+/, "");
	}

	function normalizeDir(dir) {
		return String(dir || "").replace(/\\/g, "/").replace(/^\.?\//, "").replace(/^\/+/, "").replace(/\/+$/, "");
	}

	let fileListManifestPromise;
	function getFileListManifest() {
		if (!fileListManifestPromise) {
			fileListManifestPromise = fetch(__DEPLOY_BASE__ + "__filelist.json", { cache: "no-store" }).then((response) => {
				if (!response.ok) return {};
				return response.json();
			}).catch(() => ({}));
		}
		return fileListManifestPromise;
	}

	async function stat(fileName) {
		const url = toResourceURL(fileName);
		if (!url || url.endsWith("/")) return -1;
		try {
			const response = await fetch(url, { method: "HEAD", cache: "no-store" });
			return response.ok ? 1 : -1;
		} catch (error) {
			return -1;
		}
	}

	game.export = function (data, name) {
		if (typeof data === "string") data = new Blob([data], { type: "text/plain" });
		let fileNameToSaveAs = name || "noname";
		fileNameToSaveAs = fileNameToSaveAs.replace(/\\|\/|:|\?|"|\*|<|>|\|/g, "-");
		const downloadLink = document.createElement("a");
		downloadLink.download = fileNameToSaveAs;
		downloadLink.href = window.URL.createObjectURL(data);
		downloadLink.click();
	};

	game.exit = function () {
		window.onbeforeunload = null;
		window.close();
	};

	game.open = function (url) {
		window.open(url);
	};

	game.checkFile = function (fileName, callback, onerror) {
		stat(fileName).then((result) => callback?.(result)).catch((error) => {
			if (onerror) onerror(error);
			else callback?.(-1);
		});
	};

	game.checkDir = function (dir, callback) {
		callback?.(0);
	};

	game.readFile = function (fileName, callback = () => {}, error = () => {}) {
		fetch(toResourceURL(fileName), { cache: "no-store" }).then((response) => {
			if (!response.ok) throw new Error("Cannot read file: " + fileName);
			return response.arrayBuffer();
		}).then(callback).catch(error);
	};

	game.readFileAsText = function (fileName, callback = () => {}, error = () => {}) {
		fetch(toResourceURL(fileName), { cache: "no-store" }).then((response) => {
			if (!response.ok) throw new Error("Cannot read file: " + fileName);
			return response.text();
		}).then(callback).catch(error);
	};

	game.writeFile = function (data, path, name, callback = () => {}) {
		callback();
	};

	game.removeFile = function (fileName, callback = () => {}) {
		callback();
	};

	game.getFileList = function (dir, callback = () => {}, onerror) {
		getFileListManifest().then((manifest) => {
			const entry = manifest[normalizeDir(dir)];
			callback(entry?.folders || [], entry?.files || []);
		}).catch((error) => {
			if (onerror) onerror(error);
			else callback([], []);
		});
	};

	game.ensureDirectory = function (list, callback = () => {}) {
		callback();
	};

	game.createDir = function (directory, successCallback = () => {}) {
		successCallback();
	};

	game.removeDir = function (directory, successCallback = () => {}) {
		successCallback();
	};
}

export {
	browserReady as default,
};
