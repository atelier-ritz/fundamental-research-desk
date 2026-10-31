import {normalizeQuarters} from './quarters.mjs';
export const TAGS = {
 depreciation:['Depreciation','DepreciationDepletionAndAmortizationPropertyPlantAndEquipment'], receivables:['AccountsReceivableNetCurrent'], inventory:['InventoryNet'], payables:['AccountsPayableCurrent'],
 interest:['InterestExpenseNonoperating','InterestExpense'], leaseInterest:['FinanceLeaseInterestExpense'], dividends:['PaymentsOfDividendsCommonStock'], buybacks:['PaymentsForRepurchaseOfCommonStock'], operatingLeases:['OperatingLeaseLiability'], financeLeases:['FinanceLeaseLiability'], maturity1:['LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths'], maturity2:['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearTwo'], maturity3:['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearThree'], maturity4:['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFour'], maturity5:['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFive'], maturityAfter5:['LongTermDebtMaturitiesRepaymentsOfPrincipalAfterYearFive'],
 revenue:['RevenueFromContractWithCustomerExcludingAssessedTax','Revenues','SalesRevenueNet'],
 pretax:['IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest','IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'], incomeTax:['IncomeTaxExpenseBenefit'], cost:['CostOfRevenue','CostOfGoodsAndServicesSold'], research:['ResearchAndDevelopmentExpense'], selling:['SellingGeneralAndAdministrativeExpense'], operating:['OperatingIncomeLoss'], net:['NetIncomeLoss'], cfo:['NetCashProvidedByUsedInOperatingActivities'], capex:['PaymentsToAcquirePropertyPlantAndEquipment'],
 cash:['CashAndCashEquivalentsAtCarryingValue'], investments:['ShortTermInvestments'], debtCurrent:['LongTermDebtCurrent','LongTermDebtAndCapitalLeaseObligationsCurrent'], debtLong:['LongTermDebtNoncurrent'], shortDebt:['ShortTermBorrowings'], shares:['CommonStockSharesOutstanding'], eps:['EarningsPerShareDiluted'], assets:['Assets'], sbc:['ShareBasedCompensation']
};
export function normalize(raw,ticker,meta={}) {
 const gaap=raw.facts?.['us-gaap']; if(!gaap) throw Error('US GAAP financial facts are unavailable. This version supports US GAAP filers.');
 const cutoff=new Date().toISOString().slice(0,10);
 function pick(key,end,start) {
  const unit=key==='shares'?'shares':key==='eps'?'USD/shares':'USD';
  for(const tag of TAGS[key]) {
   const list=(gaap[tag]?.units?.[unit]||[]).filter(f=>['10-K','10-K/A','10-Q','10-Q/A'].includes(f.form)&&f.filed<=cutoff&&f.end===end&&(start?f.start===start:!f.start));
   list.sort((a,b)=>b.filed.localeCompare(a.filed));
   if(list.length){const f=list[0];return {...f,tag,url:'https://www.sec.gov/Archives/edgar/data/'+Number(raw.cik)+'/'+f.accn.replaceAll('-','')+'/'+f.accn+'-index.html'};}
  }return null;
 }
 const periods=new Map();
 for(const tag of TAGS.revenue) for(const f of gaap[tag]?.units?.USD||[]) {
  const days=(Date.parse(f.end)-Date.parse(f.start))/86400000;
  if(['10-K','10-K/A'].includes(f.form)&&f.filed<=cutoff&&days>=330&&days<=380) periods.set(f.end,{start:f.start,end:f.end});
 }
 const years=[...periods.values()].sort((a,b)=>a.end.localeCompare(b.end)).slice(-5).map(p=>{
  const facts={}; for(const k of Object.keys(TAGS))facts[k]=pick(k,p.end,['receivables','inventory','payables','cash','investments','debtCurrent','debtLong','shortDebt','shares','assets','operatingLeases','financeLeases','maturity1','maturity2','maturity3','maturity4','maturity5','maturityAfter5'].includes(k)?null:p.start);
  return {...p,label:'FY '+p.end.slice(0,4),facts};
 });
 if(years.length<2)throw Error('At least two comparable annual revenue periods are required.');
 return {ticker,name:raw.entityName,cik:raw.cik,years,retrieved:new Date().toISOString(),quarterly:normalizeQuarters(raw),sic:meta.sic||'',industry:meta.sicDescription||'',segments:[],notes:['Annual values use 330–380 day periods; metrics must match the revenue period exactly.','Latest eligible filing for each metric is used; comparative figures may be restated. Different metrics may cite different filings.','The company-facts feed omits segment dimensions. Separate annual-filing enrichment is shown when available; operating KPI coverage varies.','Annual figures anchor valuation; quarterly and trailing results are shown separately. Consensus forecasts are not included.']};
}
export function dcf(data,a){
 if(!['growth','margin','tax','reinvest','discount','terminal'].every(k=>Number.isFinite(a[k])))throw Error('All model assumptions must be finite numbers.');
 const last=data.years.at(-1), v=k=>last.facts[k]?.val;
 if(!(v('revenue')>0)||!(a.discount>a.terminal))throw Error('Discount rate must exceed terminal growth.');
 let revenue=v('revenue'),pv=0;const rows=[];
 for(let i=1;i<=5;i++){revenue*=1+a.growth;const nopat=revenue*a.margin*(1-a.tax),reinvestment=revenue*a.reinvest,fcff=nopat-reinvestment,discounted=fcff/(1+a.discount)**i;pv+=discounted;rows.push({year:Number(last.end.slice(0,4))+i,revenue,nopat,reinvestment,fcff,discounted});}
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
 const net=[capex,depreciation,delta].every(Number.isFinite)?capex-depreciation+delta:null;
 return {year:y,capex,depreciation,currentWC,delta,net,ratio:net!==null&&value(y,'revenue')>0?net/value(y,'revenue'):null};});
}
