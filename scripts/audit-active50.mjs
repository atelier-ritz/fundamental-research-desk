import fs from 'node:fs/promises';
import {REPORT_REVISION} from '../src/finance.mjs';
import {reportedQuarterPeriods} from '../src/quarters.mjs';
const root='docs/active50-2026-11-04',ranking=JSON.parse(await fs.readFile(root+'/ranking.json','utf8'));
const origin='https://fundamental-research-desk.comfydance.chatgpt.site';
const fields={revenue:'Revenue',operating:'Operating income',net:'Net income',cfo:'Operating cash flow',capex:'PP&E cash purchases',cash:'Cash and equivalents',investments:'Current investments',debtCurrent:'Current long-term debt',debtLong:'Noncurrent long-term debt',shortDebt:'Short-term borrowings',dividends:'Cash dividends',shares:'Annual-end shares'};
const cache='/tmp/fundamental-active50-2026-11-04';await fs.mkdir(cache,{recursive:true});
const results=[];let cursor=0;
async function run(){while(cursor<ranking.stocks.length){const stock=ranking.stocks[cursor++],path=cache+'/'+stock.ticker+'.json';let payload,httpStatus,fromCache=false;
 try{try{const saved=JSON.parse(await fs.readFile(path,'utf8'));({payload,httpStatus}=saved);fromCache=true;}catch{const r=await fetch(origin+'/api/company?ticker='+encodeURIComponent(stock.ticker)+'&refresh=1&schema='+REPORT_REVISION,{signal:AbortSignal.timeout(90000)});httpStatus=r.status;payload=await r.json();await fs.writeFile(path,JSON.stringify({payload,httpStatus}));}
 if(httpStatus!==200||!payload.years){results.push({...stock,status:/US GAAP/.test(payload.error)?'unsupported_format':/two comparable/.test(payload.error)?'insufficient_history':httpStatus===404?'lookup_failure':'retrieval_failure',httpStatus,error:payload.error||'Unexpected API response'});}else{
 if(payload.schemaVersion!==REPORT_REVISION)throw Error('Unexpected report revision '+payload.schemaVersion);
 const y=payload.years.at(-1),q=reportedQuarterPeriods(payload.quarterly),allKeys=Object.keys(fields),present=allKeys.filter(k=>Number.isFinite(y.facts[k]?.val)),missing=allKeys.filter(k=>!present.includes(k));
 results.push({...stock,status:'loaded',httpStatus,revision:payload.schemaVersion,cik:payload.cik,secName:payload.name,annualStart:y.start,annualEnd:y.end,retrieved:payload.retrieved,years:payload.years.length,industry:payload.industry,sic:payload.sic,corePresent:['revenue','operating','net','cfo','capex'].filter(k=>present.includes(k)).length,present,missing,gaps:Object.fromEntries(missing.map(k=>[k,y.gaps?.[k]||{code:'unknown',reason:'No field-level diagnosis returned.'}])),fields:Object.fromEntries(allKeys.map(k=>[k,y.facts[k]||null])),latestDirectQuarter:q.last?.end||null,directQuarterFields:q.last?Object.entries(q.last.facts).filter(([,f])=>f?.method==='reported').map(([k])=>k):[],segmentRevenue:!!payload.business,segmentMethod:payload.business?.method||null,segmentProfit:payload.business?.views?.some(v=>v.segments.every(s=>Number.isFinite(s.operatingIncome)))||false,segmentGap:payload.businessGap||null,reviewedDisclosures:payload.companyDisclosures?.map(d=>({label:d.label,end:d.end,reviewed:d.reviewed,source:d.source}))||[],supplements:Object.entries(y.facts).filter(([,f])=>f?.reviewed).map(([field,f])=>({field,tag:f.tag,reviewed:f.reviewed,source:f.url})),reportUrl:origin+'/?ticker='+stock.ticker});
 }}catch(e){results.push({...stock,status:'retrieval_failure',error:e.message,httpStatus:httpStatus||null});}
 console.log(stock.rank,stock.ticker,results.at(-1).status,fromCache?'cached':'');
 await fs.writeFile(root+'/results.partial.json',JSON.stringify(results.sort((a,b)=>a.rank-b.rank),null,2));
}}
await Promise.all([run(),run()]);
const counts=Object.fromEntries([...new Set(results.map(r=>r.status))].map(s=>[s,results.filter(r=>r.status===s).length]));
const loaded=results.filter(r=>r.status==='loaded');
const report={generated:new Date().toISOString(),revision:REPORT_REVISION,rankingSource:ranking.source,session:ranking.session,scope:'Production API coverage test for the 50 source-ranked stocks. Presence is not an accounting audit. Missing does not mean undisclosed or zero. No market-price calls or investment decisions.',fields,counts,loaded:loaded.length,completeCore:loaded.filter(r=>r.corePresent===5).length,missingCounts:Object.fromEntries(Object.keys(fields).map(k=>[k,loaded.filter(r=>r.missing.includes(k)).length])),companies:results.sort((a,b)=>a.rank-b.rank)};
await fs.writeFile(root+'/results.json',JSON.stringify(report,null,2));await fs.rm(root+'/results.partial.json');console.log(JSON.stringify({counts,completeCore:report.completeCore,missingCounts:report.missingCounts}));
