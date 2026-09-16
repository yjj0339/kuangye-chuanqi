/* ===== 旷野传说 · 静态数据 ===== */
'use strict';
const D = {};

/* ---------- 装备品质 ---------- */
D.QUALITY = [
  { name:'普通', affixMin:0, affixMax:1, mult:1.00 },
  { name:'优秀', affixMin:1, affixMax:2, mult:1.12 },
  { name:'稀有', affixMin:2, affixMax:3, mult:1.28 },
  { name:'史诗', affixMin:3, affixMax:4, mult:1.50 },
  { name:'传说', affixMin:4, affixMax:5, mult:1.80 },
  { name:'暗金', affixMin:4, affixMax:5, mult:2.20 }, // 暗金额外带1条专属词条
];

/* ---------- 装备部位 ---------- */
D.SLOT_ORDER = ['weapon','helmet','armor','boots','necklace','ring'];
D.SLOTS = {
  weapon:  { name:'武器', icon:'🗡️', nouns:['长剑','战斧','战锤','法杖','匕首','巨剑'],
             base: ilv => ({ atk: 5 + ilv*2.8 }) },
  helmet:  { name:'头盔', icon:'🪖', nouns:['铁盔','角盔','兜帽','王冠','战盔'],
             base: ilv => ({ hp: 22 + ilv*9, def: 2 + ilv*1.0 }) },
  armor:   { name:'胸甲', icon:'🛡️', nouns:['皮甲','锁甲','板甲','法袍','战甲'],
             base: ilv => ({ def: 3.5 + ilv*1.6, hp: 16 + ilv*7 }) },
  boots:   { name:'靴子', icon:'🥾', nouns:['皮靴','战靴','疾风靴','重靴'],
             base: ilv => ({ spd: 2 + ilv*0.85, def: 1 + ilv*0.6 }) },
  necklace:{ name:'项链', icon:'📿', nouns:['吊坠','护符','珠链','圣链'],
             base: ilv => ({ mp: 10 + ilv*3.2, atk: 1.5 + ilv*1.0 }) },
  ring:    { name:'戒指', icon:'💍', nouns:['铁戒','宝石戒','印记戒','魔戒'],
             base: ilv => ({ atk: 2.5 + ilv*1.5, crit: 1 + ilv*0.12 }) },
};

/* ---------- 随机词条 ---------- */
/* stat: 聚合到角色面板的字段；pct: 显示时带 % */
D.AFFIXES = {
  atk_flat:  { name:'攻击',     stat:'atk',       w:10, gen:(l,q)=> Math.round((2+l*1.7)*(1+q*0.22)*(0.8+Math.random()*0.4)) },
  atk_pct:   { name:'攻击',     stat:'atkPct',    w:7,  pct:1, gen:(l,q)=> Math.round((3+q*1.6+l*0.16)*(0.8+Math.random()*0.4)) },
  hp_flat:   { name:'生命',     stat:'hp',        w:10, gen:(l,q)=> Math.round((12+l*7.5)*(1+q*0.22)*(0.8+Math.random()*0.4)) },
  hp_pct:    { name:'生命',     stat:'hpPct',     w:7,  pct:1, gen:(l,q)=> Math.round((3+q*1.6+l*0.16)*(0.8+Math.random()*0.4)) },
  def_flat:  { name:'防御',     stat:'def',       w:9,  gen:(l,q)=> Math.round((2+l*1.1)*(1+q*0.22)*(0.8+Math.random()*0.4)) },
  spd_flat:  { name:'速度',     stat:'spd',       w:8,  gen:(l,q)=> Math.round((1.5+l*0.5)*(1+q*0.2)*(0.8+Math.random()*0.4)) },
  crit_rate: { name:'暴击率',   stat:'crit',      w:6,  pct:1, gen:(l,q)=> Math.round((2+q*0.8+l*0.05)*(0.8+Math.random()*0.4)*10)/10 },
  crit_dmg:  { name:'暴击伤害', stat:'critDmg',   w:6,  pct:1, gen:(l,q)=> Math.round((8+q*3+l*0.2)*(0.8+Math.random()*0.4)) },
  lifesteal: { name:'吸血',     stat:'lifesteal', w:5,  pct:1, gen:(l,q)=> Math.round((1.2+q*0.6)*(0.8+Math.random()*0.4)*10)/10 },
  mp_flat:   { name:'法力',     stat:'mp',        w:7,  gen:(l,q)=> Math.round((8+l*2.6)*(1+q*0.22)*(0.8+Math.random()*0.4)) },
  skill_dmg: { name:'技能伤害', stat:'skillDmg',  w:6,  pct:1, gen:(l,q)=> Math.round((4+q*1.8+l*0.12)*(0.8+Math.random()*0.4)) },
  exp_pct:   { name:'经验获取', stat:'expPct',    w:3,  pct:1, gen:(l,q)=> Math.round((5+q*2)*(0.8+Math.random()*0.4)) },
  gold_pct:  { name:'金币获取', stat:'goldPct',   w:3,  pct:1, gen:(l,q)=> Math.round((8+q*3)*(0.8+Math.random()*0.4)) },
  dmg_reduce:{ name:'伤害减免', stat:'dmgReduce', w:4,  pct:1, gen:(l,q)=> Math.round((2+q*0.7)*(0.8+Math.random()*0.4)*10)/10 },
  dodge:     { name:'闪避',     stat:'dodge',     w:5,  pct:1, gen:(l,q)=> Math.round((1.2+q*0.5)*(0.8+Math.random()*0.4)*10)/10 },
};

