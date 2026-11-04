import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {normalize,TAGS,IFRS_TAGS,annualFilingMetadata,dcf} from '../src/finance.mjs';
import {supplementAnnualFacts} from '../src/filing-facts.mjs';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/active50-reporting.json',import.meta.url)));
function report(f,enrich=true){const r=structuredClone(f.raw),a=annualFilingMetadata(f.metadata);if(enrich&&a&&f.html)supplementAnnualFacts(r,f.html,a,'https://www.sec.gov/Archives/edgar/data/'+Number(r.cik)+'/'+a.accn.replaceAll('-','')+'/'+a.document,TAGS,IFRS_TAGS);return normalize(r,f.ticker,f.metadata);}
test('all 50 audited issuer fixtures: 46 supported reports, three explicit currency limits, one annual-history boundary',()=>{
 let loaded=0;const errors={};for(const f of fixtures){try{const d=report(f);loaded++;assert.equal(d.currency,'USD');assert.ok(d.years.every(y=>y.facts.revenue&&y.facts.revenue.end===y.end));}catch(e){errors[f.ticker]=e.code;}}assert.equal(loaded,46);assert.deepEqual(errors,{SPCX:'annual_revenue_coverage',BBD:'unsupported_currency',NOK:'unsupported_currency',STLA:'unsupported_currency'});
});
test('Geron recovers printed total including royalties, never substitutes product-only revenue',()=>{
 const f=fixtures.find(f=>f.ticker==='GERN'),d=report(f);assert.equal(d.years.at(-1).end,'2025-12-31');assert.equal(d.years.at(-1).facts.revenue.val,183881000);assert.equal(d.years.at(-2).facts.revenue.val,76994000);assert.equal(d.years.at(-1).facts.revenue.tag,'reviewed:TotalRevenues');assert.equal(d.years.at(-1).facts.revenue.reviewed,'2026-11-04');assert.equal(d.quarterly.quarters.length,0);assert.match(d.quarterly.coverageGap,/component/);assert.equal(report(f,false).freshness.status,'stale');
 const changed=structuredClone(f);changed.html=changed.html.replaceAll('183,881','999,999');assert.equal(report(changed).years.at(-1).end,'2024-12-31');
});
test('additional standard revenue tags and foreign annual forms recover verified periods',()=>{
 for(const t of ['XXII','RKT','GRAB','INLF','RBNE','CHSN','HUBC','NU']){const d=report(fixtures.find(f=>f.ticker===t));assert.equal(d.years.at(-1).end,'2025-12-31',t);assert.equal(d.freshness.status,'matched');}
 const xx=report(fixtures.find(f=>f.ticker==='XXII'));assert.equal(xx.years.at(-1).facts.revenue.val,17587000);
 const rkt=report(fixtures.find(f=>f.ticker==='RKT'));assert.equal(rkt.years.at(-1).facts.revenue.val,6695e6);
 const grab=report(fixtures.find(f=>f.ticker==='GRAB'));assert.equal(grab.accountingStandard,'IFRS');assert.equal(grab.years.at(-1).facts.revenue.val,3370e6);assert.equal(grab.quarterly.quarters.length,0);
});
test('names come from matching SEC submissions; mismatched identifiers fail closed',()=>{
 const f=fixtures.find(f=>f.ticker==='BAC'),d=report(f);assert.equal(d.name,'BANK OF AMERICA CORP /DE/');assert.equal(d.identity.factsName,'BofA Finance LLC');assert.equal(d.identity.nameDiscrepancy,true);const wrong=structuredClone(f);wrong.metadata.cik='1';assert.throws(()=>report(wrong),e=>e.code==='issuer_mismatch');
});
test('newer annual filing flags incomplete coverage and withholds valuation',()=>{
 const d=report(fixtures.find(f=>f.ticker==='SGRX'));assert.equal(d.freshness.status,'stale');assert.match(d.freshness.message,/2026-06-30/);assert.throws(()=>dcf(d,{}),/newer annual filing/);
});
test('original-filing recovery rejects dimensional, wrong-entity and conflicting consolidated facts',()=>{
 const raw={cik:1,facts:{'us-gaap':{}}},filing={form:'10-K',filed:'2026-02-01',accn:'0000000001-26-000001',end:'2025-12-31'};
 const context=(id,entity=1,dimension='')=>`<xbrli:context id="${id}"><xbrli:entity><xbrli:identifier>${entity}</xbrli:identifier>${dimension}</xbrli:entity><xbrli:period><xbrli:startDate>2025-01-01</xbrli:startDate><xbrli:endDate>2025-12-31</xbrli:endDate></xbrli:period></xbrli:context>`;
 const value=(id,n)=>`<ix:nonFraction name="us-gaap:Revenues" contextRef="${id}" unitRef="usd" scale="6">${n}</ix:nonFraction>`;
 const unit='<xbrli:unit id="usd"><xbrli:measure>iso4217:USD</xbrli:measure></xbrli:unit>';
 const dim='<xbrldi:explicitMember dimension="srt:ProductOrServiceAxis">test:ProductMember</xbrldi:explicitMember>';
 const html=unit+context('a',1,dim)+value('a',500)+context('b',2)+value('b',900)+context('c')+value('c',10)+value('c',11);
 assert.equal(supplementAnnualFacts(raw,html,filing,'https://www.sec.gov/test',TAGS,IFRS_TAGS),0);
 assert.equal(supplementAnnualFacts(raw,unit+context('d')+value('d',12),filing,'https://www.sec.gov/test',TAGS,IFRS_TAGS),1);assert.equal(raw.facts['us-gaap'].Revenues.units.USD[0].val,12e6);
});
test('broader reported purchases and debt/lease balances do not replace narrower calculation inputs',()=>{
 const a=report(fixtures.find(f=>f.ticker==='AAL'));assert.equal(a.years.at(-1).facts.productiveAssetPurchases.val,3779e6);assert.equal(a.years.at(-1).facts.capex,null);
 const t=report(fixtures.find(f=>f.ticker==='T'));assert.equal(t.years.at(-1).facts.debtAndLeases.val,127089e6);assert.equal(t.years.at(-1).facts.debtLong,null);
});
