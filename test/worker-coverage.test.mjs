import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import worker from '../worker/index.js';import {REPORT_REVISION,cashFlowDefinitions} from '../src/finance.mjs';import {categoryForecastModel,forecastContext} from '../src/forecast.mjs';
const read=f=>JSON.parse(fs.readFileSync(new URL(f,import.meta.url)));
test('built production Worker returns corrected facts and refresh bypasses cached company results',async()=>{
 const original=globalThis.fetch,raws={AAPL:read('./fixtures/aapl-raw.json'),AMZN:read('./fixtures/amzn-raw.json')};let companyFactRequests=0;
 globalThis.fetch=async input=>{const url=String(input);if(url.endsWith('company_tickers.json'))return Response.json(Object.entries(raws).map(([ticker,d])=>({ticker,cik_str:d.cik})));if(url.includes('/companyfacts/')){companyFactRequests++;const raw=Object.values(raws).find(d=>url.endsWith(String(d.cik).padStart(10,'0')+'.json'));return Response.json(raw);}if(url.includes('/submissions/'))return Response.json({sic:'3571',sicDescription:'Test metadata'});throw Error('Unexpected network request: '+url);};
 try{
  const request=(t,refresh='')=>worker.fetch(new Request('https://example.test/api/company?ticker='+t+refresh));
  const a=await request('AAPL'),apple=await a.json();assert.equal(a.headers.get('cache-control'),'no-store');assert.equal(a.headers.get('x-report-revision'),REPORT_REVISION);assert.equal(apple.schemaVersion,REPORT_REVISION);const f=apple.years.at(-1).facts;assert.equal(f.investments.val,18763e6);assert.equal(f.shortDebt.val,7979e6);assert.equal(f.dividends.val,15421e6);
  const cached=await request('AAPL');assert.equal(cached.headers.get('cache-control'),'no-store');assert.equal(companyFactRequests,1);await request('AAPL','&refresh=1');assert.equal(companyFactRequests,2);
  const amazon=await (await request('AMZN','&refresh=1')).json();assert.equal(amazon.years.length,5);assert.ok(amazon.years.every(y=>y.facts.capex));assert.equal(cashFlowDefinitions(amazon.years.at(-1)).companyFCF,11194e6);
  const page=await worker.fetch(new Request('https://example.test/'));assert.equal(page.headers.get('cache-control'),'no-store');assert.equal(page.headers.get('x-report-revision'),REPORT_REVISION);
 }finally{globalThis.fetch=original;}
});
test('Microsoft reviewed segment profits match consolidated annual operating income',()=>{const d=read('../src/snapshot.json'),profile=read('../src/business-profiles.json').find(p=>p.cik===789019),segments=profile.views[0].segments;assert.deepEqual(segments.map(s=>s.operatingIncome),[83879e6,56972e6,14386e6]);assert.equal(segments.reduce((sum,s)=>sum+s.operatingIncome,0),d.years.at(-1).facts.operating.val);assert.equal(segments.reduce((sum,s)=>sum+s.priorOperatingIncome,0),d.years.at(-2).facts.operating.val);assert.equal(categoryForecastModel(d,profile,'segments',forecastContext(d).starts.growth).marginsAvailable,true);});
