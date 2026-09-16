/* ===== 旷野传说 · 回合制战斗引擎 ===== */
'use strict';
const B = {
  active:false, over:false, busy:false,
  enc:null, hero:null, foes:[], round:0,
  _wait:null,   // 玩家输入 Promise resolve
  _pendingSkill:null,
};

B.sleep = ms => new Promise(r=>setTimeout(r, ms));
B.speed = () => (G.state && G.state.settings && G.state.settings.speed) || 1;
B.delay = () => B.sleep(Math.round(620 / B.speed()));

/* ---------- 属性快照与加成 ---------- */
B.effAtk = u => u.stats.atk * (1 + B.buffSum(u,'atkUp'));
B.effDef = u => Math.max(0, u.stats.def * (1 + B.buffSum(u,'defUp') - B.buffSum(u,'defDown')));
B.effSpd = u => u.stats.spd * (1 + B.buffSum(u,'spdUp'));
B.buffSum = (u,t) => u.buffs.filter(b=>b.type===t).reduce((s,b)=>s+b.v,0);
B.hasBuff = (u,t) => u.buffs.some(b=>b.type===t);

/* ---------- 开始战斗 ---------- */
B.start = function(enc){
  const st = G.calcHero();
  const h = G.state.hero;
  this.enc = enc;
  this.hero = {
    side:'hero', name:h.name, icon:'🧑‍🚀', lv:h.lv, stats:st,
    hp:Math.min(h.hp, st.maxHp), mp:Math.min(h.mp, st.maxMp),
    buffs:[], cds:{}, defending:false, alive:true,
  };
  this.foes = enc.foes.map((f,i)=>({
    side:'foe', idx:i, tier:f.tier, name:f.name, icon:f.icon, lv:f.lv,
    stats:f.stats, hp:f.stats.maxHp, mp:0,
    buffs:[], cds:{}, defending:false, alive:true,
    skills:f.skills||[], exp:f.exp, gold:f.gold, ilv:f.ilv, enraged:false,
  }));
  this.round = 0; this.over = false; this.busy = false;
  this.active = true;
  UI.battle.show();
  this.loop();
};

B.aliveFoes = () => B.foes.filter(f=>f.alive);

/* ---------- 主循环 ---------- */
B.loop = async function(){
  UI.battle.log(`遭遇了 ${this.foes.map(f=>`<span class="${D.TIERS[f.tier].cls}">${f.icon}${f.name} Lv.${f.lv}</span>`).join('、')}！`, 'log-sys');
  UI.battle.refresh();
  while (!this.over){
    this.round++;
    UI.battle.setRound(this.round);
    const order = [this.hero, ...this.aliveFoes()].filter(u=>u.alive).sort((a,b)=>B.effSpd(b)-B.effSpd(a));
    for (const u of order){
      if (this.over) break;
      if (!u.alive) continue;
      this.tickUnit(u);
      if (!u.alive) continue;
      if (B.hasBuff(u,'stun')){
        UI.battle.log(`${u.icon}${u.name} 被眩晕，无法行动！`, u.side==='hero'?'log-foe':'log-sys');
        u.buffs = u.buffs.filter(b=>b.type!=='stun');
        UI.battle.refresh();
        await B.delay();
        continue;
      }
      if (u.side === 'hero'){
        await this.heroTurn();
      } else {
        await B.delay();
        this.foeAct(u);
        await B.delay();
      }
      this.checkDeaths();
      UI.battle.refresh();
    }
  }
};

/* 回合开始时结算 buff/冷却 */
B.tickUnit = function(u){
  u.defending = false;
  for (const k in u.cds) u.cds[k] = Math.max(0, u.cds[k]-1);
  u.buffs.forEach(b=>b.dur--);
  u.buffs = u.buffs.filter(b=>b.dur > 0);
};

/* ---------- 伤害计算 ---------- */
B.dmgCalc = function(att, def, mult, isSkill){
  const dodge = def.stats.dodge || 0;
  if (dodge > 0 && Math.random()*100 < dodge) return { miss:true, dmg:0 };
  const raw = B.effAtk(att) * mult * G.rf(0.9, 1.1);
  const red = Math.min(0.72, B.effDef(def) / (B.effDef(def) + 55 + 8*(att.lv||1)));
  let dmg = raw * (1 - red);
  let crit = false;
  if (Math.random()*100 < (att.stats.crit||0)){ crit = true; dmg *= (att.stats.critDmg||150)/100; }
  if (isSkill && att.side === 'hero') dmg *= 1 + (att.stats.skillDmg||0)/100;
  if (def.defending) dmg *= 0.5;
  const cut = B.buffSum(def,'dmgCut');
  if (cut > 0) dmg *= (1 - Math.min(0.8, cut));
  if (def.stats.dmgReduce) dmg *= 1 - Math.min(60, def.stats.dmgReduce)/100;
  return { dmg: Math.max(1, Math.round(dmg)), crit, miss:false };
};

