/* ===== 旷野传说 · 界面渲染 ===== */
'use strict';
const UI = {
  tab:'map',
  forge:{ tab:'enh', itemId:null, craftSlot:'weapon' },
};
const el = id => document.getElementById(id);

/* ---------- 小工具 ---------- */
UI.toast = function(msg){
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  el('toasts').appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .4s'; }, 1800);
  setTimeout(()=> t.remove(), 2300);
};
UI.markSaved = function(){
  const d = new Date();
  el('tb-save').textContent = `已保存 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
};
UI.showModal = html => { el('modal').innerHTML = html; el('modal-mask').classList.remove('hidden'); };
UI.closeModal = () => el('modal-mask').classList.add('hidden');

/* ---------- 装备词条/属性显示 ---------- */
const STAT_NAMES = { atk:'攻击', hp:'生命', def:'防御', spd:'速度', mp:'法力', crit:'暴击率' };
const PCT_STATS = new Set(['crit','atkPct','hpPct','spdPct','defPct','critDmg','lifesteal','skillDmg','expPct','goldPct','dmgReduce','dodge']);
UI.baseLine = function(it){
  const mult = 1 + 0.06*(it.plus||0);
  return Object.keys(it.base).map(k=>{
    const v = Math.round(it.base[k]*mult);
    return `${STAT_NAMES[k]} +${k==='crit'? v+'%' : v}`;
  }).join('　');
};
UI.affixLine = a => `<span class="detail-affix">◆ ${a.name} +${a.v}${a.pct?'%':''}</span>`;
UI.itemNameHtml = it => `<span class="q${it.q}">${it.name}</span>${it.plus?` <span class="item-plus">+${it.plus}</span>`:''}`;

/* 装备对比 */
UI.compareHtml = function(it){
  const cur = G.state.hero.equip[it.slot];
  if (!cur) return `<div class="cmp-box">当前部位为空，直接装备即可</div>`;
  const a = G.itemStats(cur), b = G.itemStats(it);
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const rows = [];
  keys.forEach(k=>{
    const d = (b[k]||0) - (a[k]||0);
    if (Math.abs(d) < 0.01) return;
    const nm = D.AFFIXES[k] ? D.AFFIXES[k].name : ({atk:'攻击',hp:'生命',def:'防御',spd:'速度',mp:'法力',crit:'暴击率',atkPct:'攻击',hpPct:'生命',defPct:'防御',spdPct:'速度',critDmg:'暴击伤害',lifesteal:'吸血',skillDmg:'技能伤害',expPct:'经验获取',goldPct:'金币获取',dmgReduce:'伤害减免',dodge:'闪避'})[k] || k;
    const pct = PCT_STATS.has(k) ? '%' : '';
    rows.push(`${nm} <span class="${d>0?'cmp-up':'cmp-down'}">${d>0?'+':''}${Math.round(d*10)/10}${pct}</span>`);
  });
  return `<div class="cmp-box">⚖️ 与已装备「${cur.name}${cur.plus?'+'+cur.plus:''}」对比：<br>${rows.length? rows.join('　') : '属性相当'}</div>`;
};

/* ---------- 装备详情弹窗 ---------- */
UI.showItem = function(id, opts={}){
  const f = G.findItem(id); if (!f) return;
  const it = f.item;
  const qn = D.QUALITY[it.q].name;
  const affixes = (it.affixes||[]).map(UI.affixLine).join('<br>');
  const special = it.special ? `<div class="detail-special">★ 暗金专属：${it.special.name} +${it.special.v}%</div>` : '';
  const sv = G.salvageValue(it);
  const btns = [];
  if (f.where === 'bag') btns.push(`<button class="btn btn-green" data-act="equip">穿上</button>`);
  if (f.where === 'equip') btns.push(`<button class="btn" data-act="unequip">卸下</button>`);
  btns.push(`<button class="btn" data-act="salvage">分解（+${sv.iron}精铁${sv.hide?` +${sv.hide}兽皮`:''}${sv.crystal?` +${sv.crystal}魔晶`:''}${sv.essence?` +${sv.essence}🌟`:''}）</button>`);
  btns.push(`<button class="btn" data-act="close">关闭</button>`);
  UI.showModal(`
    <div class="detail-title q${it.q}">${D.SLOTS[it.slot].icon} ${it.name}${it.plus?` <span class="item-plus">+${it.plus}</span>`:''}</div>
    <div class="eq-sub">${qn} · ${D.SLOTS[it.slot].name} · 物品等级 ${it.ilv}</div>
    <div class="detail-base">${UI.baseLine(it)}</div>
    <div>${affixes || '<span style="color:#aaa">（无附加词条）</span>'}</div>
    ${special}
    ${f.where==='bag' ? UI.compareHtml(it) : ''}
    <div class="detail-btns">${btns.join('')}</div>
  `);
  el('modal').querySelectorAll('button').forEach(b=>{
    b.onclick = ()=>{
      const act = b.dataset.act;
      UI.closeModal();
      if (act === 'equip'){ G.equip(id); UI.toast(`已装备 ${it.name}`); }
      if (act === 'unequip'){ if(!G.unequip(f.slot)) UI.toast('背包已满'); }
      if (act === 'salvage'){
        const ff = G.findItem(id);
        if (ff && ff.where==='bag'){ const v = G.salvage(ff.idx); UI.toast(`分解获得 ${v.iron}精铁 ${v.hide}兽皮 ${v.crystal}魔晶${v.essence?' '+v.essence+'暗金精华':''}`); G.save(); }
        else UI.toast('已装备的装备请先卸下');
      }
      UI.renderAll();
    };
  });
};

/* ---------- 总渲染 ---------- */
UI.renderAll = function(){
  if (!G.state) return;
  const h = G.state.hero, st = G.calcHero();
  el('tb-hero').innerHTML = `<b>${h.name}</b> Lv.${h.lv}　❤ ${Math.round(h.hp)}/${st.maxHp}　🔷 ${Math.round(h.mp)}/${st.maxMp}`;
  el('tb-gold').textContent = `💰 ${G.fmt(G.state.gold)}`;
  const need = D.expNeed(h.lv);
  el('expbar-fill').style.width = Math.min(100, h.exp/need*100) + '%';
  el('expbar-text').textContent = h.lv >= D.MAX_LV ? '已满级' : `经验 ${h.exp} / ${need}`;
  el('bag-count').textContent = G.state.inv.length || '';
  el('sp-count').textContent = h.skillPoints || '';
  ({ map:UI.renderMap, hero:UI.renderHero, bag:UI.renderBag, skill:UI.renderSkill, forge:UI.renderForge, shop:UI.renderShop })[this.tab].call(UI);
};

/* ================= 地图页 ================= */
UI.renderMap = function(){
  const s = G.state;
  const cards = D.MAPS.map((m,i)=>{
    const ms = s.maps[m.id];
    const locked = !ms.unlocked;
    const monNames = m.monsters.map(x=>`<span class="t-normal">${x.icon}${x.name}</span>`).join(' ');
    const canStage = ms.unlocked && ms.prog >= 100;
    const isFinalMap = !!m.final;
    const finalOk = isFinalMap && ms.stageKilled;
    return `<div class="card map-card ${locked?'locked':''}">
      <div class="map-head">
        <span class="map-icon">${m.icon}</span>
        <div><div class="map-name">${m.name}</div><div class="map-lv">Lv.${m.minLv} ~ ${m.maxLv}　推荐挑战等级 Lv.${m.recLv}</div></div>
      </div>
      <div class="map-desc">${locked ? '？？？通关上一张地图后解锁。' : m.desc}</div>
      <div class="map-prog"><div style="width:${ms.prog}%"></div></div>
      <div class="map-prog-text">探索度 ${ms.prog}%　${ms.stageKilled?'<span class="stage-clear-tag">✓ 已击败关卡大Boss</span>':''}${s.flags.gameClear&&isFinalMap?'　<span class="t-final">✓ 已通关</span>':''}</div>
      ${locked ? '' : `<div class="map-mons">${monNames}
        <span class="t-elite">${m.elite.icon}${m.elite.name}</span>
        <span class="t-boss">${m.boss.icon}${m.boss.name}</span>
        <span class="t-dark">${m.darkgold.icon}${m.darkgold.name}</span>
        <span class="t-stage">${m.stage.icon}${m.stage.name}</span>
        ${isFinalMap?`<span class="t-final">${m.final.icon}${m.final.name}</span>`:''}</div>`}
      <div class="map-btns">
        <button class="btn btn-primary" data-map="${m.id}" data-act="explore" ${locked?'disabled':''}>⚔️ 探索战斗</button>
        <button class="btn btn-red" data-map="${m.id}" data-act="stage" ${(!canStage||locked)?'disabled':''}>👹 关卡大Boss${!locked&&!canStage?'（探索度满解锁）':''}</button>
        ${isFinalMap?`<button class="btn btn-gold" data-map="${m.id}" data-act="final" ${(!finalOk||locked)?'disabled':''}>🐲 终极Boss${!finalOk?'（先击败大Boss）':''}</button>`:''}
      </div>
    </div>`;
  }).join('');
  el('tab-map').innerHTML = `
    <div class="card" style="margin-bottom:12px">
      <b>🧭 野外冒险</b>　<span style="color:var(--ink2);font-size:13px">点击「探索战斗」遭遇怪物：62%普通 · 20%精英 · 6%BOSS · 2.5%暗金小Boss（60次保底）· 10%宝箱。探索度满 100% 解锁关卡大Boss，击败它解锁下一张地图！</span>
    </div>
    <div class="map-list">${cards}</div>`;
  el('tab-map').querySelectorAll('button[data-act]').forEach(b=>{
    b.onclick = ()=>{
      if (B.active) return;
      G.state.curMap = b.dataset.map;
      const act = b.dataset.act;
      if (act === 'explore') UI.doExplore();
      else UI.doChallenge(act);
    };
  });
};

UI.doExplore = function(){
  const enc = G.explore();
  if (enc.type === 'treasure'){
    const r = enc.reward;
    let html = '';
    if (r.kind === 'gold'){ G.gainGold(r.gold); html = `💰 捡到 <b style="color:var(--gold)">${r.gold}</b> 金币！`; }
    else if (r.kind === 'potion'){ G.state.hero.potions[r.potion]++; html = `${D.POTIONS[r.potion].icon} 捡到 <b>${D.POTIONS[r.potion].name}</b>！`; }
    else if (r.kind === 'mats'){ for (const k in r.mats) G.state.mats[k] += r.mats[k]; html = '⛏️ 捡到材料：' + Object.keys(r.mats).filter(k=>r.mats[k]>0).map(k=>`${D.MATS[k].icon}${D.MATS[k].name}×${r.mats[k]}`).join(' '); }
    else { G.addItem(r.item); html = `🎁 捡到装备：<b class="q${r.item.q}">${D.SLOTS[r.item.slot].icon}${r.item.name}</b>！<br><span style="font-size:12px;color:var(--ink2)">${UI.baseLine(r.item)}</span>`; }
    G.save(); UI.renderAll();
    UI.showModal(`<div class="result-title" style="color:var(--gold)">🎁 发现宝箱</div><div class="loot-list" style="text-align:center">${html}</div>
      <div class="result-btns"><button class="btn btn-primary" id="m-ok">继续冒险</button></div>`);
    el('m-ok').onclick = ()=>{ UI.closeModal(); };
    return;
  }
  UI.renderAll();
  B.start(enc);
};

UI.doChallenge = function(kind){
  const m = G.curMap();
  const recLv = kind === 'final' ? m.recLv + 2 : m.recLv;
  const go = ()=> B.start(G.challenge(kind));
  if (G.state.hero.lv < recLv){
    UI.showModal(`<div class="result-title lose">⚠️ 等级不足</div>
      <div class="result-sub">${kind==='final'?'终极Boss':'关卡大Boss'} 推荐等级 Lv.${recLv}，你当前 Lv.${G.state.hero.lv}。确定要挑战吗？</div>
      <div class="result-btns"><button class="btn btn-red" id="m-go">我要挑战！</button><button class="btn" id="m-no">再练级</button></div>`);
    el('m-go').onclick = ()=>{ UI.closeModal(); go(); };
    el('m-no').onclick = ()=> UI.closeModal();
  } else go();
};

/* ================= 角色页 ================= */
UI.renderHero = function(){
  const h = G.state.hero, st = G.calcHero();
  const ATTRS = [
    ['str','力量','每点 +2 攻击'], ['vit','体力','每点 +12 生命'],
    ['agi','敏捷','每点 +1 速度 +0.12% 闪避'], ['spi','精神','每点 +6 法力 +0.6% 技能伤害'],
  ];
  const attrRows = ATTRS.map(([k,n,eff])=>`<div class="attr-row">
      <span>${n} <b>${h.attrs[k]}</b> <span style="font-size:11px;color:var(--ink2)">${eff}</span></span>
      <button class="btn btn-primary" data-attr="${k}" ${h.points<=0?'disabled':''}>+1</button>
    </div>`).join('');
  const statCells = [
    ['❤ 生命上限', st.maxHp], ['🔷 法力上限', st.maxMp], ['⚔️ 攻击', st.atk], ['🛡️ 防御', st.def],
    ['💨 速度', st.spd], ['🎯 暴击率', st.crit+'%'], ['💥 暴击伤害', st.critDmg+'%'], ['🩸 吸血', st.lifesteal+'%'],
    ['✨ 技能伤害', '+'+st.skillDmg+'%'], ['🏃 闪避', st.dodge+'%'], ['🧱 伤害减免', st.dmgReduce+'%'],
    ['📈 经验加成', '+'+st.expPct+'%'], ['💰 金币加成', '+'+st.goldPct+'%'],
  ].map(([n,v])=>`<div class="stat-cell"><span>${n}</span><b>${v}</b></div>`).join('');
  const slots = D.SLOT_ORDER.map(slot=>{
    const it = h.equip[slot];
    return `<div class="equip-slot" data-slot="${slot}">
      <span class="eq-icon">${D.SLOTS[slot].icon}</span>
      ${it ? `<div><div class="eq-name q${it.q}">${it.name}${it.plus?` <span class="item-plus">+${it.plus}</span>`:''}</div><div class="eq-sub">${UI.baseLine(it)}</div></div>`
           : `<div style="color:#b9ad8f">${D.SLOTS[slot].name} · 空</div>`}
    </div>`;
  }).join('');
  const potions = Object.keys(D.POTIONS).map(pid=>{
    const p = D.POTIONS[pid], n = h.potions[pid]||0;
    return `<button class="btn btn-mini" data-potion="${pid}" ${n<=0?'disabled':''}>${p.icon}${p.name} ×${n}</button>`;
  }).join(' ');
  el('tab-hero').innerHTML = `
    <div class="grid3">
      <div class="card"><h3>🧑‍🚀 ${h.name} · Lv.${h.lv}</h3>
        <div class="hpbar"><div style="width:${h.hp/st.maxHp*100}%"></div><span class="bar-text">${Math.round(h.hp)} / ${st.maxHp}</span></div>
        <div class="mpbar" style="margin-top:5px"><div style="width:${h.mp/st.maxMp*100}%"></div><span class="bar-text">${Math.round(h.mp)} / ${st.maxMp}</span></div>
        <p style="margin:10px 0 6px;font-size:14px">可用属性点：<b style="color:var(--orange)">${h.points}</b>　技能点：<b style="color:var(--purple)">${h.skillPoints}</b></p>
        ${attrRows}
        <h3 style="margin-top:14px">🧪 药水（战斗外使用）</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${potions}</div>
      </div>
      <div class="card"><h3>📊 战斗属性</h3><div class="stat-grid">${statCells}</div></div>
      <div class="card"><h3>🎽 装备栏（点击查看）</h3><div style="display:flex;flex-direction:column;gap:8px">${slots}</div></div>
    </div>`;
  el('tab-hero').querySelectorAll('[data-attr]').forEach(b=>{ b.onclick = ()=>{ if (G.addAttr(b.dataset.attr)){ UI.renderAll(); } }; });
  el('tab-hero').querySelectorAll('[data-potion]').forEach(b=>{ b.onclick = ()=>{ const r = G.usePotion(b.dataset.potion); if (r) UI.toast('已使用药水'); UI.renderAll(); }; });
  el('tab-hero').querySelectorAll('.equip-slot').forEach(d=>{ d.onclick = ()=>{ const it = h.equip[d.dataset.slot]; if (it) UI.showItem(it.id); else UI.toast('该部位还没有装备'); }; });
};

/* ================= 背包页 ================= */
UI.renderBag = function(){
  const s = G.state;
  const items = s.inv.map((it,i)=>`<div class="item-card qb${it.q}" data-id="${it.id}">
    <div class="item-top"><span>${D.SLOTS[it.slot].icon}</span><span class="item-name q${it.q}">${it.name}</span>${it.plus?`<span class="item-plus">+${it.plus}</span>`:''}<span class="item-lv">Lv.${it.ilv} ${D.QUALITY[it.q].name}</span></div>
    <div class="item-stats">${UI.baseLine(it)}${it.affixes&&it.affixes.length?'<br>'+it.affixes.map(a=>`◆${a.name}+${a.v}${a.pct?'%':''}`).join(' '):''}</div>
  </div>`).join('');
  el('tab-bag').innerHTML = `
    <div class="card" style="margin-bottom:10px"><b>🎒 背包 ${s.inv.length}/${s.invCap}</b>　<span style="color:var(--ink2);font-size:13px">点击装备查看详情、穿上或分解。背包满时自动分解最低品质装备。</span></div>
    ${s.inv.length ? `<div class="bag-grid">${items}</div>` : '<div class="card" style="text-align:center;color:var(--ink2)">背包空空如也，去野外探索吧！</div>'}`;
  el('tab-bag').querySelectorAll('.item-card').forEach(c=>{ c.onclick = ()=> UI.showItem(c.dataset.id); });
};

/* ================= 技能页 ================= */
UI.renderSkill = function(){
  const h = G.state.hero;
  const actives = D.SKILL_ORDER.map(sid=>{
    const d = D.SKILLS[sid], lv = h.skills[sid]||0, locked = h.lv < d.req;
    const showLv = Math.max(1, lv);
    const pips = '●'.repeat(lv) + '○'.repeat(d.max-lv);
    return `<div class="card skill-card ${locked?'skill-lock':''}">
      <div class="skill-icon">${d.icon}</div>
      <div class="skill-info">
        <div class="skill-name">${d.name} <span class="skill-lvpips">${pips}</span></div>
        <div class="skill-meta">需求 Lv.${d.req} · 耗蓝 ${d.mp}${d.cd?` · 冷却 ${d.cd} 回合`:''}</div>
        <div class="skill-desc">${locked ? `Lv.${d.req} 解锁` : d.desc(showLv) + (lv>0&&lv<d.max ? `<br>下一级：${d.desc(lv+1)}` : '')}</div>
      </div>
      <button class="btn ${lv===0?'btn-green':'btn-primary'}" data-skill="${sid}" ${locked||lv>=d.max||h.skillPoints<=0?'disabled':''}>${lv===0?'学习':lv>=d.max?'已满级':'升级'}（1点）</button>
    </div>`;
  }).join('');
  const passives = D.PASSIVE_ORDER.map(pid=>{
    const d = D.PASSIVES[pid], lv = h.passives[pid]||0, locked = h.lv < d.req;
    const pips = '●'.repeat(lv) + '○'.repeat(d.max-lv);
    return `<div class="card skill-card ${locked?'skill-lock':''}">
      <div class="skill-icon">${d.icon}</div>
      <div class="skill-info">
        <div class="skill-name">${d.name} <span class="skill-lvpips">${pips}</span></div>
        <div class="skill-meta">需求 Lv.${d.req}</div>
        <div class="skill-desc">${d.desc}${lv>0?`　<b style="color:var(--green)">当前 +${d.per*lv}${d.stat==='crit'||d.stat==='lifesteal'?'%':'%'}</b>`:''}</div>
      </div>
      <button class="btn ${lv===0?'btn-green':'btn-primary'}" data-passive="${pid}" ${locked||lv>=d.max||h.skillPoints<=0?'disabled':''}>${lv===0?'学习':lv>=d.max?'已满级':'升级'}（1点）</button>
    </div>`;
  }).join('');
  el('tab-skill').innerHTML = `
    <div class="card" style="margin-bottom:10px"><b>✨ 技能体系</b>　可用技能点：<b style="color:var(--purple);font-size:18px">${h.skillPoints}</b>　<span style="color:var(--ink2);font-size:13px">每升 1 级获得 1 点，主动/被动技能通用</span></div>
    <div class="grid2"><div style="display:flex;flex-direction:column;gap:10px"><h3 style="color:#6b5316">⚔️ 主动技能</h3>${actives}</div>
    <div style="display:flex;flex-direction:column;gap:10px"><h3 style="color:#6b5316">🌟 被动技能</h3>${passives}</div></div>`;
  el('tab-skill').querySelectorAll('[data-skill]').forEach(b=>{ b.onclick = ()=>{ if (G.learnSkill(b.dataset.skill)){ UI.toast('技能提升！'); UI.renderAll(); } }; });
  el('tab-skill').querySelectorAll('[data-passive]').forEach(b=>{ b.onclick = ()=>{ if (G.learnPassive(b.dataset.passive)){ UI.toast('被动提升！'); UI.renderAll(); } }; });
};

/* ================= 锻造页 ================= */
UI.matBar = function(){
  const m = G.state.mats;
  return `<div class="mat-bar">${Object.keys(D.MATS).map(k=>`<span>${D.MATS[k].icon}${D.MATS[k].name} <b>${m[k]}</b></span>`).join('')}<span>💰金币 <b>${G.fmt(G.state.gold)}</b></span></div>`;
};
UI.allItems = function(){
  const s = G.state, out = [];
  D.SLOT_ORDER.forEach(slot=>{ if (s.hero.equip[slot]) out.push(s.hero.equip[slot]); });
  return out.concat(s.inv);
};
UI.renderForge = function(){
  const t = this.forge.tab;
  const tabs = [['enh','🔮 强化'],['reroll','🌀 洗练'],['craft','⚒️ 打造'],['salvage','♻️ 分解']];
  let body = '';
  if (t === 'enh') body = this.forgeEnhance();
  else if (t === 'reroll') body = this.forgeReroll();
  else if (t === 'craft') body = this.forgeCraft();
  else body = this.forgeSalvage();
  el('tab-forge').innerHTML = `
    ${UI.matBar()}
    <div class="forge-tabs">${tabs.map(([k,n])=>`<button class="forge-tab ${t===k?'active':''}" data-ftab="${k}">${n}</button>`).join('')}</div>
    ${body}`;
  el('tab-forge').querySelectorAll('[data-ftab]').forEach(b=>{ b.onclick = ()=>{ this.forge.tab = b.dataset.ftab; this.forge.itemId = null; UI.renderForge(); }; });
  this.wireForge();
};

UI.forgeItemList = function(selectedId){
  return UI.allItems().map(it=>`<div class="item-card qb${it.q}" data-fid="${it.id}" style="${selectedId===it.id?'outline:2.5px solid var(--orange);':''}">
    <div class="item-top"><span>${D.SLOTS[it.slot].icon}</span><span class="item-name q${it.q}">${it.name}</span>${it.plus?`<span class="item-plus">+${it.plus}</span>`:''}<span class="item-lv">${G.state.hero.equip[it.slot]&&G.state.hero.equip[it.slot].id===it.id?'已装备':'背包'}</span></div>
    <div class="item-stats">${UI.baseLine(it)}</div>
  </div>`).join('');
};

UI.forgeEnhance = function(){
  const f = this.forge.itemId && G.findItem(this.forge.itemId);
  let target = `<div class="forge-target"><span style="color:var(--ink2)">👇 从下方选择要强化的装备（含已装备）</span></div>`;
  if (f){
    const it = f.item, plus = it.plus||0;
    if (plus >= D.ENHANCE_MAX){
      target = `<div class="forge-target"><div style="text-align:center"><div class="detail-title q${it.q}">${it.name} +${plus}</div><div class="rate-ok" style="font-size:16px">已达强化上限 +15！</div></div></div>`;
    } else {
      const cost = D.enhanceCost(plus, it.ilv);
      const rate = D.ENHANCE_RATE[plus];
      const risky = D.enhanceFail(plus) !== 0;
      target = `<div class="forge-target"><div style="text-align:center">
        <div class="detail-title q${it.q}">${D.SLOTS[it.slot].icon} ${it.name} ${plus?`+${plus}`:''}</div>
        <div class="ench-rate">成功率 <span class="${rate>=70?'rate-ok':'rate-risk'}">${rate}%</span>　费用 💰${cost.gold} + 🔮强化石×${cost.stone}<br>
        ${risky?'<span class="rate-risk">失败将降低 1 级！</span>':'<span class="rate-ok">失败不降级</span>'}　每级基础属性 +6%</div>
        <button class="btn btn-gold" id="btn-enh" style="margin-top:6px">🔨 强化到 +${plus+1}</button>
      </div></div>`;
    }
  }
  return `${target}<div class="forge-list">${UI.forgeItemList(this.forge.itemId)}</div>`;
};

UI.forgeReroll = function(){
  const f = this.forge.itemId && G.findItem(this.forge.itemId);
  let target = `<div class="forge-target"><span style="color:var(--ink2)">👇 选择要洗练词条的装备（消耗 1 个 🌀洗练石，词条数量不变、数值重随）</span></div>`;
  if (f){
    const it = f.item;
    target = `<div class="forge-target"><div style="text-align:center">
      <div class="detail-title q${it.q}">${D.SLOTS[it.slot].icon} ${it.name}${it.plus?` +${it.plus}`:''}</div>
      <div style="margin:6px 0">${(it.affixes||[]).map(UI.affixLine).join('<br>') || '（无词条）'}</div>
      <button class="btn btn-purple" id="btn-reroll" ${G.state.mats.reroll<1?'disabled':''}>🌀 洗练词条（🌀×1）</button>
    </div></div>`;
  }
  return `${target}<div class="forge-list">${UI.forgeItemList(this.forge.itemId)}</div>`;
};

UI.forgeCraft = function(){
  const c = G.CRAFT_COST;
  const slotBtns = D.SLOT_ORDER.map(s=>`<button class="forge-tab ${this.forge.craftSlot===s?'active':''}" data-cslot="${s}">${D.SLOTS[s].icon} ${D.SLOTS[s].name}</button>`).join('');
  return `<div class="card">
    <h3>⚒️ 打造 ${D.SLOTS[this.forge.craftSlot].name}（物品等级 = 你当前的等级 Lv.${G.state.hero.lv}）</h3>
    <div class="forge-tabs">${slotBtns}</div>
    <p style="font-size:13.5px;line-height:2">
      <b>普通打造</b>：⛏️精铁×${c.iron} + 🟫兽皮×${c.hide} + 💎魔晶×${c.crystal} + 💰${c.gold}<br>
      　品质概率：🟢优秀30% · 🔵稀有35% · 🟣史诗22% · 🟠传说13%<br>
      <b>暗金打造</b>：上述材料 + 🌟暗金精华×3（分解暗金装备或击败暗金小Boss获得）<br>
      　<b class="q5">必出暗金装备，带专属强力词条！</b>
    </p>
    <div style="display:flex;gap:10px;margin-top:8px">
      <button class="btn btn-primary" id="btn-craft">⚒️ 普通打造</button>
      <button class="btn btn-gold" id="btn-craft-dark" ${G.state.mats.essence<3?'disabled':''}>🌟 暗金打造（🌟×3）</button>
    </div></div>`;
};

UI.forgeSalvage = function(){
  const s = G.state;
  const list = s.inv.map((it,i)=>{
    const v = G.salvageValue(it);
    return `<div class="item-card qb${it.q}">
      <div class="item-top"><span>${D.SLOTS[it.slot].icon}</span><span class="item-name q${it.q}">${it.name}</span>${it.plus?`<span class="item-plus">+${it.plus}</span>`:''}</div>
      <div class="item-stats">分解得：⛏️${v.iron} 🟫${v.hide} 💎${v.crystal}${v.essence?` 🌟${v.essence}`:''} 💰${v.gold}</div>
      <button class="btn btn-mini" data-salv="${i}" style="margin-top:4px">♻️ 分解</button>
    </div>`;
  }).join('');
  return `<div class="card" style="margin-bottom:10px"><b>♻️ 分解装备获得锻造材料</b>　<button class="btn btn-mini" id="btn-salv-all" ${!s.inv.some(x=>x.q<=1)?'disabled':''}>一键分解所有 白/绿 装备</button></div>
    ${s.inv.length?`<div class="forge-list" style="max-height:none">${list}</div>`:'<div class="card" style="text-align:center;color:var(--ink2)">背包没有可分解的装备</div>'}`;
};

UI.wireForge = function(){
  const root = el('tab-forge');
  root.querySelectorAll('[data-fid]').forEach(c=>{ c.onclick = ()=>{ this.forge.itemId = c.dataset.fid; UI.renderForge(); }; });
  root.querySelectorAll('[data-cslot]').forEach(b=>{ b.onclick = ()=>{ this.forge.craftSlot = b.dataset.cslot; UI.renderForge(); }; });
  const be = el('btn-enh');
  if (be) be.onclick = ()=>{
    const r = G.enhance(this.forge.itemId);
    UI.toast(r.msg);
    if (r.ok === false && r.msg.includes('不足')) return;
    UI.renderAll(); // 重渲染（含锻造页）
    this.tab = 'forge';
    UI.showTab('forge');
  };
  const br = el('btn-reroll');
  if (br) br.onclick = ()=>{
    const r = G.reroll(this.forge.itemId);
    UI.toast(r.msg); UI.renderAll(); this.tab='forge'; UI.showTab('forge');
  };
  const bc = el('btn-craft');
  if (bc) bc.onclick = ()=> UI.doCraft(false);
  const bd = el('btn-craft-dark');
  if (bd) bd.onclick = ()=> UI.doCraft(true);
  const ba = el('btn-salv-all');
  if (ba) ba.onclick = ()=>{
    const s = G.state; let n = 0;
    for (let i = s.inv.length-1; i >= 0; i--){ if (s.inv[i].q <= 1){ G.salvage(i, true); n++; } }
    G.save(); UI.toast(`分解了 ${n} 件装备`); UI.renderAll(); this.tab='forge'; UI.showTab('forge');
  };
  root.querySelectorAll('[data-salv]').forEach(b=>{ b.onclick = e=>{ e.stopPropagation(); const v = G.salvage(Number(b.dataset.salv)); if (v){ UI.toast('分解完成'); UI.renderAll(); this.tab='forge'; UI.showTab('forge'); } }; });
};

UI.doCraft = function(dark){
  const r = G.craft(this.forge.craftSlot, dark);
  if (!r.ok){ UI.toast(r.msg); return; }
  const it = r.item;
  UI.renderAll(); this.tab='forge'; UI.showTab('forge');
  UI.showModal(`<div class="result-title" style="color:var(--gold)">⚒️ 打造成功！</div>
    <div class="loot-list" style="text-align:center">
      <div class="detail-title q${it.q}">${D.SLOTS[it.slot].icon} ${it.name}</div>
      <div class="eq-sub">${D.QUALITY[it.q].name} · 物品等级 ${it.ilv}</div>
      <div class="detail-base">${UI.baseLine(it)}</div>
      ${(it.affixes||[]).map(UI.affixLine).join('<br>')}
      ${it.special?`<div class="detail-special">★ 暗金专属：${it.special.name} +${it.special.v}%</div>`:''}
    </div>
    <div class="result-btns"><button class="btn btn-primary" id="m-ok2">收下</button></div>`);
  el('m-ok2').onclick = ()=> UI.closeModal();
};

/* ================= 商店页 ================= */
UI.renderShop = function(){
  const s = G.state;
  const cards = D.SHOP.map(d=>{
    const isPotion = d.type === 'potion';
    const p = isPotion ? D.POTIONS[d.id] : d;
    const own = isPotion ? (s.hero.potions[d.id]||0) : (s.mats[d.id]||0);
    const price = isPotion ? p.price : d.price;
    return `<div class="card shop-card">
      <div class="shop-icon">${p.icon}</div>
      <div class="shop-name">${p.name}</div>
      <div class="shop-desc">${p.desc}</div>
      <div class="shop-price">💰 ${price}</div>
      <div class="shop-own">已拥有：${own}</div>
      <button class="btn btn-green btn-mini" data-buy="${d.id}" ${s.gold<price?'disabled':''} style="margin-top:6px">购买</button>
    </div>`;
  }).join('');
  el('tab-shop').innerHTML = `<div class="card" style="margin-bottom:10px"><b>🏪 杂货商店</b>　<span style="color:var(--ink2);font-size:13px">金币余额 💰 ${G.fmt(s.gold)}。药水在战斗中也能使用。</span></div>
    <div class="shop-grid">${cards}</div>`;
  el('tab-shop').querySelectorAll('[data-buy]').forEach(b=>{ b.onclick = ()=>{ if (G.buy(b.dataset.buy)){ UI.toast('购买成功'); UI.renderAll(); } }; });
};

/* ================= 页签切换 ================= */
UI.showTab = function(name){
  this.tab = name;
  document.querySelectorAll('#tabs .tab').forEach(t=> t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('main .panel').forEach(p=> p.classList.add('hidden'));
  el('tab-'+name).classList.remove('hidden');
  UI.renderAll();
};

/* ================= 战斗界面 ================= */
UI.battle = {};

UI.battle.show = function(){
  el('battle-overlay').classList.remove('hidden');
  el('battle-log').innerHTML = '';
  el('battle-sub').classList.add('hidden');
  el('battle-actions').innerHTML = '';
  this.refresh();
};
UI.battle.hide = function(){
  el('battle-overlay').classList.add('hidden');
  el('battle-sub').classList.add('hidden');
};
UI.battle.setRound = n => el('battle-round').textContent = `第 ${n} 回合`;
UI.battle.setTurn = t => el('battle-turn').textContent = t;

UI.battle.foeCardHtml = function(f){
  const t = D.TIERS[f.tier];
  const chips = f.buffs.map(b=>{
    const m = { atkUp:'💢攻↑', defUp:'🔰防↑', defDown:'💔防↓', stun:'💫眩晕', dmgCut:'✝️减伤' }[b.type]||b.type;
    return `${m}${b.dur<=9?b.dur:''}`;
  }).join(' ');
  return `<div class="enemy-card ec-${f.tier} ${f.alive?'':'dead'}" data-foe="${f.idx}">
    <div class="enemy-icon">${f.icon}</div>
    <div class="enemy-name ${t.cls}">${f.name}</div>
    <div class="enemy-lv">Lv.${f.lv} · ${t.name}</div>
    <div class="enemy-hp"><div style="width:${Math.max(0,f.hp/f.stats.maxHp*100)}%"></div></div>
    <div class="enemy-lv">${Math.max(0,Math.round(f.hp))}/${f.stats.maxHp}${f.enraged?' <span style="color:var(--red)">狂暴</span>':''}</div>
    <div class="enemy-buffs">${chips}</div>
  </div>`;
};

UI.battle.refresh = function(){
  if (!B.hero) return;
  el('enemy-row').innerHTML = B.foes.map(f=>this.foeCardHtml(f)).join('');
  const h = B.hero;
  const chips = h.buffs.map(b=>{
    const m = { atkUp:'💢攻↑', defUp:'🔰防↑', defDown:'💔防↓', stun:'💫眩晕', dmgCut:'✝️减伤' }[b.type]||b.type;
    return `${m}${b.dur<=9?b.dur:''}`;
  }).join(' ') + (h.defending?' 🛡️防御中':'');
  el('hero-panel').innerHTML = `
    <div style="font-weight:900">${h.icon} ${h.name} <span style="font-size:12px;color:var(--ink2)">Lv.${h.lv}</span></div>
    <div class="hpbar"><div style="width:${Math.max(0,h.hp/h.stats.maxHp*100)}%"></div><span class="bar-text">${Math.max(0,Math.round(h.hp))} / ${h.stats.maxHp}</span></div>
    <div class="mpbar"><div style="width:${Math.max(0,h.mp/h.stats.maxMp*100)}%"></div><span class="bar-text">${Math.max(0,Math.round(h.mp))} / ${h.stats.maxMp}</span></div>
    <div class="hero-buffs">${chips}</div>
    <div style="font-size:11.5px;color:var(--ink2)">⚔️${h.stats.atk} 🛡️${h.stats.def} 💨${h.stats.spd} 🎯${h.stats.crit}%</div>`;
};

UI.battle.log = function(html, cls){
  const box = el('battle-log');
  const d = document.createElement('div');
  if (cls) d.className = cls;
  d.innerHTML = html;
  box.appendChild(d);
  while (box.children.length > 220) box.removeChild(box.firstChild);
  box.scrollTop = box.scrollHeight;
};

UI.battle.floatNum = function(unit, text, cls){
  let host;
  if (unit.side === 'hero') host = el('hero-panel');
  else host = el('enemy-row').querySelector(`[data-foe="${unit.idx}"]`);
  if (!host) return;
  const s = document.createElement('span');
  s.className = 'dmg-num ' + (cls||'');
  s.textContent = text;
  host.appendChild(s);
  setTimeout(()=> s.remove(), 850);
};
UI.battle.shake = function(unit){
  let host;
  if (unit.side === 'hero') host = el('hero-panel');
  else host = el('enemy-row').querySelector(`[data-foe="${unit.idx}"]`);
  if (!host) return;
  host.classList.remove('shake'); void host.offsetWidth; host.classList.add('shake');
};

/* 行动按钮 */
UI.battle.actions = function(){
  this.clearSub();
  el('battle-actions').innerHTML = `
    <button class="btn btn-primary" id="ba-atk">⚔️ 攻击</button>
    <button class="btn btn-blue" id="ba-skill">✨ 技能</button>
    <button class="btn" id="ba-def">🛡️ 防御</button>
    <button class="btn btn-green" id="ba-potion">🧪 药水</button>
    <button class="btn" id="ba-flee">🏃 逃跑</button>`;
  el('ba-atk').onclick = ()=> B.act('attack');
  el('ba-def').onclick = ()=> B.act('defend');
  el('ba-flee').onclick = ()=> B.act('flee');
  el('ba-skill').onclick = ()=> this.skillMenu();
  el('ba-potion').onclick = ()=> this.potionMenu();
};
UI.battle.clearSub = function(){
  el('battle-sub').classList.add('hidden');
  el('battle-sub').innerHTML = '';
};

UI.battle.skillMenu = function(){
  const h = G.state.hero;
  const btns = Object.keys(h.skills).map(sid=>{
    const d = D.SKILLS[sid], lv = h.skills[sid];
    const cd = B.hero.cds[sid]||0;
    const noMp = B.hero.mp < d.mp;
    return `<button class="btn ${cd>0||noMp?'sub-cd':''}" data-sid="${sid}" ${cd>0||noMp?'disabled':''}>${d.icon}${d.name} Lv.${lv}<br><span style="font-size:11px">耗蓝${d.mp}${cd>0?` · 冷却${cd}回合`:''}${noMp?' · 蓝不足':''}</span></button>`;
  }).join('');
  el('battle-sub').innerHTML = `${btns}<button class="btn" id="ba-back">↩ 返回</button>`;
  el('battle-sub').classList.remove('hidden');
  el('battle-sub').querySelectorAll('[data-sid]').forEach(b=>{ b.onclick = ()=>{ this.clearSub(); B.act('skill', b.dataset.sid); }; });
  el('ba-back').onclick = ()=> this.clearSub();
};

UI.battle.potionMenu = function(){
  const h = G.state.hero;
  const btns = Object.keys(D.POTIONS).map(pid=>{
    const p = D.POTIONS[pid], n = h.potions[pid]||0;
    return `<button class="btn" data-pid="${pid}" ${n<=0?'disabled':''}>${p.icon}${p.name} ×${n}</button>`;
  }).join('');
  el('battle-sub').innerHTML = `${btns}<button class="btn" id="ba-back2">↩ 返回</button>`;
  el('battle-sub').classList.remove('hidden');
  el('battle-sub').querySelectorAll('[data-pid]').forEach(b=>{ b.onclick = ()=>{ this.clearSub(); B.act('potion', b.dataset.pid); }; });
  el('ba-back2').onclick = ()=> this.clearSub();
};

/* 点选目标 */
UI.battle.pickTarget = function(alive, cb){
  el('battle-actions').innerHTML = `<span style="font-weight:800;color:var(--orange)">🎯 点击选择一个目标</span>`;
  el('battle-sub').innerHTML = `<button class="btn" id="ba-cancel">取消</button>`;
  el('battle-sub').classList.remove('hidden');
  const done = t=>{
    el('battle-sub').classList.add('hidden');
    el('enemy-row').querySelectorAll('.enemy-card').forEach(c=>{ c.classList.remove('targetable','selected'); c.onclick = null; });
    cb(t);
  };
  alive.forEach(f=>{
    const card = el('enemy-row').querySelector(`[data-foe="${f.idx}"]`);
    if (!card) return;
    card.classList.add('targetable');
    card.onclick = ()=>{ card.classList.add('selected'); done(f); };
  });
  el('ba-cancel').onclick = ()=>{ done(null); UI.battle.actions(); UI.battle.setTurn('你的回合 — 选择行动'); };
};

/* 胜利结算 */
UI.battle.showResult = function(r, enc){
  const drops = r.drops.map(it=>`<div>🎁 <b class="q${it.q}">${D.SLOTS[it.slot].icon} ${it.name}</b> <span style="font-size:12px;color:var(--ink2)">（${D.QUALITY[it.q].name} · Lv.${it.ilv}）</span></div>`).join('');
  const ups = r.ups.length ? `<div class="log-sys" style="font-size:16px">🎉 升级！达到 Lv.${r.ups[r.ups.length-1]}（+${r.ups.length*3} 属性点 +${r.ups.length} 技能点，状态全满）</div>` : '';
  let extra = '';
  if (enc.type === 'stage'){
    const m = G.curMap(), idx = D.MAPS.indexOf(m);
    extra = idx+1 < D.MAPS.length ? `<div class="log-sys" style="font-size:15px">🗺️ 新地图「${D.MAPS[idx+1].icon}${D.MAPS[idx+1].name}」已解锁！</div>` : `<div class="log-sys" style="font-size:15px">🐲 终极Boss「苍穹龙王」已在神殿之巅现身！</div>`;
  }
  if (enc.type === 'final'){
    extra = `<div class="clear-banner"><h2>👑 通关！你击败了苍穹龙王！</h2><p style="color:var(--ink2)">旷野重归和平。你可以继续刷装备、冲击强化 +15 与满级！</p></div>`;
  }
  UI.showModal(`
    <div class="result-title win">🏆 战斗胜利！</div>
    <div class="result-sub">${enc.foes.map(f=>`${f.icon}${f.name}`).join('、')} 被击败</div>
    <div class="loot-list">
      <div>📈 经验 <b style="color:var(--exp)">+${r.exp}</b>　💰 金币 <b style="color:var(--gold)">+${r.gold}</b></div>
      ${ups}${drops || '<div style="color:var(--ink2)">（没有装备掉落）</div>'}${extra}
    </div>
    <div class="result-btns"><button class="btn btn-primary" id="m-win">继续冒险</button></div>`);
  el('m-win').onclick = ()=>{ UI.closeModal(); B.leave(); };
};

UI.battle.showDefeat = function(r){
  UI.showModal(`
    <div class="result-title lose">💀 战斗失败…</div>
    <div class="result-sub">你在野外倒下了，损失 💰${r.lost} 金币（10%）。已在营地复活，状态全满。</div>
    <div class="result-btns"><button class="btn btn-primary" id="m-lose">回城休整</button></div>`);
  el('m-lose').onclick = ()=>{ UI.closeModal(); B.leave(); };
};
