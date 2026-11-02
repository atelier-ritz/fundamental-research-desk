// Reviewed first-hand company disclosures. Never substitute these for GAAP facts
// or for the report's separately defined FCF calculation.
export const COMPANY_DISCLOSURES=[
 {cik:1045810,start:'2025-01-27',end:'2026-01-25',label:'Free cash flow',value:96575000000,revenue:215938000000,cfo:102718000000,published:'2026-02-25',reviewed:'2026-11-02',source:'https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Fourth-Quarter-and-Fiscal-2026/',definition:'NVIDIA defines free cash flow as GAAP operating cash flow less purchases related to property and equipment and intangible assets, and related principal payments.',note:'The release reports $102.718B operating cash flow, $6.042B purchases and $0.101B principal payments. This is NVIDIA’s published non-GAAP measure, not a standardized cash-flow statement line. Newer announcements are not verified.'},
 {cik:1018724,start:'2025-01-01',end:'2025-12-31',label:'Free cash flow',value:11194000000,revenue:716924000000,cfo:139514000000,published:'2026-02-05',reviewed:'2026-11-02',source:'https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Fourth-Quarter-Results/default.aspx',definition:'Amazon defines free cash flow as operating cash flow less purchases of property and equipment, net of property-sale proceeds and incentives.',note:'This is the company-published supplemental measure. Its definition differs from CFO minus gross cash purchases. Newer announcements are not verified.'}
];
export function selectReportedDisclosures(data,disclosures=COMPANY_DISCLOSURES){
 const y=data.years?.at(-1);if(!y)return [];
 return disclosures.filter(d=>Number(d.cik)===Number(data.cik)&&d.start===y.start&&d.end===y.end&&d.revenue===y.facts.revenue?.val&&d.cfo===y.facts.cfo?.val&&Number.isFinite(d.value)&&/^https:\/\//.test(d.source));
}
