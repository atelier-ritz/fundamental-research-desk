// Deterministic descriptions of reported changes; no inferred causes or ratings.
export function buildObservations(years){
 const current=years.at(-1),previous=years.at(-2);if(!current||!previous)return [];
 const get=(year,key)=>year.facts[key]?.val;
 const finite=Number.isFinite;
 const dollars=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:1}).format(value);
 const percent=value=>(Math.abs(value)*100).toFixed(1)+'%';
 const items=[];
 function change(key,label,meaning,values){
  const [now,before]=values||[get(current,key),get(previous,key)];
  if(!finite(now)||!finite(before))return;
  const delta=now-before,amount=dollars(Math.abs(delta));
  let headline;
  if(delta===0)headline=label+(label==='Sales'?' were unchanged':' was unchanged');
  else if(before>0&&Math.abs(delta/before)*100>=.05)headline=label+(delta>0?' rose ':' fell ')+percent(delta/before);
  else if(before>0&&Math.abs(delta/before)*100<.05)headline=label+(label==='Sales'?' were broadly unchanged':' was broadly unchanged');
  else headline=label+(delta>0?' increased by ':' decreased by ')+amount;
  items.push({key,headline,body:'From '+dollars(before)+' to '+dollars(now)+'. '+meaning,formula:key==='fcf'?'Operating cash flow − cash purchases of property and equipment.':'Difference / prior value × 100 when the prior value is positive; otherwise the dollar change is shown.',evidenceKeys:key==='fcf'?['cfo','capex']:[key]});
 }
 change('revenue','Sales','This measures money earned before expenses; it does not by itself show profit.');
 const revenueNow=get(current,'revenue'),revenueBefore=get(previous,'revenue'),operatingNow=get(current,'operating'),operatingBefore=get(previous,'operating');
 if(revenueNow>0&&revenueBefore>0&&finite(operatingNow)&&finite(operatingBefore)){
  const now=operatingNow/revenueNow,before=operatingBefore/revenueBefore,points=(now-before)*100;
  const rounded=Math.abs(points).toFixed(1);
  items.push({key:'margin',headline:rounded==='0.0'?'Operating margin was broadly unchanged':'Operating margin '+(points>0?'rose ':'fell ')+rounded+' percentage points',body:'From '+(before*100).toFixed(1)+'% to '+(now*100).toFixed(1)+'%. For each $100 of sales, operating profit was '+dollars(now*100)+', compared with '+dollars(before*100)+' previously.',formula:'Operating income / revenue × 100. Change is measured in percentage points, not percent.',evidenceKeys:['operating','revenue']});
 }
 const freeCash=year=>finite(get(year,'cfo'))&&finite(get(year,'capex'))?get(year,'cfo')-get(year,'capex'):null;
 change('fcf','Free cash flow','This is cash from operations after cash spending on long-lived assets.',[freeCash(current),freeCash(previous)]);
 change('capex','Asset spending','This is cash spent on property and equipment. These totals alone do not distinguish maintenance from expansion.');
 return items;
}
