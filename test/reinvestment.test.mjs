import test from 'node:test';
import assert from 'node:assert/strict';
import {reinvestmentHistory} from '../src/finance.mjs';
const year=(start,end,values)=>({start,end,facts:Object.fromEntries(Object.entries(values).map(([k,val])=>[k,{val}]))});
test('selected reinvestment reconciles cash capex, depreciation and consecutive balance changes',()=>{
 const years=[year('2023-01-01','2023-12-31',{receivables:100,inventory:20,payables:40}),year('2024-01-01','2024-12-31',{revenue:1000,capex:90,depreciation:30,receivables:120,inventory:25,payables:45})];
 const rows=reinvestmentHistory({years});assert.equal(rows[0].net,null);assert.equal(rows[1].delta,20);assert.equal(rows[1].net,80);assert.equal(rows[1].ratio,.08);
 delete years[1].facts.inventory;assert.equal(reinvestmentHistory({years})[1].net,null);
 years[1].facts.inventory={val:0};assert.equal(reinvestmentHistory({years})[1].net,55);
 years[1].start='2024-02-01';assert.equal(reinvestmentHistory({years})[1].delta,null);
});
