// Recover explicitly tagged, consolidated facts from the original annual filing.
// No text guessing, dimensional sums, currency conversion or inferred zeroes.
export function supplementAnnualFacts(raw,html,filing,url,gaapTags,ifrsTags){
 const attr=s=>Object.fromEntries([...s.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1].toLowerCase(),m[2]]));
 const content=(s,t)=>s.match(new RegExp('<(?:[\\w-]+:)?'+t+'\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?'+t+'>','i'))?.[1]?.trim();
 const contexts=new Map(),units=new Map(),allowed=new Set([...Object.values(gaapTags).flat().map(t=>'us-gaap:'+t),...Object.values(ifrsTags).flat().map(t=>'ifrs-full:'+t)]);
 for(const m of html.matchAll(/<(?:[\w-]+:)?unit\b([^>]*)>([\s\S]*?)<\/(?:[\w-]+:)?unit>/gi)){
  const a=attr(m[1]);if(/divide/i.test(m[2])){if(/:USD\s*<\//i.test(m[2])&&/:shares\s*<\//i.test(m[2]))units.set(a.id,'USD/shares');continue;}
  if(/:USD\s*<\//i.test(m[2]))units.set(a.id,'USD');else if(/:shares\s*<\//i.test(m[2]))units.set(a.id,'shares');
 }
 for(const m of html.matchAll(/<(?:[\w-]+:)?context\b([^>]*)>([\s\S]*?)<\/(?:[\w-]+:)?context>/gi)){
  if(/<(?:[\w-]+:)?(?:explicitMember|typedMember)\b/i.test(m[2]))continue;
  const identifier=content(m[2],'identifier');if(!identifier||Number(identifier)!==Number(raw.cik))continue;
  const start=content(m[2],'startDate'),end=content(m[2],'endDate')||content(m[2],'instant');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(end||'')||end>filing.end)continue;
  if(start){const days=(Date.parse(end)-Date.parse(start))/86400000;if(days<330||days>380)continue;}
  contexts.set(attr(m[1]).id,{...(start?{start}:{}),end});
 }
 const groups=new Map();
 for(const m of html.matchAll(/<ix:nonFraction\b([^>]*)>([\s\S]*?)<\/ix:nonFraction>/gi)){
  const a=attr(m[1]),p=contexts.get(a.contextref),unit=units.get(a.unitref);if(!p||!unit||!allowed.has(a.name)||a['xsi:nil']==='true')continue;
  if(a.format&&!/num-dot-decimal|numdotdecimal|numdash|zerodash/i.test(a.format))continue;
  const text=m[2].replace(/<[^>]*>/g,'').replace(/&#160;|&nbsp;/g,' ').replace(/,/g,'').trim();
  const val=/^[—–-]$/.test(text)&&/dash/i.test(a.format||'')?0:/^-?\d+(\.\d+)?$/.test(text)?Number(text):NaN;
  const scale=Number(a.scale||0);if(!Number.isFinite(val)||!Number.isInteger(scale)||Math.abs(scale)>12)continue;
  const value=val*10**scale*(a.sign==='-'?-1:1);if(!Number.isFinite(value))continue;
  const key=[a.name,unit,p.start||'',p.end].join('|'),f={...p,val:value,accn:filing.accn,form:filing.form,filed:filing.filed,url,method:'original annual filing inline-XBRL'};
  const prior=groups.get(key);if(prior&&prior.f.val!==value)prior.conflict=true;else if(!prior)groups.set(key,{name:a.name,unit,f});
 }
 let recovered=0;for(const g of groups.values()){
  if(g.conflict)continue;const [ns,tag]=g.name.split(':');raw.facts[ns]??={};raw.facts[ns][tag]??={units:{}};raw.facts[ns][tag].units??={};const list=raw.facts[ns][tag].units[g.unit]??=[];
  // Keep the original feed if the same filing already reports a contradictory value.
  const same=list.filter(f=>f.accn===g.f.accn&&f.end===g.f.end&&(f.start||'')===(g.f.start||''));if(same.length)continue;
  list.push(g.f);recovered++;
 }
 // Geron's consolidated total is printed in MD&A but its tagged product revenue
 // excludes royalties. Preserve the reviewed printed total, never relabel the product fact.
 if(Number(raw.cik)===886744&&filing.accn==='0000886744-26-000008'){
  for(const row of [{start:'2025-01-01',end:'2025-12-31',val:183881000,operating:-68585000},{start:'2024-01-01',end:'2024-12-31',val:76994000,operating:-173732000}]){
   const operating=(raw.facts['us-gaap']?.OperatingIncomeLoss?.units?.USD||[]).filter(f=>f.start===row.start&&f.end===row.end&&['10-K','10-K/A','10-Q','10-Q/A'].includes(f.form)).sort((a,b)=>b.filed.localeCompare(a.filed))[0];
   const printed=(row.val/1000).toLocaleString('en-US');
   if(operating?.val!==row.operating||!html.includes(printed))continue;
   raw.facts['us-gaap'].Revenues??={units:{USD:[]}};
   const list=raw.facts['us-gaap'].Revenues.units.USD??=[];
   if(list.some(f=>f.start===row.start&&f.end===row.end))continue;
   list.push({start:row.start,end:row.end,val:row.val,accn:filing.accn,form:filing.form,filed:filing.filed,url,tag:'reviewed:TotalRevenues',method:'reviewed printed annual total, including product revenue and royalties',reviewed:'2026-11-04'});recovered++;
  }
 }
 return recovered;
}
