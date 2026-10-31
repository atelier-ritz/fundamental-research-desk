const memory=new Map();
async function sec(path){
 const hit=memory.get(path);if(hit&&Date.now()-hit.time<3600000)return hit.value;
 const response=await fetch('https://'+path,{headers:{'User-Agent':'FundamentalResearch/1.0 (public financial research; https://fundamental-research-desk.comfydance.chatgpt.site)','Accept':'application/json'},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('SEC data service returned '+response.status+'. Try again later or import a company-facts JSON file.');
 const value=await response.json();memory.set(path,{time:Date.now(),value});if(memory.size>30)memory.delete(memory.keys().next().value);return value;
}
export default {async fetch(request){
 const url=new URL(request.url);
 if(url.pathname==='/api/company'){
  try{
   const ticker=(url.searchParams.get('ticker')||'').trim().toUpperCase();
   if(!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(ticker))return Response.json({error:'Enter a valid US stock symbol.'},{status:400});
   const tickers=await sec('www.sec.gov/files/company_tickers.json');
   const match=Object.values(tickers).find(t=>t.ticker===ticker);if(!match)return Response.json({error:'Symbol not found in the SEC issuer directory. Try the issuer’s primary US ticker.'},{status:404});
   const cik=String(match.cik_str).padStart(10,'0');
   const facts=await sec('data.sec.gov/api/xbrl/companyfacts/CIK'+cik+'.json');
   const data=normalize(facts,ticker);
   return Response.json(data,{headers:{'Cache-Control':'private, max-age=3600'}});
  }catch(error){return Response.json({error:error.message},{status:502});}
 }
 if(url.pathname!=='/')return new Response('Not found',{status:404});
 return new Response(PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}};
