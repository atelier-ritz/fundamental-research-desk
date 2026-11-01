import {alphaQuote} from './market.mjs';
export function providerNotice(body){
 const message=String(body?.Note||body?.Information||body?.['Error Message']||'').toLowerCase();
 if(!message)return null;
 // Map to fixed text; provider notices can include the API key. Never echo them.
 if(/invalid.*(api.?key|apikey)|(api.?key|apikey).*(invalid|not valid)|missing.*(api.?key|apikey)/.test(message))return {code:'invalid_key',error:'Alpha Vantage rejected the API key. Check that the secret contains only the key copied from your account.'};
 if(/per second|per minute|spreading|too many requests/.test(message))return {code:'rate_limited',error:'Alpha Vantage asked us to slow down requests. Wait a minute before refreshing.'};
 if(/per day|daily.*limit|quota/.test(message))return {code:'daily_limit',error:'Alpha Vantage reported its daily request limit. Automatic prices cannot refresh until the provider allows more requests. You can still use a dated manual price.'};
 if(/premium|subscription|entitlement/.test(message))return {code:'plan_required',error:'Alpha Vantage says this request needs a different plan or entitlement. This app requests end-of-day data, not a real-time feed.'};
 if(body?.['Error Message'])return {code:'provider_request',error:'Alpha Vantage rejected this symbol or API request.'};
 return {code:'provider_notice',error:'Alpha Vantage returned an account or access notice instead of data. Price retrieval remains unavailable.'};
}
export function createMarketService({spacingMs=1200}={}){
 const quotes=new Map(),identities=new Map();let nextRequest=0,gate=Promise.resolve();
 const trim=map=>{if(map.size>100)map.delete(map.keys().next().value);};
 return async function marketService(request,env={},fetcher=fetch){
  const url=new URL(request.url),headers={'Cache-Control':'private, no-store'},apiKey=String(env.ALPHA_VANTAGE_API_KEY||'').trim(),configured=Boolean(apiKey&&apiKey!=='demo');
  if(url.pathname==='/api/market/status')return Response.json({configured,provider:'Alpha Vantage',timing:'End-of-day'}, {headers});
  const ticker=(url.searchParams.get('ticker')||'').trim().toUpperCase();
  if(!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(ticker))return Response.json({error:'Enter a valid US stock symbol.'},{status:400,headers});
  if(!configured)return Response.json({error:'Automatic prices are not connected. A provider key must be configured by the site owner. You can use a dated, sourced manual price.',code:'not_configured'},{status:503,headers});
  const cached=quotes.get(ticker);if(cached&&Date.now()-cached.time<3600000)return Response.json(cached.value,{headers});
  async function query(params){
   const endpoint=new URL('https://www.alphavantage.co/query');for(const [k,v] of Object.entries({...params,apikey:apiKey}))endpoint.searchParams.set(k,v);
   // Serialize request starts and respect short-window provider limits.
   const turn=gate.then(async()=>{const wait=Math.max(0,nextRequest-Date.now());if(wait)await new Promise(resolve=>setTimeout(resolve,wait));nextRequest=Date.now()+spacingMs;});gate=turn.catch(()=>{});await turn;
   let response;try{response=await fetcher(endpoint.href,{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});}catch{throw Error('The price provider could not be reached. Try again later or use a sourced manual price.');}
   if(!response.ok)throw Error('The price provider is temporarily unavailable. Try again later.');
   let body;try{body=await response.json();}catch{throw Error('The price provider returned an unreadable response.');}
   // Never forward provider messages: they may echo credentials or account details.
   const notice=providerNotice(body);if(notice)throw Object.assign(Error(notice.error),{code:notice.code,stage:params.function});return body;
  }
  try{
   let search=identities.get(ticker);if(!search||Date.now()-search.time>86400000){search={time:Date.now(),value:await query({function:'SYMBOL_SEARCH',keywords:ticker})};identities.set(ticker,search);trim(identities);}
   const raw=await query({function:'GLOBAL_QUOTE',symbol:ticker}),value=alphaQuote(ticker,raw,search.value);
   quotes.set(ticker,{time:Date.now(),value});trim(quotes);return Response.json(value,{headers});
  }catch(error){return Response.json({error:error.message,code:error.code||'price_unavailable',stage:error.stage||'normalization'},{status:502,headers});}
 };
}
