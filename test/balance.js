/* 平衡性模拟：加载真实 data.js + engine.js，模拟各档位战斗胜率 */
'use strict';
const fs = require('fs');
const path = require('path');

const vm = require('vm');
const sandbox = { console, Math, Date, JSON, localStorage:{ getItem:()=>null, setItem:()=>{}, removeItem:()=>{} } };
vm.createContext(sandbox);
const src = ['data.js','engine.js'].map(f=>fs.readFileSync(path.join(__dirname,'..','js',f),'utf8')).join('\n');
vm.runInContext(src + '\n;globalThis.__X = { D, G };', sandbox);
const { D, G } = sandbox.__X;

/* 复制 battle.js 的伤害公式（保持同步） */
function dmgCalc(att, def, mult, isSkill){
  const dodge = def.stats.dodge || 0;
  if (dodge > 0 && Math.random()*100 < dodge) return { miss:true, dmg:0 };
  const atkUp = (att.atkUp||0);
  const raw = att.stats.atk * (1+atkUp) * mult * (0.9 + Math.random()*0.2);
  const dDef = Math.max(0, def.stats.def * (1 - (def.defDown||0)));
  const red = Math.min(0.72, dDef / (dDef + 55 + 8*(att.lv||1)));
  let dmg = raw * (1 - red);
  let crit = false;
  if (Math.random()*100 < (att.stats.crit||0)){ crit = true; dmg *= (att.stats.critDmg||150)/100; }
  if (isSkill && att.side==='hero') dmg *= 1 + (att.stats.skillDmg||0)/100;
  if (def.stats.dmgReduce) dmg *= 1 - Math.min(60, def.stats.dmgReduce)/100;
  return { dmg: Math.max(1, Math.round(dmg)), crit };
}

/* 构造某等级、某装备档次的英雄 */
function makeHero(lv, gearQ){
  G.newGame();
  const h = G.state.hero;
  h.lv = lv;
  h.attrs = { str: Math.round(lv*1.4), vit: Math.round(lv*1.0), agi: Math.round(lv*0.4), spi: Math.round(lv*0.2) };
  h.skills = { slash: Math.min(5, 1+Math.floor(lv/6)) };
  if (lv >= 5) h.skills.heal = Math.min(5, 1+Math.floor(lv/8));
  if (lv >= 8) h.skills.flame = Math.min(5, 1+Math.floor(lv/9));
  if (lv >= 14) h.skills.rage = 2;
  if (lv >= 21) h.skills.thunder = 2;
  D.SLOT_ORDER.forEach((slot,i)=>{
    const q = Math.max(0, Math.min(5, gearQ + (i===0?1:0) + (Math.random()<0.3?1:0) - (Math.random()<0.25?1:0)));
    h.equip[slot] = G.genItem(lv, q, slot);
    h.equip[slot].plus = Math.min(15, Math.floor(lv/4));
  });
  h.potions = { hp1:5, hp2:3, hp3:1, mp1:3, mp2:1 };
  const st = G.calcHero();
  h.hp = st.maxHp; h.mp = st.maxMp;
  return { h, st };
}

/* 模拟一场战斗 */
function simBattle(heroInfo, foe, usePotion){
  const h = { side:'hero', lv:heroInfo.h.lv, stats:heroInfo.st, hp:heroInfo.st.maxHp, mp:heroInfo.st.maxMp, atkUp:0, defDown:0 };
  const f = { side:'foe', lv:foe.lv, stats:{ ...foe.stats }, hp:foe.stats.maxHp, atkUp:0, defDown:0, skills:foe.skills||[] };
  let healCd = 0, rounds = 0, potions = usePotion ? 3 : 0;
  const skills = heroInfo.h.skills;
  while (rounds++ < 80){
    healCd = Math.max(0, healCd-1);
    // 英雄行动
    if (skills.heal && healCd===0 && h.hp < h.stats.maxHp*0.35 && h.mp >= 15){
      h.hp = Math.min(h.stats.maxHp, h.hp + Math.round(h.stats.maxHp*0.3)); h.mp -= 15; healCd = 3;
    } else if (potions>0 && h.hp < h.stats.maxHp*0.25){
      h.hp = Math.min(h.stats.maxHp, h.hp + Math.round(h.stats.maxHp*0.65)); potions--;
    } else if (skills.rage && h.atkUp<=0 && h.mp>=18 && f.stats.maxHp > h.stats.maxHp*1.5){
      h.atkUp = 0.35; h.mp -= 18;
    } else if (skills.thunder && h.mp>=28){
      const r = dmgCalc(h, f, 2.9, true); f.hp -= r.dmg; h.mp -= 28;
    } else if (skills.flame && h.mp>=20){
      const r = dmgCalc(h, f, 2.1, true); f.hp -= r.dmg; h.mp -= 20;
    } else if (h.mp >= 8){
      const r = dmgCalc(h, f, 1.6, true); f.hp -= r.dmg; h.mp -= 8;
    } else {
      const r = dmgCalc(h, f, 1, false); f.hp -= r.dmg;
    }
    // 吸血
    if (f.hp <= 0) return { win:true, rounds, hpLeft: h.hp/h.stats.maxHp };
    // 怪物行动
    const usable = f.skills.filter(s=>s.mult);
    if (usable.length && Math.random()<0.5){
      const sk = usable[Math.floor(Math.random()*usable.length)];
      const r = dmgCalc(f, h, sk.mult, true); if (!r.miss) h.hp -= r.dmg;
    } else {
      const r = dmgCalc(f, h, 1, false); if (!r.miss) h.hp -= r.dmg;
    }
    if (h.hp <= 0) return { win:false, rounds, hpLeft:0 };
  }
  return { win:false, rounds:80, hpLeft:h.hp/h.stats.maxHp, timeout:true };
}

