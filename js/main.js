/* ===== 旷野传说 · 启动引导 ===== */
'use strict';
(function(){
  function enterGame(){
    el('start-screen').classList.add('hidden');
    el('app').classList.remove('hidden');
    UI.showTab('map');
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
    window.addEventListener('beforeunload', ()=>{ try{ G.save(); }catch(e){} });
  });
})();
