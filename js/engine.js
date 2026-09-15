/* ===== 旷野传说 · 游戏引擎（状态/存档/属性/装备/锻造/探索） ===== */
'use strict';
const G = {
  SAVE_KEY: 'kuangye_chuanqi_save_v1',
  state: null,
  _uid: 1,
};

/* ---------- 工具 ---------- */
G.uid = () => 'it' + Date.now().toString(36) + (G._uid++).toString(36);
G.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
G.rf = (a, b) => a + Math.random() * (b - a);
G.pick = arr => arr[Math.floor(Math.random() * arr.length)];
G.fmt = n => n >= 10000 ? (n/10000).toFixed(1).replace(/\.0$/,'') + '万' : String(Math.round(n));

/* ---------- 新游戏 ---------- */
G.newGame = function(){
  const hero = {
    name:'冒险者', lv:1, exp:0, points:0,
    attrs:{ str:0, vit:0, agi:0, spi:0 },
    skillPoints:1,
    skills:{ slash:1 },       // 初始会猛击
    passives:{},
    equip:{ weapon:null, helmet:null, armor:null, boots:null, necklace:null, ring:null },
    potions:{ hp1:5, hp2:0, hp3:0, mp1:2, mp2:0 },
    hp:1, mp:1,               // 立即被 calc+回满覆盖
  };
  this.state = {
    version:1, hero, gold:120,
    inv:[], invCap:60,
    mats:{ iron:0, hide:0, crystal:0, enhance:5, reroll:2, essence:0 },
    curMap:'m1',
    maps:{}, pity:0, explores:0,
    stats:{ kills:0, elite:0, boss:0, darkgold:0, stage:0, deaths:0, enhanced:0, crafted:0 },
    flags:{ gameClear:false },
    createdAt: Date.now(), playSec:0,
  };
  D.MAPS.forEach((m,i)=>{ this.state.maps[m.id] = { unlocked: i===0, prog:0, stageKilled:false }; });
  // 初始装备一把白武器
  hero.equip.weapon = this.genItem(1, 0, 'weapon');
  const st = this.calcHero();
  hero.hp = st.maxHp; hero.mp = st.maxMp;
  this.save();
};

/* ---------- 存档（localStorage 同步必成 + 版本号 + 数值校验） ---------- */
G.save = function(){
  if (!this.state) return;
  try {
    this.state.savedAt = Date.now();
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.state));
    if (typeof UI !== 'undefined') UI.markSaved();
  } catch(e){ console.warn('存档失败', e); }
};
G.hasSave = function(){
  try { return !!localStorage.getItem(this.SAVE_KEY); } catch(e){ return false; }
};
G.load = function(){
  let raw = null;
  try { raw = localStorage.getItem(this.SAVE_KEY); } catch(e){}
  if (!raw) return false;
  try {
    const s = JSON.parse(raw);
    if (!s || s.version !== 1 || !s.hero) return false;
    // 数值字段防 NaN 感染
    const h = s.hero;
    ['lv','exp','points','skillPoints','hp','mp'].forEach(k=>{
      h[k] = Number(h[k]); if (!isFinite(h[k]) || h[k] < 0) h[k] = 0;
    });
    h.lv = Math.max(1, Math.min(D.MAX_LV, Math.round(h.lv)));
    s.gold = Math.max(0, Number(s.gold)||0);
    if (!s.inv || !Array.isArray(s.inv)) s.inv = [];
    if (!s.pity) s.pity = 0;
    this.state = s;
    return true;
  } catch(e){ console.warn('读档失败，开新档', e); return false; }
};

/* ---------- 角色属性计算 ---------- */
G.baseStats = lv => ({
  hp: 110 + lv*15, mp: 40 + lv*5.5, atk: 9 + lv*2.2, def: 5 + lv*1.4, spd: 8 + lv*0.75,
});

/* 单件装备提供的属性（含强化） */
G.itemStats = function(it){
  const out = {};
  const mult = 1 + 0.06 * (it.plus||0);
  for (const k in it.base) out[k] = Math.round(it.base[k] * mult * 10)/10;
  (it.affixes||[]).forEach(a=>{ out[a.stat] = (out[a.stat]||0) + a.v; });
  if (it.special){ const s = it.special; out[s.stat] = (out[s.stat]||0) + s.v; }
  return out;
};

