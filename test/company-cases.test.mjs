import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {forecastContext} from '../src/forecast.mjs';import {dcf,reinvestmentHistory} from '../src/finance.mjs';import {assessCompany} from '../src/suitability.mjs';import {marketMetrics} from '../src/market.mjs';import {financialStrength} from '../src/strength.mjs';import {comparisonMetrics} from '../src/compare.mjs';
const load=t=>JSON.parse(fs.readFileSync(new URL('./fixtures/'+t+'.json',import.meta.url)));
const cases=['rivn','xom','jpm'].map(load),msft=JSON.parse(fs.readFileSync(new URL('../src/snapshot.json',import.meta.url)));
const now=new Date('2026-11-01T12:00:00Z'),reference=d=>({ticker:d.ticker,currency:'USD',price:100,asOf:'2026-11-01'}); // Calculation fixture, not a market quote.
test('real SEC company cases retain exact annual periods and filing provenance',()=>{
 for(const data of [...cases,msft]){assert.equal(data.years.length,5);for(const y of data.years){for(const [key,f] of Object.entries(y.facts)){if(!f)continue;assert.ok(Number.isFinite(f.val),data.ticker+' '+key);assert.equal(f.end,y.end);if(f.start)assert.equal(f.start,y.start);assert.match(f.url,/^https:\/\/www.sec.gov\/Archives\//);assert.ok(f.filed<='2026-11-01');}}
 }
});
test('profitable Microsoft scenario and cash metrics reconcile without changing history',()=>{
 const last=msft.years.at(-1),c=forecastContext(msft),r=dcf(msft,c.starts);assert.ok(r.ev>0);assert.ok(c.starts.margin>0);assert.equal(assessCompany(msft).financial,false);
 const m=marketMetrics(msft,reference(msft),now);assert.equal(m.pe,100/last.facts.eps.val);assert.equal(m.fcfYield,(last.facts.cfo.val-last.facts.capex.val)/(100*last.facts.shares.val));
});
test('loss-making Rivian keeps its negative historical margin and never receives a profitable fallback',()=>{
 const d=cases[0],c=forecastContext(d),m=marketMetrics(d,reference(d),now);
 assert.ok(d.years.at(-1).facts.operating.val<0);assert.ok(c.starts.margin<-.3);assert.equal(c.historyBased.margin,true);assert.throws(()=>dcf(d,c.starts),/Terminal cash flow/);assert.equal(m.pe,null);assert.ok(m.fcfYield<0);assert.equal(d.years.at(-1).facts.debtCurrent,null);
});
test('capital-heavy Exxon withholds unsupported components instead of assuming profitable operations or zero debt',()=>{
 const d=cases[1],c=forecastContext(d);assert.equal(d.years.at(-1).facts.operating,null);assert.equal(d.years.at(-1).facts.debtLong,null);assert.equal(c.starts.margin,0);assert.equal(c.historyBased.margin,false);assert.throws(()=>dcf(d,c.starts),/Terminal cash flow/);
 assert.ok(reinvestmentHistory(d).every(r=>r.net===null));assert.equal(comparisonMetrics(d).items.operatingMargin.value,null);
});
test('JPMorgan and financial classifications cannot produce industrial DCF or FCF-yield comparisons',()=>{
 const d=cases[2],c=forecastContext(d);assert.equal(assessCompany(d).financial,true);assert.throws(()=>dcf(d,{...c.starts,margin:.3}),/withheld for financial/);
 const m=marketMetrics(d,reference(d),now);assert.equal(m.fcfYield,null);assert.equal(m.scenarioEligible,false);assert.ok(m.pe>0);assert.equal(financialStrength(d).coverage,null);
 for(const key of ['fcfMargin','ttmFcfMargin','interestCoverage'])assert.equal(comparisonMetrics(d).items[key].value,null);
 for(const sic of ['6021','6311','6798'])assert.equal(assessCompany({...d,sic}).dcfAllowed,false);
 assert.equal(assessCompany({...d,sic:'3711'}).dcfAllowed,true);
});
