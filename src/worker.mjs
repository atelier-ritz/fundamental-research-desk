const memory=new Map();
function remember(key,value){memory.delete(key);memory.set(key,{time:Date.now(),value});while(memory.size>30)memory.delete(memory.keys().next().value);}
const companyHeaders={'Cache-Control':'no-store','X-Report-Revision':REPORT_REVISION};
const marketService=createMarketService();
async function sec(path){
 const hit=memory.get(path);if(hit&&Date.now()-hit.time<3600000)return hit.value;
 const response=await fetch('https://'+path,{headers:{'User-Agent':'FundamentalResearch/1.0 (public financial research; https://fundamental-research-desk.comfydance.chatgpt.site)','Accept':'application/json'},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('SEC data service returned '+response.status+'. Try again later or import a company-facts JSON file.');
 const value=await response.json();if(!path.includes('/companyfacts/'))remember(path,value);return value;
}
export default {async fetch(request,env={}){
 const url=new URL(request.url);
 if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{Allow:'GET','Cache-Control':'no-store'}});
 if(['/api/market/status','/api/market/quote'].includes(url.pathname))return marketService(request,env);
 if(url.pathname==='/api/company'){
  try{
   const ticker=(url.searchParams.get('ticker')||'').trim().toUpperCase();
   if(!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(ticker))return Response.json({error:'Enter a valid US stock symbol.'},{status:400});
   const cached=memory.get('company:'+ticker);if(url.searchParams.get('refresh')!=='1'&&cached&&Date.now()-cached.time<3600000)return Response.json(cached.value,{headers:companyHeaders});
   const tickers=await sec('www.sec.gov/files/company_tickers.json');
   const match=Object.values(tickers).find(t=>t.ticker===ticker);if(!match)return Response.json({error:'Symbol not found in the SEC issuer directory. Try the issuer’s primary US ticker.'},{status:404});
   const cik=String(match.cik_str).padStart(10,'0');
   const facts=await sec('data.sec.gov/api/xbrl/companyfacts/CIK'+cik+'.json');
   let metadata={};try{metadata=await sec('data.sec.gov/submissions/CIK'+cik+'.json');}catch{}
   const annual=annualFilingMetadata(metadata);let annualHtml=null,annualSource=null,filingGap=null,recovered=0;
   if(annual&&/^[a-zA-Z0-9_.-]+\.html?$/.test(annual.document||'')&&/^\d{10}-\d{2}-\d{6}$/.test(annual.accn||'')){
    try{
     annualSource='https://www.sec.gov/Archives/edgar/data/'+Number(cik)+'/'+annual.accn.replaceAll('-','')+'/'+annual.document;
     const response=await fetch(annualSource,{headers:{'User-Agent':'FundamentalResearch/1.0 (public financial research; https://fundamental-research-desk.comfydance.chatgpt.site)'},signal:AbortSignal.timeout(20000)});
     if(!response.ok)throw Error('Original annual filing returned '+response.status+'.');
     if(Number(response.headers.get('content-length'))>15000000)throw Error('Original annual filing exceeds the extraction size limit.');
     annualHtml=await response.text();if(annualHtml.length>15000000)throw Error('Original annual filing exceeds the extraction size limit.');
     recovered=supplementAnnualFacts(facts,annualHtml,annual,annualSource,TAGS,IFRS_TAGS);
    }catch(error){annualHtml=null;filingGap=error.message;}
   }
   const data=normalize(facts,ticker,metadata);
   data.originalFiling={source:annualSource,recoveredFacts:recovered,error:filingGap};

   data.companyDisclosures=selectReportedDisclosures(data);
   data.business=selectBusinessProfile(data,BUSINESS_PROFILES);
   if(!data.business){
    try{
     const period=data.years.at(-1);
     if(annualHtml&&annual.end===period.end){
      const views=extractSegmentViews(annualHtml,period,period.facts.revenue.val);
      if(views.length)data.business={cik:Number(cik),periodEnd:period.end,totalRevenue:period.facts.revenue.val,source:annualSource,sourceLabel:annual.form+' filed '+annual.filed+' · inline XBRL dimensions',method:'extracted',summary:null,payments:null,views,coverage:'Single-dimension USD revenue groups match the annual period and reconcile to company revenue. Segment operating income is shown only when directly tagged in matching contexts; no allocation is inferred. Descriptions have not been reviewed.'};
     }else if(filingGap)data.businessGap=filingGap;
    }catch(error){data.businessGap='Filing enrichment unavailable: '+error.message;}
   }
   remember('company:'+ticker,data);
   return Response.json(data,{headers:companyHeaders});
  }catch(error){return Response.json({error:error.message,code:error.code||'retrieval_failure'},{status:error.code?422:502,headers:companyHeaders});}
 }
 if(url.pathname!=='/')return new Response('Not found',{status:404});
 return new Response(PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Report-Revision':REPORT_REVISION,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}};
