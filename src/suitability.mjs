export function assessCompany(data){
 const sic=String(data.sic||''),code=/^\d{4}$/.test(sic)?Number(sic):null;
 const financial=code!==null&&((code>=6000&&code<=6499)||(code>=6700&&code<=6799));
 const last=data.years?.at(-1),op=last?.facts?.operating?.val;
 return {financial,dcfAllowed:!financial,classificationKnown:code!==null,sic,industry:data.industry||'',lossMaking:Number.isFinite(op)&&op<0,operatingMissing:!Number.isFinite(op),reason:financial?'This industrial-company DCF is withheld for financial businesses, including banks, insurers and investment/REIT structures. Debt, interest and reinvestment need a specialist equity-based model.':''};
}