G.calcHero = function(){
  const h = this.state.hero, lv = h.lv;
  const b = this.baseStats(lv);
  const s = {
    maxHp: b.hp + h.attrs.vit*12, maxMp: b.mp + h.attrs.spi*6,
    atk: b.atk + h.attrs.str*2, def: b.def, spd: b.spd + h.attrs.agi*1,
    crit: 5, critDmg: 150, lifesteal: 0, skillDmg: h.attrs.spi*0.6,
    expPct: 0, goldPct: 0, dmgReduce: 0, dodge: h.attrs.agi*0.12,
    atkPct: 0, hpPct: 0, spdPct: 0, defPct: 0,
  };
  // 装备
  for (const slot of D.SLOT_ORDER){
    const it = h.equip[slot]; if (!it) continue;
    const st = this.itemStats(it);
    for (const k in st){ s[k] = (s[k]||0) + st[k]; }
  }
  // 被动
  for (const pid in h.passives){
    const p = D.PASSIVES[pid]; if (!p) continue;
    s[p.stat] = (s[p.stat]||0) + p.per * h.passives[pid];
  }
  // 百分比结算
  s.atk = s.atk * (1 + s.atkPct/100);
  s.maxHp = s.maxHp * (1 + s.hpPct/100);
  s.spd = s.spd * (1 + s.spdPct/100);
  s.def = s.def * (1 + s.defPct/100);
  // 取整与封顶
  ['maxHp','maxMp','atk','def','spd'].forEach(k=> s[k] = Math.max(1, Math.round(s[k])));
  s.crit = Math.min(80, Math.round(s.crit*10)/10);
  s.critDmg = Math.round(s.critDmg);
  s.dodge = Math.min(45, Math.round(s.dodge*10)/10);
  s.dmgReduce = Math.min(60, Math.round(s.dmgReduce*10)/10);
  s.lifesteal = Math.round(s.lifesteal*10)/10;
  s.skillDmg = Math.round(s.skillDmg);
  s.expPct = Math.round(s.expPct);
  s.goldPct = Math.round(s.goldPct);
  return s;
};

/* 加点 */
G.addAttr = function(k){
  const h = this.state.hero;
  if (h.points <= 0) return false;
  h.points--; h.attrs[k]++;
  const st = this.calcHero();
  h.hp = Math.min(h.hp, st.maxHp); h.mp = Math.min(h.mp, st.maxMp);
  this.save(); return true;
};

/* 技能加点 */
G.learnSkill = function(id){
  const h = this.state.hero, d = D.SKILLS[id];
  if (!d || h.lv < d.req || h.skillPoints <= 0) return false;
  const cur = h.skills[id]||0;
  if (cur >= d.max) return false;
  h.skills[id] = cur + 1; h.skillPoints--;
  this.save(); return true;
};
G.learnPassive = function(id){
  const h = this.state.hero, d = D.PASSIVES[id];
  if (!d || h.lv < d.req || h.skillPoints <= 0) return false;
  const cur = h.passives[id]||0;
  if (cur >= d.max) return false;
  h.passives[id] = cur + 1; h.skillPoints--;
  const st = this.calcHero();
  h.hp = Math.min(h.hp, st.maxHp);
  this.save(); return true;
};

/* ---------- 经验与金币 ---------- */
G.gainExp = function(n){
  const h = this.state.hero, st = this.calcHero();
  n = Math.round(n * (1 + st.expPct/100));
  h.exp += n;
  const ups = [];
  while (h.lv < D.MAX_LV && h.exp >= D.expNeed(h.lv)){
    h.exp -= D.expNeed(h.lv);
    h.lv++; h.points += 3; h.skillPoints += 1;
    ups.push(h.lv);
  }
  if (ups.length){
    const s2 = this.calcHero();
    h.hp = s2.maxHp; h.mp = s2.maxMp;   // 升级回满
  }
  return { gained:n, ups };
};
G.gainGold = function(n){
  const st = this.calcHero();
  n = Math.round(n * (1 + st.goldPct/100));
  this.state.gold += n; return n;
};

