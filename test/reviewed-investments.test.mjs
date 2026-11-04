import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {normalize,TAGS} from '../src/finance.mjs';
const raw=()=>JSON.parse(fs.readFileSync(new URL('./fixtures/nvda-raw.json',import.meta.url)));
test('NVIDIA reviewed custom-tag investments preserve full disclosed scope and provenance',()=>{
 const d=normalize(raw(),'NVDA'),y=d.years.at(-1),f=y.facts.investments;
 assert.equal(f.val,51951e6);assert.equal(f.tag,'nvda:MarketableSecuritiesAndEquitySecuritiesFVNI');assert.equal(f.end,'2026-01-25');assert.equal(f.reviewed,'2026-11-03');assert.ok(f.url.endsWith('nvda-20260125.htm'));assert.equal(y.gaps.investments,undefined);
 assert.equal(y.facts.capex,null);assert.equal(y.facts.equipmentIntangiblePurchases.val,6042e6);
});
test('reviewed investment supplement is withheld on changed financial base or different issuer',()=>{
 for(const keys of [TAGS.revenue,TAGS.cfo]){const r=raw();for(const key of keys)for(const f of r.facts['us-gaap'][key]?.units?.USD||[])if(f.end==='2026-01-25')f.val+=1;assert.equal(normalize(r,'NVDA').years.at(-1).facts.investments,null);}
 const r=raw();r.cik=1;assert.equal(normalize(r,'OTHER').years.at(-1).facts.investments,null);
});
