import { lib, game, ui, get, ai, _status } from "noname";

const translates = {
	wu_luxun: "武陆逊",
	wu_luxun_prefix: "武",
	dcxiongmu: "雄幕",
	dcxiongmu_tag: "雄幕",
	dcxiongmu_info: "①每轮开始时，你可以将手牌摸至体力上限（若手牌数不小于体力上限则跳过），然后将任意张牌随机置入牌堆，从牌堆或弃牌堆中获得等量的点数为8的牌，且这些牌本轮不计入手牌上限。②当你于一回合首次受到伤害时，若你的手牌数不大于你的体力值，此伤害-1。",
	dczhangcai: "彰才",
	dczhangcai_info: "当你使用或打出点数为8的牌时，你可以摸X张牌（X为你手牌区里点数为8的牌数且至少为1）。",
	dcruxian: "儒贤",
	dcruxian_info: "限定技。出牌阶段，你可以令你〖彰才〗的点数限制取消，且摸牌数改为等同于你手牌区内与此牌点数相同的牌数且至少为1，直到你的下回合开始。",
};

export default translates;