/* ---------- 装备生成 ---------- */
G.rollAffixes = function(ilv, q){
  const n = G.ri(D.QUALITY[q].affixMin, D.QUALITY[q].affixMax);
  const keys = Object.keys(D.AFFIXES);
  const bag = [];
  keys.forEach(k=>{ for (let i=0;i<D.AFFIXES[k].w;i++) bag.push(k); });
  const picked = [];
  let guard = 99;
  while (picked.length < n && guard-- > 0){
    const k = bag[Math.floor(Math.random()*bag.length)];
    if (picked.includes(k)) continue;
    picked.push(k);
  }
  return picked.map(k=>{
    const def = D.AFFIXES[k];
    return { key:k, stat:def.stat, name:def.name, pct:!!def.pct, v: def.gen(ilv, q) };
  });
};

G.genItem = function(ilv, q, slot, uniqueDef){
  slot = slot || G.pick(D.SLOT_ORDER);
  ilv = Math.max(1, Math.round(ilv));
  const sd = D.SLOTS[slot], qd = D.QUALITY[q];
  const base = sd.base(ilv);
  for (const k in base) base[k] = Math.round(base[k] * qd.mult);
  let name, special = null, unique = false;
  if (q === 5){
    const ud = uniqueDef || G.pick(D.UNIQUES.filter(u=>u.slot===slot)) ;
    name = ud.name; special = { ...ud.special }; unique = true;
  } else {
    const prefix = ['', '精良的', '稀有的', '史诗·', '传说·'][q];
    name = prefix + G.pick(sd.nouns);
  }
  return { id:G.uid(), slot, name, q, ilv, base, affixes:G.rollAffixes(ilv, q), plus:0, unique, special };
};

/* 按怪物档位决定掉落品质 */
G.dropQuality = function(tier){
  const r = Math.random()*100;
  if (tier === 'normal')  return r<55?0 : r<85?1 : r<97?2 : 3;
  if (tier === 'elite')   return r<15?1 : r<60?2 : r<90?3 : 4;
  if (tier === 'boss')    return r<20?2 : r<70?3 : 4;
  if (tier === 'darkgold')return 5;
  if (tier === 'stage')   return r<35?3 : r<90?4 : 5;
  if (tier === 'final')   return 5;
  return 0;
};

/* ---------- 背包 ---------- */
G.addItem = function(it){
  const s = this.state;
  if (s.inv.length >= s.invCap){
    // 背包满：自动分解品质最低的一件白/绿
    const idx = s.inv.findIndex(x=>x.q<=1);
    if (idx >= 0){ this.salvage(idx, true); }
    else { this.state.gold += 50; }
  }
  s.inv.push(it);
};
G.findItem = function(id){
  const s = this.state;
  let i = s.inv.findIndex(x=>x.id===id);
  if (i >= 0) return { where:'bag', idx:i, item:s.inv[i] };
  for (const slot of D.SLOT_ORDER){
    if (s.hero.equip[slot] && s.hero.equip[slot].id === id) return { where:'equip', slot, item:s.hero.equip[slot] };
  }
  return null;
};
G.equip = function(id){
  const f = this.findItem(id); if (!f || f.where !== 'bag') return false;
  const s = this.state, it = f.item;
  s.inv.splice(f.idx, 1);
  const old = s.hero.equip[it.slot];
  s.hero.equip[it.slot] = it;
  if (old) s.inv.push(old);
  const st = this.calcHero();
  s.hero.hp = Math.min(s.hero.hp, st.maxHp); s.hero.mp = Math.min(s.hero.mp, st.maxMp);
  this.save(); return true;
};
G.unequip = function(slot){
  const s = this.state, it = s.hero.equip[slot];
  if (!it) return false;
  if (s.inv.length >= s.invCap) return false;
  s.hero.equip[slot] = null; s.inv.push(it);
  const st = this.calcHero();
  s.hero.hp = Math.min(s.hero.hp, st.maxHp); s.hero.mp = Math.min(s.hero.mp, st.maxMp);
  this.save(); return true;
};

