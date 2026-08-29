import { lib, game, ui, get, ai, _status } from "noname";

const skills = {
	ranshang: {
		audio: 2,
		trigger: { player: "damageEnd" },
		filter(event, player) {
			return event.hasNature("fire");
		},
		forced: true,
		check() {
			return false;
		},
		content() {
			player.addMark("ranshang", trigger.num);
		},
		intro: {
			name2: "燃",
			content: "mark",
		},
		ai: {
			neg: true,
			effect: {
				target(card, player, target, current) {
					if (card.name == "sha") {
						if (game.hasNature(card, "fire") || player.hasSkill("zhuque_skill")) {
							return 2;
						}
					}
					if (get.tag(card, "fireDamage") && current < 0) {
						return 2;
					}
				},
			},
		},
		group: "ranshang2",
	},
	ranshang2: {
		audio: 2,
		trigger: { player: "phaseJieshuBegin" },
		forced: true,
		sourceSkill: "ranshang",
		filter(event, player) {
			return player.countMark("ranshang") > 0;
		},
		content() {
			player.loseHp(player.countMark("ranshang"));
			if (player.countMark("ranshang") > 2) {
				player.loseMaxHp(2);
				player.draw(2);
			}
		},
	},
	hanyong: {
		audio: 2,
		trigger: { player: "useCard" },
		filter(event, player) {
			return event.card && (event.card.name == "nanman" || event.card.name == "wanjian" || (event.card.name == "sha" && !game.hasNature(event.card) && get.suit(event.card) == "spade")) && player.isDamaged();
		},
		content() {
			trigger.baseDamage++;
			if (game.roundNumber <= player.hp) {
				player.addMark("ranshang", 1);
			}
		},
	},
	hanyong3: {
		audio: false,
		trigger: { source: "damageBegin1" },
		forced: true,
		onremove: true,
		sourceSkill: "hanyong",
		filter(event, player) {
			return event.card == player.storage.hanyong3;
		},
		content() {
			trigger.num++;
		},
	},
};

export default skills;
