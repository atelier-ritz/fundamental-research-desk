const memory=new Map();
async function sec(path){
 const hit=memory.get(path);if(hit&&Date.now()-hit.time<3600000)return hit.value;
 const response=await fetch('https://'+path,{headers:{'User-Agent':'FundamentalResearch/1.0 (public financial research; https://fundamental-research-desk.comfydance.chatgpt.site)','Accept':'application/json'},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('SEC data service returned '+response.status+'. Try again later or import a company-facts JSON file.');
 const value=await response.json();if(!path.includes('/companyfacts/'))memory.set(path,{time:Date.now(),value});if(memory.size>30)memory.delete(memory.keys().next().value);return value;
}
export default {async fetch(request){
 const url=new URL(request.url);
 if(url.pathname==='/api/company'){
  try{
   const ticker=(url.searchParams.get('ticker')||'').trim().toUpperCase();
   if(!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(ticker))return Response.json({error:'Enter a valid US stock symbol.'},{status:400});
   const cached=memory.get('company:'+ticker);if(cached&&Date.now()-cached.time<3600000)return Response.json(cached.value);
   const tickers=await sec('www.sec.gov/files/company_tickers.json');
   const match=Object.values(tickers).find(t=>t.ticker===ticker);if(!match)return Response.json({error:'Symbol not found in the SEC issuer directory. Try the issuer’s primary US ticker.'},{status:404});
   const cik=String(match.cik_str).padStart(10,'0');
   const facts=await sec('data.sec.gov/api/xbrl/companyfacts/CIK'+cik+'.json');
   const data=normalize(facts,ticker);
   data.business=selectBusinessProfile(data,BUSINESS_PROFILES);
   if(!data.business){
    try{
     const period=data.years.at(-1),sourceFact=period.facts.revenue;
     const submissions=await sec('data.sec.gov/submissions/CIK'+cik+'.json');
     data.sic=submissions.sic||'';data.industry=submissions.sicDescription||'';
     const recent=submissions.filings?.recent,index=recent?.accessionNumber?.indexOf(sourceFact.accn),doc=index>=0?recent.primaryDocument[index]:null;
     if(doc&&/^[a-zA-Z0-9_.-]+\.html?$/.test(doc)){
      const source='https://www.sec.gov/Archives/edgar/data/'+Number(cik)+'/'+sourceFact.accn.replaceAll('-','')+'/'+doc;
      const response=await fetch(source,{headers:{'User-Agent':'FundamentalResearch/1.0 (public financial research; https://fundamental-research-desk.comfydance.chatgpt.site)'},signal:AbortSignal.timeout(20000)});
      if(!response.ok)throw Error('Original filing could not be retrieved.');
      if(Number(response.headers.get('content-length'))>15000000)throw Error('Filing exceeds this version’s extraction size limit.');
      const html=await response.text();if(html.length>15000000)throw Error('Filing exceeds this version’s extraction size limit.');
      const views=extractSegmentViews(html,period,sourceFact.val);
      if(views.length)data.business={cik:Number(cik),periodEnd:period.end,totalRevenue:sourceFact.val,source,sourceLabel:sourceFact.form+' filed '+sourceFact.filed+' · inline XBRL revenue dimensions',method:'extracted',summary:null,payments:null,views,coverage:'Only single-dimension USD revenue groups that match the annual period and reconcile to company revenue are shown. Names are derived from filing tags. Descriptions and operating drivers have not been reviewed.'};
     }
    }catch(error){data.businessGap='Filing enrichment unavailable: '+error.message;}
   }
   memory.set('company:'+ticker,{time:Date.now(),value:data});
   return Response.json(data,{headers:{'Cache-Control':'private, max-age=3600'}});
  }catch(error){return Response.json({error:error.message},{status:502});}
 }
 if(url.pathname!=='/')return new Response('Not found',{status:404});
 return new Response(PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}};
