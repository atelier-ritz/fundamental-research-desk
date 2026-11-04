import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalize} from '../src/finance.mjs';
const raw=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/aapl-raw.json',import.meta.url)));
test('missing facts distinguish mapping, unit, exact period and eligibility without changing values',()=>{
 const base=raw(),end=normalize(base,'AAPL').years.at(-1).end;
 const cases=[['unmapped',undefined],['unit',{units:{shares:[]}}],['period',{units:{USD:[{val:4,end:'2000-01-01',form:'10-K',filed:'2000-02-01'}]}}],['ineligible',{units:{USD:[{val:4,end,form:'8-K',filed:'2026-01-01'}]}}]];
 for(const [code,value] of cases){const r=raw();for(const tag of ['ShortTermInvestments','MarketableSecuritiesCurrent'])delete r.facts['us-gaap'][tag];if(value)r.facts['us-gaap'].ShortTermInvestments=value;const y=normalize(r,'AAPL').years.at(-1);assert.equal(y.facts.investments,null);assert.equal(y.gaps.investments.code,code);assert.ok(y.gaps.investments.reason);assert.equal(y.facts.revenue.val,416161e6);}
 const y=normalize(base,'AAPL').years.at(-1);assert.equal(y.gaps.investments,undefined);assert.equal(y.facts.investments.val,18763e6);
});
