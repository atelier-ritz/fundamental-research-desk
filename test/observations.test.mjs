import test from 'node:test';
import assert from 'node:assert/strict';
import {buildObservations} from '../src/observations.mjs';
const year=(values,end)=>({end,facts:Object.fromEntries(Object.entries(values).map(([k,val])=>[k,{val}]))});
test('summarizes sales, margin percentage points, free cash and capex from exact inputs',()=>{
 const items=buildObservations([year({revenue:1000,operating:200,cfo:150,capex:50},'2024-12-31'),year({revenue:1200,operating:300,cfo:200,capex:150},'2025-12-31')]);
 assert.equal(items.length,4);assert.equal(items[0].headline,'Sales rose 20.0%');assert.equal(items[1].headline,'Operating margin rose 5.0 percentage points');assert.equal(items[2].headline,'Free cash flow fell 50.0%');assert.deepEqual(items[2].evidenceKeys,['cfo','capex']);assert.equal(items[3].headline,'Asset spending rose 200.0%');
});
test('loss-to-positive cash flow uses a dollar change instead of misleading percentage',()=>{
 const items=buildObservations([year({revenue:100,cfo:10,capex:20},'2024-12-31'),year({revenue:100,cfo:30,capex:20},'2025-12-31')]);
 assert.equal(items.find(x=>x.key==='fcf').headline,'Free cash flow increased by $20');assert.equal(items[0].headline,'Sales were unchanged');
});
test('missing metrics are omitted, and rounded tiny changes are not called improvements',()=>{
 assert.deepEqual(buildObservations([]),[]);
 const items=buildObservations([year({revenue:1000,operating:200},'2024-12-31'),year({revenue:1000.01,operating:200.01},'2025-12-31')]);assert.equal(items.length,2);assert.equal(items[0].headline,'Sales were broadly unchanged');assert.equal(items[1].headline,'Operating margin was broadly unchanged');
});
