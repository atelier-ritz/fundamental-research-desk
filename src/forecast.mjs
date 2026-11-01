export function forecastContext(data){
 const years=data.years,last=years.at(-1),first=years[0],value=(y,k)=>y.facts[k]?.val;
 const median=a=>{const s=a.filter(Number.isFinite).sort((a,b)=>a-b);return s.length?s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2:null;};
 const recent=years.slice(-3),elapsed=(Date.parse(last.end)-Date.parse(first.end))/86400000/365.25;
 const growth=value(first,'revenue')>0&&value(last,'revenue')>0&&elapsed>0?(value(last,'revenue')/value(first,'revenue'))**(1/elapsed)-1:null;
 const margins=recent.map(y=>value(y,'revenue')>0&&Number.isFinite(value(y,'operating'))?value(y,'operating')/value(y,'revenue'):null).filter(Number.isFinite),margin=median(margins);
 const taxes=recent.map(y=>value(y,'pretax')>0&&Number.isFinite(value(y,'incomeTax'))?value(y,'incomeTax')/value(y,'pretax'):null).filter(x=>Number.isFinite(x)&&x>=0&&x<=.5),tax=median(taxes);
 const capex=Number.isFinite(value(last,'capex'))&&value(last,'revenue')>0?value(last,'capex')/value(last,'revenue'):null;
 const usableGrowth=Number.isFinite(growth)&&growth>=-.25&&growth<=.6,usableMargin=Number.isFinite(margin)&&margin>=-5&&margin<=.8;
 return {growth,margin,tax,capex,marginCount:margins.length,taxCount:taxes.length,firstEnd:first.end,lastEnd:last.end,starts:{growth:usableGrowth?Math.round(growth*1000)/1000:.1,margin:usableMargin?Math.round(margin*1000)/1000:0,tax:tax===null?.21:Math.round(tax*1000)/1000,claims:0,dilution:0,reinvest:.08,discount:.1,terminal:.025},historyBased:{growth:usableGrowth,margin:usableMargin,tax:tax!==null}};
}
export function forecastVariants(inputs){return [{id:'lower',label:'Lower growth',inputs:{...inputs,growth:inputs.growth-.05}},{id:'base',label:'Current inputs',inputs:{...inputs}},{id:'higher',label:'Higher growth',inputs:{...inputs,growth:inputs.growth+.05}}];}

export function categoryForecastModel(data,profile,viewId,growthAnchor){
 const y=data.years.at(-1),view=profile?.views?.find(v=>v.id===viewId);
 if(!view||Number(profile.cik)!==Number(data.cik)||profile.periodEnd!==y.end||Math.abs(profile.totalRevenue-y.facts.revenue.val)>1||view.segments.length<2)throw Error('A reconciled revenue breakdown for this annual period is required.');
 if(view.segments.some(s=>!Number.isFinite(s.revenue)||s.revenue<0)||Math.abs(view.segments.reduce((n,s)=>n+s.revenue,0)-profile.totalRevenue)>Math.max(1,profile.totalRevenue*.000001))throw Error('This breakdown does not reconcile to company revenue.');
 return {cik:data.cik,periodEnd:y.end,viewId:view.id,label:view.label,kind:view.kind,source:profile.source,sourceLabel:profile.sourceLabel,growthAnchor,segments:view.segments.map(s=>{const historical=s.priorRevenue>0?s.revenue/s.priorRevenue-1:null,usable=Number.isFinite(historical)&&historical>=-.9&&historical<=1;return {name:s.name,revenue:s.revenue,priorRevenue:s.priorRevenue??null,growth:usable?Math.round(historical*1000)/1000:0,historyBased:usable};})};
}
