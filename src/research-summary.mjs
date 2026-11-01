import {assessCompany} from './suitability.mjs';
import {dcf} from './finance.mjs';
// Deterministic synthesis only: no generated causes, ratings or external API calls.
export function researchSummary(data,business,inputs){
 const y=data.years.at(-1),previous=data.years.at(-2),v=(p,k)=>p?.facts[k]?.val,finite=Number.isFinite;
 const money=x=>'$'+(x/1e9).toLocaleString('en-US',{maximumFractionDigits:1})+'B',percent=x=>(x*100).toFixed(1)+'%',suitability=assessCompany(data);
 const sources=(period,keys)=>keys.flatMap(k=>period?.facts[k]?[{...period.facts[k],metric:k}]:[]);
 const cards=[],add=(id,title,label,statements,link,evidence,method)=>cards.push({id,title,label,statements,link,evidence,method});
 const performance=[];const r=v(y,'revenue'),pr=v(previous,'revenue'),op=v(y,'operating'),pop=v(previous,'operating');
 const gap=previous?(Date.parse(y.end)-Date.parse(previous.end))/86400000:0,comparable=gap>=330&&gap<=400;
 if(comparable&&pr>0&&finite(r))performance.push('Annual sales '+(r===pr?'were unchanged':(r>pr?'rose ':'fell ')+percent(Math.abs(r/pr-1)))+' to '+money(r)+'.');
 else performance.push('A comparable annual sales-growth calculation is unavailable.');
 if(r>0&&finite(op))performance.push('Operating profit was '+percent(op/r)+' of sales'+(comparable&&pr>0&&finite(pop)?', versus '+percent(pop/pr)+' in the preceding annual period':'')+'.');
 else performance.push('Operating income is unavailable in the selected tags.');
 if(!suitability.financial&&['cfo','capex'].every(k=>finite(v(y,k))))performance.push('Cash left after cash equipment purchases was '+money(v(y,'cfo')-v(y,'capex'))+'.');
 add('performance','Business performance','Reported + calculated',performance,'#history',[...sources(y,['revenue','operating','cfo','capex']),...sources(previous,['revenue','operating'])],'Annual growth = latest / preceding annual revenue − 1; operating margin = operating income / revenue; selected free cash flow = CFO − cash equipment purchases. This describes changes, not their causes.');
 const view=business?.views?.[0],segments=view?.segments||[],total=business?.totalRevenue;
 const mix=[];
 if(segments.length&&total>0){const largest=[...segments].sort((a,b)=>b.revenue-a.revenue)[0];mix.push(largest.name+' accounted for '+percent(largest.revenue/total)+' of annual revenue ('+money(largest.revenue)+').');
 const changes=segments.filter(s=>s.priorRevenue>0&&finite(s.revenue)).map(s=>({...s,growth:s.revenue/s.priorRevenue-1}));
 const growing=changes.filter(s=>s.growth>0).sort((a,b)=>b.growth-a.growth),declining=changes.filter(s=>s.growth<0).sort((a,b)=>a.growth-b.growth);
 if(growing.length)mix.push('Within '+(view.label||'this revenue view')+', '+growing[0].name+' had the fastest percentage growth: '+percent(growing[0].growth)+(business.priorEnd?' versus '+business.priorEnd:' versus its supplied prior period')+'.');
 if(declining.length)mix.push(declining[0].name+' declined '+percent(Math.abs(declining[0].growth))+(business.priorEnd?' versus the annual period ended '+business.priorEnd+'.':' versus its supplied prior period.'));
 if(!changes.length)mix.push('Comparable prior-category figures are unavailable.');
 }else mix.push('A reconciled annual revenue breakdown is unavailable. This is a report coverage gap; it does not establish that the company has no segments.');
 add('mix','Business mix',segments.length?'Reported + calculated':'Coverage gap',mix,'#segments',business?.source?[{url:business.source,tag:business.sourceLabel||'Annual revenue breakdown',end:business.periodEnd}]:[],'Uses the first reconciled revenue view only. Revenue share = category / total company revenue. Growth requires positive supplied prior-category revenue. Views may describe segments, products or geographies; they must not be added together.');
 const position=[],cash=v(y,'cash'),current=v(y,'debtCurrent'),long=v(y,'debtLong'),maturity=v(y,'maturity1');
 if(finite(cash))position.push('Reported cash and equivalents were '+money(cash)+' at '+y.end+'.');else position.push('Cash and equivalents are unavailable in the selected tags.');
 if(finite(current)&&finite(long))position.push('Current and noncurrent long-term debt totaled '+money(current+long)+'. This excludes other borrowing and lease balances.');else position.push('The selected long-term debt subtotal is incomplete; missing components are not zero.');
 if(finite(maturity))position.push('Reported long-term principal due in the following 12 months was '+money(maturity)+'. This is measured from '+y.end+', not today.');
 else position.push('A complete next-12-month principal amount is not established by the selected tags.');
 add('position','Cash & obligations','Reported + calculated',position,'#strength',sources(y,['cash','debtCurrent','debtLong','maturity1']),'Long-term debt subtotal = current + noncurrent carrying amounts. Principal maturities differ from carrying values and exclude lease payments. These figures do not establish that cash covers all obligations.');
 const questions=[];
 if(suitability.financial)questions.push('Which specialist equity model fits this business? The general industrial DCF is withheld.');
 else if(suitability.operatingMissing)questions.push('What future operating margin can the filings support? The 0% starting margin is a placeholder, not a forecast.');
 else if(suitability.lossMaking)questions.push('What evidence supports a path from operating losses to positive cash flow? The model assumes no automatic turnaround.');
 if(!finite(v(y,'shortDebt')))questions.push('What additional borrowing or equity claims are missing? Short-term borrowings are not mapped in this annual dataset.');
 if(!business)questions.push('Which businesses drive results? A reconciled revenue breakdown needs further filing review.');
 let sensitivity=null;
 if(!suitability.financial){try{const base=dcf(data,inputs);if(base.ev>0){const impacts=[];for(const [key,label] of [['discount','discount rate'],['margin','operating margin'],['growth',inputs.segmentModel?'all category growth rates':'sales growth']]){const values=[];for(const delta of [-.01,.01]){try{values.push(dcf(data,{...inputs,[key]:inputs[key]+delta}).ev/base.ev-1);}catch{}}if(values.length===2)impacts.push({key,label,low:Math.min(...values),high:Math.max(...values),size:Math.max(...values.map(Math.abs))});}impacts.sort((a,b)=>b.size-a.size);if(impacts.length===3)sensitivity=impacts[0];}}catch{}}
 if(sensitivity)questions.push('Of three one-at-a-time tests (±1 percentage point), '+sensitivity.label+' moved modeled business value most: '+(sensitivity.low*100).toFixed(1)+'% to +'+(sensitivity.high*100).toFixed(1)+'%. These are local tests, not probabilities.');
 else questions.push('A comparable valuation-sensitivity calculation is unavailable with the current inputs. Review model suitability, losses and missing fields.');
 if(inputs.segmentModel)questions.push('Revenue uses separate '+inputs.segmentModel.label+' growth assumptions; company-wide margin, tax and reinvestment still need review.');
 questions.push('Acquisitions, restatements, corporate actions and later financing events have not been systematically reviewed.');
 add('questions','Questions to investigate','Gaps + assumptions',questions,'#coverage',[],'Sensitivity holds other current inputs fixed (in category mode, the growth test shifts every category rate by the same percentage-point amount) and changes discount rate, operating margin, and annual growth individually by ±1 percentage point. It compares enterprise values, not market prices. Ranking is limited to these three tests; it is not a global sensitivity analysis or a recommendation.');
 return {annualStart:y.start,annualEnd:y.end,quarterEnd:data.quarterly?.quarters?.at(-1)?.end||null,cards,sensitivity};
}