/* ---------- 暗金专属装备 ---------- */
D.UNIQUES = [
  { slot:'weapon',   name:'灭世之刃',     special:{ stat:'skillDmg',  v:25, name:'技能伤害' } },
  { slot:'weapon',   name:'苍穹龙牙',     special:{ stat:'lifesteal', v:8,  name:'吸血' } },
  { slot:'helmet',   name:'龙王之冠',     special:{ stat:'dmgReduce', v:8,  name:'伤害减免' } },
  { slot:'helmet',   name:'贤者之冕',     special:{ stat:'expPct',    v:30, name:'经验获取' } },
  { slot:'armor',    name:'不灭神铠',     special:{ stat:'hpPct',     v:20, name:'生命' } },
  { slot:'armor',    name:'凤凰羽衣',     special:{ stat:'dmgReduce', v:6,  name:'伤害减免' } },
  { slot:'boots',    name:'逐风者之靴',   special:{ stat:'dodge',     v:8,  name:'闪避' } },
  { slot:'boots',    name:'雷鸣战靴',     special:{ stat:'crit',      v:8,  name:'暴击率' } },
  { slot:'necklace', name:'永恒之心',     special:{ stat:'lifesteal', v:6,  name:'吸血' } },
  { slot:'necklace', name:'黄金律',       special:{ stat:'goldPct',   v:50, name:'金币获取' } },
  { slot:'ring',     name:'弑神者之戒',   special:{ stat:'critDmg',   v:45, name:'暴击伤害' } },
  { slot:'ring',     name:'守护者之誓',   special:{ stat:'atkPct',    v:15, name:'攻击' } },
];

