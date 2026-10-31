import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,dcf} from '../src/finance.mjs';
const a={growth:.1,margin:.25,tax:.2,reinvest:.05,discount:.1,terminal:.02};
const data={years:[{end:'2025-12-31',facts:Object.fromEntries(Object.entries({revenue:1000,cash:100,debtCurrent:20,debtLong:80,shares:10}).map(([k,val])=>[k,{val}]))}]};
test('DCF reconciles independent five-year PV, terminal value, equity bridge',()=>{
 const result=dcf(data,a);let pv=0;for(let i=1;i<=5;i++)pv+=(1000*1.1**i*.15)/1.1**i;
 const terminal=1000*1.1**5*.15*1.02/.08/1.1**5;
 assert.ok(Math.abs(result.ev-(pv+terminal))<1e-8);assert.equal(result.equity,result.ev);assert.equal(result.perShare,result.ev/10);
});
test('Invalid terminal assumptions and missing values cannot create fabricated valuations',()=>{assert.throws(()=>dcf(data,{...a,terminal:.1}));assert.throws(()=>dcf(data,{...a,margin:NaN}));assert.throws(()=>dcf(data,{...a,reinvest:.9}));const copy=structuredClone(data);delete copy.years[0].facts.debtCurrent;assert.equal(dcf(copy,a).perShare,null);});
test('Higher discount lowers valuation; higher growth increases it',()=>{assert.ok(dcf(data,{...a,discount:.12}).ev<dcf(data,a).ev);assert.ok(dcf(data,{...a,growth:.15}).ev>dcf(data,a).ev);});
test('Normalizer excludes quarterly, future filings, incompatible durations and preserves provenance',()=>{
 const fact=(year,val,extra={})=>({start:(year-1)+'-07-01',end:year+'-06-30',val,form:'10-K',filed:year+'-08-01',accn:'0000000001-25-000001',...extra});
 const raw={cik:1,entityName:'Example',facts:{'us-gaap':{Revenues:{units:{USD:[fact(2023,100),fact(2024,120),fact(2024,125,{filed:'2025-08-01'}),fact(2024,500,{filed:'2099-01-01'}),fact(2025,30,{start:'2025-04-01',form:'10-Q'})]}},OperatingIncomeLoss:{units:{USD:[fact(2024,50,{start:'2024-01-01'})]}}}}};
 const result=normalize(raw,'EX');assert.equal(result.years.length,2);assert.equal(result.years[1].facts.revenue.val,125);assert.equal(result.years[1].facts.operating,null);assert.ok(result.years[1].facts.revenue.url.startsWith('https://www.sec.gov/Archives/'));assert.equal(result.years[1].facts.revenue.filed,'2025-08-01');
});

test('manual claims and dilution reconcile without automatic lease double counting',()=>{
 const leaseData=structuredClone(data);leaseData.years[0].facts.financeLeases={val:50};
 const r=dcf(leaseData,{...a,claims:20,dilution:.1});
 assert.equal(r.equity,dcf(data,a).equity-20);assert.equal(r.adjustedShares,11);assert.equal(r.perShare,r.equity/11);
 assert.throws(()=>dcf(data,{...a,claims:-1}));assert.throws(()=>dcf(data,{...a,dilution:NaN}));
});