/* 对目标造成一次伤害（含吸血/飘字/死亡） */
B.hit = function(att, def, mult, isSkill, label){
  const r = B.dmgCalc(att, def, mult, isSkill);
  if (r.miss){
    UI.battle.log(`${att.icon}${att.name} 的${label||'攻击'}被 ${def.icon}${def.name} 闪避了！`, att.side==='hero'?'log-me':'log-foe');
    UI.battle.floatNum(def, '闪避', 'miss');
    return 0;
  }
  def.hp = Math.max(0, def.hp - r.dmg);
  const tag = r.crit ? '暴击！' : '';
  UI.battle.log(`${att.icon}${att.name} ${label||'攻击'} ${def.icon}${def.name}，${tag}造成 <b class="log-crit">${r.dmg}</b> 点伤害`, att.side==='hero'?'log-me':'log-foe');
  UI.battle.floatNum(def, (r.crit?'暴击 -':'-') + r.dmg, r.crit?'crit':'');
  UI.battle.shake(def);
  // 吸血
  const ls = att.stats.lifesteal || 0;
  if (ls > 0 && r.dmg > 0){
    const heal = Math.max(1, Math.round(r.dmg * ls/100));
    att.hp = Math.min(att.stats.maxHp, att.hp + heal);
    UI.battle.floatNum(att, '+'+heal, 'heal');
  }
  if (def.hp <= 0 && def.side === 'foe'){
    def.alive = false;
    UI.battle.log(`${def.icon}${def.name} 被击败了！`, 'log-sys');
  }
  return r.dmg;
};

B.checkDeaths = function(){
  if (this.hero.hp <= 0 && this.hero.alive){ this.hero.alive = false; return this.finish(false); }
  if (this.aliveFoes().length === 0){ return this.finish(true); }
};

/* ---------- 玩家回合 ---------- */
B.heroTurn = function(){
  return new Promise(res=>{
    this._wait = res;
    if (G.state.settings && G.state.settings.auto){
      UI.battle.setTurn('🤖 自动战斗中…');
      UI.battle.actions();
      setTimeout(()=> this.autoResolve(), Math.round(420 / B.speed()));
      return;
    }
    UI.battle.setTurn('你的回合 — 选择行动');
    UI.battle.actions();
  });
};

/* 自动战斗：低血喝药/治疗，否则放最高倍率技能，没蓝普攻 */
B.autoResolve = function(){
  if (!this._wait) return;
  const c = this.autoChoice();
  this.act(c.kind, c.payload);
};
B.autoChoice = function(){
  const h = this.hero, pots = G.state.hero.potions;
  if (h.hp < h.stats.maxHp * 0.3){
    const pid = ['hp3','hp2','hp1'].find(p=>pots[p]>0);
    if (pid) return { kind:'potion', payload:pid };
    const healSid = ['revive','heal'].find(sid=>G.state.hero.skills[sid] && (h.cds[sid]||0)<=0 && h.mp>=D.SKILLS[sid].mp);
    if (healSid) return { kind:'skill', payload:healSid };
  }
  let best=null, bestMult=1;
  for (const sid in G.state.hero.skills){
    const d = D.SKILLS[sid], lv = G.state.hero.skills[sid];
    if (!d.mult) continue;
    if ((h.cds[sid]||0) > 0 || h.mp < d.mp) continue;
    const m = d.mult(lv) * (d.hits||1);
    if (m > bestMult){ bestMult = m; best = sid; }
  }
  if (best) return { kind:'skill', payload:best };
  return { kind:'attack' };
};

