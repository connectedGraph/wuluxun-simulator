import { lib, game, ui, get, ai, _status } from "noname";
import characters from "./character.js";
import pinyins from "./pinyin.js";
import skills from "./skill.js";
import translates from "./translate.js";
import characterTitles from "./characterTitle.js";
import voices from "./voices.js";
import { characterSort, characterSortTranslate } from "./sort.js";

game.import("character", function () {
	return {
		name: "xianding",
		connect: true,
		character: { ...characters },
		characterSort: {
			xianding: characterSort,
		},
		characterSubstitute: {},
		characterFilter: {},
		characterTitle: { ...characterTitles },
		dynamicTranslate: {},
		characterIntro: {},
		perfectPair: {},
		card: {},
		skill: { ...skills },
		translate: { ...translates, ...voices, ...characterSortTranslate },
		pinyins: { ...pinyins },
	};
});
