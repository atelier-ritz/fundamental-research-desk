import fs from 'node:fs';
const finance=fs.readFileSync('src/finance.mjs','utf8').replaceAll('export ','');
const data=fs.readFileSync('src/snapshot.json','utf8').replaceAll('<','\\u003c');
const app=finance+'\n'+fs.readFileSync('src/observations.mjs','utf8').replaceAll('export ','')+'\n'+fs.readFileSync('src/help.js','utf8')+'\n'+fs.readFileSync('src/app.js','utf8');
const page=fs.readFileSync('src/page.html','utf8').replace('/*STYLES*/',()=>fs.readFileSync('src/style.css','utf8')).replace('/*DATA*/',()=>data).replace('/*APP*/',()=>app);
fs.writeFileSync('worker/index.js',finance+'\nconst PAGE='+JSON.stringify(page)+';\n'+fs.readFileSync('src/worker.mjs','utf8'));
fs.writeFileSync('report.html',page);
console.log('Built self-contained report and Worker.');