/* ---------- 主动技能 ---------- */
/* type: dmg单体 multi连击 aoe全体 heal治疗 buff增益 dmg_debuff dmg_stun */
D.SKILLS = {
  slash:   { name:'猛击',     icon:'⚔️', req:1,  mp:8,  cd:0, max:5, type:'dmg',
             mult:l=>1.45+0.13*l, desc:l=>`造成 ${Math.round((1.45+0.13*l)*100)}% 攻击力的伤害` },
  doubles: { name:'连斩',     icon:'🔪', req:3,  mp:12, cd:0, max:5, type:'multi', hits:2,
             mult:l=>0.82+0.08*l, desc:l=>`连续攻击 2 次，每次 ${Math.round((0.82+0.08*l)*100)}% 攻击力` },
  heal:    { name:'治愈术',   icon:'💚', req:5,  mp:15, cd:3, max:5, type:'heal',
             mult:l=>0.24+0.05*l, desc:l=>`恢复 ${Math.round((0.24+0.05*l)*100)}% 最大生命（受精神加成）` },
  flame:   { name:'烈焰冲击', icon:'🔥', req:8,  mp:20, cd:1, max:5, type:'aoe',
             mult:l=>1.85+0.16*l, desc:l=>`火焰冲击全体敌人，造成 ${Math.round((1.85+0.16*l)*100)}% 攻击力伤害` },
  armorbrk:{ name:'破甲斩',   icon:'🔨', req:11, mp:16, cd:2, max:5, type:'dmg_debuff', defDown:0.3, dur:3,
             mult:l=>1.35+0.11*l, desc:l=>`造成 ${Math.round((1.35+0.11*l)*100)}% 伤害，并降低目标 30% 防御 3 回合` },
  rage:    { name:'狂暴',     icon:'💢', req:14, mp:18, cd:5, max:5, type:'buff', dur:3,
             atkUp:l=>0.28+0.05*l, desc:l=>`攻击提升 ${Math.round((0.28+0.05*l)*100)}%，持续 3 回合` },
  shield:  { name:'圣盾术',   icon:'🔰', req:17, mp:20, cd:5, max:5, type:'buff', dur:2,
             dmgCut:l=>0.38+0.05*l, desc:l=>`受到伤害降低 ${Math.round((0.38+0.05*l)*100)}%，持续 2 回合` },
  thunder: { name:'雷霆万钧', icon:'🌩️', req:21, mp:28, cd:3, max:5, type:'dmg_stun',
             mult:l=>2.6+0.22*l, stun:l=>Math.min(0.75,0.35+0.06*l),
             desc:l=>`造成 ${Math.round((2.6+0.22*l)*100)}% 伤害，${Math.round(Math.min(0.75,0.35+0.06*l)*100)}% 概率眩晕 1 回合` },
  revive:  { name:'神恩复苏', icon:'✨', req:25, mp:30, cd:6, max:5, type:'heal', cleanse:true,
             mult:l=>0.48+0.05*l, desc:l=>`恢复 ${Math.round((0.48+0.05*l)*100)}% 最大生命并净化减益` },
  doom:    { name:'末日审判', icon:'☄️', req:30, mp:40, cd:4, max:5, type:'aoe',
             mult:l=>3.6+0.32*l, desc:l=>`审判全体敌人，造成 ${Math.round((3.6+0.32*l)*100)}% 攻击力的毁天灭地伤害` },
};
D.SKILL_ORDER = ['slash','doubles','heal','flame','armorbrk','rage','shield','thunder','revive','doom'];

/* ---------- 被动技能 ---------- */
D.PASSIVES = {
  tough:   { name:'强壮',     icon:'💪', req:4,  max:5, per:8,  stat:'hpPct',     desc:'每级生命上限 +8%' },
  master:  { name:'武器大师', icon:'🗡️', req:7,  max:5, per:6,  stat:'atkPct',    desc:'每级攻击 +6%' },
  swift:   { name:'迅捷',     icon:'🌀', req:10, max:5, per:6,  stat:'spdPct',    desc:'每级速度 +6%' },
  precise: { name:'精准',     icon:'🎯', req:13, max:5, per:3,  stat:'crit',      desc:'每级暴击率 +3%' },
  vamp:    { name:'吸血诀',   icon:'🩸', req:19, max:5, per:4,  stat:'lifesteal', desc:'每级吸血 +4%' },
  iron:    { name:'铁壁',     icon:'🧱', req:23, max:5, per:8,  stat:'defPct',    desc:'每级防御 +8%' },
};
D.PASSIVE_ORDER = ['tough','master','swift','precise','vamp','iron'];

/* ---------- 怪物六档 ---------- */
D.TIERS = {
  normal:  { name:'普通',   cls:'t-normal', hp:1,   atk:1,    def:1,    spd:1,    exp:1,   gold:1,  drop:0.14, ilvBonus:0 },
  elite:   { name:'精英',   cls:'t-elite',  hp:1.75,atk:1.28, def:1.15, spd:1.05, exp:2.4, gold:2.2,drop:0.6,  ilvBonus:1 },
  boss:    { name:'BOSS',   cls:'t-boss',   hp:2.9, atk:1.55, def:1.3,  spd:1.05, exp:5.5, gold:5,  drop:1,    ilvBonus:2 },
  darkgold:{ name:'暗金',   cls:'t-dark',   hp:3.8, atk:1.85, def:1.5,  spd:1.1,  exp:9,   gold:9,  drop:1,    ilvBonus:3 },
  stage:   { name:'大BOSS', cls:'t-stage',  hp:4.2, atk:1.9,  def:1.8,  spd:1.1,  exp:14,  gold:14, drop:1,    ilvBonus:3 },
  final:   { name:'终极',   cls:'t-final',  hp:9.5, atk:2.9,  def:2.1,  spd:1.2,  exp:40,  gold:60, drop:1,    ilvBonus:4 },
};