/* 分解 → 材料 */
G.salvageValue = it => ({
  iron:    [1,2,3,5,8,10][it.q],
  hide:    [0,1,2,3,5,6][it.q],
  crystal: [0,0,1,2,4,5][it.q],
  essence: it.q === 5 ? 1 : 0,
  gold:    [5,10,20,40,80,150][it.q] + it.ilv,
});
G.salvage = function(idx, silent){
  const s = this.state, it = s.inv[idx]; if (!it) return null;
  const v = this.salvageValue(it);
  s.inv.splice(idx, 1);
  s.mats.iron += v.iron; s.mats.hide += v.hide; s.mats.crystal += v.crystal; s.mats.essence += v.essence;
  s.gold += v.gold;
  if (!silent) this.save();
  return v;
};

/* ---------- 锻造 ---------- */
G.enhance = function(id){
  const s = this.state, f = this.findItem(id);
  if (!f) return { ok:false, msg:'装备不存在' };
  const it = f.item;
  if ((it.plus||0) >= D.ENHANCE_MAX) return { ok:false, msg:'已达强化上限 +15' };
  const cost = D.enhanceCost(it.plus||0, it.ilv);
  if (s.gold < cost.gold) return { ok:false, msg:'金币不足' };
  if (s.mats.enhance < cost.stone) return { ok:false, msg:'强化石不足' };
  s.gold -= cost.gold; s.mats.enhance -= cost.stone;
  const rate = D.ENHANCE_RATE[it.plus||0];
  const ok = Math.random()*100 < rate;
  if (ok){ it.plus = (it.plus||0)+1; s.stats.enhanced++; }
  else { it.plus = Math.max(0, (it.plus||0) + D.enhanceFail(it.plus||0)); }
  const st = this.calcHero();
  s.hero.hp = Math.min(s.hero.hp, st.maxHp);
  this.save();
  return { ok, rate, item:it, msg: ok ? `强化成功！${it.name} +${it.plus}` : `强化失败…${D.enhanceFail(it.plus)!==0?'等级 -1':'等级不变'}` };
};

G.reroll = function(id){
  const s = this.state, f = this.findItem(id);
  if (!f) return { ok:false, msg:'装备不存在' };
  if (s.mats.reroll < 1) return { ok:false, msg:'洗练石不足' };
  const it = f.item;
  s.mats.reroll--;
  it.affixes = this.rollAffixes(it.ilv, it.q);
  this.save();
  return { ok:true, item:it, msg:'词条已重铸！' };
};

/* 打造：消耗材料，随机出绿~橙；暗金打造消耗精华保底暗金 */
G.CRAFT_COST = { iron:6, hide:4, crystal:2, gold:200 };
G.craft = function(slot, dark){
  const s = this.state, c = G.CRAFT_COST;
  if (dark){
    if (s.mats.essence < 3) return { ok:false, msg:'暗金精华不足（需要 3 个）' };
  }
  if (s.mats.iron < c.iron || s.mats.hide < c.hide || s.mats.crystal < c.crystal) return { ok:false, msg:'材料不足' };
  if (s.gold < c.gold) return { ok:false, msg:'金币不足' };
  s.mats.iron -= c.iron; s.mats.hide -= c.hide; s.mats.crystal -= c.crystal; s.gold -= c.gold;
  let q;
  if (dark){ s.mats.essence -= 3; q = 5; }
  else { const r = Math.random()*100; q = r<30?1 : r<65?2 : r<87?3 : 4; }
  const it = this.genItem(s.hero.lv, q, slot);
  this.addItem(it); s.stats.crafted++;
  this.save();
  return { ok:true, item:it };
};

/* ---------- 商店 ---------- */
G.buy = function(shopId){
  const s = this.state;
  const d = D.SHOP.find(x=>x.id===shopId); if (!d) return false;
  const price = d.type === 'potion' ? D.POTIONS[d.id].price : d.price;
  if (s.gold < price) return false;
  s.gold -= price;
  if (d.type === 'potion') s.hero.potions[d.id]++;
  else s.mats[d.id]++;
  this.save(); return true;
};

/* ---------- 药水 ---------- */
G.usePotion = function(pid, stats){
  const s = this.state, p = D.POTIONS[pid];
  if (!p || s.hero.potions[pid] <= 0) return null;
  const st = stats || this.calcHero();
  s.hero.potions[pid]--;
  let healed = 0, manaed = 0;
  if (p.heal){ healed = Math.round(st.maxHp * p.heal); s.hero.hp = Math.min(st.maxHp, s.hero.hp + healed); }
  if (p.mana){ manaed = Math.round(st.maxMp * p.mana); s.hero.mp = Math.min(st.maxMp, s.hero.mp + manaed); }
  this.save();
  return { healed, manaed };
};

