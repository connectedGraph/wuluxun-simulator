import { lib, game, ui, get, _status } from "noname";

const extensionName = "武陆逊模拟器";
const sceneName = "武陆逊模拟器";
const brawlKey = "wuluxun_simulator";
const decadeCardSkin = "decade";
const skinConfigKey = `extension_${extensionName}_wuluxunSkin`;
const launcherBackgroundDbName = "wuluxun_launcher_assets";
const launcherBackgroundStore = "assets";
const launcherBackgroundBlobKey = "background_blob";
const launcherBackgroundModeKey = "wuluxun_launcher_bg_mode";
const launcherBackgroundBlurKey = "wuluxun_launcher_bg_blur";
const shenxiuSkinKey = "shenxiu_zhengrong";
const shenxiuSkin = {
	name: "神秀峥嵘",
	image: `extension/${extensionName}/assets/skins/shenxiu_zhengrong/character/wu_luxun.png`,
	audioBase: `ext:${extensionName}/assets/skins/shenxiu_zhengrong/audio`,
};
const shenxiuSkillAudio = {
	dcxiongmu: 2,
	dczhangcai: 2,
	dcruxian: 2,
};
let launcherBackgroundObjectUrl = "";

export const type = "extension";

function addUnique(list, item) {
	if (!Array.isArray(list)) return;
	if (!list.includes(item)) list.push(item);
}

function getWuluxunSkinSelection() {
	return lib.config?.[skinConfigKey] === "classic" ? "classic" : shenxiuSkinKey;
}

function requestToPromise(request) {
	return new Promise((resolve, reject) => {
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
	});
}

function getLauncherBackgroundBlur() {
	const blur = Number(localStorage.getItem(launcherBackgroundBlurKey));
	return Math.max(0, Math.min(28, Number.isFinite(blur) ? blur : 10));
}

function openLauncherBackgroundDatabase() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(launcherBackgroundDbName, 1);
		request.onupgradeneeded = event => {
			const db = event.target.result;
			if (!db.objectStoreNames.contains(launcherBackgroundStore)) db.createObjectStore(launcherBackgroundStore);
		};
		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
	});
}

async function getLauncherBackgroundBlob() {
	const db = await openLauncherBackgroundDatabase();
	try {
		return await requestToPromise(db.transaction(launcherBackgroundStore, "readonly").objectStore(launcherBackgroundStore).get(launcherBackgroundBlobKey));
	} finally {
		db.close();
	}
}

function ensureLauncherBackgroundLayer() {
	return document.querySelector(".background") || ui.background || null;
}

function paintNativeBackground(url) {
	const nodes = [ui.background, document.querySelector(".background")].filter(Boolean);
	for (const node of nodes) {
		node.style.setProperty("background-image", `url(${JSON.stringify(url)})`, "important");
		node.style.setProperty("background-position", "center", "important");
		node.style.setProperty("background-size", "cover", "important");
		node.style.setProperty("background-repeat", "no-repeat", "important");
		node.style.setProperty("filter", `blur(${getLauncherBackgroundBlur()}px)`, "important");
		node.style.setProperty("transform", "scale(1.04)", "important");
		node.style.setProperty("opacity", "1", "important");
		node.classList.add("wuluxun-native-background");
	}
}

function setLauncherBackgroundUrl(url, objectUrl = false) {
	if (launcherBackgroundObjectUrl && launcherBackgroundObjectUrl !== url) {
		URL.revokeObjectURL(launcherBackgroundObjectUrl);
		launcherBackgroundObjectUrl = "";
	}
	if (objectUrl) launcherBackgroundObjectUrl = url;
	document.body.classList.add("wuluxun-game-background-active");
	ensureLauncherBackgroundLayer();
	paintNativeBackground(url);
}

async function applyLauncherBackgroundToGame() {
	ensureLauncherBackgroundLayer();
	const mode = localStorage.getItem(launcherBackgroundModeKey) || "remote";
	const blob = await getLauncherBackgroundBlob();
	if (blob) {
		const url = URL.createObjectURL(blob);
		setLauncherBackgroundUrl(url, true);
		return {
			mode,
			source: mode === "remote" ? "indexeddb-remote" : "indexeddb-custom",
			blur: getLauncherBackgroundBlur(),
		};
	}
	return { mode, source: "missing-indexeddb-background", blur: getLauncherBackgroundBlur() };
}

