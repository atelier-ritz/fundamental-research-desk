import {assessCompany} from './suitability.mjs';
export function financialStrength(data){
 const period=data.years.at(-1),facts=period.facts,value=key=>facts[key]?.val,finite=Number.isFinite;
 const longDebtSubtotal=finite(value('debtCurrent'))&&finite(value('debtLong'))?value('debtCurrent')+value('debtLong'):null;
 const interest=value('interest'),coverage=!assessCompany(data).financial&&finite(value('operating'))&&interest>0?value('operating')/interest:null;
 const uses=['capex','dividends','buybacks'];
 const allUses=uses.every(key=>finite(value(key))&&value(key)>=0),selectedUses=allUses?uses.reduce((sum,key)=>sum+value(key),0):null;
 const remaining=selectedUses!==null&&finite(value('cfo'))?value('cfo')-selectedUses:null;
 const maturities=['maturity1','maturity2','maturity3','maturity4','maturity5','maturityAfter5'].map((key,index)=>({key,label:index===0?'Next 12 months':index===5?'After year 5':'Year '+(index+1),value:value(key)??null,fact:facts[key]||null}));
 return {period,longDebtSubtotal,coverage,selectedUses,remaining,maturities,missingUses:uses.filter(key=>!finite(value(key))||value(key)<0),shortDebtMissing:!finite(value('shortDebt')),principalVsCash:finite(value('maturity1'))&&finite(value('cash'))?value('cash')-value('maturity1'):null};
}
