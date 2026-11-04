import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {normalize} from '../src/finance.mjs';
const raw=JSON.parse(fs.readFileSync(new URL('./fixtures/reported-expenses.json',import.meta.url)));
test('separately disclosed expenses retain original definitions rather than synthesized SG&A',()=>{
 const a=normalize(raw.AMZN,'AMZN').years.at(-1),m=normalize(raw.MSFT,'MSFT').years.at(-1);
 assert.equal(a.facts.marketing.val,47129e6);assert.equal(a.facts.generalAdmin.val,11172e6);assert.equal(a.facts.sellingMarketing,null);assert.equal(a.facts.selling,null);
 assert.equal(m.facts.sellingMarketing.val,26710e6);assert.equal(m.facts.generalAdmin.val,7956e6);assert.equal(m.facts.marketing,null);assert.equal(m.facts.selling,null);
 for(const [y,keys]of [[a,['marketing','generalAdmin']],[m,['sellingMarketing','generalAdmin']]])for(const key of keys){assert.equal(y.facts[key].start,y.start);assert.equal(y.facts[key].end,y.end);assert.ok(y.facts[key].url.startsWith('https://www.sec.gov/Archives/'));}
});
