import {assessCompany} from './suitability.mjs';
import {normalizeQuarters} from './quarters.mjs';
export const REPORT_REVISION='2026-11-03.1';
export const TAGS = {
 depreciation:['Depreciation','DepreciationDepletionAndAmortizationPropertyPlantAndEquipment'], receivables:['AccountsReceivableNetCurrent'], inventory:['InventoryNet'], payables:['AccountsPayableCurrent'],
 interest:['InterestExpenseNonoperating','InterestExpense'], leaseInterest:['FinanceLeaseInterestExpense'], dividends:['PaymentsOfDividendsCommonStock','PaymentsOfDividends','PaymentsOfOrdinaryDividends'], buybacks:['PaymentsForRepurchaseOfCommonStock'], operatingLeases:['OperatingLeaseLiability'], financeLeases:['FinanceLeaseLiability'], maturity1:['LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths'], maturity2:['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearTwo'], maturity3:['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearThree'], maturity4:['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFour'], maturity5:['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFive'], maturityAfter5:['LongTermDebtMaturitiesRepaymentsOfPrincipalAfterYearFive'],
 revenue:['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet'],
 pretax:['IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest','IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'], incomeTax:['IncomeTaxExpenseBenefit'], cost:['CostOfRevenue','CostOfGoodsAndServicesSold'], research:['ResearchAndDevelopmentExpense'], selling:['SellingGeneralAndAdministrativeExpense'], operating:['OperatingIncomeLoss'], net:['NetIncomeLoss'],commonIncome:['NetIncomeLossAvailableToCommonStockholdersBasic'], cfo:['NetCashProvidedByUsedInOperatingActivities'], capex:['PaymentsToAcquirePropertyPlantAndEquipment'],equipmentIntangiblePurchases:['PaymentsToAcquireProductiveAssets'],
 cash:['CashAndCashEquivalentsAtCarryingValue'], investments:['ShortTermInvestments','MarketableSecuritiesCurrent'], debtCurrent:['LongTermDebtCurrent','LongTermDebtAndCapitalLeaseObligationsCurrent'], debtLong:['LongTermDebtNoncurrent'], shortDebt:['ShortTermBorrowings','CommercialPaper'], shares:['CommonStockSharesOutstanding'], eps:['EarningsPerShareDiluted'], assets:['Assets'], sbc:['ShareBasedCompensation']
};
export function normalize(raw,ticker,meta={}) {
 const gaap=raw.facts?.['us-gaap']; if(!gaap) throw Error('US GAAP financial facts are unavailable. This version supports US GAAP filers.');
 const cutoff=new Date().toISOString().slice(0,10);
 function fieldGap(key,end,start) {
  if(key==='equipmentIntangiblePurchases'&&Number(raw.cik)!==1045810)return {code:'scope',reason:'This broader purchase definition has not been reviewed for this company.'};
  const tags=key==='capex'&&Number(raw.cik)===1018724?['PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets']:TAGS[key];
  const present=tags.filter(tag=>gaap[tag]);
  if(!present.length)return {code:'unmapped',reason:'None of the supported tags appears in the SEC company-facts feed. A different or company-specific tag may require review.'};
  const unit=key==='shares'?'shares':key==='eps'?'USD/shares':'USD';
  const entries=present.flatMap(tag=>gaap[tag].units?.[unit]||[]);
  if(!entries.length)return {code:'unit',reason:'Supported tags exist, but not in the required '+unit+' unit.'};
  const exact=entries.filter(f=>f.end===end&&(start?f.start===start:!f.start));
  if(!exact.length)return {code:'period',reason:'Supported tags exist, but no fact matches this exact '+(start?'annual period.':'balance-sheet date.')};
  return {code:'ineligible',reason:'Matching-period facts exist, but none passes the filing-type, date and finite-value checks.'};
 }
 function pick(key,end,start) {
  if(key==='equipmentIntangiblePurchases'&&Number(raw.cik)!==1045810)return null;
  const unit=key==='shares'?'shares':key==='eps'?'USD/shares':'USD';
  // Amazon labels this broader standard tag as cash purchases of property and equipment.
  const tags=key==='capex'&&Number(raw.cik)===1018724?['PaymentsToAcquirePropertyPlantAndEquipment','PaymentsToAcquireProductiveAssets']:TAGS[key];
  for(const tag of tags) {
   const list=(gaap[tag]?.units?.[unit]||[]).filter(f=>['10-K','10-K/A','10-Q','10-Q/A'].includes(f.form)&&f.filed<=cutoff&&f.end<=cutoff&&Number.isFinite(f.val)&&f.end===end&&(start?f.start===start:!f.start));
   list.sort((a,b)=>b.filed.localeCompare(a.filed));
   if(list.length){const f=list[0];return {...f,tag,url:'https://www.sec.gov/Archives/edgar/data/'+Number(raw.cik)+'/'+f.accn.replaceAll('-','')+'/'+f.accn+'-index.html'};}
  }return null;
 }
 const periods=new Map();
 for(const tag of TAGS.revenue) for(const f of gaap[tag]?.units?.USD||[]) {
  const days=(Date.parse(f.end)-Date.parse(f.start))/86400000;
  if(['10-K','10-K/A'].includes(f.form)&&f.filed<=cutoff&&f.end<=cutoff&&Number.isFinite(f.val)&&days>=330&&days<=380) periods.set(f.end,{start:f.start,end:f.end});
 }
 const years=[...periods.values()].sort((a,b)=>a.end.localeCompare(b.end)).slice(-5).map(p=>{
  const facts={}; for(const k of Object.keys(TAGS))facts[k]=pick(k,p.end,['receivables','inventory','payables','cash','investments','debtCurrent','debtLong','shortDebt','shares','assets','operatingLeases','financeLeases','maturity1','maturity2','maturity3','maturity4','maturity5','maturityAfter5'].includes(k)?null:p.start);
  // Reviewed custom-tag supplements omitted by SEC's standard company-facts feed.
  if(Number(raw.cik)===1018724&&p.start===p.end.slice(0,4)+'-01-01'){
   const year=Number(p.end.slice(0,4)),proceeds={2021:5657,2022:5324,2023:4596,2024:5341,2025:3499}[year];
   if(proceeds!==undefined){const recent=year>=2023;facts.capexProceeds={val:proceeds*1e6,start:p.start,end:p.end,tag:'amzn:ProceedsFromPropertyPlantAndEquipmentSalesAndIncentives',form:'10-K',filed:recent?'2026-02-06':'2024-02-02',accn:recent?'0001018724-26-000004':'0001018724-24-000008',url:recent?'https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm':'https://www.sec.gov/Archives/edgar/data/1018724/000101872424000008/amzn-20231231.htm',reviewed:'2026-11-01',method:'reviewed inline-XBRL custom tag'};}
  }
  const gaps={};for(const k of Object.keys(TAGS))if(!facts[k])gaps[k]=fieldGap(k,p.end,['receivables','inventory','payables','cash','investments','debtCurrent','debtLong','shortDebt','shares','assets','operatingLeases','financeLeases','maturity1','maturity2','maturity3','maturity4','maturity5','maturityAfter5'].includes(k)?null:p.start);
  return {...p,label:'FY '+p.end.slice(0,4),facts,gaps};
 });
 if(years.length<2)throw Error('At least two comparable annual revenue periods are required.');
 return {schemaVersion:REPORT_REVISION,ticker,name:raw.entityName,cik:raw.cik,years,retrieved:new Date().toISOString(),quarterly:normalizeQuarters(raw),sic:meta.sic||'',industry:meta.sicDescription||'',segments:[],notes:['Annual values use 330–380 day periods; metrics must match the revenue period exactly.','Latest eligible filing for each metric is used; comparative figures may be restated. Different metrics may cite different filings.','The company-facts feed omits segment dimensions. Separate annual-filing enrichment is shown when available; operating KPI coverage varies.','Annual figures anchor valuation; quarterly and trailing results are shown separately. Consensus forecasts are not included.']};
}
export function cashFlowDefinitions(year){
 const v=k=>year?.facts[k]?.val,cfo=v('cfo'),gross=v('capex'),proceeds=v('capexProceeds');
 const grossFCF=[cfo,gross].every(Number.isFinite)?cfo-gross:null;
 const netCapex=[gross,proceeds].every(Number.isFinite)?gross-proceeds:null;
 return {cfo,gross,proceeds,grossFCF,netCapex,companyFCF:netCapex!==null&&Number.isFinite(cfo)?cfo-netCapex:null};
}
export function segmentRevenuePath(data,a){
 const m=a.segmentModel;if(!m)return null;const y=data.years.at(-1),base=y.facts.revenue?.val;
 if(Number(m.cik)!==Number(data.cik)||m.periodEnd!==y.end||!Array.isArray(m.segments)||m.segments.length<2||m.segments.length>20||!Number.isFinite(m.growthAnchor))throw Error('The category forecast does not match this company and annual period.');
 if(!m.segments.every(s=>typeof s.name==='string'&&Number.isFinite(s.revenue)&&s.revenue>=0&&Number.isFinite(s.growth)))throw Error('Every category needs a reported revenue base and finite growth assumption.');
 const total=m.segments.reduce((n,s)=>n+s.revenue,0);if(!(base>0)||Math.abs(total-base)>Math.max(1,base*.000001))throw Error('Category revenue must reconcile to the reported company total.');
 if(m.useMargins&&(!m.marginsAvailable||!Number.isFinite(m.marginAnchor)||!m.segments.every(s=>Number.isFinite(s.margin)&&s.margin>=-5&&s.margin<=1)))throw Error('Every segment needs a finite operating margin between −500% and 100%.');
 if(m.useMargins&&m.segments.some(s=>s.margin+a.margin-m.marginAnchor < -5||s.margin+a.margin-m.marginAnchor>1))throw Error('Effective segment margins must stay between −500% and 100%.');
 const shift=a.growth-m.growthAnchor,rates=m.segments.map(s=>s.growth+shift);
 if(rates.some(g=>!Number.isFinite(g)||g<=-1||g>2))throw Error('Each effective category growth assumption must be above −100% and no more than 200%.');
 return Array.from({length:5},(_,i)=>{const segments=m.segments.map((s,j)=>({name:s.name,revenue:s.revenue*(1+rates[j])**(i+1),growth:rates[j],margin:m.useMargins?s.margin+a.margin-m.marginAnchor:null}));return {revenue:segments.reduce((n,s)=>n+s.revenue,0),operating:m.useMargins?segments.reduce((n,s)=>n+s.revenue*s.margin,0):null,segments};});
}
export function dcf(data,a){
 const suitability=assessCompany(data);if(!suitability.dcfAllowed)throw Error(suitability.reason);
 if(!['reinvest','discount','terminal'].every(k=>Number.isFinite(a[k])))throw Error('Enter net reinvestment, discount rate (WACC), and terminal growth to calculate an illustrative scenario.');
 if(!['growth','margin','tax','reinvest','discount','terminal'].every(k=>Number.isFinite(a[k])))throw Error('All model assumptions must be finite numbers.');
 const last=data.years.at(-1), v=k=>last.facts[k]?.val;
 if(!(v('revenue')>0)||a.discount<=0||a.terminal<=-1||!(a.discount>a.terminal))throw Error('Discount rate must exceed terminal growth.');
 let revenue=v('revenue'),pv=0;const rows=[],segmentPath=segmentRevenuePath(data,a);
 for(let i=1;i<=5;i++){revenue=segmentPath?segmentPath[i-1].revenue:revenue*(1+a.growth);const operating=segmentPath?.[i-1].operating??revenue*a.margin,nopat=operating*(1-a.tax),reinvestment=revenue*a.reinvest,fcff=nopat-reinvestment,discounted=fcff/(1+a.discount)**i;pv+=discounted;rows.push({segments:segmentPath?.[i-1].segments||null,year:Number(last.end.slice(0,4))+i,revenue,operating,nopat,reinvestment,fcff,discounted});}
 if(rows.at(-1).fcff<=0)throw Error('Terminal cash flow must be positive. Adjust operating margin or reinvestment.');
 const terminal=rows.at(-1).fcff*(1+a.terminal)/(a.discount-a.terminal)/(1+a.discount)**5,ev=pv+terminal;
 const cash=v('cash'),long=v('debtLong'),current=v('debtCurrent'),shares=v('shares');
 const ready=[cash,long,current,shares].every(Number.isFinite)&&shares>0;
 const debt=ready?long+current+(v('shortDebt')||0):null;
 const claims=a.claims??0,dilution=a.dilution??0;
 if(!Number.isFinite(claims)||claims<0||!Number.isFinite(dilution)||dilution<0)throw Error('Additional claims and dilution must be finite, nonnegative numbers.');
 const equity=ready?ev+cash+(v('investments')||0)-debt-claims:null;
 const adjustedShares=Number.isFinite(shares)?shares*(1+dilution):null;
 return {rows,ev,equity,perShare:equity===null?null:equity/adjustedShares,claims,dilution,adjustedShares,terminalShare:terminal/ev,terminal,cash,shares,debt};
}

export function reinvestmentHistory(data){
 const value=(y,k)=>y?.facts[k]?.val;
 const wc=y=>['receivables','inventory','payables'].every(k=>Number.isFinite(value(y,k)))?value(y,'receivables')+value(y,'inventory')-value(y,'payables'):null;
 return data.years.map((y,i)=>{const prior=data.years[i-1],currentWC=wc(y),priorWC=wc(prior),gap=prior?(Date.parse(y.start)-Date.parse(prior.end))/86400000:null;
 const delta=currentWC!==null&&priorWC!==null&&gap===1?currentWC-priorWC:null,capex=value(y,'capex'),depreciation=value(y,'depreciation');
 const net=!assessCompany(data).financial&&[capex,depreciation,delta].every(Number.isFinite)?capex-depreciation+delta:null;
 return {year:y,capex,depreciation,currentWC,delta,net,ratio:net!==null&&value(y,'revenue')>0?net/value(y,'revenue'):null};});
}
