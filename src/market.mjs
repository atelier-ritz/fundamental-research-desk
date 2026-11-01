import {assessCompany} from './suitability.mjs';
const MARKET_SYMBOL=/^[A-Z][A-Z0-9.\-]{0,9}$/;
export function marketDate(value,now=new Date()){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value||value>now.toISOString().slice(0,10))throw Error('Use a valid price date that is not in the future.');
 return value;
}
export function manualQuote(ticker,input,now=new Date()){
 const price=Number(input.price),source=String(input.source||'').trim();
 if(!MARKET_SYMBOL.test(ticker)||!Number.isFinite(price)||price<=0||!source||source.length>160)throw Error('Enter a positive USD price and a source name (up to 160 characters).');
 let sourceUrl='';if(input.url){const url=new URL(input.url);if(url.protocol!=='https:'||url.username||url.password)throw Error('Source links must use HTTPS without credentials.');sourceUrl=url.href;}
 return {ticker,price,currency:'USD',asOf:marketDate(input.date,now),retrieved:now.toISOString(),source,sourceUrl,kind:'manual',timing:'User-supplied price · not independently verified'};
}
export function alphaQuote(ticker,raw,search,now=new Date()){
 const match=search?.bestMatches?.find(m=>m['1. symbol']===ticker&&m['4. region']==='United States'&&m['8. currency']==='USD'&&m['3. type']==='Equity');
 if(!match)throw Error('An exact US equity symbol and USD currency could not be verified. Use a sourced manual price.');
 const q=raw?.['Global Quote'],price=Number(q?.['05. price']);
 if(!MARKET_SYMBOL.test(ticker)||q?.['01. symbol']!==ticker||!Number.isFinite(price)||price<=0)throw Error('The provider returned no valid price for this exact symbol.');
 return {ticker,name:match['2. name'],price,currency:'USD',asOf:marketDate(q['07. latest trading day'],now),retrieved:now.toISOString(),source:'Alpha Vantage',sourceUrl:'https://www.alphavantage.co/documentation/#latestprice',kind:'provider',timing:'End-of-day data · not real-time; provider supplies a trading date, not a trade timestamp'};
}
export function marketMetrics(data,quote,now=new Date()){
 if(!quote||quote.ticker!==data.ticker||quote.currency!=='USD'||!Number.isFinite(quote.price)||quote.price<=0)return null;
 try{marketDate(quote.asOf,now);}catch{return null;}
 const y=data.years.at(-1),f=y.facts,finite=k=>Number.isFinite(f[k]?.val);
 // Do not combine a historical price with financial facts filed after that price date.
 const eligible=keys=>quote.asOf>=y.end&&keys.every(k=>finite(k)&&/^\d{4}-\d{2}-\d{2}$/.test(f[k].filed||'')&&f[k].filed<=quote.asOf);
 const suitability=assessCompany(data);
 const peReady=eligible(['eps'])&&f.eps.val>0,fcfReady=!suitability.financial&&eligible(['cfo','capex','shares'])&&f.shares.val>0;
 const marketCap=fcfReady?quote.price*f.shares.val:null,fcf=fcfReady?f.cfo.val-f.capex.val:null;
 const scenarioKeys=['revenue','operating','pretax','incomeTax','shares','cash','investments','debtCurrent','debtLong','shortDebt'];
 const scenarioEligible=suitability.dcfAllowed&&quote.asOf>=y.end&&data.years.every(year=>scenarioKeys.every(k=>!Number.isFinite(year.facts[k]?.val)||(/^\d{4}-\d{2}-\d{2}$/.test(year.facts[k].filed||'')&&year.facts[k].filed<=quote.asOf)));
 return {scenarioEligible,pe:peReady?quote.price/f.eps.val:null,fcfYield:fcfReady?fcf/marketCap:null,marketCap,fcf,annualEnd:y.end,shares:finite('shares')?f.shares.val:null,ageDays:Math.floor((Date.parse(now.toISOString().slice(0,10))-Date.parse(quote.asOf))/86400000),peReason:peReady?'':'Positive annual diluted EPS, filed on or before the price date, is required.',fcfReason:suitability.financial?'The industrial-company free cash flow yield is withheld for financial businesses.':fcfReady?'':'Annual operating cash flow, cash asset spending and positive shares, filed on or before the price date, are required.'};
}
