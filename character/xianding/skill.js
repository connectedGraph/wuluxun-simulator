import { lib, game, ui, get, ai, _status } from "noname";

const skills = {
	//武陆逊
	dcxiongmu: {
		audio: 2,
		trigger: { global: "roundStart" },
		group: "dcxiongmu_minus",
		prompt2(event, player) {
			return (player.countCards("h") < player.maxHp ? "将手牌摸至" + get.cnNumber(player.maxHp) + "张，然后" : "") + "将任意张牌随机置入牌堆并从牌堆或弃牌堆中获得等量点数为8的牌。";
		},
		async content(event, trigger, player) {
			await player.drawTo(player.maxHp);
			var cards = player.getCards("he");
			if (!cards.length) {
				return;
			}
			var result;
			let selectedCards = null;
			let selectedCount = 0;
			if (cards.length == 1) {
				result = { bool: true, cards: cards };
			} else {
				result = await player
					.chooseCard("雄幕：将任意张牌置入牌堆的随机位置", "he", [1, Infinity], true, "allowChooseAll")
					.set("ai", card => {
						return 6 - get.value(card);
					})
					.forResult();
			}
			if (result.bool) {
				selectedCards = result.cards;
				selectedCount = selectedCards.length;
				game.log(player, `将${get.cnNumber(selectedCount)}张牌置入了牌堆`);
				var next = player.loseToDiscardpile(selectedCards, ui.cardPile, "blank").set("log", false);
				next.insert_index = function () {
					return ui.cardPile.childNodes[get.rand(0, ui.cardPile.childNodes.length - 1)];
				};
				await next;
			} else {
				return;
			}
			var list = [],
				shown = [];
			var piles = ["cardPile", "discardPile"];
			for (var pile of piles) {
				for (var i = 0; i < ui[pile].childNodes.length; i++) {
					var card = ui[pile].childNodes[i];
					var number = get.number(card, false);
					if (!list.includes(card) && number == 8) {
						list.push(card);
						if (pile == "discardPile") {
							shown.push(card);
						}
						if (list.length >= selectedCount) {
							break;
						}
					}
				}
				if (list.length >= selectedCount) {
					break;
				}
			}
			if (list.length) {
				var next = player.gain(list);
				next.shown_cards = shown;
				next.set("animate", function (event) {
					var player = event.player,
						cards = event.cards,
						shown = event.shown_cards;
					if (shown.length < cards.length) {
						var num = cards.length - shown.length;
						player.$draw(num);
						game.log(player, "从牌堆获得了", get.cnNumber(num), "张点数为8的牌");
					}
					if (shown.length > 0) {
						player.$gain2(shown, false);
						game.log(player, "从弃牌堆获得了", shown);
					}
					return 500;
				});
				next.gaintag.add("dcxiongmu_tag");
				await next;
				player.addTempSkill("dcxiongmu_tag", "roundStart");
			}
		},
		ai: {
			effect: {
				target(card, player, target) {
					if (target.countCards("h") > target.getHp() || player.hasSkillTag("jueqing", false, target)) {
						return;
					}
					if (player._dcxiongmu_temp) {
						return;
					}
					if (_status.event.getParent("useCard", true) || _status.event.getParent("_wuxie", true)) {
						return;
					}
					if (get.tag(card, "damage")) {
						if (target.getHistory("damage").length > 0) {
							return [1, -2];
						} else {
							if (get.attitude(player, target) > 0 && target.hp > 1) {
								return "zeroplayertarget";
							}
							if (get.attitude(player, target) < 0 && !player.hasSkillTag("damageBonus")) {
								if (card.name == "sha") {
									return;
								}
								var sha = false;
								player._dcxiongmu_temp = true;
								var num = player.countCards("h", function (card) {
									if (card.name == "sha") {
										if (sha) {
											return false;
										} else {
											sha = true;
										}
									}
									return get.tag(card, "damage") && player.canUse(card, target) && get.effect(target, card, player, player) > 0;
								});
								delete player._dcxiongmu_temp;
								if (player.hasSkillTag("damage")) {
									num++;
								}
								if (num < 2) {
									var enemies = player.getEnemies();
									if (enemies.length == 1 && enemies[0] == target && player.needsToDiscard()) {
										return;
									}
									return "zeroplayertarget";
								}
							}
						}
					}
				},
			},
		},
		subSkill: {
			minus: {
				audio: "dcxiongmu",
				trigger: { player: "damageBegin4" },
				filter(event, player) {
					return (
						player.countCards("h") <= player.getHp() &&
						game
							.getGlobalHistory(
								"everything",
								evt => {
									return evt.name == "damage" && evt.player == player;
								},
								event
							)
							.indexOf(event) == 0
					);
				},
				forced: true,
				locked: false,
				async content(event, trigger, player) {
					trigger.num--;
				},
			},
			tag: {
				charlotte: true,
				onremove(player) {
					player.removeGaintag("dcxiongmu_tag");
				},
				mod: {
					ignoredHandcard(card, player) {
						if (card.hasGaintag("dcxiongmu_tag")) {
							return true;
						}
					},
					cardDiscardable(card, player, name) {
						if (name == "phaseDiscard" && card.hasGaintag("dcxiongmu_tag")) {
							return false;
						}
					},
				},
			},
		},
	},
	dczhangcai: {
		audio: 2,
		mod: {
			aiOrder: (player, card, num) => {
				if (num > 0 && get.tag(card, "draw") && ui.cardPile.childNodes.length + ui.discardPile.childNodes.length < 20) {
					return 0;
				}
			},
			aiValue: (player, card, num) => {
				if (num > 0 && card.name === "zhuge") {
					return 20;
				}
			},
			aiUseful: (player, card, num) => {
				if (num > 0 && card.name === "zhuge") {
					return 10;
				}
			},
		},
		trigger: {
			player: ["useCard", "respond"],
		},
		filter(event, player) {
			if (player.hasSkill("dczhangcai_all")) {
				return true;
			}
			return get.number(event.card) == 8;
		},
		prompt2(event, player) {
			const num = player.hasSkill("dczhangcai_all") ? get.number(event.card) : 8;
			let count = 1;
			if (typeof num == "number") {
				count = Math.max(
					1,
					player.countCards("h", card => get.number(card) == num)
				);
			}
			return "你可以摸" + get.cnNumber(count) + "张牌。";
		},
		check: (event, player) => {
			const num = player.hasSkill("dczhangcai_all") ? get.number(event.card) : 8;
			let count = 1;
			if (typeof num == "number") {
				count = Math.max(
					1,
					player.countCards("h", card => get.number(card) == num)
				);
			}
			return ui.cardPile.childNodes.length + ui.discardPile.childNodes.length >= count;
		},
		frequent: true,
		locked: false,
		content() {
			var num = player.hasSkill("dczhangcai_all") ? get.number(trigger.card) : 8;
			var count = 1;
			if (typeof num == "number") {
				count = Math.max(
					1,
					player.countCards("h", card => get.number(card) == num)
				);
			}
			player.draw(count, "nodelay");
		},
		ai: {
			threaten: 4,
			combo: "dcxiongmu",
		},
		subSkill: {
			all: {
				charlotte: true,
				mark: true,
				intro: {
					content: "当你使用或打出牌时，你可以摸X张牌（X为你手牌中与此牌点数相同的牌数且至少为1）",
				},
			},
		},
	},
	dcruxian: {
		audio: 2,
		enable: "phaseUse",
		limited: true,
		skillAnimation: true,
		animationColor: "wood",
		content() {
			"step 0";
			player.awakenSkill(event.name);
			player.addTempSkill("dczhangcai_all", { player: "phaseBegin" });
		},
		ai: {
			combo: "dczhangcai",
			order: 15,
			result: {
				player(player) {
					if (!player.hasSkill("dczhangcai")) {
						return 0;
					}
					if (player.countCards("hs", card => get.number(card) != 8 && player.hasValueTarget(card)) > 3 || player.hp == 1) {
						return 5;
					}
					return 0;
				},
			},
		},
	},
};

export default skills;
