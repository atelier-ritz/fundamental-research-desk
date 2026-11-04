import test from 'node:test';import assert from 'node:assert/strict';import worker from '../worker/index.js';
test('unsupported methods and malformed tickers are rejected before upstream requests',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('Unexpected upstream call');};
 try{for(const path of ['/','/api/company?ticker=AAPL','/api/market/quote?ticker=AAPL']){const r=await worker.fetch(new Request('https://example.test'+path,{method:'POST',body:'ignored'}));assert.equal(r.status,405);assert.equal(r.headers.get('allow'),'GET');}
 for(const ticker of ['../secret','<script>','A'.repeat(11)]){const r=await worker.fetch(new Request('https://example.test/api/company?ticker='+encodeURIComponent(ticker)));assert.equal(r.status,400);}
 assert.equal(calls,0);
 }finally{globalThis.fetch=original;}
});
test('company-result insertions evict old cache entries rather than growing indefinitely',async()=>{
 const original=globalThis.fetch;let factsCalls=0;const tickers=Array.from({length:35},(_,i)=>'Z'+i),raw={cik:123,entityName:'Cache boundary fixture',facts:{'us-gaap':{Revenues:{units:{USD:[2024,2025].map(y=>({start:y+'-01-01',end:y+'-12-31',val:100,form:'10-K',filed:(y+1)+'-02-01',accn:'0000000123-26-000001'}))}}}}};
 globalThis.fetch=async input=>{const url=String(input);if(url.endsWith('company_tickers.json'))return Response.json(tickers.map(ticker=>({ticker,cik_str:123})));if(url.includes('/companyfacts/')){factsCalls++;return Response.json(raw);}if(url.includes('/submissions/'))return Response.json({});throw Error('Unexpected upstream call');};
 try{const get=t=>worker.fetch(new Request('https://example.test/api/company?ticker='+t));for(const ticker of tickers)assert.equal((await get(ticker)).status,200);const before=factsCalls;await get(tickers.at(-1));assert.equal(factsCalls,before);await get(tickers[0]);assert.equal(factsCalls,before+1);}finally{globalThis.fetch=original;}
});
