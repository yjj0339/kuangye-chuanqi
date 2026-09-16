/* ===== 旷野传说 · 启动引导 ===== */
'use strict';
(function(){
  function enterGame(){
    el('start-screen').classList.add('hidden');
    el('app').classList.remove('hidden');
    UI.showTab('map');
    // 离线收益结算
    if (G.state && G.state.offline){
      const o = G.state.offline;
      delete G.state.offline;
      const e = G.gainExp(o.exp);
      G.save();
      UI.showModal(`<div class="result-title" style="color:var(--gold)">💤 离线收益</div>
        <div class="result-sub">你离开了 ${o.mins >= 60 ? Math.floor(o.mins/60)+' 小时 ' : ''}${o.mins%60 ? (o.mins%60)+' 分钟' : ''}，冒险者没有闲着！</div>
        <div class="loot-list" style="text-align:center">💰 金币 <b style="color:var(--gold)">+${o.gold}</b>　📈 经验 <b style="color:var(--exp)">+${e.gained}</b>${e.ups.length?`<br>🎉 连升 ${e.ups.length} 级！`:''}</div>
        <div class="result-btns"><button class="btn btn-primary" id="m-offline">收下</button></div>`);
      el('m-offline').onclick = ()=>{ UI.closeModal(); UI.renderAll(); };
    }
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    if (G.hasSave()) el('btn-continue').classList.remove('hidden');
    el('btn-new').onclick = ()=>{
      if (G.hasSave()){
        UI.showModal(`<div class="result-title lose">⚠️ 覆盖存档？</div>
          <div class="result-sub">开始新的征程将覆盖现有存档（Lv.${(JSON.parse(localStorage.getItem(G.SAVE_KEY)||'{}').hero||{}).lv||'?'}），确定吗？</div>
          <div class="result-btns"><button class="btn btn-red" id="nb-yes">覆盖，重新开始</button><button class="btn" id="nb-no">取消</button></div>`);
        el('nb-yes').onclick = ()=>{ UI.closeModal(); G.newGame(); enterGame(); UI.toast('🎉 新的冒险开始了！'); };
        el('nb-no').onclick = ()=> UI.closeModal();
      } else {
        G.newGame(); enterGame(); UI.toast('🎉 欢迎来到旷野传说！');
      }
    };
    el('btn-continue').onclick = ()=>{
      if (G.load()){ enterGame(); UI.toast('▶ 存档已读取，继续冒险！'); }
      else UI.toast('存档损坏，请开始新的征程');
    };
    document.querySelectorAll('#tabs .tab').forEach(t=>{
      t.onclick = ()=>{ if (B.active) return; UI.showTab(t.dataset.tab); };
    });
    el('btn-save').onclick = ()=>{ G.save(); UI.toast('💾 进度已保存'); };
    el('btn-rest').onclick = ()=>{
      if (B.active) return;
      G.rest(); UI.toast('🏕️ 休息完毕，生命与法力全满'); UI.renderAll();
    };
    // 战斗速度 1x → 2x → 3x
    el('btn-speed').onclick = ()=>{
      const st = G.state.settings;
      st.speed = st.speed >= 3 ? 1 : st.speed + 1;
      G.save(); UI.battle.optsRefresh();
    };
    // 自动战斗开关；若在等待玩家输入，立即接管本回合
    el('btn-auto').onclick = ()=>{
      const st = G.state.settings;
      st.auto = !st.auto;
      G.save(); UI.battle.optsRefresh();
      if (st.auto && B.active && B._wait){
        setTimeout(()=> B.autoResolve(), 200);
      } else if (!st.auto && B.active && B._wait){
        UI.battle.setTurn('你的回合 — 选择行动');
      }
    };
    window.addEventListener('beforeunload', ()=>{ try{ G.save(); }catch(e){} });
  });
})();
