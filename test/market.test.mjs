import test from 'node:test';import assert from 'node:assert/strict';
import {manualQuote,alphaQuote,marketMetrics} from '../src/market.mjs';
import {createMarketService} from '../src/market-service.mjs';
const now=new Date('2026-10-31T20:00:00Z');
const quote=manualQuote('MSFT',{price:100,date:'2026-10-30',source:'Test fixture'},now);
const data={ticker:'MSFT',years:[{end:'2026-06-30',facts:Object.fromEntries(Object.entries({eps:5,cfo:60,capex:20,shares:10}).map(([key,val])=>[key,{val,filed:'2026-07-29'}]))}]};
const search={bestMatches:[{'1. symbol':'MSFT','2. name':'Microsoft','3. type':'Equity','4. region':'United States','8. currency':'USD'}]};
const raw={'Global Quote':{'01. symbol':'MSFT','05. price':'100','07. latest trading day':'2026-10-30'}};
test('manual prices validate source, price date and safe source URL',()=>{
 assert.equal(quote.kind,'manual');assert.equal(quote.retrieved,now.toISOString());
 for(const extra of [{price:0},{price:'Infinity'},{source:''},{date:'2026-11-01'},{date:'2026-02-30'},{url:'javascript:alert(1)'},{url:'https://user:pass@example.com'}])assert.throws(()=>manualQuote('MSFT',{price:100,date:'2026-10-30',source:'Fixture',...extra},now));
});
test('annual multiples reconcile independently and retain negative yield',()=>{
 const m=marketMetrics(data,quote,now);assert.equal(m.pe,20);assert.equal(m.marketCap,1000);assert.equal(m.fcfYield,.04);assert.equal(m.ageDays,1);
 const d=structuredClone(data);d.years[0].facts.capex.val=80;assert.equal(marketMetrics(d,quote,now).fcfYield,-.02);
 d.years[0].facts.eps.val=-1;assert.equal(marketMetrics(d,quote,now).pe,null);
});
test('ratios withhold missing, future-filed or symbol/currency-mismatched inputs',()=>{
 const d=structuredClone(data);delete d.years[0].facts.shares;assert.equal(marketMetrics(d,quote,now).fcfYield,null);
 d.years[0].facts.eps.filed='2026-10-31';assert.equal(marketMetrics(d,quote,now).pe,null);
 assert.equal(marketMetrics(data,{...quote,ticker:'AAPL'},now),null);assert.equal(marketMetrics(data,{...quote,currency:'EUR'},now),null);
 assert.equal(marketMetrics(data,{...quote,asOf:'2026-01-01'},now).pe,null);
});
test('provider normalization verifies identity, currency and date without inventing time',()=>{
 const q=alphaQuote('MSFT',raw,search,now);assert.equal(q.price,100);assert.equal(q.asOf,'2026-10-30');assert.equal(q.kind,'provider');
 assert.throws(()=>alphaQuote('MSFT',raw,{bestMatches:[]},now));
 const s=structuredClone(search);s.bestMatches[0]['8. currency']='EUR';assert.throws(()=>alphaQuote('MSFT',raw,s,now));
 assert.throws(()=>alphaQuote('AAPL',raw,search,now));
});
test('unconfigured service never calls a provider and reveals no key',async()=>{
 const service=createMarketService();let calls=0;const fake=()=>{calls++;throw Error('unexpected');};
 const status=await service(new Request('https://example.test/api/market/status'),{},fake);assert.equal((await status.json()).configured,false);
 const r=await service(new Request('https://example.test/api/market/quote?ticker=MSFT'),{},fake);assert.equal(r.status,503);assert.equal(calls,0);
 assert.equal((await service(new Request('https://example.test/api/market/quote?ticker=BAD!'),{},fake)).status,400);
});
test('provider adapter uses official endpoints, caches responses and redacts provider errors',async()=>{
 const service=createMarketService(),env={ALPHA_VANTAGE_API_KEY:'fixture-secret'};let calls=0;
 const fake=async url=>{calls++;const u=new URL(url);assert.equal(u.origin,'https://www.alphavantage.co');assert.equal(u.searchParams.get('apikey'),'fixture-secret');assert.equal(u.searchParams.has('entitlement'),false);return Response.json(u.searchParams.get('function')==='SYMBOL_SEARCH'?search:raw);};
 const request=new Request('https://example.test/api/market/quote?ticker=MSFT');
 const r=await service(request,env,fake);assert.equal(r.status,200);assert.equal((await r.json()).price,100);assert.equal(calls,2);
 await service(request,env,fake);assert.equal(calls,2);
 const failing=createMarketService();const error=await failing(request,env,async()=>Response.json({Information:'fixture-secret account details'}));assert.equal(error.status,502);assert.doesNotMatch(await error.text(),/fixture-secret/);
});
test('scenario price comparison is withheld when model facts were filed later',()=>{
 assert.equal(marketMetrics(data,quote,now).scenarioEligible,true);
 const d=structuredClone(data);d.years[0].facts.revenue={val:1000,filed:'2026-10-31'};
 assert.equal(marketMetrics(d,quote,now).scenarioEligible,false);
});
