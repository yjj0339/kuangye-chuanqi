/* 通过 GitHub Contents API 部署（git push 不通时的备选通道）：node tools/deploy.js */
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = 'yjj0339/kuangye-chuanqi';
const FILES = [
  'index.html', '.nojekyll', '.gitignore', 'README.md', 'qr-live.png',
  'css/style.css', 'js/data.js', 'js/engine.js', 'js/battle.js', 'js/ui.js', 'js/main.js',
  'test/balance.js', 'tools/server.js', 'tools/deploy.js',
];
const ROOT = path.join(__dirname, '..');

function gh(args){
  return execSync(`gh api ${args}`, { encoding: 'utf8', maxBuffer: 32*1024*1024 });
}

(async ()=>{
  for (const f of FILES){
    const full = path.join(ROOT, f);
    if (!fs.existsSync(full)){ console.log('SKIP', f); continue; }
    // 取已有文件 sha（更新时必须）
    let sha = null;
    try { sha = JSON.parse(gh(`repos/${REPO}/contents/${f}`)).sha; } catch(e){ /* 新文件 */ }
    const payload = { message: '旷野传说 v2：试炼塔/成就/图鉴/自动战斗/离线收益', content: fs.readFileSync(full).toString('base64') };
    if (sha) payload.sha = sha;
    const tmp = path.join(ROOT, '.deploy-payload.json');
    fs.writeFileSync(tmp, JSON.stringify(payload));
    try {
      gh(`-X PUT repos/${REPO}/contents/${f} --input .deploy-payload.json`);
      console.log('OK', f);
    } catch(e){
      console.log('FAIL', f, String(e.message).slice(0, 120));
    } finally {
      fs.unlinkSync(tmp);
    }
  }
  console.log('部署完成');
})();