/* UI 调用：玩家选择了行动 */
B.act = async function(kind, payload){
  if (this.busy || this.over || !this._wait) return;
  const done = ()=>{ const r = this._wait; this._wait = null; this.busy = false; UI.battle.clearSub(); r(); };
  this.busy = true;
  UI.battle.setTurn('');
  const h = this.hero;

  if (kind === 'attack'){
    const t = await this.pickTarget(); if (t === null){ this.busy=false; return; } // 取消
    B.hit(h, t, 1, false);
  }
  else if (kind === 'skill'){
    const ok = await this.useSkill(payload);
    if (ok === 'cancel'){ this.busy=false; return; }
    if (!ok){ this.busy=false; return; }
  }
  else if (kind === 'defend'){
    h.defending = true;
    UI.battle.log(`${h.icon}${h.name} 摆出防御姿态，受到的伤害减半`, 'log-me');
  }
  else if (kind === 'potion'){
    const r = G.usePotion(payload, h.stats);
    if (!r){ this.busy=false; return; }
    h.hp = Math.min(h.stats.maxHp, G.state.hero.hp);
    h.mp = Math.min(h.stats.maxMp, G.state.hero.mp);
    UI.battle.log(`${h.icon}${h.name} 使用了 ${D.POTIONS[payload].icon}${D.POTIONS[payload].name}${r.healed?`，恢复 ${r.healed} 生命`:''}${r.manaed?`，恢复 ${r.manaed} 法力`:''}`, 'log-sys');
    UI.battle.floatNum(h, r.healed?('+'+r.healed):('+'+r.manaed+'MP'), 'heal');
  }
  else if (kind === 'flee'){
    const can = !['stage','final'].includes(this.enc.type);
    const avg = this.aliveFoes().reduce((s,f)=>s+f.stats.spd,0) / Math.max(1,this.aliveFoes().length);
    const rate = Math.min(90, Math.max(15, 55 + (h.stats.spd - avg)*3));
    if (can && Math.random()*100 < rate){
      UI.battle.log('你成功脱离了战斗！', 'log-sys');
      this.over = true;
      this.syncHero();
      UI.battle.refresh();
      const r = this._wait; this._wait = null;
      if (r) r();
      await B.delay();
      this.active = false;
      this.leave();
      return;
    }
    UI.battle.log(can ? '逃跑失败！' : '强大的敌人封锁了退路，无法逃跑！', 'log-foe');
  }
  this.checkDeaths();
  UI.battle.refresh();
  if (!this.over) done();
};

/* 单体目标选择（多敌时点选，单敌/自动战斗自动） */
B.pickTarget = function(){
  const alive = this.aliveFoes();
  if (alive.length === 1) return Promise.resolve(alive[0]);
  if (G.state.settings && G.state.settings.auto)
    return Promise.resolve(alive.slice().sort((a,b)=>b.hp-a.hp)[0]);
  return new Promise(res=>{
    UI.battle.pickTarget(alive, t=>res(t));
  });
};

/* 技能施放 */
B.useSkill = async function(sid){
  const h = this.hero, lv = G.state.hero.skills[sid]||0;
  const d = D.SKILLS[sid];
  if (!d || lv <= 0) return false;
  if ((h.cds[sid]||0) > 0){ UI.toast('技能冷却中'); return false; }
  if (h.mp < d.mp){ UI.toast('法力不足'); return false; }
  const mult = d.mult ? d.mult(lv) : 1;
  const isAoe = d.type === 'aoe';
  const needTarget = ['dmg','multi','dmg_debuff','dmg_stun'].includes(d.type);
  let t = null;
  if (needTarget && !isAoe){
    t = await this.pickTarget();
    if (t === null) return 'cancel';
  }
  h.mp -= d.mp;
  if (d.cd) h.cds[sid] = d.cd + 1;
  const label = `${d.icon}${d.name}`;

  if (d.type === 'dmg' || d.type === 'multi' || d.type === 'dmg_debuff' || d.type === 'dmg_stun'){
    const hits = d.type === 'multi' ? d.hits : 1;
    for (let i=0;i<hits;i++){
      if (!t.alive){ const a=this.aliveFoes(); if (!a.length) break; t = a[0]; }
      B.hit(h, t, mult, true, label + (hits>1?`（第${i+1}击）`:''));
    }
    if (d.type === 'dmg_debuff' && t.alive){ t.buffs.push({type:'defDown', v:d.defDown, dur:d.dur}); UI.battle.log(`${t.icon}${t.name} 防御降低 30%！`, 'log-sys'); }
    if (d.type === 'dmg_stun' && t.alive && Math.random() < d.stun(lv)){ t.buffs.push({type:'stun', v:0, dur:2}); UI.battle.log(`${t.icon}${t.name} 被眩晕了！`, 'log-sys'); }
  }
  else if (d.type === 'aoe'){
    this.aliveFoes().forEach(f=> B.hit(h, f, mult, true, label));
  }
  else if (d.type === 'heal'){
    let heal = Math.round(h.stats.maxHp * d.mult(lv) + G.state.hero.attrs.spi*3);
    if (d.cleanse){ h.buffs = h.buffs.filter(b=>!['defDown','stun'].includes(b.type)); }
    h.hp = Math.min(h.stats.maxHp, h.hp + heal);
    UI.battle.log(`${h.icon}${h.name} 施放 ${label}，恢复 <b class="log-sys">${heal}</b> 点生命${d.cleanse?'，净化了减益':''}`, 'log-me');
    UI.battle.floatNum(h, '+'+heal, 'heal');
  }
  else if (d.type === 'buff'){
    if (d.atkUp){ h.buffs.push({type:'atkUp', v:d.atkUp(lv), dur:d.dur}); UI.battle.log(`${h.icon}${h.name} 进入狂暴状态，攻击提升 ${Math.round(d.atkUp(lv)*100)}%！`, 'log-me'); }
    if (d.dmgCut){ h.buffs.push({type:'dmgCut', v:d.dmgCut(lv), dur:d.dur}); UI.battle.log(`${h.icon}${h.name} 展开圣盾，受到伤害降低 ${Math.round(d.dmgCut(lv)*100)}%！`, 'log-me'); }
  }
  return true;
};

