export function selectBusinessProfile(data,profiles){
 const latest=data.years.at(-1);if(!latest)return null;
 const profile=profiles.find(p=>Number(p.cik)===Number(data.cik)&&p.periodEnd===latest.end);
 if(!profile||!Number.isFinite(latest.facts.revenue?.val)||Math.abs(profile.totalRevenue-latest.facts.revenue.val)>1)return null;
 const valid=profile.views.filter(view=>reconcilesSegments(view.segments,profile.totalRevenue));
 return valid.length?{...profile,views:valid}:null;
}
export function reconcilesSegments(segments,total){
 return Number.isFinite(total)&&total>0&&segments.length>=2&&segments.every(s=>Number.isFinite(s.revenue)&&s.revenue>=0)&&new Set(segments.map(s=>s.name)).size===segments.length&&Math.abs(segments.reduce((n,s)=>n+s.revenue,0)-total)<=Math.max(1,total*0.000001);
}
// Conservative inline-XBRL extraction: one dimension, exact annual period,
// standard revenue tag, USD units, unique members, and a reconciled total.
export function extractSegmentViews(html,period,totalRevenue){
 const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m=>[m[1].toLowerCase(),m[2]]));
 const text=s=>s.replace(/<[^>]*>/g,'').replace(/&nbsp;|&#160;/g,' ').trim();
 const tagText=(s,tag)=>s.match(new RegExp('<(?:[\\w-]+:)?'+tag+'\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?'+tag+'>','i'))?.[1]?.trim();
 const units=new Set();for(const m of html.matchAll(/<(?:[\w-]+:)?unit\b([^>]*)>([\s\S]*?)<\/(?:[\w-]+:)?unit>/gi))if(/:(?:USD)\s*<\//i.test(m[2])&&!/divide/i.test(m[2]))units.add(attrs(m[1]).id);
 const contexts=new Map();
 for(const m of html.matchAll(/<(?:[\w-]+:)?context\b([^>]*)>([\s\S]*?)<\/(?:[\w-]+:)?context>/gi)){
  if(tagText(m[2],'startDate')!==period.start||tagText(m[2],'endDate')!==period.end)continue;
  const members=[...m[2].matchAll(/<(?:[\w-]+:)?explicitMember\b([^>]*)>([^<]+)<\/(?:[\w-]+:)?explicitMember>/gi)];
  if(members.length!==1||/<(?:[\w-]+:)?typedMember\b/i.test(m[2]))continue;
  const member=members[0],axis=attrs(member[1]).dimension;
  if(!/(StatementBusinessSegmentsAxis|ProductOrServiceAxis|GeographicalAxis)$/.test(axis||''))continue;
  contexts.set(attrs(m[1]).id,{axis,member:member[2].trim()});
 }
 const groups=new Map();
 for(const m of html.matchAll(/<ix:nonFraction\b([^>]*)>([\s\S]*?)<\/ix:nonFraction>/gi)){
  const a=attrs(m[1]),context=contexts.get(a.contextref);if(!context||!units.has(a.unitref)||a['xsi:nil']==='true')continue;
  if(!/^us-gaap:(RevenueFromContractWithCustomerExcludingAssessedTax|Revenues|SalesRevenueNet)$/.test(a.name||''))continue;
  if(a.format&&!/num-dot-decimal|numdotdecimal|numdash|zerodash/i.test(a.format))continue;
  const raw=text(m[2]).replace(/,/g,'').trim();if(!/^-?\d+(\.\d+)?$/.test(raw))continue;
  const scale=Number(a.scale||0);if(!Number.isInteger(scale)||Math.abs(scale)>12)continue;
  const revenue=Number(raw)*10**scale*(a.sign==='-'?-1:1);if(!Number.isFinite(revenue)||revenue<0)continue;
  const key=context.axis+'|'+a.name;if(!groups.has(key))groups.set(key,new Map());
  const group=groups.get(key),existing=group.get(context.member);
  if(existing&&existing.revenue!==revenue){group.conflict=true;continue;}
  const name=context.member.split(':').at(-1).replace(/Member$/,'').replace(/([a-z\d])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2');
  group.set(context.member,{name,revenue,member:context.member,tag:a.name,contextId:a.contextref,description:'Category reported in the filing. A plain-language description has not yet been reviewed.',driver:null});
 }
 const views=[],seenAxes=new Set();for(const [key,group] of groups){const axis=key.split('|')[0],segments=[...group.values()];if(group.conflict||seenAxes.has(axis)||!reconcilesSegments(segments,totalRevenue))continue;seenAxes.add(axis);views.push({id:'filing-'+views.length,label:/BusinessSegments/.test(axis)?'Business segments':/ProductOrService/.test(axis)?'Products & services':'Geographic breakdown',kind:'Reported revenue dimension · '+axis,segments});}
 return views;
}