/* ---------- 地图与探索 ---------- */
G.curMap = function(){ return D.MAPS.find(m=>m.id===this.state.curMap); };
G.mapState = function(id){ return this.state.maps[id]; };

/* 生成一场遭遇 */
G.explore = function(){
  const s = this.state, m = this.curMap(), ms = s.maps[m.id];
  ms.prog = Math.min(100, ms.prog + G.ri(4, 8));
  s.explores++; s.pity++;
  const r = Math.random();
  let tier;
  if (s.pity >= 60 || r < 0.025) tier = 'darkgold';   // 暗金小Boss（60 次保底）
  else if (r < 0.085) tier = 'boss';
  else if (r < 0.29)  tier = 'elite';
  else if (r < 0.39)  tier = 'treasure';
  else tier = 'normal';
  // 等级保护：高级怪对低等级玩家降级为普通遭遇，防止新手被秒杀
  const heroLv = s.hero.lv;
  const canElite = heroLv >= m.minLv + 1;
  const canBoss  = heroLv >= m.minLv + 2;
  const canDark  = heroLv >= m.minLv + 3;
  if (tier === 'darkgold' && !canDark) tier = canBoss ? 'boss' : canElite ? 'elite' : 'normal';
  if (tier === 'boss' && !canBoss) tier = canElite ? 'elite' : 'normal';
  if (tier === 'elite' && !canElite) tier = 'normal';
  if (tier === 'darkgold') s.pity = 0;

  let enc;
  if (tier === 'darkgold' || tier === 'boss'){
    enc = { type:tier, foes:[this.makeFoe(m, tier)] };
  } else if (tier === 'elite'){
    const n = heroLv <= 4 ? G.ri(0, 1) : G.ri(0, 2);
    const foes = [this.makeFoe(m, 'elite')];
    for (let i=0;i<n;i++) foes.push(this.makeFoe(m, 'normal'));
    enc = { type:'elite', foes };
  } else if (tier === 'treasure'){
    enc = { type:'treasure', reward:this.rollTreasure(m) };
  } else {
    // 低级时只单挑，等级高了才会被围殴
    const n = heroLv <= 2 ? 1 : heroLv <= 4 ? G.ri(1, 2) : G.ri(1, 3);
    const foes = [];
    for (let i=0;i<n;i++) foes.push(this.makeFoe(m, 'normal'));
    enc = { type:'normal', foes };
  }
  this.save();
  return enc;
};

G.makeFoe = function(m, tier){
  const t = D.TIERS[tier];
  const heroLv = this.state.hero.lv;
  let src, lv;
  if (tier === 'normal'){ src = G.pick(m.monsters); lv = Math.min(G.ri(m.minLv, m.maxLv), heroLv + 2); }
  else if (tier === 'elite'){ src = m.elite; lv = Math.min(m.maxLv+1, G.ri(m.minLv, m.maxLv)+1, heroLv + 3); }
  else if (tier === 'boss'){ src = m.boss; lv = Math.min(m.maxLv+1, G.ri(m.minLv, m.maxLv)+2); }
  else if (tier === 'darkgold'){ src = m.darkgold; lv = m.maxLv+1; }
  else if (tier === 'stage'){ src = m.stage; lv = m.maxLv+1; }
  else { src = m.final; lv = m.maxLv+2; }
  const base = D.monsterBase(lv, src.mod);
  const stats = {
    maxHp: Math.round(base.hp * t.hp), atk: Math.round(base.atk * t.atk),
    def: Math.round(base.def * t.def), spd: Math.round(base.spd * t.spd),
  };
  return {
    tier, name: src.name, icon: src.icon, lv, stats,
    skills: (src.skills||[]).map(sk=>({ ...sk })),
    exp: Math.round(base.exp * t.exp), gold: Math.round(base.gold * t.gold),
    ilv: lv + t.ilvBonus,
  };
};

/* 大Boss / 终极Boss 挑战 */
G.challenge = function(kind){
  const m = this.curMap();
  return { type:kind, foes:[this.makeFoe(m, kind)] };
};