/* 怪物基础属性（普通怪，等级 lv），mod 为个体修正 */
D.monsterBase = (lv, mod={}) => ({
  hp:  Math.round((55 + lv*26 + 4.2*Math.pow(lv,1.65)) * (mod.hp||1)),
  atk: Math.round((5 + lv*3.0 + 0.55*Math.pow(lv,1.6)) * (mod.atk||1)),
  def: Math.round((1 + lv*1.3 + 0.3*Math.pow(lv,1.5)) * (mod.def||1)),
  spd: Math.round((5 + lv*0.8) * (mod.spd||1)),
  exp:  Math.round(22 + lv*13),
  gold: Math.round(5 + lv*5.5),
});

/* ---------- 野外地图 ---------- */
D.MAPS = [
  { id:'m1', name:'微风草原', icon:'🌾', minLv:1,  maxLv:7,  recLv:7,
    desc:'微风拂过青翠的草原，野花遍地。狼群在草丛中出没，传说草原深处沉睡着狼王芬里尔。',
    monsters:[
      { name:'草原狼', icon:'🐺', mod:{spd:1.15} },
      { name:'野兔精', icon:'🐰', mod:{hp:0.85,spd:1.25} },
      { name:'青毒蛇', icon:'🐍', mod:{atk:1.15,hp:0.9} },
    ],
    elite:    { name:'恶狼头领',     icon:'🐺', mod:{hp:1.1,atk:1.1} },
    boss:     { name:'钢牙巨狼',     icon:'🦷', skills:[{name:'撕裂爪',mult:1.7,cd:3}] },
    darkgold: { name:'金鬃狮王',     icon:'🦁', skills:[{name:'王者咆哮',mult:1.9,cd:3},{name:'狮王连击',mult:1.3,cd:2,hits:2}] },
    stage:    { name:'草原狼王·芬里尔', icon:'👑', skills:[{name:'月光撕裂',mult:2.1,cd:3},{name:'狼王狂暴',buff:{atkUp:0.3,dur:3},cd:5}] },
  },
  { id:'m2', name:'翠影森林', icon:'🌲', minLv:7,  maxLv:13, recLv:13,
    desc:'阳光透过层层树叶洒下斑驳光影。古老的树精守护着森林，更深处传来千年树妖的低语。',
    monsters:[
      { name:'小树精', icon:'🌳', mod:{hp:1.2,spd:0.85} },
      { name:'毒蜘蛛', icon:'🕷️', mod:{atk:1.15} },
      { name:'林妖',   icon:'🧚', mod:{spd:1.15,hp:0.9} },
    ],
    elite:    { name:'荆棘卫士',     icon:'🌵', mod:{def:1.3,hp:1.1} },
    boss:     { name:'千年树妖',     icon:'🎋', skills:[{name:'缠绕根须',mult:1.6,cd:3},{name:'汲取生命',mult:1.2,cd:4,drain:0.5}] },
    darkgold: { name:'翡翠龙雏',     icon:'🐉', skills:[{name:'龙息',mult:2.0,cd:3},{name:'鳞甲硬化',buff:{defUp:0.4,dur:3},cd:5}] },
    stage:    { name:'森林之王·奥伯伦', icon:'🦌', skills:[{name:'荆棘风暴',mult:2.2,cd:3},{name:'自然治愈',heal:0.18,cd:5},{name:'王者之怒',buff:{atkUp:0.35,dur:3},cd:6}] },
  },
  { id:'m3', name:'流沙荒漠', icon:'🏜️', minLv:13, maxLv:19, recLv:19,
    desc:'烈日炙烤着金色沙丘，海市蜃楼若隐若现。沙漠女王的蝎群在沙下潜行，等待猎物。',
    monsters:[
      { name:'沙蝎',   icon:'🦂', mod:{def:1.2} },
      { name:'沙漠盗匪', icon:'🗡️', mod:{atk:1.1,spd:1.1} },
      { name:'火蜥蜴', icon:'🦎', mod:{atk:1.15,hp:0.95} },
    ],
    elite:    { name:'沙暴巨人',     icon:'🌪️', mod:{hp:1.2,atk:1.05} },
    boss:     { name:'沙漠女王蝎',   icon:'👸', skills:[{name:'剧毒尾刺',mult:1.8,cd:3},{name:'沙暴突袭',mult:1.4,cd:2,hits:2}] },
    darkgold: { name:'黄金圣甲虫',   icon:'🪲', skills:[{name:'圣光冲撞',mult:2.1,cd:3},{name:'黄金甲壳',buff:{defUp:0.5,dur:2},cd:5}] },
    stage:    { name:'荒漠死神·阿努比斯', icon:'⚱️', skills:[{name:'死神镰刀',mult:2.3,cd:3},{name:'沙葬',mult:1.6,cd:4,stun:0.4},{name:'亡灵汲取',mult:1.3,cd:5,drain:0.6}] },
  },
  { id:'m4', name:'冰霜雪原', icon:'❄️', minLv:19, maxLv:25, recLv:25,
    desc:'千里冰封的雪原上，极光在夜空中舞动。寒冰女巫的宫殿矗立在暴风雪的中心。',
    monsters:[
      { name:'雪原狼', icon:'🐺', mod:{spd:1.15} },
      { name:'冰元素', icon:'🧊', mod:{def:1.25,spd:0.9} },
      { name:'小雪怪', icon:'⛄', mod:{hp:1.2,atk:1.05} },
    ],
    elite:    { name:'冰霜巨人',     icon:'🧌', mod:{hp:1.25,atk:1.1,spd:0.85} },
    boss:     { name:'寒冰女巫',     icon:'🧙‍♀️', skills:[{name:'寒冰箭',mult:1.9,cd:3},{name:'冻结',mult:1.2,cd:4,stun:0.5}] },
    darkgold: { name:'冰晶凤凰',     icon:'🦅', skills:[{name:'冰晶风暴',mult:2.1,cd:3},{name:'涅槃',heal:0.22,cd:6}] },
    stage:    { name:'极寒魔王·弗罗斯特', icon:'👹', skills:[{name:'绝对零度',mult:2.4,cd:3},{name:'冰封万里',mult:1.5,cd:4,stun:0.45},{name:'寒冰护体',buff:{defUp:0.45,dur:3},cd:6}] },
  },
  { id:'m5', name:'熔岩火山', icon:'🌋', minLv:25, maxLv:31, recLv:31,
    desc:'岩浆在火山口翻滚，灼热的气浪扑面而来。炎狱君主的王座由黑曜石铸成，焚烧一切来犯者。',
    monsters:[
      { name:'火元素', icon:'🔥', mod:{atk:1.2,hp:0.95} },
      { name:'熔岩魔', icon:'🌋', mod:{def:1.2,hp:1.1} },
      { name:'小炎魔', icon:'😈', mod:{atk:1.15,spd:1.1} },
    ],
    elite:    { name:'烈焰领主',     icon:'🔥', mod:{atk:1.15,hp:1.15} },
    boss:     { name:'熔核巨兽',     icon:'🦖', skills:[{name:'熔岩喷吐',mult:1.9,cd:3},{name:'地震践踏',mult:1.7,cd:4}] },
    darkgold: { name:'焚天火凤',     icon:'🐦‍🔥', skills:[{name:'焚天之焰',mult:2.2,cd:3},{name:'浴火重生',heal:0.25,cd:6}] },
    stage:    { name:'炎狱君主·伊格尼斯', icon:'😈', skills:[{name:'地狱烈焰',mult:2.5,cd:3},{name:'岩浆爆发',mult:1.8,cd:4},{name:'炎魔之怒',buff:{atkUp:0.4,dur:3},cd:6}] },
  },
  { id:'m6', name:'苍穹神殿', icon:'⛩️', minLv:31, maxLv:38, recLv:37,
    desc:'悬浮于云端的神圣殿堂，圣光笼罩着每一级白玉台阶。神殿之巅，苍穹龙王等待着真正的勇者。',
    monsters:[
      { name:'圣殿守卫', icon:'💂', mod:{def:1.25,hp:1.1} },
      { name:'雷鹰',   icon:'🦅', mod:{spd:1.25,atk:1.1} },
      { name:'光元素', icon:'✨', mod:{atk:1.15} },
    ],
    elite:    { name:'圣裁骑士',     icon:'🛡️', mod:{hp:1.15,def:1.15} },
    boss:     { name:'堕落天使',     icon:'😇', skills:[{name:'堕天一击',mult:2.0,cd:3},{name:'黑暗审判',mult:1.6,cd:4,stun:0.4}] },
    darkgold: { name:'神圣天马',     icon:'🦄', skills:[{name:'圣光践踏',mult:2.2,cd:3},{name:'神圣庇护',heal:0.2,cd:5}] },
    stage:    { name:'神殿主宰·塞拉芬', icon:'👼', skills:[{name:'神罚之光',mult:2.6,cd:3},{name:'神圣审判',mult:1.9,cd:4,stun:0.5},{name:'神佑',heal:0.2,cd:6}] },
    final:    { name:'苍穹龙王·奥瑞利安', icon:'🐲', skills:[{name:'龙神吐息',mult:2.8,cd:3},{name:'苍穹陨星',mult:2.2,cd:4},{name:'龙威',buff:{atkUp:0.45,dur:3},cd:5},{name:'龙鳞护体',buff:{defUp:0.5,dur:3},cd:6},{name:'神龙摆尾',mult:1.8,cd:2,stun:0.45}] },
  },
];