function makeScene() {
	return {
		name: sceneName,
		intro: "固定两人局：你控制武陆逊，对方兀突骨由原版AI托管。",
		gameDraw: true,
		replacepile: false,
		cardPileTop: [],
		cardPileBottom: [],
		discardPile: [],
		players: [
			{
				name: "wu_luxun",
				name2: "none",
				identity: "zhu",
				position: 1,
				playercontrol: true,
				handcards: [],
				equips: [],
				judges: [],
			},
			{
				name: "wutugu",
				name2: "none",
				identity: "fan",
				position: 2,
				playercontrol: false,
				handcards: [],
				equips: [],
				judges: [],
			},
		],
	};
}

function makeStage(scene) {
	return {
		name: sceneName,
		intro: "武陆逊 vs 兀突骨。",
		mode: "normal",
		scenes: [scene],
	};
}

function applySimulatorConfig() {
	lib.config.mode = "brawl";
	lib.config.layout = "nova";
	lib.config.video = "0";
	lib.config.background_audio = true;
	lib.config.background_music = "music_off";
	lib.config.background_speak = true;
	lib.config.volumn_audio = 6;
	lib.config.volumn_background = 4;
	lib.config.show_volumn = true;
	lib.config.show_pause = false;
	lib.config.show_auto = false;
	lib.config.show_wuxie = false;
	lib.config.show_sortcard = false;
	lib.config.show_deckMonitor = false;
	lib.config.show_round_menu = false;
	lib.config.mode_config ??= {};
	lib.config.mode_config.identity ??= {};
	lib.config.mode_config.identity.change_card = "unlimited";
	lib.config.mode_config.identity.double_character = false;
	lib.config.mode_config.identity.free_choose = false;
	lib.config.mode_config.identity.player_number = 2;
	lib.config.extension_十周年UI_newDecadeStyle = "on";
	lib.config.extension_十周年UI_cardPrettify = decadeCardSkin;
	lib.config.extension_十周年UI_cardGhostEffect = true;
	lib.config.extension_十周年UI_cardPrompt = true;
	lib.config.extension_十周年UI_cardAlternateName = false;
	lib.config.extension_十周年UI_chupaizhishi = "shousha";
	lib.config.extension_十周年UI_bettersound = true;
	lib.config.extension_十周年UI_skillDieAudio = true;
	lib.config.extension_十周年UI_audioEasterEggs = true;
}

function fixWuluxunGroup() {
	if (lib.character?.wu_luxun) {
		lib.character.wu_luxun.group = "wu";
		lib.character.wu_luxun.doubleGroup = [];
	}
	if (window.__wuluxunSelectGroupFixed) return;
	window.__wuluxunSelectGroupFixed = true;
	const originalSelectGroup = get.selectGroup;
	get.selectGroup = function (name, type) {
		const characterName = get.itemtype(name) === "player" ? name.name || name.name1 : name;
		if (characterName === "wu_luxun") {
			return type === true ? "default" : [];
		}
		return originalSelectGroup.call(this, name, type);
	};
}

function applyShenxiuAudioConfig() {
	for (const [skill, count] of Object.entries(shenxiuSkillAudio)) {
		const info = lib.skill?.[skill];
		if (!info) continue;
		info.audioname2 ??= {};
		info.audioname2.wu_luxun = `${shenxiuSkin.audioBase}:${count}`;
	}
	if (lib.character?.wu_luxun) {
		lib.character.wu_luxun.dieAudios = [`${shenxiuSkin.audioBase}/wu_luxun_die.mp3`];
	}
}

function applyShenxiuSkinToPlayer(player) {
	if (!player || (player.name !== "wu_luxun" && player.name1 !== "wu_luxun")) return;
	player.classList.add("wuluxun-shenxiu-skin");
	if (player.node?.avatar) {
		player.node.avatar.style.setProperty("background-image", `url("${lib.assetURL}${shenxiuSkin.image}")`, "important");
		player.node.avatar.style.setProperty("background-position", "58% 36%", "important");
		player.node.avatar.style.setProperty("background-size", "auto 118%", "important");
	}
}

function installShenxiuSkinAssets() {
	if (getWuluxunSkinSelection() !== shenxiuSkinKey) return;
	if (lib.character?.wu_luxun) {
		lib.character.wu_luxun.img = shenxiuSkin.image;
		lib.character.wu_luxun.trashBin ??= [];
		if (!lib.character.wu_luxun.trashBin.includes("skin:shenxiu_zhengrong")) {
			lib.character.wu_luxun.trashBin.push("skin:shenxiu_zhengrong");
		}
	}
	lib.translate.wu_luxun_shenxiu_zhengrong = `${shenxiuSkin.name}*${get.translation("wu_luxun")}`;
	applyShenxiuAudioConfig();

	if (Array.isArray(lib.arenaReady)) {
		lib.arenaReady.push(() => {
			applyShenxiuAudioConfig();
			for (const player of game.players || []) {
				applyShenxiuSkinToPlayer(player);
			}
			setTimeout(() => {
				for (const player of game.players || []) {
					applyShenxiuSkinToPlayer(player);
				}
			}, 800);
		});
	}
}

