import { lib, game, ui, get, ai, _status } from "noname";
import characters from "./character.js";
import skills from "./skill.js";
import translates from "./translate.js";
import characterTitles from "./characterTitle.js";
import characterIntros from "./intro.js";
import voices from "./voices.js";

game.import("character", function () {
	return {
		name: "sp",
		connect: true,
		character: { ...characters },
		characterSort: {},
		characterFilter: {},
		characterTitle: { ...characterTitles },
		characterSubstitute: {},
		dynamicTranslate: {},
		characterIntro: { ...characterIntros },
		card: {},
		skill: { ...skills },
		perfectPair: {},
		translate: { ...translates, ...voices },
		pinyins: {},
	};
});