/* ---------- 药水 ---------- */
D.POTIONS = {
  hp1: { name:'小治疗药水', icon:'🧪', heal:0.4,  price:30,  desc:'恢复 40% 生命' },
  hp2: { name:'治疗药水',   icon:'🍷', heal:0.65, price:90,  desc:'恢复 65% 生命' },
  hp3: { name:'大治疗药水', icon:'💖', heal:1.0,  price:240, desc:'完全恢复生命' },
  mp1: { name:'小法力药水', icon:'🔷', mana:0.5,  price:30,  desc:'恢复 50% 法力' },
  mp2: { name:'法力药水',   icon:'💠', mana:1.0,  price:90,  desc:'完全恢复法力' },
};

/* ---------- 商店 ---------- */
D.SHOP = [
  { id:'hp1', type:'potion' }, { id:'hp2', type:'potion' }, { id:'hp3', type:'potion' },
  { id:'mp1', type:'potion' }, { id:'mp2', type:'potion' },
  { id:'enhance', type:'mat', name:'强化石', icon:'🔮', price:50,  desc:'装备强化必备材料' },
  { id:'reroll',  type:'mat', name:'洗练石', icon:'🌀', price:120, desc:'重铸装备随机词条' },
];

/* ---------- 材料名 ---------- */
D.MATS = {
  iron:    { name:'精铁',   icon:'⛏️' },
  hide:    { name:'兽皮',   icon:'🟫' },
  crystal: { name:'魔晶',   icon:'💎' },
  enhance: { name:'强化石', icon:'🔮' },
  reroll:  { name:'洗练石', icon:'🌀' },
  essence: { name:'暗金精华', icon:'🌟' },
};