function installAudioProbe() {
	window.wuluxunAudioTest = () => {
		const player = game.players?.find(current => current.name === "wu_luxun") || game.me;
		const result = { skin: getWuluxunSkinSelection() };
		for (const skill of ["dcxiongmu", "dczhangcai", "dcruxian"]) {
			result[skill] = game.parseSkillAudio(skill, player);
			game.trySkillAudio(skill, player, true, true);
		}
		return result;
	};
	window.wuluxunBackgroundTest = async () => {
		const result = await applyLauncherBackgroundToGame();
		const layer = document.querySelector(".background.wuluxun-native-background");
		return {
			...result,
			active: document.body.classList.contains("wuluxun-game-background-active"),
			bg: layer ? getComputedStyle(layer).backgroundImage : "",
			blur: layer ? getComputedStyle(layer).filter : "",
			layerDisplay: layer ? getComputedStyle(layer).display : "",
		};
	};
	window.wuluxunSkinAssetTest = async () => {
		const audioFiles = [
			"dcxiongmu1.mp3",
			"dcxiongmu2.mp3",
			"dczhangcai1.mp3",
			"dczhangcai2.mp3",
			"dcruxian1.mp3",
			"dcruxian2.mp3",
			"wu_luxun_die.mp3",
		];
		const paths = [
			shenxiuSkin.image,
			...audioFiles.map(file => shenxiuSkin.audioBase.replace(/^ext:/, "extension/") + "/" + file),
		];
		const result = { skin: getWuluxunSkinSelection() };
		await Promise.all(paths.map(async path => {
			try {
				const response = await fetch(lib.assetURL + path, { method: "HEAD", cache: "no-store" });
				result[path] = response.status;
			} catch (error) {
				result[path] = String(error?.message || error);
			}
		}));
		return result;
	};
}

function injectDocumentStyle(id, cssText) {
	let style = document.getElementById(id);
	if (!style) {
		style = document.createElement("style");
		style.id = id;
		document.head.appendChild(style);
	}
	style.textContent = cssText;
}

function hideEntryChrome() {
	injectDocumentStyle(
		"wuluxun-entry-chrome-style",
		[
			".dialog.character.fullwidth.fullheight .packnode,.dialog.character.fullwidth.fullheight .dialogbutton{opacity:0!important;pointer-events:none!important}",
			".main.menu.dialog{display:none!important;opacity:0!important;pointer-events:none!important}",
		].join("\n")
	);
	const cleanup = () => {
		document.querySelectorAll(".main.menu.dialog").forEach(node => {
			node.classList.add("wuluxun-hidden");
			node.style.display = "none";
			node.style.opacity = "0";
			node.style.pointerEvents = "none";
		});
		document.querySelectorAll(".dialog.character.fullwidth.fullheight .packnode,.dialog.character.fullwidth.fullheight .dialogbutton").forEach(node => {
			node.style.opacity = "0";
			node.style.pointerEvents = "none";
		});
	};
	cleanup();
	let tries = 0;
	const timer = setInterval(() => {
		cleanup();
		if (++tries > 80) clearInterval(timer);
	}, 100);
	if (Array.isArray(lib.arenaReady)) {
		lib.arenaReady.push(() => {
			cleanup();
			setTimeout(cleanup, 250);
			setTimeout(cleanup, 1000);
		});
	}
}

function createBrawlEntry(scene) {
	const entry = {
		name: "武陆逊单挑",
		intro: "武陆逊 vs 兀突骨。",
	};
	for (const key in lib.brawl.scene.template) {
		entry[key] = get.copy(lib.brawl.scene.template[key]);
	}
	entry.content.scene = scene;
	entry.showcase = function (init) {
		if (!init) return;
		this.innerHTML = "";
		ui.create.div(".text.center", "武陆逊 vs 兀突骨", this);
		let tries = 0;
		const timer = setInterval(() => {
			const start = document.querySelector(".menubutton.round.highlight");
			if (start && start.textContent === "斗") {
				clearInterval(timer);
				start.click();
			} else if (++tries > 60) {
				clearInterval(timer);
			}
		}, 120);
	};
	return entry;
}