G.rollTreasure = function(m){
  const lv = G.ri(m.minLv, m.maxLv);
  const r = Math.random();
  if (r < 0.35) return { kind:'gold', gold: G.ri(15, 40) + lv*6 };
  if (r < 0.55) return { kind:'potion', potion: G.pick(['hp1','hp1','mp1','hp2','mp2']) };
  if (r < 0.78){
    const mats = { iron: G.ri(1,3), hide: G.ri(0,2), crystal: G.ri(0,1) };
    if (Math.random() < 0.25) mats.enhance = 1;
    if (Math.random() < 0.12) mats.reroll = 1;
    return { kind:'mats', mats };
  }
  const q = Math.random()<0.6?1 : Math.random()<0.8?2 : 3;
  return { kind:'item', item: this.genItem(lv, q) };
};

/* 战斗胜利结算（由 battle 调用） */
G.applyRewards = function(foes){
  const s = this.state;
  let exp = 0, gold = 0; const drops = [];
  foes.forEach(f=>{
    exp += f.exp; gold += f.gold;
    const t = D.TIERS[f.tier];
    if (Math.random() < t.drop){
      let q = this.dropQuality(f.tier);
      const it = this.genItem(f.ilv, q);
      drops.push(it); this.addItem(it);
    }
    // 材料掉落
    if (f.tier === 'normal'){ s.mats.iron += G.ri(0,1); if (Math.random()<0.4) s.mats.hide++; }
    else if (f.tier === 'elite'){ s.mats.iron += G.ri(1,2); s.mats.hide++; if (Math.random()<0.5) s.mats.crystal++; }
    else if (f.tier === 'boss'){ s.mats.iron += G.ri(2,3); s.mats.hide += G.ri(1,2); s.mats.crystal++; s.mats.enhance++; }
    else if (f.tier === 'darkgold'){ s.mats.crystal += G.ri(2,3); s.mats.essence++; s.mats.enhance += 2; s.mats.reroll++; }
    else if (f.tier === 'stage'){ s.mats.crystal += G.ri(2,4); s.mats.essence++; s.mats.enhance += 2; s.mats.reroll += 2; s.mats.iron += 5; s.mats.hide += 4; }
    else if (f.tier === 'final'){ s.mats.essence += 3; s.mats.enhance += 5; s.mats.reroll += 3; s.mats.crystal += 8; }
  });
  // 暗金小Boss 必掉暗金
  foes.forEach(f=>{
    if (f.tier === 'darkgold'){
      const it = this.genItem(f.ilv, 5);
      drops.push(it); this.addItem(it);
    }
    if (f.tier === 'final'){
      for (let i=0;i<2;i++){ const it = this.genItem(f.ilv, 5); drops.push(it); this.addItem(it); }
      const w = this.genItem(f.ilv, 4); drops.push(w); this.addItem(w);
    }
  });
  const g = this.gainGold(gold);
  const e = this.gainExp(exp);
  // 统计与解锁
  foes.forEach(f=>{
    s.stats.kills++;
    if (f.tier === 'elite') s.stats.elite++;
    if (f.tier === 'boss') s.stats.boss++;
    if (f.tier === 'darkgold') s.stats.darkgold++;
    if (f.tier === 'stage'){
      s.stats.stage++;
      const m = this.curMap(); s.maps[m.id].stageKilled = true;
      const idx = D.MAPS.indexOf(m);
      if (idx+1 < D.MAPS.length) s.maps[D.MAPS[idx+1].id].unlocked = true;
    }
    if (f.tier === 'final'){ s.flags.gameClear = true; }
  });
  this.save();
  return { exp:e.gained, ups:e.ups, gold:g, drops };
};

/* 战败惩罚：损失 10% 金币，回满状态 */
G.applyDefeat = function(){
  const s = this.state;
  const lost = Math.round(s.gold * 0.1);
  s.gold -= lost;
  const st = this.calcHero();
  s.hero.hp = st.maxHp; s.hero.mp = st.maxMp;
  s.stats.deaths++;
  this.save();
  return { lost };
};

/* 休息 */
G.rest = function(){
  const st = this.calcHero();
  this.state.hero.hp = st.maxHp; this.state.hero.mp = st.maxMp;
  this.save();
};