/* ---------- 经验曲线 ---------- */
D.expNeed = lv => Math.round(55 * Math.pow(lv, 1.55));
D.MAX_LV = 45;

/* ---------- 强化规则 ---------- */
/* 索引为当前 plus，值为升到 plus+1 的成功率(%) */
D.ENHANCE_RATE = [100,100,100,92,86,80,72,64,55,46,38,30,24,18,12];
D.ENHANCE_MAX = 15;
D.enhanceCost = (plus, ilv) => ({
  gold: Math.round((30 + ilv*4) * (plus+1) * 0.9),
  stone: Math.max(1, Math.round((plus+1) * (plus >= 8 ? 2 : 1))),
});
D.enhanceFail = plus => plus >= 8 ? -1 : 0; // +8 以上失败掉 1 级

/* ---------- 无尽试炼塔 ---------- */
D.TOWER_MOBS = [
  { name:'试炼傀儡', icon:'🤖', mod:{def:1.2} },
  { name:'石像鬼',   icon:'🗿', mod:{hp:1.15,spd:0.9} },
  { name:'暗影狼',   icon:'🐺', mod:{spd:1.2,atk:1.05} },
  { name:'塔灵',     icon:'🔮', mod:{atk:1.15} },
  { name:'岩魔',     icon:'🪨', mod:{hp:1.2,def:1.15,spd:0.85} },
  { name:'风灵',     icon:'🌪️', mod:{spd:1.25} },
  { name:'焰灵',     icon:'🔥', mod:{atk:1.2,hp:0.9} },
  { name:'冰灵',     icon:'🧊', mod:{def:1.25} },
];
D.TOWER_MASTERS = ['石巨人王','傀儡统帅','风暴之眼','熔核守卫','寒冰魔像','虚空行者'];
D.towerLv = fl => Math.round(4 + fl*1.6);