function installBrawlEntry() {
	lib.storage.scene ??= {};
	lib.storage.stage ??= {};
	applySimulatorConfig();
	fixWuluxunGroup();

	const scene = makeScene();
	const stage = makeStage(scene);
	if (lib.brawl?.scene?.template) {
		lib.brawl[brawlKey] = createBrawlEntry(scene);
		delete lib.storage.scene[sceneName];
	} else {
		lib.storage.scene[sceneName] = scene;
	}
	lib.storage.stage[sceneName] = stage;

	lib.storage.currentBrawl = "stage_" + sceneName;
	lib.storage.directStage = [sceneName, 0];
	_status.extensionstage = true;
	_status.extensionscene = true;
	_status.extensionmade ??= [];
	addUnique(_status.extensionmade, sceneName);
}

function installMinimalChrome() {
	injectDocumentStyle(
		"wuluxun-minimal-chrome-style",
		[
			"body.wuluxun-game-background-active>.background.wuluxun-native-background{opacity:1!important;pointer-events:none!important}",
			"#system1>div:not(.wuluxun-keep),#system2>div{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}",
			"#system1>div.wuluxun-keep{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}",
			"#restartbutton{display:block!important;opacity:1!important}",
			"#roundmenu,#autobutton,#pausebutton,#system .wuluxun-hidden{display:none!important}",
			".menubutton.round.highlight,.buttonyjcm,body>img[src*='CD/button3.png']{display:none!important}",
			".player.wuluxun-shenxiu-skin>.avatar{background-position:58% 36%!important;background-size:auto 118%!important}",
		].join("\n")
	);
	if (!Array.isArray(lib.arenaReady)) return;
	lib.arenaReady.push(() => {
		applyLauncherBackgroundToGame().catch(error => console.warn(error));
		const keepMinimal = () => {
			const nodes = [
				ui.config2,
				ui.pause,
				ui.auto,
				ui.sortCard,
				ui.deckMonitor,
				ui.wuxie,
				ui.cardPileButton,
				ui.commonCardPileButton,
				ui.brawlinfo,
			];
			for (const node of nodes) {
				if (!node) continue;
				node.classList.add("wuluxun-hidden");
				if (node.style.display !== "none") node.style.display = "none";
			}
			if (ui.volumn) {
				ui.volumn.classList.add("wuluxun-keep");
				ui.volumn.classList.remove("wuluxun-hidden");
				ui.volumn.style.removeProperty("display");
				ui.volumn.style.removeProperty("visibility");
				ui.volumn.style.removeProperty("opacity");
				ui.volumn.style.removeProperty("pointer-events");
			}
			document.querySelectorAll("#system1>div,#system2>div").forEach(node => {
				const isVolume = node === ui.volumn || node.textContent?.trim() === "♫";
				if (isVolume) {
					node.classList.add("wuluxun-keep");
					node.classList.remove("wuluxun-hidden");
					node.style.removeProperty("display");
					node.style.removeProperty("visibility");
					node.style.removeProperty("opacity");
					node.style.removeProperty("pointer-events");
				} else {
					node.classList.add("wuluxun-hidden");
					if (node.style.display !== "none") node.style.setProperty("display", "none", "important");
					if (node.style.visibility !== "hidden") node.style.setProperty("visibility", "hidden", "important");
					if (node.style.opacity !== "0") node.style.setProperty("opacity", "0", "important");
					if (node.style.pointerEvents !== "none") node.style.setProperty("pointer-events", "none", "important");
				}
			});
			if (ui.replay) {
				ui.replay.innerHTML = "重来";
				ui.replay.style.display = "";
				ui.replay.onclick = () => {
					localStorage.setItem(lib.configprefix + "directstart", "true");
					game.reload();
				};
			}
		};
		keepMinimal();
		setTimeout(keepMinimal, 500);
		setTimeout(keepMinimal, 1500);
		setTimeout(keepMinimal, 3000);
		if (!window.__wuluxunMinimalChromeTimer) {
			let cleanupCount = 0;
			window.__wuluxunMinimalChromeTimer = setInterval(() => {
				keepMinimal();
				cleanupCount++;
				if (cleanupCount >= 30) {
					clearInterval(window.__wuluxunMinimalChromeTimer);
					window.__wuluxunMinimalChromeTimer = null;
				}
			}, 500);
		}
	});
}

export default async function () {
	return {
		name: extensionName,
		editable: false,
		content() {
			installShenxiuSkinAssets();
			installBrawlEntry();
			hideEntryChrome();
			installMinimalChrome();
			installAudioProbe();
		},
		package: {
			author: "local",
			intro: "网页单挑入口：武陆逊 vs 兀突骨，十周年UI由独立扩展提供。",
			version: "0.4.3",
		},
	};
}
