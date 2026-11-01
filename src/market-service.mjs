import {alphaQuote} from './market.mjs';
export function createMarketService(){
 const quotes=new Map(),identities=new Map();
 const trim=map=>{if(map.size>100)map.delete(map.keys().next().value);};
 return async function marketService(request,env={},fetcher=fetch){
  const url=new URL(request.url),headers={'Cache-Control':'private, no-store'},configured=Boolean(env.ALPHA_VANTAGE_API_KEY&&env.ALPHA_VANTAGE_API_KEY!=='demo');
  if(url.pathname==='/api/market/status')return Response.json({configured,provider:'Alpha Vantage',timing:'End-of-day'}, {headers});
  const ticker=(url.searchParams.get('ticker')||'').trim().toUpperCase();
  if(!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(ticker))return Response.json({error:'Enter a valid US stock symbol.'},{status:400,headers});
  if(!configured)return Response.json({error:'Automatic prices are not connected. A provider key must be configured by the site owner. You can use a dated, sourced manual price.',code:'not_configured'},{status:503,headers});
  const cached=quotes.get(ticker);if(cached&&Date.now()-cached.time<3600000)return Response.json(cached.value,{headers});
  async function query(params){
   const endpoint=new URL('https://www.alphavantage.co/query');for(const [k,v] of Object.entries({...params,apikey:env.ALPHA_VANTAGE_API_KEY}))endpoint.searchParams.set(k,v);
   let response;try{response=await fetcher(endpoint.href,{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});}catch{throw Error('The price provider could not be reached. Try again later or use a sourced manual price.');}
   if(!response.ok)throw Error('The price provider is temporarily unavailable. Try again later.');
   let body;try{body=await response.json();}catch{throw Error('The price provider returned an unreadable response.');}
   // Never forward provider messages: they may echo credentials or account details.
   if(body.Note||body.Information||body['Error Message'])throw Error('The provider returned no quote. Check its quota, symbol coverage and account configuration.');return body;
  }
  try{
   let search=identities.get(ticker);if(!search||Date.now()-search.time>86400000){search={time:Date.now(),value:await query({function:'SYMBOL_SEARCH',keywords:ticker})};identities.set(ticker,search);trim(identities);}
   const raw=await query({function:'GLOBAL_QUOTE',symbol:ticker}),value=alphaQuote(ticker,raw,search.value);
   quotes.set(ticker,{time:Date.now(),value});trim(quotes);return Response.json(value,{headers});
  }catch(error){return Response.json({error:error.message},{status:502,headers});}
 };
}
