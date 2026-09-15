/* 本地局域网预览服务器：node tools/server.js [端口] */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.argv[2]) || 8090;
const MIME = {
  '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json', '.png':'image/png',
  '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.md':'text/plain; charset=utf-8',
};

http.createServer((req, res)=>{
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
    res.writeHead(404); res.end('404'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, ()=>{
  const nets = os.networkInterfaces();
  let lan = 'localhost';
  for (const name of Object.keys(nets)){
    for (const n of nets[name]||[]){
      if (n.family === 'IPv4' && !n.internal){ lan = n.address; break; }
    }
  }
  console.log(`旷野传说 本地服务器已启动：`);
  console.log(`  电脑打开: http://localhost:${PORT}/`);
  console.log(`  手机打开: http://${lan}:${PORT}/`);
});