/* ---------- 怪物 AI ---------- */
B.foeAct = function(f){
  const h = this.hero;
  // Boss 狂暴阶段
  if (['stage','final','darkgold'].includes(f.tier) && !f.enraged && f.hp < f.stats.maxHp*0.5){
    f.enraged = true;
    f.buffs.push({type:'atkUp', v:0.25, dur:99});
    UI.battle.log(`${f.icon}${f.name} 生命值过半，进入狂暴状态！攻击提升！`, 'log-foe');
  }
  // 选技能
  const usable = (f.skills||[]).filter((sk,i)=> (f.cds['sk'+i]||0) <= 0);
  let sk = null;
  const healSk = usable.find(s=>s.heal);
  if (healSk && f.hp < f.stats.maxHp*0.45) sk = healSk;
  if (!sk){
    const buffSk = usable.find(s=>s.buff && !B.hasBuff(f, s.buff.atkUp?'atkUp':'defUp'));
    if (buffSk && Math.random() < 0.7) sk = buffSk;
  }
  if (!sk && usable.length){
    const dmgs = usable.filter(s=>s.mult);
    if (dmgs.length && Math.random() < 0.75) sk = dmgs[Math.floor(Math.random()*dmgs.length)];
  }
  if (sk){
    const i = f.skills.indexOf(sk);
    f.cds['sk'+i] = (sk.cd||2) + 1;
    if (sk.heal){
      const heal = Math.round(f.stats.maxHp * sk.heal);
      f.hp = Math.min(f.stats.maxHp, f.hp + heal);
      UI.battle.log(`${f.icon}${f.name} 使用「${sk.name}」，恢复 ${heal} 点生命`, 'log-foe');
      UI.battle.floatNum(f, '+'+heal, 'heal');
      return;
    }
    if (sk.buff){
      const type = sk.buff.atkUp ? 'atkUp' : 'defUp';
      const v = sk.buff.atkUp || sk.buff.defUp;
      f.buffs.push({type, v, dur:sk.buff.dur||3});
      UI.battle.log(`${f.icon}${f.name} 使用「${sk.name}」，${type==='atkUp'?'攻击':'防御'}提升！`, 'log-foe');
      return;
    }
    const hits = sk.hits || 1;
    for (let k=0;k<hits;k++){
      if (!h.alive || h.hp <= 0) break;
      const dmg = B.hit(f, h, sk.mult, true, `「${sk.name}」`);
      if (sk.drain && dmg > 0){ f.hp = Math.min(f.stats.maxHp, f.hp + Math.round(dmg*sk.drain)); }
      if (sk.stun && h.alive && Math.random() < sk.stun){
        h.buffs.push({type:'stun', v:0, dur:2});
        UI.battle.log(`${h.icon}${h.name} 被眩晕了！`, 'log-foe');
      }
    }
    return;
  }
  B.hit(f, h, 1, false);
};

/* ---------- 战斗结束 ---------- */
B.finish = async function(win){
  this.over = true;
  UI.battle.refresh();
  await B.sleep(500);
  if (win){
    const rewards = G.applyRewards(this.foes);
    let towerWin = null;
    if (this.enc.type === 'tower') towerWin = G.applyTowerWin(this.enc.floor);
    this.syncHero();
    UI.battle.showResult(rewards, this.enc, towerWin);
  } else {
    const r = G.applyDefeat();
    UI.battle.showDefeat(r);
  }
  this.active = false;
};

B.syncHero = function(){
  const st = G.calcHero();
  G.state.hero.hp = Math.min(Math.max(1, Math.round(this.hero.hp)), st.maxHp);
  G.state.hero.mp = Math.min(Math.round(this.hero.mp), st.maxMp);
  G.save();
};

/* 战斗结算后离开 */
B.leave = function(){
  this._wait = null;
  UI.battle.hide();
  UI.renderAll();
};