/* ---------- 成就 ---------- */
/* prog: [当前值, 目标值]；reward: gold 与材料 */
D.ACHIEVEMENTS = [
  { id:'k1',     icon:'🗡️', name:'初出茅庐',   desc:'击败第 1 只怪物',            prog:s=>[s.stats.kills,1],      reward:{gold:50} },
  { id:'k100',   icon:'⚔️', name:'斩妖百计',   desc:'累计击败 100 只怪物',        prog:s=>[s.stats.kills,100],    reward:{gold:200} },
  { id:'k500',   icon:'🏹', name:'屠魔五百',   desc:'累计击败 500 只怪物',        prog:s=>[s.stats.kills,500],    reward:{gold:500, mats:{enhance:5}} },
  { id:'k2000',  icon:'💀', name:'旷野死神',   desc:'累计击败 2000 只怪物',       prog:s=>[s.stats.kills,2000],   reward:{gold:1500, mats:{crystal:10}} },
  { id:'e10',    icon:'🎯', name:'精英猎手',   desc:'击败 10 只精英怪',           prog:s=>[s.stats.elite,10],     reward:{gold:150} },
  { id:'b5',     icon:'👹', name:'BOSS 克星',  desc:'击败 5 只 BOSS',             prog:s=>[s.stats.boss,5],       reward:{mats:{reroll:2}} },
  { id:'d1',     icon:'🌟', name:'暗金猎人',   desc:'击败 1 只暗金小Boss',        prog:s=>[s.stats.darkgold,1],   reward:{mats:{enhance:3}} },
  { id:'d10',    icon:'💫', name:'暗金收藏家', desc:'击败 10 只暗金小Boss',       prog:s=>[s.stats.darkgold,10],  reward:{mats:{essence:2}} },
  { id:'st1',    icon:'🏁', name:'初露锋芒',   desc:'击败 1 个关卡大Boss',        prog:s=>[s.stats.stage,1],      reward:{gold:300} },
  { id:'st6',    icon:'👑', name:'六域征服者', desc:'击败全部 6 个关卡大Boss',    prog:s=>[s.stats.stage,6],      reward:{gold:1000, mats:{essence:3}} },
  { id:'clear',  icon:'🐲', name:'屠龙勇者',   desc:'击败终极 Boss 苍穹龙王',     prog:s=>[s.flags.gameClear?1:0,1], reward:{gold:2000, mats:{essence:5}} },
  { id:'eh10',   icon:'🔨', name:'小铁匠',     desc:'成功强化 10 次',             prog:s=>[s.stats.enhanced,10],  reward:{mats:{enhance:5}} },
  { id:'eh15',   icon:'⚒️', name:'神匠在世',   desc:'拥有 1 件 +15 装备',         prog:s=>[ (D.SLOT_ORDER.some(sl=>s.hero.equip[sl]&&(s.hero.equip[sl].plus||0)>=15)||s.inv.some(it=>(it.plus||0)>=15))?1:0 ,1], reward:{mats:{enhance:10}} },
  { id:'cf20',   icon:'🛠️', name:'打造达人',   desc:'累计打造 20 件装备',         prog:s=>[s.stats.crafted,20],   reward:{mats:{iron:20,hide:10}} },
  { id:'tw10',   icon:'🗼', name:'试炼新星',   desc:'无尽试炼到达第 10 层',       prog:s=>[s.tower?s.tower.best:0,10], reward:{gold:500} },
  { id:'tw25',   icon:'🌌', name:'试炼王者',   desc:'无尽试炼到达第 25 层',       prog:s=>[s.tower?s.tower.best:0,25], reward:{mats:{essence:3}} },
  { id:'lv45',   icon:'🎖️', name:'登峰造极',   desc:'角色达到满级 Lv.45',         prog:s=>[s.hero.lv,45],         reward:{gold:3000} },
  { id:'rich',   icon:'💰', name:'腰缠万贯',   desc:'持有 10 万金币',             prog:s=>[s.gold,100000],        reward:{mats:{reroll:3}} },
];
