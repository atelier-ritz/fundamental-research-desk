import {assessCompany} from './suitability.mjs';
export function parsePeerTickers(text,active){
 const symbols=[...new Set(text.trim().toUpperCase().split(/[,\s]+/).filter(Boolean))].filter(s=>s!==active.toUpperCase());
 if(!symbols.length)throw Error('Enter at least one different stock symbol.');
 if(symbols.length>2)throw Error('Choose up to two other tickers for three companies in total.');
 if(symbols.some(s=>! /^[A-Z][A-Z0-9.\-]{0,9}$/.test(s)))throw Error('Use valid US stock symbols separated by commas.');
 return symbols;
}
export function comparisonMetrics(data){
 const annual=data.years.at(-1),previous=data.years.at(-2),quarter=data.quarterly?.quarters?.at(-1),priorQuarter=data.quarterly?.comparison,ttm=data.quarterly?.ttm;
 const get=(p,k)=>p?.facts?.[k]?.val,valid=Number.isFinite;
 const sources=(p,keys)=>keys.flatMap(k=>{const f=p?.facts?.[k];return f?(f.sources||[f]).filter(s=>s.url).map(s=>({...s,metric:k})):[];});
 const items={};
 const metric=(id,value,format,period,keys,formula,reason,extra=[])=>items[id]={value:valid(value)?value:null,format,period:period?(['cash','longDebt','currentDebt'].includes(id)?'As of '+period.end:period.start+' → '+period.end):null,formula,reason:valid(value)?null:reason,sources:[...sources(period,keys),...extra]};
 const revenue=get(annual,'revenue'),op=get(annual,'operating'),cfo=get(annual,'cfo'),capex=get(annual,'capex'),interest=get(annual,'interest');
 const gap=previous?(Date.parse(annual.end)-Date.parse(previous.end))/86400000:null;
 metric('annualGrowth',previous&&gap>=330&&gap<=400&&get(previous,'revenue')>0&&valid(revenue)?revenue/get(previous,'revenue')-1:null,'percent',annual,['revenue'],'Latest annual revenue / preceding annual revenue − 1.','Consecutive annual periods or a positive prior revenue base are unavailable.',sources(previous,['revenue']));
 metric('quarterGrowth',priorQuarter&&get(priorQuarter,'revenue')>0&&valid(get(quarter,'revenue'))?get(quarter,'revenue')/get(priorQuarter,'revenue')-1:null,'percent',quarter,['revenue'],'Latest quarter revenue / same-quarter prior-year revenue − 1.','A suitable same-quarter comparison is unavailable.',sources(priorQuarter,['revenue']));
 metric('operatingMargin',revenue>0&&valid(op)?op/revenue:null,'percent',annual,['operating','revenue'],'Operating income / annual revenue.','Operating income or positive revenue is unavailable.');
 metric('fcfMargin',revenue>0&&valid(cfo)&&valid(capex)?(cfo-capex)/revenue:null,'percent',annual,['cfo','capex','revenue'],'(Operating cash flow − cash purchases of property and equipment) / annual revenue.','Cash flow, cash asset spending or positive revenue is unavailable.');
 metric('ttmOperatingMargin',get(ttm,'revenue')>0&&valid(get(ttm,'operating'))?get(ttm,'operating')/get(ttm,'revenue'):null,'percent',ttm,['operating','revenue'],'Trailing operating income / trailing revenue across four consecutive quarters.','A complete reconciled trailing income/revenue series is unavailable.');
 metric('ttmFcfMargin',get(ttm,'revenue')>0&&valid(get(ttm,'cfo'))&&valid(get(ttm,'capex'))?(get(ttm,'cfo')-get(ttm,'capex'))/get(ttm,'revenue'):null,'percent',ttm,['cfo','capex','revenue'],'(Trailing operating cash flow − trailing cash asset purchases) / trailing revenue.','A complete reconciled trailing cash-flow series is unavailable.');
 metric('cash',get(annual,'cash'),'money',annual,['cash'],'Reported cash and cash equivalents at annual period end.','Cash and equivalents are unavailable.');
 const current=get(annual,'debtCurrent'),long=get(annual,'debtLong');
 metric('longDebt',valid(current)&&valid(long)?current+long:null,'money',annual,['debtCurrent','debtLong'],'Current + noncurrent long-term debt carrying values. Other debt and leases are not added.','One or both long-term debt components are unavailable.');
 metric('currentDebt',current,'money',annual,['debtCurrent'],'Current portion of long-term debt at annual period end. Not all obligations due within a year.','Current long-term debt is unavailable.');
 metric('interestCoverage',valid(op)&&interest>0?op/interest:null,'multiple',annual,['operating','interest'],'Operating income / selected positive reported interest expense. Lease interest may be outside this measure.','Operating income or a positive reported interest expense is unavailable.');
 if(assessCompany(data).financial)for(const key of ['fcfMargin','ttmFcfMargin','interestCoverage']){items[key].value=null;items[key].reason='Withheld for financial businesses: this industrial-company metric is not suitable.';}
 return {ticker:data.ticker,name:data.name,cik:data.cik,annualEnd:annual.end,quarterEnd:quarter?.end||null,retrieved:data.retrieved,items};
}