function trials(lv, gear, m, tier, n, usePotion){
  let wins = 0, rounds = 0, hp = 0;
  for (let i=0;i<n;i++){
    const hero = makeHero(lv, gear);           // 每场重建，平均装备运气
    const foe = G.makeFoe(m, tier);
    const r = simBattle(hero, foe, usePotion);
    if (r.win){ wins++; rounds += r.rounds; hp += r.hpLeft; }
  }
  return { rate: (wins/n*100).toFixed(0)+'%', rounds: wins?(rounds/wins).toFixed(1):'-', hpLeft: wins?(hp/wins*100).toFixed(0)+'%':'-' };
}

/* ============ 场景 ============ */
console.log('========== 平衡性模拟（每场 120 次） ==========');
const scenarios = [
  { lv:1,  gear:0, map:0, tiers:['normal'], pot:false, label:'Lv1 新手出门' },
  { lv:4,  gear:1, map:0, tiers:['normal','elite','boss'], pot:true, label:'Lv4 草原(绿装)' },
  { lv:6,  gear:2, map:0, tiers:['stage'], pot:true, label:'Lv6 越1级打草原大Boss(蓝装)' },
  { lv:7,  gear:2, map:0, tiers:['stage','darkgold'], pot:true, label:'Lv7 推荐级草原大Boss/暗金' },
  { lv:10, gear:2, map:1, tiers:['normal','elite','boss'], pot:true, label:'Lv10 森林(蓝装)' },
  { lv:12, gear:2, map:1, tiers:['stage'], pot:true, label:'Lv12 越1级森林大Boss' },
  { lv:13, gear:3, map:1, tiers:['stage','darkgold'], pot:true, label:'Lv13 推荐级森林大Boss/暗金(紫装)' },
  { lv:18, gear:3, map:2, tiers:['elite','stage','darkgold'], pot:true, label:'Lv18 荒漠(紫装)' },
  { lv:24, gear:3, map:3, tiers:['elite','stage','darkgold'], pot:true, label:'Lv24 雪原(紫装)' },
  { lv:30, gear:4, map:4, tiers:['elite','stage','darkgold'], pot:true, label:'Lv30 火山(橙装)' },
  { lv:36, gear:4, map:5, tiers:['elite','stage','darkgold'], pot:true, label:'Lv36 神殿(橙装)' },
  { lv:38, gear:5, map:5, tiers:['final'], pot:true, label:'Lv38 暗金套 终极Boss' },
  { lv:42, gear:5, map:5, tiers:['final'], pot:true, label:'Lv42 暗金套+强化 终极Boss' },
];
for (const sc of scenarios){
  for (const tier of sc.tiers){
    const m = D.MAPS[sc.map];
    const r = trials(sc.lv, sc.gear, m, tier, 120, sc.pot);
    console.log(`${sc.label} | ${m.name} ${tier.padEnd(8)} | 胜率 ${r.rate.padStart(4)} | 平均回合 ${r.rounds} | 胜时余血 ${r.hpLeft}`);
  }
}
/* 经验节奏 */
console.log('\n========== 升级节奏 ==========');
for (const lv of [1,3,5,10,15,20,25,30,35]){
  const foeLv = lv, exp = D.monsterBase(foeLv).exp;
  const need = D.expNeed(lv);
  console.log(`Lv.${lv} 升级需 ${need} 经验，同级普通怪 ${exp}/只 → 约 ${(need/exp).toFixed(1)} 只普通怪升 1 级`);
}
