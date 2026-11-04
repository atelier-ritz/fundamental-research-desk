export function normalizeQuarters(raw,cutoff=new Date().toISOString().slice(0,10)){
 const tags={revenue:['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet','RevenueFromContractWithCustomerIncludingAssessedTax','RevenuesNetOfInterestExpense'],operating:['OperatingIncomeLoss'],net:['NetIncomeLoss'],cfo:['NetCashProvidedByUsedInOperatingActivities'],capex:['PaymentsToAcquirePropertyPlantAndEquipment']};
 if(Number(raw.cik)===1018724)tags.capex.push('PaymentsToAcquireProductiveAssets');
 // Costco's 10-K defines 12-week Q1–Q3 and 16/17-week Q4.
 // https://www.sec.gov/Archives/edgar/data/909832/000090983226000093/cost-20260830.htm
 const quarterMax=Number(raw.cik)===909832?119:110;
 const day=86400000,days=(start,end)=>(Date.parse(end)-Date.parse(start))/day+1,next=date=>new Date(Date.parse(date)+day).toISOString().slice(0,10),previous=date=>new Date(Date.parse(date)-day).toISOString().slice(0,10);
 const valid=f=>['10-K','10-K/A','10-Q','10-Q/A'].includes(f.form)&&f.filed<=cutoff&&f.end<=cutoff&&f.start&&Number.isFinite(f.val);
 const facts={};for(const [key,names]of Object.entries(tags))facts[key]=names.map(tag=>({tag,rows:(raw.facts?.['us-gaap']?.[tag]?.units?.USD||[]).filter(valid).sort((a,b)=>b.filed.localeCompare(a.filed)||b.accn.localeCompare(a.accn))}));
 const revenue=facts.revenue.flatMap(group=>group.rows.map(f=>({...f,tag:group.tag}))),annuals=new Map();
 for(const f of revenue)if(days(f.start,f.end)>=330&&days(f.start,f.end)<=380&&!annuals.has(f.start))annuals.set(f.start,{start:f.start,end:f.end});
 const annualList=[...annuals.values()].sort((a,b)=>a.start.localeCompare(b.start));if(!annualList.length)return {quarters:[],ttm:null,comparison:null,latestFiling:null};
 const latestAnnual=annualList.at(-1),lower=new Date(Date.parse(latestAnnual.end)-5*366*day).toISOString().slice(0,10);
 const fiscalStarts=[...annuals.keys(),next(latestAnnual.end)].sort();
 const fiscalStart=quarter=>fiscalStarts.filter(start=>start<=quarter.start&&days(start,quarter.end)<=380).at(-1);
 const anchors=new Map();
 for(const f of revenue){if(f.end<lower||days(f.start,f.end)<65||days(f.start,f.end)>quarterMax)continue;const existing=anchors.get(f.end);if(!existing||f.filed>existing.filed)anchors.set(f.end,{start:f.start,end:f.end,filed:f.filed});}
 for(const annual of annualList){if(annual.end<lower||anchors.has(annual.end))continue;const nine=revenue.filter(f=>f.start===annual.start&&days(f.start,f.end)>=240&&days(f.start,f.end)<=300&&days(next(f.end),annual.end)>=65&&days(next(f.end),annual.end)<=quarterMax).sort((a,b)=>b.end.localeCompare(a.end))[0];if(nine)anchors.set(annual.end,{start:next(nine.end),end:annual.end,filed:null});}
 const source=f=>({...f,url:'https://www.sec.gov/Archives/edgar/data/'+Number(raw.cik)+'/'+f.accn.replaceAll('-','')+'/'+f.accn+'-index.html'});
 function metric(key,quarter){
  for(const group of facts[key]){
   const direct=group.rows.find(f=>f.start===quarter.start&&f.end===quarter.end);
   if(direct)return {val:direct.val,method:'reported',tag:group.tag,sources:[source({...direct,tag:group.tag})]};
   const start=fiscalStart(quarter);if(!start||start===quarter.start)continue;
   const totals=group.rows.filter(f=>f.start===start&&f.end===quarter.end),priors=group.rows.filter(f=>f.start===start&&f.end===previous(quarter.start));
   if(!totals.length||!priors.length)continue;
   let total=totals[0],prior=priors[0];
   const matched=totals.map(t=>({t,p:priors.find(p=>p.accn===t.accn)})).find(pair=>pair.p);
   if(matched){total=matched.t;prior=matched.p;}
   return {val:total.val-prior.val,method:'derived',tag:group.tag,crossFiling:total.accn!==prior.accn,sources:[source({...total,tag:group.tag}),source({...prior,tag:group.tag})],formula:'Current cumulative total minus earlier cumulative total with the same fiscal start and XBRL tag.'};
  }return null;
 }
 const quarters=[...anchors.values()].sort((a,b)=>a.end.localeCompare(b.end)).map(q=>({start:q.start,end:q.end,facts:Object.fromEntries(Object.keys(tags).map(key=>[key,metric(key,q)]))})).filter(q=>q.facts.revenue).slice(-12);
 const last=quarters.at(-1);
 const comparison=last?quarters.filter(q=>days(q.end,last.end)>=350&&days(q.end,last.end)<=385&&Math.abs(days(q.start,q.end)-days(last.start,last.end))<=10).sort((a,b)=>Math.abs(days(a.end,last.end)-366)-Math.abs(days(b.end,last.end)-366))[0]||null:null;
 const four=quarters.slice(-4),contiguous=four.length===4&&four.every((q,i)=>!i||q.start===next(four[i-1].end))&&days(four[0].start,four[3].end)>=330&&days(four[0].start,four[3].end)<=380;
 const ttm=contiguous?{start:four[0].start,end:four[3].end,facts:Object.fromEntries(Object.keys(tags).map(key=>[key,four.every(q=>q.facts[key])?{val:four.reduce((n,q)=>n+q.facts[key].val,0),method:'sum',sources:four.flatMap(q=>q.facts[key].sources)}:null]))}:null;
 if(ttm){
  ttm.reconciliation={};
  for(const key of Object.keys(tags)){
   if(!ttm.facts[key])continue;
   const annual=facts[key].map(group=>group.rows.find(f=>f.start===ttm.start&&f.end===ttm.end)).find(Boolean);
   if(annual){const agrees=Math.abs(ttm.facts[key].val-annual.val)<=Math.max(1,Math.abs(annual.val)*.000001);ttm.reconciliation[key]=agrees?'Matches annual total':'Withheld: quarter sum differs from the reported annual total';if(!agrees)ttm.facts[key]=null;}
  }
 }
 const latestFiling=revenue.filter(f=>days(f.start,f.end)>=65).sort((a,b)=>b.filed.localeCompare(a.filed))[0];
 return {quarters,comparison,ttm,latestFiling:latestFiling?{filed:latestFiling.filed,form:latestFiling.form,end:latestFiling.end,url:source(latestFiling).url}:null,notes:[quarterMax===119?'Costco calendar: Q1–Q3 contain 12 weeks; Q4 contains 16 or 17 weeks. Supported periods span 65–119 days for this issuer only.':'Quarter-only figures use exact periods of 65–110 days.','When no quarter-only fact is available, cumulative totals are subtracted only within the same fiscal start and tag. Q4 may be annual total minus nine months.','Latest eligible facts are preferred. Derived values may combine different filings; restatements can affect comparability.','At an annual boundary, TTM sums are checked against matching reported annual totals when available. Disagreeing metrics are withheld.','Trailing 12 months (TTM) requires four consecutive quarters covering 330–380 days. Any metric with missing quarters remains unavailable.','Same-quarter comparison uses a comparable duration ending approximately one year earlier, allowing 52/53-week fiscal calendars.']};
}

// The reported view must not silently promote a reconstructed latest quarter.
export function reportedQuarterPeriods(q){
 const reported=(q?.quarters||[]).filter(p=>Object.values(p.facts).some(f=>f?.method==='reported'));
 const last=reported.at(-1)||null;if(!last)return {last:null,prior:null};
 const days=(a,b)=>(Date.parse(b)-Date.parse(a))/86400000,span=p=>days(p.start,p.end);
 const prior=reported.filter(p=>days(p.end,last.end)>=350&&days(p.end,last.end)<=385&&Math.abs(span(p)-span(last))<=10).sort((a,b)=>Math.abs(days(a.end,last.end)-365.25)-Math.abs(days(b.end,last.end)-365.25))[0]||null;
 return {last,prior};
}
