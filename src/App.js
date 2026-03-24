import { useState, useMemo } from "react";

const RC = r => r==="critical"||r==="high" ? "#dc2626" : r==="medium" ? "#d97706" : "#16a34a";
const RB = r => r==="critical" ? "rgba(220,38,38,.1)" : r==="high" ? "rgba(220,38,38,.07)" : r==="medium" ? "rgba(217,119,6,.1)" : "rgba(22,163,74,.08)";
const Pill = ({r,t}) => <span style={{background:RB(r),color:RC(r),border:`1px solid ${RC(r)}44`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{t}</span>;
const Bdg = ({t,c="#6366f1",bg="rgba(99,102,241,.1)"}) => <span style={{background:bg,color:c,border:`1px solid ${c}33`,borderRadius:4,padding:"2px 7px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{t}</span>;
const KPI = ({label,value,sub,color="#6366f1",onClick}) => (
  <div onClick={onClick} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"14px 18px",flex:1,minWidth:130,boxShadow:"0 1px 3px rgba(0,0,0,.06)",cursor:onClick?"pointer":"default"}}
    onMouseEnter={e=>{if(onClick)e.currentTarget.style.boxShadow="0 4px 14px rgba(0,0,0,.12)"}}
    onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,.06)"}}>
    <div style={{color:"#94a3b8",fontSize:10,fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{label}</div>
    <div style={{color,fontSize:26,fontWeight:800,lineHeight:1}}>{value}</div>
    {sub && <div style={{color:"#94a3b8",fontSize:10,marginTop:4}}>{sub}</div>}
    {onClick && <div style={{color,fontSize:10,marginTop:5,fontWeight:600}}>Click to explore →</div>}
  </div>
);
const Card = ({children,style={}}) => <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:18,marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,.05)",...style}}>{children}</div>;
const TH = ({children,style={}}) => <th style={{background:"#f8fafc",color:"#64748b",fontWeight:600,padding:"9px 11px",textAlign:"left",borderBottom:"1px solid #e2e8f0",fontSize:10,textTransform:"uppercase",whiteSpace:"nowrap",...style}}>{children}</th>;
const TD = ({children,style={}}) => <td style={{padding:"9px 11px",borderBottom:"1px solid #f1f5f9",verticalAlign:"top",lineHeight:1.4,fontSize:12,...style}}>{children}</td>;
const Tip = ({children}) => <div style={{color:"#6366f1",fontSize:11,marginBottom:14,background:"rgba(99,102,241,.06)",padding:"8px 14px",borderRadius:8,border:"1px solid rgba(99,102,241,.2)"}}>{children}</div>;
const SrcLink = ({url,label="Gov't Source"}) => url ? <a href={url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:11,color:"#6366f1",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4,fontWeight:600}}>🔗 {label}</a> : null;

const STATES = [
  {s:"Alabama",a:"AL",mw:7.25,chg:false,note:"No state law — federal $7.25",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum wage applies ($7.25)","No state sick leave","Tipped: $2.13 federal rate"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://labor.alabama.gov/"},
  {s:"Alaska",a:"AK",mw:13.00,chg:true,cd:"Jul 1, 2026",nr:14.00,note:"→$14.00 Jul 1, 2026. No tip credit.",tip:"Full MW",tc:"None",sl:true,slN:"All employers Jul 2025. 1hr/30hrs. 56hrs/yr (15+).",sch:false,schN:"None",r:"medium",ot:"Daily 8 + Weekly 40",otD:true,otNote:"OT after 8hrs/day OR 40hrs/week",local:"None",laws:["Min wage → $14.00 Jul 1, 2026","No tip credit — full MW","Daily OT after 8hrs","Paid sick leave all employers Jul 2025"],minor:"Work permit required.",brk:{rest:"None required for adults",meal:"None required for adults",premium:"None",mealNote:"Minors must receive breaks per DOL standards"},src:"https://labor.alaska.gov/lss/whhome.htm"},
  {s:"Arizona",a:"AZ",mw:15.15,chg:false,note:"CPI-indexed. Flagstaff $17.85.",tip:12.15,tc:3.00,sl:true,slN:"1hr/30hrs up to 40hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"Flagstaff: $17.85",laws:["PSL: 1hr/30hrs","Tipped: $12.15 (credit $3.00)","Flagstaff local: $17.85"],minor:"Work permit required under 16.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://www.azica.gov/divisions/labor-department/minimum-wage"},
  {s:"Arkansas",a:"AR",mw:11.00,chg:false,note:"State minimum $11.00.",tip:2.63,tc:8.37,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Tipped: $2.63 (credit $8.37)","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://www.labor.arkansas.gov/"},
  {s:"California",a:"CA",mw:16.90,chg:false,note:"Fast food 60+ locs: $20. Many locals higher.",tip:"Full MW",tc:"None",sl:true,slN:"AB 406 Jan 2026: 40–80hrs/yr.",sch:true,schN:"SF, LA, Berkeley, Emeryville, San Jose Fair Workweek.",r:"high",ot:"Daily 8(1.5x)/12(2x) + Weekly 40 + 7th day",otD:true,otNote:"1.5x after 8hrs/day; 2x after 12hrs/day; 7th consecutive day 1.5x/2x",local:"LA $17.28 | SF $18.67 | W.Hollywood $19.08",laws:["No tip credit — full $16.90 required","Fast food: $20 (chains 60+ locations)","Daily OT: 1.5x >8hrs, 2x >12hrs","7th consecutive day rules","Fair Workweek laws in SF, LA, Berkeley, Emeryville","SDI/PFL contribution 1.3%"],minor:"DLSE permit required. 14–15: 3hr/day school days.",brk:{rest:"10-min PAID rest per 4hrs worked",meal:"30-min UNPAID meal per 5hrs; 2nd meal >10hrs",premium:"1 hour at regular pay per missed rest OR meal",mealNote:"Non-compliant meal periods must be paid as regular time worked"},src:"https://www.dir.ca.gov/dlse/faq_minimumwage.htm"},
  {s:"Colorado",a:"CO",mw:14.81,chg:true,cd:"Jan 1, 2027",nr:15.00,note:"Denver $18.29. COMPS Order applies.",tip:11.79,tc:3.02,sl:true,slN:"HFWA: 1hr/30hrs up to 48hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Daily 12 + Weekly 40",otD:true,otNote:"OT after 12hrs/day OR 40hrs/week per COMPS Order",local:"Denver: $18.29",laws:["COMPS Order covers restaurant workers","Denver local: $18.29","Daily OT after 12hrs","HFWA sick leave 1hr/30hrs"],minor:"Work permit required under 16.",brk:{rest:"10-min PAID rest per 4hrs worked",meal:"30-min UNPAID meal per 5hrs",premium:"None specific; COMPS Order penalties apply",mealNote:"COMPS Order §5 governs. Employee must be completely relieved."},src:"https://cdle.colorado.gov/wages"},
  {s:"Connecticut",a:"CT",mw:16.35,chg:true,cd:"Jan 1, 2027",nr:17.00,note:"→$17.00 Jan 1, 2027.",tip:8.23,tc:8.12,sl:true,slN:"1hr/40hrs up to 40hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage → $17.00 Jan 2027","Tipped: $8.23 (credit $8.12)","PSL: 1hr/40hrs"],minor:"Work permit required.",brk:{rest:"None required by state law",meal:"30-min unpaid meal for shifts >7.5hrs",premium:"None specific",mealNote:"CT Gen. Stat. §31-51ii applies"},src:"https://www.ctdol.state.ct.us/wgwkstnd/wage-hour.htm"},
  {s:"Delaware",a:"DE",mw:15.00,chg:false,note:"$15.00 effective Jan 2025.",tip:2.23,tc:12.77,sl:true,slN:"1hr/30hrs up to 40hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["$15.00 since Jan 2025","Tipped: $2.23 (credit $12.77)","PSL: 1hr/30hrs"],minor:"Work permit required under 18.",brk:{rest:"None required by state law",meal:"30-min unpaid meal for shifts >7.5hrs",premium:"None",mealNote:"Applies to employers with 10+ employees"},src:"https://labor.delaware.gov/divisions/industrial-affairs/wage-hour/"},
  {s:"Florida",a:"FL",mw:14.00,chg:true,cd:"Sep 30, 2026",nr:15.00,note:"→$15.00 Sep 30, 2026. Tipped → $11.98.",tip:10.98,tc:3.02,sl:false,slN:"None",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage → $15.00 Sep 30, 2026","Tipped → $11.98 Sep 30, 2026","No state sick leave"],minor:"Work permit required under 18.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://floridajobs.org/workforce-board-resources/policy-and-technical-assistance/labor-laws"},
  {s:"Georgia",a:"GA",mw:7.25,chg:false,note:"Federal $7.25 applies.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave","Tipped: $2.13"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://dol.georgia.gov/labor-law-faqs"},
  {s:"Hawaii",a:"HI",mw:14.00,chg:true,cd:"Jan 1, 2026",nr:16.00,note:"→$16.00 Jan 1, 2026.",tip:12.75,tc:1.25,sl:true,slN:"Employers 100+: up to 40hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage → $16.00 Jan 2026","Tipped: $12.75 (credit $1.25)","PSL large employers 100+"],minor:"Work permit required under 16.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://labor.hawaii.gov/wage-standards-division/"},
  {s:"Idaho",a:"ID",mw:7.25,chg:false,note:"Federal rate.",tip:3.35,tc:3.90,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://labor.idaho.gov/"},
  {s:"Illinois",a:"IL",mw:15.00,chg:false,note:"Chicago $16.20. Cook County $15.00.",tip:9.00,tc:6.00,sl:true,slN:"1hr/40hrs up to 40hrs/yr.",sch:true,schN:"Chicago Fair Workweek: 14-day notice.",r:"high",ot:"Weekly 40",otD:false,otNote:"Follows FLSA. Chicago adds predictability pay.",local:"Chicago $16.20 | Cook County $15.00",laws:["Chicago local: $16.20","Chicago Fair Workweek: 14-day notice","Tipped: $9.00 (credit $6.00)","PSL: 1hr/40hrs"],minor:"Work permit required.",brk:{rest:"None required by state law",meal:"20-min unpaid meal break for shifts >7.5hrs",premium:"None",mealNote:"820 ILCS 140/3. Employee must be completely free from duties."},src:"https://labor.illinois.gov/"},
  {s:"Indiana",a:"IN",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave","Youth subminimum $4.25 first 90 days"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://www.in.gov/dol/"},
  {s:"Iowa",a:"IA",mw:7.25,chg:false,note:"Federal rate.",tip:4.35,tc:2.90,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required for adults. Minors: 30-min after 5hrs.",premium:"None",mealNote:"Minor break rules: Iowa Code §92.7"},src:"https://www.iwd.iowa.gov/"},
  {s:"Kansas",a:"KS",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://www.dol.ks.gov/"},
  {s:"Kentucky",a:"KY",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"10-min PAID rest per 4hrs worked",meal:"Reasonable unpaid meal break",premium:"None specific",mealNote:"KRS §337.355. One of few low-minimum states with rest break requirements."},src:"https://labor.ky.gov/"},
  {s:"Louisiana",a:"LA",mw:7.25,chg:false,note:"No state law. Federal $7.25.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://www.laworks.net/"},
  {s:"Maine",a:"ME",mw:14.65,chg:true,cd:"Jan 1, 2027",nr:15.00,note:"Portland $15.00. CPI-indexed.",tip:7.33,tc:7.32,sl:true,slN:"1hr/40hrs up to 40hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"Portland: $15.00",laws:["CPI indexing","Portland local $15.00","Tipped: $7.33","PSL: 1hr/40hrs"],minor:"Work permit required.",brk:{rest:"None required by state law",meal:"30-min unpaid break per 6 consecutive hours",premium:"None",mealNote:"26 MRS §603. Employee must be relieved of all duties."},src:"https://www.maine.gov/labor/labor_laws/"},
  {s:"Maryland",a:"MD",mw:15.00,chg:false,note:"Montgomery County $17.15. Prince George's $16.50.",tip:3.63,tc:11.37,sl:true,slN:"1hr/30hrs up to 40–64hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"Montgomery Co $17.15 | PG Co $16.50",laws:["Tipped: $3.63 (credit $11.37)","PSL: 1hr/30hrs","Local rates: Montgomery & PG County"],minor:"Work permit required under 18.",brk:{rest:"None required (FLSA only)",meal:"None required for adults (FLSA only)",premium:"None",mealNote:"Minors under 16: 30-min unpaid break after 5hrs"},src:"https://www.dllr.state.md.us/labor/wages/"},
  {s:"Massachusetts",a:"MA",mw:15.00,chg:false,note:"$15.00. No further increase scheduled.",tip:6.75,tc:8.25,sl:true,slN:"1hr/30hrs up to 40hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Tipped: $6.75","PSL: 1hr/30hrs","Sunday premium phased out 2023"],minor:"Work permit required under 18.",brk:{rest:"None required by state law",meal:"30-min unpaid break per 6hrs worked",premium:"None specific; violation subject to civil fine",mealNote:"M.G.L. c.149 §100. One of the more strictly enforced meal break states."},src:"https://www.mass.gov/minimum-wage-program"},
  {s:"Michigan",a:"MI",mw:10.56,chg:true,cd:"Feb 2026",nr:13.29,note:"→$13.29 Feb 2026. Tip credit phasing out by 2031.",tip:4.74,tc:5.82,sl:true,slN:"1hr/35hrs up to 72hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage → $12.48 Feb 2025, $13.29 Feb 2026","Tip credit eliminated by 2031","ESTA: 1hr/35hrs up to 72hrs/yr"],minor:"Work permit required under 18.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://www.michigan.gov/leo/bureaus-agencies/ors/wage-and-hour"},
  {s:"Minnesota",a:"MN",mw:10.85,chg:true,cd:"Jan 1, 2026",nr:11.13,note:"Minneapolis $15.57. St. Paul $15.19.",tip:"Full MW",tc:"None",sl:true,slN:"1hr/30hrs up to 48hrs/yr.",sch:true,schN:"Minneapolis Fair Workweek: 14-day notice.",r:"high",ot:"Weekly 48",otD:false,otNote:"State OT after 48hrs/week (not 40).",local:"Minneapolis $15.57 | St. Paul $15.19",laws:["No tip credit — full MW required","Minneapolis local: $15.57","St. Paul local: $15.19","Minneapolis Fair Workweek: 14-day notice","PSL: 1hr/30hrs","State OT after 48hrs"],minor:"Work permit required under 16.",brk:{rest:"Sufficient time to use restroom per 4hrs (PAID if on-premises)",meal:"Sufficient time to eat — if <20 min, must be PAID",premium:"None specific",mealNote:"Minn. Stat. §177.253–177.254. On-premises breaks must be paid."},src:"https://www.dli.mn.gov/business/employment-practices/minimum-wage-minnesota"},
  {s:"Mississippi",a:"MS",mw:7.25,chg:false,note:"No state law. Federal $7.25.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://mdes.ms.gov/"},
  {s:"Missouri",a:"MO",mw:13.75,chg:true,cd:"Jan 1, 2026",nr:15.00,note:"→$15.00 Jan 1, 2026 per Prop A.",tip:6.88,tc:6.87,sl:true,slN:"Prop A: 1hr/30hrs eff Jan 2026.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage → $15.00 Jan 2026","Prop A paid sick leave effective Jan 2026"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://labor.mo.gov/DLS/MinimumWage"},
  {s:"Montana",a:"MT",mw:10.30,chg:false,note:"Businesses >$110K gross. Others $4/hr.",tip:"Full MW",tc:"None",sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["No tip credit allowed","Small business exception $4/hr","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://dli.mt.gov/labor-standards/wage-and-hour"},
  {s:"Nebraska",a:"NE",mw:13.50,chg:true,cd:"Jan 1, 2026",nr:15.00,note:"→$15.00 Jan 1, 2026.",tip:2.13,tc:11.37,sl:true,slN:"Prop 436: 1hr/30hrs eff Jan 2025.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage → $15.00 Jan 2026","Paid sick leave via Prop 436","Tipped: $2.13"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://labor.nebraska.gov/"},
  {s:"Nevada",a:"NV",mw:12.00,chg:false,note:"No tip credit. Daily OT after 8hrs if <$18/hr.",tip:"Full MW",tc:"None",sl:true,slN:"1hr/52hrs up to 40hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Daily 8 + Weekly 40",otD:true,otNote:"OT after 8hrs/day if earning <$18/hr; also after 40hrs/week",local:"None",laws:["No tip credit allowed","Daily OT after 8hrs if paid under $18/hr","PSL: 1hr/52hrs"],minor:"Work permit required under 17.",brk:{rest:"10-min PAID rest per 4hrs worked",meal:"30-min unpaid meal per shift >8hrs",premium:"None specific; violation subject to labor board complaint",mealNote:"NRS §608.019. Both paid rest AND meal requirements."},src:"https://labor.nv.gov/"},
  {s:"New Hampshire",a:"NH",mw:7.25,chg:false,note:"Federal rate.",tip:3.26,tc:3.99,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required by state law",meal:"30-min unpaid meal per 5hrs worked",premium:"None",mealNote:"NH RSA 275:30-a."},src:"https://www.nh.gov/labor/"},
  {s:"New Jersey",a:"NJ",mw:15.49,chg:true,cd:"Jan 1, 2027",nr:16.00,note:"CPI-indexed. Small/seasonal: $13.73.",tip:5.26,tc:10.23,sl:true,slN:"1hr/30hrs up to 40hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["CPI annual adjustment","Tipped: $5.26","PSL: 1hr/30hrs"],minor:"Work permit required under 18.",brk:{rest:"None required (FLSA only)",meal:"None required for adults",premium:"None",mealNote:"Minors under 18: 30-min break after 5hrs continuous work"},src:"https://www.nj.gov/labor/wageandhour/"},
  {s:"New Mexico",a:"NM",mw:12.00,chg:false,note:"Las Cruces $13.50. Albuquerque $12.00.",tip:3.00,tc:9.00,sl:true,slN:"1hr/30hrs up to 64hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"Albuquerque $12.00 | Las Cruces $13.50",laws:["PSL: 1hr/30hrs","Tipped: $3.00 (credit $9.00)","Local rates apply"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://www.dws.state.nm.us/"},
  {s:"New York",a:"NY",mw:16.50,chg:false,note:"NYC/LI/Westchester $17. Fast food $17 statewide.",tip:11.35,tc:5.65,sl:true,slN:"1hr/30hrs up to 56hrs/yr.",sch:true,schN:"NYC Fair Workweek: 14-day notice.",r:"high",ot:"Weekly 40",otD:false,otNote:"FLSA weekly. NYC: spread-of-hours premium if shift >10hrs.",local:"NYC/LI/Westchester $17.00",laws:["NYC/LI/Westchester: $17.00","NYC Fair Workweek: 14-day notice","Fast food statewide: $17.00","Spread-of-hours premium","PSL: 1hr/30hrs"],minor:"Working papers required under 18.",brk:{rest:"None required by state law",meal:"30-min per 6hrs (general); 45-min for restaurant workers if shift includes 11am–2pm; 60-min for factory workers",premium:"None; violation subject to NYDOL enforcement",mealNote:"NY Labor Law §162. Restaurant-specific 45-min rule commonly violated."},src:"https://dol.ny.gov/minimum-wage"},
  {s:"North Carolina",a:"NC",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"30-min unpaid break per shift — required by DOL for employers 5+",premium:"None",mealNote:"NC Admin Code 13 NCAC 12.0104."},src:"https://www.labor.nc.gov/"},
  {s:"North Dakota",a:"ND",mw:7.25,chg:false,note:"Federal rate.",tip:4.86,tc:2.39,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"30-min unpaid meal per 5hrs",premium:"None",mealNote:"ND Century Code §34-06-03."},src:"https://www.nd.gov/labor/"},
  {s:"Ohio",a:"OH",mw:10.70,chg:false,note:"CPI-indexed. Employers <$385K gross: $7.25.",tip:5.35,tc:5.35,sl:false,slN:"Cleveland PSL only",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"Cleveland PSL",laws:["CPI indexing","Tipped: $5.35 (50% of MW)","Cleveland sick leave ordinance"],minor:"Work permit required under 18.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://com.ohio.gov/divisions/industrial-compliance/wage-and-hour"},
  {s:"Oklahoma",a:"OK",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://www.ok.gov/odol/"},
  {s:"Oregon",a:"OR",mw:14.70,chg:true,cd:"Jul 1, 2026",nr:15.50,note:"Portland metro $15.95 → $16.80 Jul 2026.",tip:"Full MW",tc:"None",sl:true,slN:"PSST: 1hr/30hrs up to 40hrs/yr.",sch:true,schN:"Statewide Fair Scheduling: food service 500+ employees.",r:"high",ot:"Weekly 40",otD:false,otNote:"FLSA weekly. Clopening premium <10hrs between shifts.",local:"Portland metro $15.95 (→$16.80 Jul 2026)",laws:["No tip credit allowed","Portland metro → $16.80 Jul 2026","Statewide Fair Work Week: 14-day notice 500+","Clopening premium 1.5x if <10hr gap","PSST sick leave: 1hr/30hrs"],minor:"Work permit required under 18.",brk:{rest:"10-min PAID rest per 4hrs worked",meal:"30-min unpaid meal after 6hrs; 2nd meal per 14hrs",premium:"None specific; BOLI enforcement",mealNote:"ORS §653.261. Oregon enforces both rest and meal break requirements strictly."},src:"https://www.oregon.gov/boli/workers/Pages/minimum-wage.aspx"},
  {s:"Pennsylvania",a:"PA",mw:7.25,chg:false,note:"Increases stalled. Federal rate remains.",tip:2.83,tc:4.42,sl:false,slN:"Philadelphia PSL",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"Philadelphia PSL",laws:["Federal minimum; state increases stalled","Philadelphia PSL ordinance","Tipped: $2.83"],minor:"Work permit required.",brk:{rest:"None required for adults",meal:"None required for adults",premium:"None",mealNote:"Minors under 18: 30-min break after 5hrs. PA Child Labor Act."},src:"https://www.dli.pa.gov/Individuals/Labor-Management-Relations/llc/Pages/Minimum-Wage.aspx"},
  {s:"Rhode Island",a:"RI",mw:14.00,chg:true,cd:"Jan 1, 2026",nr:15.00,note:"→$15.00 Jan 1, 2026.",tip:3.89,tc:10.11,sl:true,slN:"1hr/35hrs up to 40hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage → $15.00 Jan 2026","Tipped: $3.89","PSL: 1hr/35hrs"],minor:"Work permit required.",brk:{rest:"None required by state law",meal:"20-min unpaid break per 6hrs worked",premium:"None",mealNote:"RI Gen. Laws §28-3-14."},src:"https://dlt.ri.gov/employers/wage-and-hour/minimum-wage"},
  {s:"South Carolina",a:"SC",mw:7.25,chg:false,note:"No state law. Federal $7.25.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://llr.sc.gov/"},
  {s:"South Dakota",a:"SD",mw:11.20,chg:false,note:"CPI-indexed annually.",tip:5.60,tc:5.60,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["CPI indexing","Tipped: $5.60 (50% of MW)","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://dlr.sd.gov/"},
  {s:"Tennessee",a:"TN",mw:7.25,chg:false,note:"No state law. Federal $7.25.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required by state law",meal:"30-min unpaid meal per 6hrs for employers 5+",premium:"None",mealNote:"TCA §50-2-103."},src:"https://www.tn.gov/workforce/"},
  {s:"Texas",a:"TX",mw:7.25,chg:false,note:"Federal rate. State preempts local.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum; state preempts local","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://www.twc.texas.gov/"},
  {s:"Utah",a:"UT",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://laborcommission.utah.gov/"},
  {s:"Vermont",a:"VT",mw:14.01,chg:false,note:"CPI-indexed annually.",tip:6.99,tc:7.02,sl:true,slN:"1hr/52hrs up to 40hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["CPI indexing","Tipped: $6.99","PSL: 1hr/52hrs"],minor:"Work permit required under 16.",brk:{rest:"None required by state law",meal:"Reasonable meal opportunity",premium:"None",mealNote:"21 VSA §309."},src:"https://labor.vermont.gov/"},
  {s:"Virginia",a:"VA",mw:12.41,chg:true,cd:"Jan 1, 2026",nr:15.00,note:"→$15.00 Jan 1, 2026.",tip:2.13,tc:10.28,sl:true,slN:"1hr/40hrs up to 40hrs/yr.",sch:false,schN:"None",r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage → $15.00 Jan 2026","PSL: 1hr/40hrs","Tipped: $2.13"],minor:"Work permit required under 16.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://www.doli.virginia.gov/"},
  {s:"Washington",a:"WA",mw:16.66,chg:true,cd:"Jan 1, 2027",nr:17.00,note:"Seattle $20.76. Tukwila $21.10. SeaTac $19.71.",tip:"Full MW",tc:"None",sl:true,slN:"1hr/40hrs up to 40hrs/yr.",sch:true,schN:"Seattle Secure Scheduling: 14-day notice, clopening premium.",r:"high",ot:"Weekly 40",otD:false,otNote:"FLSA weekly. Seattle adds clopening premium.",local:"Seattle $20.76 | Tukwila $21.10 | SeaTac $19.71",laws:["No tip credit allowed","Seattle Secure Scheduling: 14-day notice","PSL: 1hr/40hrs","Annual CPI adjustments","Tukwila $21.10 — highest US city minimum"],minor:"Work permit required under 18.",brk:{rest:"10-min PAID rest per 4hrs worked",meal:"30-min unpaid meal per 5hrs worked",premium:"None specific; L&I enforcement",mealNote:"RCW §49.12.187. Both rest and meal breaks strictly required."},src:"https://lni.wa.gov/workers-rights/wages/minimum-wage/"},
  {s:"West Virginia",a:"WV",mw:8.75,chg:false,note:"State min $8.75 for employers >6 workers.",tip:2.62,tc:6.13,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["State MW $8.75 for larger employers","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"20-min unpaid meal per 6hrs worked",premium:"None",mealNote:"WV Code §21-3-10a."},src:"https://labor.wv.gov/"},
  {s:"Wisconsin",a:"WI",mw:7.25,chg:false,note:"Federal rate. State preempts local.",tip:2.33,tc:4.92,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum; state preempts local","No state sick leave"],minor:"Work permit required under 16.",brk:{rest:"None required by state law",meal:"30-min unpaid meal per 6hrs — recommended",premium:"None",mealNote:"Wisconsin DWD Advisory. Not legally enforceable."},src:"https://dwd.wisconsin.gov/er/laborstandards/"},
  {s:"Wyoming",a:"WY",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,schN:"None",r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required (FLSA only)",meal:"None required (FLSA only)",premium:"None",mealNote:"Short breaks <20 min must be paid per FLSA"},src:"https://wyomingworkforce.org/"},
];

const CASES = [
  {yr:2025,co:"Starbucks",type:"Fair Workweek",laws:"NYC Fair Workweek Law",pen:"$38.9M",who:"~8,000 NYC workers",sev:"critical",detail:"500,000+ violations since 2021: irregular schedules, hours cut >15% without notice, failure to offer hours to existing workers."},
  {yr:2024,co:"Chipotle (Seattle)",type:"Scheduling / Sick Leave",laws:"Seattle Secure Scheduling + PSST",pen:"$2.9M",who:"Seattle workers",sev:"high",detail:"Failed to provide sick leave at correct accrual rate; retaliated against workers; violated advance notice rules."},
  {yr:2024,co:"McDonald's Franchisee (CA)",type:"Wage Theft / Daily OT",laws:"California Labor Code",pen:"$1.2M",who:"~300 workers",sev:"high",detail:"Failure to pay daily OT on shifts exceeding 8hrs; meal period violations across multiple CA locations."},
  {yr:2024,co:"Denny's (FL)",type:"Tip Credit / 80-20 Rule",laws:"FLSA / FL Wage Law",pen:"$620K",who:"Servers, bussers",sev:"high",detail:"Applied tip credit to employees who spent more than 20% of time on non-tipped duties."},
  {yr:2023,co:"Domino's Franchisee (NY)",type:"Minor Labor / Wage",laws:"NYLL / Child Labor",pen:"$900K",who:"Delivery minors",sev:"critical",detail:"Employed minors on hazardous delivery routes (e-bikes); failure to obtain working papers; school-week hour violations."},
  {yr:2023,co:"Panera Bread (IL)",type:"Fair Workweek",laws:"Chicago Fair Workweek",pen:"$280K",who:"Chicago locations",sev:"medium",detail:"Failed to provide 14-day advance notice; did not pay required premiums for last-minute schedule changes."},
];

const FEDERAL_UPDATES = [
  {cat:"FLSA",title:"OT Salary Threshold — Blocked at $35,568",date:"Nov 2024",status:"Blocked",sev:"medium",detail:"Biden DOL raised threshold to $58,656/yr. Federal judge vacated Nov 2024. Threshold remains $35,568.",src:"https://www.dol.gov/agencies/whd/overtime"},
  {cat:"FLSA",title:"80/20 Tip Credit Rule — Actively Enforced",date:"2023–Ongoing",status:"Active",sev:"high",detail:"Tipped employees cannot spend >20% of shift on non-tipped duties. Top restaurant industry violation per DOL WHD.",src:"https://www.dol.gov/agencies/whd/restaurants"},
  {cat:"Child Labor",title:"DOL Child Labor Enforcement Surge",date:"2024–2025",status:"Active",sev:"critical",detail:"950+ cases in 2024. Restaurant industry is #1 cited sector. Focus: delivery routes, equipment, hours violations.",src:"https://www.dol.gov/agencies/whd/child-labor"},
  {cat:"I-9",title:"Remote I-9 Verification Expired",date:"Aug 2023",status:"Expired",sev:"medium",detail:"COVID-era remote verification ended Aug 2023. All I-9s must be physically inspected. Ongoing audit risk.",src:"https://www.uscis.gov/i-9-central"},
  {cat:"Tip Credit",title:"Dual Jobs / Non-Tipped Duties Enforcement",date:"2024",status:"Active",sev:"high",detail:"WHD enforces sidework beyond 20% of shift. Average back-wage assessment: $1,400/employee.",src:"https://www.dol.gov/agencies/whd/restaurants"},
  {cat:"Joint Employment",title:"Joint Employer Rule Withdrawn",date:"Mar 2024",status:"Resolved",sev:"medium",detail:"Biden-era joint employer rule vacated. Franchisors generally not liable for franchisee wage violations under current rule.",src:"https://www.dol.gov/agencies/whd/flsa"},
];

// --- MINOR LABOR AGE-SPECIFIC DATA ---
const B14 = ["3hrs/school day","18hrs/school wk","8hrs/non-school day","40hrs/non-school wk","7am–7pm (9pm Jun–Labor Day)","No hazardous equipment"];
const B16 = ["No federal hour restrictions","No hazardous work (under 18)","May work any shift"];

const MINOR_AGES = {
  AL:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required — follows FLSA"},
  AK:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Work permit required for all minors"},
  AZ:{a14:[...B14,"Work permit required (under 16)"],a15:["Same rules as age 14","Work permit required"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Required under 16"},
  AR:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  CA:{
    a14:["3hrs/school day","18hrs/school wk","8hrs/non-school day","48hrs/summer wk","7am–7pm school nights","7am–9pm non-school nights","DLSE work permit required"],
    a15:["Same rules as age 14","DLSE work permit required"],
    a16:["4hrs/school day","28hrs/school wk","8hrs/non-school day","48hrs/non-school wk","Until 10pm school nights","Until 12:30am non-school nights","DLSE work permit required"],
    a17:["Same rules as age 16","DLSE work permit required"],
    permit:true,permitNote:"DLSE work permit required for ALL minors under 18"
  },
  CO:{a14:[...B14,"Work permit required (under 16)"],a15:["Same rules as age 14","Work permit required"],a16:[...B16,"Work permit required"],a17:["Same as age 16","Work permit recommended"],permit:true,permitNote:"Required under 16"},
  CT:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Work permit required for all minors under 18"},
  DE:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Work permit required under 18"},
  FL:{
    a14:["3hrs/school day","15hrs/school wk (FL — stricter than FLSA)","8hrs/non-school day","40hrs/non-school wk","7am–7pm (9pm Jun 1–Labor Day)","Work permit required"],
    a15:["Same rules as age 14","Work permit required"],
    a16:["8hrs/day","30hrs/school wk","40hrs/non-school wk","Until 11pm (school nights)","Until 1am (non-school nights)","Work permit required"],
    a17:["Same rules as age 16","Work permit required"],
    permit:true,permitNote:"Work permit required under 18 — FL Dept of Business & Professional Regulation"
  },
  GA:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required — follows FLSA"},
  HI:{a14:[...B14,"Work permit required"],a15:["Same rules as age 14","Work permit required"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Required under 16"},
  ID:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  IL:{
    a14:[...B14,"Employment certificate required","7am–7pm school days (9pm non-school)"],
    a15:["Same rules as age 14","Employment certificate required"],
    a16:[...B16,"Employment certificate required"],
    a17:["Same as age 16","Employment certificate required"],
    permit:true,permitNote:"Employment certificate (work permit) required for all minors under 16; encouraged under 18"
  },
  IN:{
    a14:[...B14,"Youth subminimum $4.25/hr allowed (first 90 days)"],
    a15:["Same rules as age 14","Youth subminimum $4.25/hr allowed"],
    a16:B16,
    a17:["Same as age 16"],
    permit:false,permitNote:"None required"
  },
  IA:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"Employment certificate recommended; not legally required"},
  KS:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  KY:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  LA:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  ME:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Work permit required for all minors"},
  MD:{
    a14:[...B14,"Work permit required (under 16)"],
    a15:["Same rules as age 14","Work permit required"],
    a16:[...B16,"Work permit required"],
    a17:["Same as age 16","Work permit required"],
    permit:true,permitNote:"Required under 18"
  },
  MA:{
    a14:["3hrs/school day","18hrs/school wk","8hrs/non-school day","40hrs/non-school wk","Until 9pm (school year)","Until 9pm Jun 1–Labor Day","Working papers required"],
    a15:["Same rules as age 14","Working papers required"],
    a16:["9hrs/day","48hrs/wk during school","Until 10pm Sun–Thu (school year)","Until 11:30pm Fri–Sat","Working papers required"],
    a17:["Same rules as age 16","Working papers required"],
    permit:true,permitNote:"Working papers required for all minors under 18"
  },
  MI:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Work permit required under 18"},
  MN:{a14:[...B14,"Work permit required (under 16)"],a15:["Same rules as age 14","Work permit required"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Required under 16"},
  MS:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  MO:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  MT:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  NE:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  NV:{
    a14:[...B14,"Work permit required (under 17)"],
    a15:["Same rules as age 14","Work permit required"],
    a16:[...B16,"Work permit required"],
    a17:["No hour restrictions","Work permit required","No hazardous work"],
    permit:true,permitNote:"Required under 17"
  },
  NH:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  NJ:{
    a14:["3hrs/school day","18hrs/school wk","8hrs/non-school day","40hrs/non-school wk","Until 7pm school days","Until 9pm non-school days","Work permit required"],
    a15:["Same rules as age 14","Work permit required"],
    a16:["6hrs/school day","40hrs/school wk","8hrs/non-school day","48hrs/non-school wk","Until 11pm (10pm school nights)","Work permit required"],
    a17:["8hrs/day","40hrs/school wk","50hrs/non-school wk","Until midnight","Work permit required"],
    permit:true,permitNote:"Working papers required for all minors under 18"
  },
  NM:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  NY:{
    a14:["3hrs/school day","18hrs/school wk","8hrs/non-school day","40hrs/non-school wk","Until 7pm (9pm Jun 21–Labor Day)","Working papers required"],
    a15:["Same rules as age 14","Working papers required"],
    a16:["4hrs/school day","28hrs/school wk","8hrs/non-school day","48hrs/non-school wk","Until 10pm (midnight w/ parent consent)","Working papers required"],
    a17:["8hrs/day","28hrs/school wk","48hrs/non-school wk","Until midnight","Working papers required"],
    permit:true,permitNote:"Working papers (employment certificate) required under 18"
  },
  NC:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  ND:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  OH:{
    a14:[...B14,"Work permit required"],
    a15:["Same rules as age 14","Work permit required"],
    a16:[...B16,"Work permit required"],
    a17:["Same as age 16","Work permit required"],
    permit:true,permitNote:"Required under 18"
  },
  OK:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  OR:{
    a14:[...B14,"Work permit required","No work during school hours"],
    a15:["Same rules as age 14","Work permit required"],
    a16:[...B16,"Until 10pm school nights","Work permit required"],
    a17:["Same as age 16","Work permit required"],
    permit:true,permitNote:"Work permit required under 18"
  },
  PA:{
    a14:["3hrs/school day","18hrs/school wk","8hrs/non-school day","40hrs/non-school wk","Until 7pm school days","Work permit required"],
    a15:["Same rules as age 14","Work permit required"],
    a16:["8hrs/day","28hrs/school wk","48hrs/non-school wk","Until 12am (Fri–Sat & non-school nights)","Work permit required"],
    a17:["8hrs/day","28hrs/school wk","48hrs/non-school wk","Until 12am","Work permit required"],
    permit:true,permitNote:"PA Child Labor Act strictly enforced; work permit required"
  },
  RI:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Work permit required"},
  SC:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  SD:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  TN:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  TX:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  UT:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  VT:{a14:[...B14,"Work permit required (under 16)"],a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Required under 16"},
  VA:{
    a14:[...B14,"Work permit required (under 16)"],
    a15:["Same rules as age 14","Work permit required"],
    a16:[...B16,"Work permit required"],
    a17:["Same as age 16","Work permit required"],
    permit:true,permitNote:"Required under 16"
  },
  WA:{
    a14:["3hrs/school day","16hrs/school wk (WA — stricter than FLSA)","8hrs/non-school day","40hrs/non-school wk","7am–7pm (9pm Jun 1–Labor Day)","Work permit required"],
    a15:["Same rules as age 14","Work permit required"],
    a16:["4hrs/school day","20hrs/school wk","8hrs/non-school day","48hrs/non-school wk","Until 10pm (school nights)","Until midnight (non-school nights)","Work permit required"],
    a17:["Same rules as age 16","Work permit required"],
    permit:true,permitNote:"Work permit required under 18; L&I strictly enforces"
  },
  WV:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  WI:{a14:[...B14,"Work permit required (under 16)"],a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Required under 16"},
  WY:{a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
};

const UPCOMING = [
  {cat:"Min Wage",j:"Florida",title:"Minimum Wage → $15.00 / Tipped → $11.98",eff:"Sep 30, 2026",yr:2026,detail:"Florida Amendment 2 annual step. Tipped minimum rises to $11.98/hr simultaneously. Update POS and payroll before Aug 2026.",impact:"high",src:"https://floridajobs.org/workforce-board-resources/policy-and-technical-assistance/labor-laws"},
  {cat:"Min Wage",j:"Alaska",title:"Minimum Wage → $14.00",eff:"Jul 1, 2026",yr:2026,detail:"Per 2024 Measure 1. No tip credit — full $14.00 required for all employees. Paid sick leave for all employers also in effect since Jul 2025.",impact:"medium",src:"https://labor.alaska.gov/lss/whhome.htm"},
  {cat:"Min Wage",j:"Oregon",title:"Statewide → $15.50 / Portland Metro → $16.80 / Non-Urban → $14.20",eff:"Jul 1, 2026",yr:2026,detail:"Annual three-tier increase. No tip credit — full rate required. Update payroll before Jun 30 pay cycle.",impact:"high",src:"https://www.oregon.gov/boli/workers/Pages/minimum-wage.aspx"},
  {cat:"Min Wage",j:"Connecticut",title:"Minimum Wage → $17.00",eff:"Jan 1, 2027",yr:2027,detail:"Multi-year staircase reaches $17.00. Tipped wage adjusts proportionally. Update payroll models before Q4 2026.",impact:"medium",src:"https://www.ctdol.state.ct.us/wgwkstnd/wage-hour.htm"},
  {cat:"Min Wage",j:"Colorado",title:"Minimum Wage → ~$15+ (CPI-indexed)",eff:"Jan 1, 2027",yr:2027,detail:"Annual COMPS Order CPI adjustment expected to push minimum above $15. Denver local rate increases proportionally. Updated COMPS Order published each October.",impact:"medium",src:"https://cdle.colorado.gov/wages"},
  {cat:"Min Wage",j:"Washington",title:"Minimum Wage → ~$17.00+ (CPI-indexed)",eff:"Jan 1, 2027",yr:2027,detail:"Annual CPI increase. Seattle, Tukwila ($21+), SeaTac local rates all rise further. No tip credit statewide.",impact:"high",src:"https://lni.wa.gov/workers-rights/wages/minimum-wage/"},
  {cat:"Min Wage",j:"New Jersey",title:"Minimum Wage → ~$16.00 (CPI-indexed)",eff:"Jan 1, 2027",yr:2027,detail:"Annual CPI adjustment. Small/seasonal employer subrate also adjusts. Final rate announced each October by NJ DOL.",impact:"medium",src:"https://www.nj.gov/labor/wageandhour/"},
  {cat:"Min Wage",j:"Maine",title:"Minimum Wage → ~$15+ (CPI-indexed)",eff:"Jan 1, 2027",yr:2027,detail:"Annual CPI adjustment. Portland local rate exceeds $15.50. Tipped rate remains 50% of standard MW.",impact:"medium",src:"https://www.maine.gov/labor/labor_laws/"},
  {cat:"Tipped Wage",j:"Michigan",title:"Tip Credit Phase-Out — Continues Annually to 2031",eff:"Feb 2026",yr:2026,detail:"Michigan Supreme Court-ordered phase-out advances in Feb 2026. Full MW parity required by 2031. Average tipped-to-MW gap currently ~$8.55. Model annual cost impact and update payroll each February.",impact:"high",src:"https://www.michigan.gov/leo/bureaus-agencies/ors/wage-and-hour"},
  {cat:"Tipped Wage",j:"Federal (Congress)",title:"WAGES Act — Federal Tip Credit Elimination Bill",eff:"Pending — 2026 Congress",yr:2026,detail:"Proposes phasing out the federal $2.13 tipped minimum over 5 years. No Senate majority as of March 2026. If passed, impacts all 43 states using tip credit. Estimated annual cost: $2,000–$5,000 per tipped employee.",impact:"critical",src:"https://www.congress.gov/"},
  {cat:"Sick Leave",j:"Missouri",title:"Proposition A — New Statewide Paid Sick Leave",eff:"Jan 1, 2026",yr:2026,detail:"15+ employees: 1hr/30hrs up to 56hrs/yr. Under 15: 1hr/30hrs up to 48hrs/yr. Active enforcement began Jan 2026. New accrual tracking and recordkeeping required.",impact:"high",src:"https://labor.mo.gov/DLS/MinimumWage"},
  {cat:"Sick Leave",j:"Michigan",title:"ESTA Expanded to ALL Employers",eff:"Feb 2025 (Active Enforcement 2026)",yr:2026,detail:"Earned Sick Time Act now covers all employer sizes. 1hr/30hrs up to 72hrs/yr (large) / 40hrs/yr (small). WHD enforcement increasing in 2026.",impact:"high",src:"https://www.michigan.gov/leo/bureaus-agencies/ors/wage-and-hour"},
  {cat:"Sick Leave",j:"California",title:"AB 406 — Safe Time Leave Expansion",eff:"Jan 1, 2026",yr:2026,detail:"Expands 'safe time' under CA PSL to cover additional domestic violence, sexual assault, and stalking protections. Update employee handbooks and leave policy documentation.",impact:"medium",src:"https://www.dir.ca.gov/dlse/"},
  {cat:"Sick Leave",j:"Nebraska",title:"Proposition 436 — New Statewide Sick Leave",eff:"Jan 1, 2025 (Active 2026)",yr:2026,detail:"All employers: paid sick leave 1hr/30hrs. Ongoing enforcement and employee awareness campaigns in 2026.",impact:"medium",src:"https://labor.nebraska.gov/"},
  {cat:"Scheduling",j:"New York State",title:"Potential Statewide Fair Workweek Expansion",eff:"Pending 2026–2027",yr:2026,detail:"Legislature considering expanding NYC Fair Workweek rules statewide to all fast food and restaurant employers — 14-day advance notice, call-in pay, and schedule change premiums for all NY locations.",impact:"high",src:"https://www.nysenate.gov/legislation"},
  {cat:"Scheduling",j:"Chicago, IL",title:"Fair Workweek — Employer Threshold Reduction Proposed",eff:"Proposed 2026",yr:2026,detail:"Chicago considering lowering Fair Workweek threshold from 100 employees to 50. Would extend 14-day notice and premium pay to many more mid-size restaurant groups.",impact:"medium",src:"https://www.chicago.gov/city/en/depts/dol/provdrs/labor-standards.html"},
  {cat:"Scheduling",j:"Seattle, WA",title:"Secure Scheduling — Delivery Platform Expansion",eff:"2026",yr:2026,detail:"Seattle expanding Secure Scheduling to third-party delivery platform workers at restaurant locations. Restaurants may face new notification and record obligations.",impact:"medium",src:"https://www.seattle.gov/laborstandards"},
  {cat:"Minor Labor",j:"Federal (DOL)",title:"Increased Civil Penalties — Child Labor Enforcement Surge",eff:"2026 (ongoing)",yr:2026,detail:"DOL WHD enforcement budget increased significantly. Max civil penalty now $71,818 per willful minor violation. Restaurant industry #1 targeted sector: kitchen equipment, delivery routes, late-night hours for 14–17 year olds.",impact:"critical",src:"https://www.dol.gov/agencies/whd/child-labor"},
  {cat:"Minor Labor",j:"California",title:"DLSE — Enhanced QSR Minor Labor Audits",eff:"2026",yr:2026,detail:"DLSE increasing random audits of QSR employers for minor work permit compliance, hours violations, and prohibited equipment. Penalties doubled for repeat violations.",impact:"medium",src:"https://www.dir.ca.gov/dlse/DLSE_Minors.html"},
  {cat:"Overtime",j:"Federal (DOL)",title:"New OT Salary Threshold Rulemaking — Expected 2026–2027",eff:"2026–2027",yr:2026,detail:"After $58,656 threshold was vacated, new rulemaking expected. Likely range $43,000–$55,000. Restaurant managers, shift leads, and assistant managers at risk of reclassification. Audit exempt employee salaries now.",impact:"high",src:"https://www.dol.gov/agencies/whd/overtime"},
  {cat:"Overtime",j:"Minnesota",title:"OT Threshold — Proposal to Reduce from 48hrs to 40hrs",eff:"Pending 2026–2027",yr:2027,detail:"Legislature considering aligning MN OT threshold with federal 40hr standard (currently 48hrs). If passed, significantly increases OT costs for MN restaurant operators.",impact:"high",src:"https://www.dli.mn.gov/business/employment-practices/minimum-wage-minnesota"},
  {cat:"Break Laws",j:"Federal (DOL)",title:"PUMP Act — Nursing Break Enforcement Expansion",eff:"2026 (ongoing)",yr:2026,detail:"PUMP for Nursing Mothers Act enforcement expanding. Restaurants must provide private, non-restroom lactation space. No employer size exemption. Breaks under 20 min are paid time.",impact:"medium",src:"https://www.dol.gov/agencies/whd/nursing-mothers"},
  {cat:"Break Laws",j:"Oregon",title:"BOLI — Digital Break Waiver Recordkeeping Requirement",eff:"Jul 1, 2026",yr:2026,detail:"Oregon BOLI requiring digital recordkeeping of all meal break waivers and premium pay events for employers with 10+ locations. Paper waivers no longer accepted during audits.",impact:"medium",src:"https://www.oregon.gov/boli/workers/Pages/meal-and-rest-periods.aspx"},
  {cat:"Restaurant-Specific",j:"California",title:"FAST Recovery Act — Fast Food Council Activity Ongoing",eff:"2026 (ongoing)",yr:2026,detail:"California Fast Food Council continues quarterly meetings with authority to set industry-wide standards beyond $20/hr minimum — including scheduling, training, safety equipment, and enhanced break rules for QSR chains (60+ locations).",impact:"high",src:"https://www.dir.ca.gov/dlse/fast-food-council.html"},
  {cat:"Restaurant-Specific",j:"New York City",title:"App-Based Delivery Worker Minimum Pay Expansion",eff:"2026",yr:2026,detail:"NYC expanding delivery worker minimum pay rate (CPI-adjusted 2026). May extend to restaurant-employed in-house delivery staff. Monitor NYC DCA rulemaking closely.",impact:"medium",src:"https://www.nyc.gov/site/dca/workers/delivery-workers.page"},
  {cat:"Restaurant-Specific",j:"Federal (Congress)",title:"Raise the Wage Act — Federal Minimum to $17 by 2028",eff:"Pending 2026–2027",yr:2027,detail:"Phases federal minimum to $17/hr by 2028, tip credit phased out over 7 years. No current Senate majority. Restaurant industry identified as #1 most-impacted sector.",impact:"critical",src:"https://www.congress.gov/"},
  {cat:"Restaurant-Specific",j:"Federal (FTC)",title:"FTC Scrutiny of AI-Driven Scheduling Tools",eff:"2026–2027",yr:2026,detail:"FTC guidance warns AI scheduling tools may suppress hours and wages. Operators using algorithmic scheduling should audit for Fair Workweek and anti-retaliation compliance.",impact:"medium",src:"https://www.ftc.gov/business-guidance/blog"},
  {cat:"Restaurant-Specific",j:"Federal (DOL)",title:"Joint Employer Standard — Potential Rule Reversal",eff:"2026–2027",yr:2027,detail:"Current administration may revisit joint employer standard. If reversed, franchisors could be held liable for franchisee labor violations — large-scale cost and litigation exposure for franchise systems.",impact:"high",src:"https://www.dol.gov/agencies/whd/flsa"},
];

const CAT_COLORS = {
  "Min Wage":{c:"#7c3aed",bg:"rgba(124,58,237,.08)"},
  "Tipped Wage":{c:"#0284c7",bg:"rgba(2,132,199,.08)"},
  "Sick Leave":{c:"#16a34a",bg:"rgba(22,163,74,.08)"},
  "Scheduling":{c:"#6366f1",bg:"rgba(99,102,241,.08)"},
  "Minor Labor":{c:"#dc2626",bg:"rgba(220,38,38,.08)"},
  "Overtime":{c:"#d97706",bg:"rgba(217,119,6,.08)"},
  "Break Laws":{c:"#b45309",bg:"rgba(180,83,9,.08)"},
  "Restaurant-Specific":{c:"#db2777",bg:"rgba(219,39,119,.08)"},
};

const TABS = ["Overview","Min Wage","Tipped Wage","Minor Laws","Break Laws","Overtime","Scheduling","Federal Updates","Upcoming Changes"];

async function fetchLatestChanges(onChunk) {
  const prompt = `You are a labor law compliance expert for the US restaurant industry. Today is March 2026.

Search the web for the LATEST confirmed and proposed labor law changes for 2026 and 2027 that impact the restaurant industry. Focus on:
- Minimum wage increases (state and federal)
- Tipped wage / tip credit changes
- Paid sick leave new laws or expansions
- Minor / child labor law updates or enforcement changes
- Break law changes
- Overtime rule changes
- Fair Workweek / predictive scheduling laws
- Restaurant-specific legislation (e.g. Fast Food councils, delivery worker laws)
- Federal bills (Raise the Wage Act, WAGES Act, etc.)

Return a JSON array (no markdown, no explanation, raw JSON only) of objects. Each object must have exactly these fields:
{
  "cat": one of ["Min Wage","Tipped Wage","Sick Leave","Minor Labor","Break Laws","Overtime","Scheduling","Restaurant-Specific"],
  "j": jurisdiction (state name, city, or "Federal (DOL)" / "Federal (Congress)"),
  "title": short descriptive title (max 80 chars),
  "eff": effective date or "Pending YYYY" if not yet law,
  "yr": 2026 or 2027 (integer),
  "detail": 2-3 sentence explanation of what changed and what operators must do,
  "impact": one of ["critical","high","medium","low"],
  "src": official government URL (dol.gov, state labor dept, congress.gov, etc.)
}

Return 20-30 items. Only include items relevant to restaurants. Prioritize confirmed laws over speculation. Raw JSON array only — no other text.`;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514",
      max_tokens:4000,
      stream:true,
      tools:[{type:"web_search_20250305",name:"web_search"}],
      messages:[{role:"user",content:prompt}]
    })
  });

  if(!resp.ok) throw new Error(`API error: ${resp.status}`);

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let searchCount = 0;

  while(true) {
    const {done,value} = await reader.read();
    if(done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");
    for(const line of lines) {
      if(!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if(data==="[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if(ev.type==="content_block_start" && ev.content_block?.type==="tool_use" && ev.content_block?.name==="web_search") {
          searchCount++;
          onChunk({type:"search", count:searchCount});
        }
        if(ev.type==="content_block_delta" && ev.delta?.type==="text_delta") {
          fullText += ev.delta.text;
          onChunk({type:"text", text:fullText});
        }
      } catch(e){}
    }
  }
  return fullText;
}

function AgeCell({rules,bg}) {
  return (
    <td style={{padding:"7px 9px",borderBottom:"1px solid #f1f5f9",verticalAlign:"top",background:bg,minWidth:160,maxWidth:200}}>
      {(rules||[]).map((r,i)=>(
        <div key={i} style={{display:"flex",gap:4,marginBottom:2,alignItems:"flex-start"}}>
          <span style={{color:"#a5b4fc",flexShrink:0,fontSize:9,marginTop:2}}>▸</span>
          <span style={{fontSize:10,color:"#334155",lineHeight:1.4}}>{r}</span>
        </div>
      ))}
    </td>
  );
}

function StateModal({st, onClose}) {
  const m = MINOR_AGES[st.a] || {};
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:14,maxWidth:680,width:"100%",maxHeight:"88vh",overflowY:"auto",padding:28,boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontSize:22,fontWeight:800}}>{st.s} <span style={{color:"#94a3b8",fontWeight:400,fontSize:16}}>({st.a})</span></div>
            <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
              <Pill r={st.r} t={st.r.toUpperCase()+" RISK"}/>
              <SrcLink url={st.src} label="Official State Source"/>
            </div>
          </div>
          <button onClick={onClose} style={{border:"none",background:"#f1f5f9",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:14,flexShrink:0}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[["Min Wage",`$${st.mw.toFixed(2)}/hr`],["OT Rule",st.ot],["Tipped Rate",typeof st.tip==="number"?`$${st.tip.toFixed(2)}/hr`:st.tip],["Tip Credit",st.tc==="None"?"None":(typeof st.tc==="number"?`$${st.tc.toFixed(2)}`:"N/A")],["Paid Sick Leave",st.sl?"Required":"None"],["Fair Scheduling",st.sch?"Active":"None"]].map(([k,v])=>(
            <div key={k} style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{k}</div>
              <div style={{fontSize:13,fontWeight:700}}>{v}</div>
            </div>
          ))}
        </div>
        {st.chg && <div style={{background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:8,padding:"10px 14px",marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:"#dc2626",marginBottom:3}}>⚠ UPCOMING CHANGE</div><div style={{fontSize:12,color:"#7f1d1d"}}>{st.cd}: Min wage → <strong>${st.nr?.toFixed(2)}/hr</strong></div></div>}
        {st.local && st.local!=="None" && <div style={{background:"rgba(99,102,241,.06)",border:"1px solid rgba(99,102,241,.2)",borderRadius:8,padding:"10px 14px",marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:"#6366f1",marginBottom:3}}>LOCAL RATES</div><div style={{fontSize:12,color:"#312e81"}}>{st.local}</div></div>}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",marginBottom:8}}>Key Compliance Requirements</div>
          {st.laws.map((l,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:12,color:"#334155"}}><span style={{color:"#6366f1",flexShrink:0}}>•</span>{l}</div>)}
        </div>
        {m.a14 && (
          <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"12px 14px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:"#92400e",textTransform:"uppercase",marginBottom:8}}>Minor Labor — Age-Specific Rules</div>
            {m.permitNote && <div style={{fontSize:11,color:"#b45309",fontWeight:600,marginBottom:8}}>Work Permit: {m.permitNote}</div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["Age 14",m.a14,"#fef9c3"],["Age 15",m.a15,"#fef3c7"],["Age 16",m.a16,"#f0fdf4"],["Age 17",m.a17,"#dcfce7"]].map(([label,rules,bg])=>(
                <div key={label} style={{background:bg,borderRadius:6,padding:"8px 10px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#374151",marginBottom:4,textTransform:"uppercase"}}>{label}</div>
                  {(rules||[]).map((r,i)=><div key={i} style={{fontSize:10,color:"#334155",marginBottom:2,lineHeight:1.4}}>▸ {r}</div>)}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{background:"#fefce8",border:"1px solid #fde68a",borderRadius:8,padding:"10px 14px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"#92400e",textTransform:"uppercase",marginBottom:6}}>Break Laws</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:6}}>
            <div><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>Rest Break</div><div style={{fontSize:12,fontWeight:600}}>{st.brk.rest}</div></div>
            <div><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>Meal Break</div><div style={{fontSize:12,fontWeight:600}}>{st.brk.meal}</div></div>
          </div>
          <div style={{marginBottom:4}}><span style={{fontSize:10,color:"#92400e",fontWeight:700,textTransform:"uppercase"}}>Premium Pay: </span><span style={{fontSize:12}}>{st.brk.premium}</span></div>
          <div style={{fontSize:11,color:"#78350f",fontStyle:"italic"}}>{st.brk.mealNote}</div>
        </div>
        <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 14px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",marginBottom:4}}>Overtime</div>
          <div style={{fontSize:12,color:"#334155"}}>{st.otNote}</div>
        </div>
        {st.sl && <div style={{fontSize:12,color:"#475569",marginBottom:6}}><strong>Sick Leave Detail:</strong> {st.slN}</div>}
        {st.sch && <div style={{fontSize:12,color:"#475569"}}><strong>Scheduling Detail:</strong> {st.schN}</div>}
      </div>
    </div>
  );
}

function ListModal({title,desc,states,onSelect,onClose}) {
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.6)",zIndex:1500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:14,maxWidth:640,width:"100%",maxHeight:"82vh",overflowY:"auto",padding:24,boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div style={{fontSize:18,fontWeight:800}}>{title}</div>
          <button onClick={onClose} style={{border:"none",background:"#f1f5f9",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:14,flexShrink:0}}>✕</button>
        </div>
        {desc && <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>{desc}</div>}
        {states.map(st=>(
          <div key={st.a} onClick={()=>onSelect(st)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderBottom:"1px solid #f1f5f9",cursor:"pointer",borderRadius:8}}
            onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
            <div><span style={{fontWeight:700,fontSize:13}}>{st.s}</span><span style={{color:"#94a3b8",fontSize:11,marginLeft:8}}>{st.a}</span><span style={{color:"#64748b",fontSize:11,marginLeft:8}}>${st.mw.toFixed(2)}/hr</span></div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>{st.chg&&<Bdg t={`→$${st.nr?.toFixed(2)}`} c="#7c3aed" bg="rgba(124,58,237,.07)"/>}<Pill r={st.r} t={st.r.toUpperCase()}/><span style={{color:"#94a3b8",fontSize:11}}>›</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);
  const [stateModal, setStateModal] = useState(null);
  const [listModal, setListModal] = useState(null);
  const [search, setSearch] = useState("");
  const [rFilter, setRFilter] = useState("all");
  const [upYr, setUpYr] = useState("all");
  const [upCat, setUpCat] = useState("all");
  const [upcomingData, setUpcomingData] = useState(UPCOMING);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // {msg, type: 'info'|'success'|'error'}
  const [lastSynced, setLastSynced] = useState(null);

  const filtered = useMemo(()=>STATES.filter(s=>(rFilter==="all"||s.r===rFilter)&&(s.s.toLowerCase().includes(search.toLowerCase())||s.a.toLowerCase().includes(search.toLowerCase()))),[search,rFilter]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus({msg:"Connecting to web search...", type:"info"});
    try {
      let searchesDone = 0;
      const raw = await fetchLatestChanges(({type, count, text}) => {
        if(type==="search") {
          searchesDone = count;
          setSyncStatus({msg:`🔍 Searching the web... (${count} quer${count===1?"y":"ies"} completed)`, type:"info"});
        } else if(type==="text") {
          setSyncStatus({msg:`📥 Receiving latest data...`, type:"info"});
        }
      });
      // Extract JSON
      const match = raw.match(/\[[\s\S]*\]/);
      if(!match) throw new Error("No JSON array found in response");
      const parsed = JSON.parse(match[0]);
      const valid = parsed.filter(u=>
        u.cat && u.j && u.title && u.eff && u.yr && u.detail && u.impact && u.src
        && ["Min Wage","Tipped Wage","Sick Leave","Minor Labor","Break Laws","Overtime","Scheduling","Restaurant-Specific"].includes(u.cat)
        && [2026,2027].includes(Number(u.yr))
      ).map(u=>({...u, yr:Number(u.yr)}));
      if(valid.length===0) throw new Error("No valid items returned");
      setUpcomingData(valid);
      setLastSynced(new Date());
      setSyncStatus({msg:`✅ Synced ${valid.length} items from ${searchesDone} web searches`, type:"success"});
      setTab(8);
      setTimeout(()=>setSyncStatus(null), 5000);
    } catch(err) {
      setSyncStatus({msg:`❌ Sync failed: ${err.message}`, type:"error"});
      setTimeout(()=>setSyncStatus(null), 6000);
    } finally {
      setSyncing(false);
    }
  };
  const filteredUp = useMemo(()=>UPCOMING.filter(u=>(upYr==="all"||String(u.yr)===upYr)&&(upCat==="all"||u.cat===upCat)),[upYr,upCat]);

  const highRisk=STATES.filter(s=>s.r==="high");
  const medRisk=STATES.filter(s=>s.r==="medium");
  const upcoming=STATES.filter(s=>s.chg);
  const noTipCredit=STATES.filter(s=>s.tc==="None");
  const hasSL=STATES.filter(s=>s.sl);
  const dailyOT=STATES.filter(s=>s.otD);
  const hasBreakLaws=STATES.filter(s=>!s.brk.rest.includes("FLSA only")&&!s.brk.meal.includes("FLSA only"));
  const hasPremium=STATES.filter(s=>s.brk.premium!=="None");

  const openList=(title,desc,states)=>setListModal({title,desc,states});
  const openState=st=>{setListModal(null);setStateModal(st);};
  const inpStyle={padding:"7px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12,outline:"none"};
  const btnF=(val,label)=><button onClick={()=>setRFilter(val)} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",background:rFilter===val?"#6366f1":"#fff",color:rFilter===val?"#fff":"#64748b"}}>{label}</button>;

  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",color:"#0f172a",minHeight:"100vh",background:"#f1f5f9"}}>
      {stateModal && <StateModal st={stateModal} onClose={()=>setStateModal(null)}/>}
      {listModal && !stateModal && <ListModal title={listModal.title} desc={listModal.desc} states={listModal.states} onSelect={openState} onClose={()=>setListModal(null)}/>}

      <div style={{background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)",padding:"20px 24px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:18}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:"#fff"}}>🏢 Labor Compliance Dashboard</div>
            <div style={{color:"rgba(255,255,255,.6)",fontSize:12,marginTop:3}}>
              Restaurant Industry · 50-State Tracker · March 2026
              {lastSynced && <span style={{marginLeft:10,color:"rgba(165,243,252,.7)"}}>· Last synced {lastSynced.toLocaleTimeString()}</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{background:"rgba(220,38,38,.25)",color:"#fca5a5",border:"1px solid rgba(220,38,38,.4)",borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:700}}>{highRisk.length} High Risk States</span>
            <span style={{background:"rgba(217,119,6,.2)",color:"#fcd34d",border:"1px solid rgba(217,119,6,.3)",borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:700}}>{upcoming.length} Wage Changes 2026</span>
            {/* SYNC BUTTON */}
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                display:"flex",alignItems:"center",gap:7,
                background:syncing?"rgba(99,102,241,.3)":"rgba(255,255,255,.12)",
                color:syncing?"rgba(255,255,255,.5)":"#fff",
                border:"1.5px solid rgba(255,255,255,.3)",
                borderRadius:8,padding:"6px 16px",
                fontSize:12,fontWeight:700,cursor:syncing?"not-allowed":"pointer",
                transition:"all .2s"
              }}
              onMouseEnter={e=>{if(!syncing)e.currentTarget.style.background="rgba(255,255,255,.22)"}}
              onMouseLeave={e=>{if(!syncing)e.currentTarget.style.background="rgba(255,255,255,.12)"}}
            >
              <span style={{display:"inline-block",animation:syncing?"spin 1s linear infinite":"none",fontSize:14}}>
                {syncing ? "⟳" : "↻"}
              </span>
              {syncing ? "Syncing..." : "Sync Latest"}
            </button>
          </div>
        </div>

        {/* Sync status bar */}
        {syncStatus && (
          <div style={{
            margin:"0 0 12px",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:600,
            background: syncStatus.type==="success"?"rgba(22,163,74,.2)":syncStatus.type==="error"?"rgba(220,38,38,.2)":"rgba(99,102,241,.2)",
            color: syncStatus.type==="success"?"#86efac":syncStatus.type==="error"?"#fca5a5":"#c7d2fe",
            border: `1px solid ${syncStatus.type==="success"?"rgba(22,163,74,.4)":syncStatus.type==="error"?"rgba(220,38,38,.4)":"rgba(99,102,241,.4)"}`,
            display:"flex",alignItems:"center",gap:8
          }}>
            {syncStatus.type==="info" && <span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>⟳</span>}
            {syncStatus.msg}
          </div>
        )}

        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <div style={{display:"flex",gap:0,overflowX:"auto"}}>
          {TABS.map((t,i)=><button key={i} onClick={()=>setTab(i)} style={{border:"none",background:"none",padding:"9px 13px",whiteSpace:"nowrap",borderBottom:tab===i?"3px solid #a5b4fc":"3px solid transparent",color:tab===i?"#a5b4fc":"rgba(255,255,255,.55)",fontWeight:600,fontSize:11,cursor:"pointer"}}>{t}</button>)}
        </div>
      </div>

      <div style={{padding:20,maxWidth:1400,margin:"0 auto"}}>

        {/* OVERVIEW */}
        {tab===0 && (
          <div>
            <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
              <KPI label="High Risk States" value={highRisk.length} sub="Immediate audit needed" color="#dc2626" onClick={()=>openList("High Risk States","States with complex, multi-layered compliance requirements.",highRisk)}/>
              <KPI label="Medium Risk" value={medRisk.length} sub="Monitor closely" color="#d97706" onClick={()=>openList("Medium Risk States","States with active wage increases, sick leave mandates, or notable local rates.",medRisk)}/>
              <KPI label="2026 Wage Changes" value={upcoming.length} sub="Pending increases" color="#7c3aed" onClick={()=>openList("States with 2026 Wage Changes","All states with minimum wage increases scheduled in 2026.",upcoming)}/>
              <KPI label="No Tip Credit" value={noTipCredit.length} sub="Full MW required" color="#0284c7" onClick={()=>openList("No Tip Credit States","States where tip credit is not allowed — full MW required for all tipped employees.",noTipCredit)}/>
              <KPI label="Sick Leave Laws" value={hasSL.length} sub="State mandates active" color="#16a34a" onClick={()=>openList("States with Sick Leave Mandates","States requiring paid sick leave including new 2025–2026 laws.",hasSL)}/>
              <KPI label="Daily OT States" value={dailyOT.length} sub="CA, AK, NV, CO" color="#dc2626" onClick={()=>openList("States with Daily Overtime","States requiring OT pay based on daily hours worked.",dailyOT)}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span style={{background:"rgba(220,38,38,.1)",color:"#dc2626",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>🔴 HIGH RISK STATES</span>
                  <span style={{fontSize:11,color:"#94a3b8"}}>Click any card for full detail</span>
                </div>
                {highRisk.map(st=>(
                  <div key={st.a} onClick={()=>setStateModal(st)} style={{background:"#fff",border:"1px solid #fecaca",borderRadius:10,padding:"12px 14px",marginBottom:10,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}
                    onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 12px rgba(220,38,38,.15)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,.05)"}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div><span style={{fontWeight:800,fontSize:15}}>{st.s}</span><span style={{color:"#94a3b8",fontSize:12,marginLeft:6}}>{st.a}</span></div>
                      <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:15}}>${st.mw.toFixed(2)}<span style={{fontWeight:400,fontSize:11,color:"#94a3b8"}}>/hr</span></div>{st.chg&&<div style={{fontSize:10,color:"#dc2626",fontWeight:700}}>→${st.nr?.toFixed(2)} on {st.cd}</div>}</div>
                    </div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
                      {st.tc==="None"&&<Bdg t="No Tip Credit" c="#dc2626" bg="rgba(220,38,38,.07)"/>}
                      {st.sch&&<Bdg t="Fair Scheduling" c="#7c3aed" bg="rgba(124,58,237,.07)"/>}
                      {st.sl&&<Bdg t="Sick Leave" c="#0284c7" bg="rgba(2,132,199,.07)"/>}
                      {st.otD&&<Bdg t="Daily OT" c="#d97706" bg="rgba(217,119,6,.08)"/>}
                      {st.local&&st.local!=="None"&&<Bdg t="Local Rates" c="#6366f1" bg="rgba(99,102,241,.07)"/>}
                    </div>
                    <div style={{fontSize:11,color:"#64748b"}}>{st.note}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{marginBottom:10}}><span style={{background:"rgba(124,58,237,.1)",color:"#7c3aed",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>⏰ 2026 WAGE CHANGES</span></div>
                <Card style={{padding:0,overflow:"hidden",marginBottom:16}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr><TH>State</TH><TH>Effective</TH><TH>Change</TH></tr></thead>
                    <tbody>
                      {upcoming.map(st=>(
                        <tr key={st.a} onClick={()=>setStateModal(st)} style={{cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                          <TD><strong>{st.s}</strong></TD>
                          <TD style={{color:"#94a3b8",fontSize:11}}>{st.cd}</TD>
                          <TD style={{fontWeight:700,color:"#7c3aed",whiteSpace:"nowrap"}}>${st.mw.toFixed(2)} → ${st.nr?.toFixed(2)}</TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
                <div style={{marginBottom:10}}><span style={{background:"rgba(220,38,38,.1)",color:"#dc2626",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>⚖️ RECENT ENFORCEMENT</span></div>
                {CASES.slice(0,3).map((c,i)=>(
                  <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",marginBottom:10,boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                      <div style={{fontWeight:700,fontSize:13}}>{c.co} <span style={{color:"#94a3b8",fontWeight:400,fontSize:11}}>({c.yr})</span></div>
                      <div style={{fontWeight:800,color:"#dc2626",fontSize:13,flexShrink:0,marginLeft:8}}>{c.pen}</div>
                    </div>
                    <div style={{display:"flex",gap:6,marginBottom:5}}><Bdg t={c.type}/><Pill r={c.sev} t={c.sev.toUpperCase()}/></div>
                    <div style={{fontSize:11,color:"#64748b",lineHeight:1.5}}>{c.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MIN WAGE */}
        {tab===1 && (
          <div>
            <Tip>💡 Click any state row for full compliance details including age-specific minor rules, break laws, OT, and sick leave.</Tip>
            <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
              <input style={{...inpStyle,minWidth:180}} placeholder="Search state..." value={search} onChange={e=>setSearch(e.target.value)}/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{btnF("all","All")}{btnF("high","High Risk")}{btnF("medium","Medium")}{btnF("low","Low Risk")}</div>
            </div>
            <Card style={{padding:0,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{["State","Min Wage","Tipped Rate","Tip Credit","OT Rule","Upcoming Change","Local Rates","Risk","Source"].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {filtered.map(st=>(
                    <tr key={st.a} onClick={()=>setStateModal(st)} style={{cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                      <TD><strong>{st.s}</strong> <span style={{color:"#94a3b8",fontSize:10}}>{st.a}</span></TD>
                      <TD style={{fontWeight:700}}>${st.mw.toFixed(2)}</TD>
                      <TD>{typeof st.tip==="number"?`$${st.tip.toFixed(2)}`:st.tip}</TD>
                      <TD>{st.tc==="None"?<Bdg t="None" c="#dc2626" bg="rgba(220,38,38,.07)"/>:(typeof st.tc==="number"?`$${st.tc.toFixed(2)}`:"—")}</TD>
                      <TD style={{color:"#64748b",fontSize:11}}>{st.ot}</TD>
                      <TD>{st.chg?<span style={{color:"#7c3aed",fontWeight:700,fontSize:11}}>${st.nr?.toFixed(2)} · {st.cd}</span>:<span style={{color:"#cbd5e1",fontSize:11}}>—</span>}</TD>
                      <TD style={{color:"#64748b",fontSize:11}}>{st.local&&st.local!=="None"?st.local:"—"}</TD>
                      <TD><Pill r={st.r} t={st.r.toUpperCase()}/></TD>
                      <TD><SrcLink url={st.src}/></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* TIPPED WAGE */}
        {tab===2 && (
          <div>
            <Tip>💡 80/20 Rule: tipped employees cannot spend >20% of shift on non-tipped duties. Top DOL enforcement focus. Avg back-wage finding: $1,400/employee.</Tip>
            <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <KPI label="No Tip Credit States" value={noTipCredit.length} sub="Full MW required" color="#dc2626" onClick={()=>openList("No Tip Credit States","States prohibiting tip credit.",noTipCredit)}/>
              <KPI label="Highest Tipped Rate" value="$12.75" sub="Hawaii" color="#0284c7"/>
              <KPI label="Federal Tip Credit" value="$5.12" sub="At $7.25 federal MW" color="#6366f1"/>
            </div>
            <Card style={{padding:0,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{["State","Min Wage","Tipped Cash Wage","Tip Credit","Notes","Risk","Source"].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {STATES.map(st=>(
                    <tr key={st.a} onClick={()=>setStateModal(st)} style={{cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                      <TD><strong>{st.s}</strong></TD>
                      <TD style={{fontWeight:700}}>${st.mw.toFixed(2)}</TD>
                      <TD style={{fontWeight:700,color:st.tc==="None"?"#dc2626":"#0f172a"}}>{typeof st.tip==="number"?`$${st.tip.toFixed(2)}`:st.tip}</TD>
                      <TD>{st.tc==="None"?<Bdg t="No Credit" c="#dc2626" bg="rgba(220,38,38,.07)"/>:(typeof st.tc==="number"?`$${st.tc.toFixed(2)}`:"—")}</TD>
                      <TD style={{fontSize:11,color:"#64748b",maxWidth:200}}>{st.note}</TD>
                      <TD><Pill r={st.r} t={st.r.toUpperCase()}/></TD>
                      <TD><SrcLink url={st.src}/></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* MINOR LAWS */}
        {tab===3 && (
          <div>
            <Tip>💡 Restaurant industry is the #1 DOL child labor enforcement sector. 950+ investigations in 2024. Age-specific rules vary significantly — Florida and Washington are stricter than federal for 14–15 year olds.</Tip>
            <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <KPI label="DOL Investigations" value="950+" sub="Child labor cases 2024" color="#dc2626"/>
              <KPI label="Avg Penalty" value="$15K+" sub="Per minor violation" color="#d97706"/>
              <KPI label="States Requiring Permit" value={Object.values(MINOR_AGES).filter(m=>m.permit).length} sub="Work/employment permit" color="#7c3aed"/>
            </div>

            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:13}}>Federal FLSA Baseline — All States Must Meet or Exceed</div>
                <SrcLink url="https://www.dol.gov/agencies/whd/child-labor/restaurant" label="DOL Restaurant Guide"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div style={{background:"#fef9c3",borderRadius:8,padding:"10px 14px",border:"1px solid #fde68a"}}>
                  <div style={{fontWeight:700,fontSize:11,color:"#92400e",marginBottom:6,textTransform:"uppercase"}}>Ages 14–15 Federal Limits</div>
                  {B14.map((r,i)=><div key={i} style={{fontSize:11,color:"#334155",marginBottom:3}}>▸ {r}</div>)}
                </div>
                <div style={{background:"#f0fdf4",borderRadius:8,padding:"10px 14px",border:"1px solid #bbf7d0"}}>
                  <div style={{fontWeight:700,fontSize:11,color:"#14532d",marginBottom:6,textTransform:"uppercase"}}>Ages 16–17 Federal Limits</div>
                  {B16.map((r,i)=><div key={i} style={{fontSize:11,color:"#334155",marginBottom:3}}>▸ {r}</div>)}
                  <div style={{fontSize:11,color:"#334155",marginBottom:3}}>▸ No federal hour limit for non-hazardous work</div>
                </div>
              </div>
              <div style={{marginTop:10,padding:"8px 12px",background:"#fef2f2",borderRadius:8,border:"1px solid #fecaca",fontSize:11,color:"#7f1d1d"}}>
                ⚠ Hazardous work banned under 18: meat slicers, power-driven equipment, most cooking appliances, delivery on public roads or e-bikes.
              </div>
            </Card>

            <Card style={{padding:0,overflow:"hidden"}}>
              <div style={{padding:"12px 16px",fontWeight:700,fontSize:13,borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>State-by-State Age-Specific Minor Labor Rules</span>
                <span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}>Click any row for full compliance detail · Scroll right for all columns →</span>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:1100}}>
                  <thead>
                    <tr>
                      <TH style={{minWidth:130,position:"sticky",left:0,zIndex:1}}>State</TH>
                      <TH style={{minWidth:90}}>Work Permit</TH>
                      <TH style={{minWidth:180,background:"#fef9c3",color:"#92400e"}}>Age 14</TH>
                      <TH style={{minWidth:170,background:"#fef3c7",color:"#92400e"}}>Age 15</TH>
                      <TH style={{minWidth:180,background:"#f0fdf4",color:"#14532d"}}>Age 16</TH>
                      <TH style={{minWidth:170,background:"#dcfce7",color:"#14532d"}}>Age 17</TH>
                      <TH style={{minWidth:70}}>Risk</TH>
                      <TH style={{minWidth:90}}>Source</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {STATES.map(st=>{
                      const m=MINOR_AGES[st.a]||{};
                      return (
                        <tr key={st.a} onClick={()=>setStateModal(st)} style={{cursor:"pointer"}}
                          onMouseEnter={e=>e.currentTarget.style.opacity="0.82"}
                          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                          <td style={{padding:"8px 10px",borderBottom:"1px solid #f1f5f9",verticalAlign:"top",position:"sticky",left:0,background:"#fff",zIndex:1,minWidth:130}}>
                            <div style={{fontWeight:700,fontSize:12}}>{st.s}</div>
                            <div style={{fontSize:10,color:"#94a3b8"}}>{st.a}</div>
                          </td>
                          <td style={{padding:"8px 10px",borderBottom:"1px solid #f1f5f9",verticalAlign:"top",minWidth:90}}>
                            {m.permit
                              ? <div><Bdg t="Required" c="#dc2626" bg="rgba(220,38,38,.08)"/><div style={{fontSize:9,color:"#64748b",marginTop:4,lineHeight:1.3}}>{m.permitNote}</div></div>
                              : <span style={{color:"#94a3b8",fontSize:11}}>None</span>}
                          </td>
                          <AgeCell rules={m.a14} bg="rgba(254,249,195,.4)"/>
                          <AgeCell rules={m.a15} bg="rgba(254,243,199,.3)"/>
                          <AgeCell rules={m.a16} bg="rgba(240,253,244,.5)"/>
                          <AgeCell rules={m.a17} bg="rgba(220,252,231,.4)"/>
                          <td style={{padding:"8px 10px",borderBottom:"1px solid #f1f5f9",verticalAlign:"top"}}>
                            <Pill r={st.r} t={st.r.toUpperCase()}/>
                          </td>
                          <td style={{padding:"8px 10px",borderBottom:"1px solid #f1f5f9",verticalAlign:"top"}} onClick={e=>e.stopPropagation()}>
                            <SrcLink url={st.src}/>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* BREAK LAWS */}
        {tab===4 && (
          <div>
            <Tip>💡 California is the only state with statutory premium pay (1hr at regular rate) for missed breaks. Most other states have meal break requirements but violations trigger DOL complaints or civil action.</Tip>
            <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <KPI label="States w/ Break Laws" value={hasBreakLaws.length} sub="Beyond FLSA minimum" color="#d97706" onClick={()=>openList("States with Break Requirements","States requiring meal and/or rest breaks beyond federal FLSA baseline.",hasBreakLaws)}/>
              <KPI label="Premium Pay States" value={hasPremium.length} sub="Penalty pay for violations" color="#dc2626" onClick={()=>openList("States with Break Premium Pay","States requiring extra compensation when a required break is missed.",hasPremium)}/>
              <KPI label="FLSA Baseline" value="0 req." sub="No adult break mandate federally" color="#6366f1"/>
              <KPI label="Paid Rest Rule" value="<20 min" sub="Short breaks must be paid (FLSA)" color="#16a34a"/>
            </div>
            <Card style={{background:"#fffbeb",border:"1px solid #fde68a",marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:"#92400e"}}>📋 Federal FLSA Baseline</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[["Rest Breaks","Short breaks (5–20 min) must be counted as paid work time. No minimum frequency required federally."],["Meal Breaks","Bona fide meal period (30+ min, fully relieved) need NOT be paid. No federal requirement to provide one."],["Premium Pay","None federally. Only California mandates 1hr premium pay per missed break. Other states impose civil penalties."]].map(([k,v])=>(
                  <div key={k} style={{background:"#fff",borderRadius:8,padding:"10px 14px",border:"1px solid #fde68a"}}>
                    <div style={{fontWeight:700,fontSize:11,color:"#92400e",marginBottom:4,textTransform:"uppercase"}}>{k}</div>
                    <div style={{fontSize:11,color:"#78350f",lineHeight:1.5}}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{padding:0,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{["State","Rest Break","Meal Break","Premium Pay","Notes","Risk","Source"].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {STATES.map(st=>(
                    <tr key={st.a} onClick={()=>setStateModal(st)} style={{cursor:"pointer",background:st.brk.premium!=="None"?"rgba(220,38,38,.02)":""}} onMouseEnter={e=>e.currentTarget.style.background=st.brk.premium!=="None"?"rgba(220,38,38,.05)":"#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=st.brk.premium!=="None"?"rgba(220,38,38,.02)":""}>
                      <TD><strong>{st.s}</strong></TD>
                      <TD style={{fontSize:11,color:st.brk.rest.includes("FLSA")?"#94a3b8":st.brk.rest.includes("PAID")?"#16a34a":"#334155",fontWeight:st.brk.rest.includes("PAID")?"700":"400"}}>{st.brk.rest}</TD>
                      <TD style={{fontSize:11,color:st.brk.meal.includes("FLSA")?"#94a3b8":"#334155"}}>{st.brk.meal}</TD>
                      <TD>{st.brk.premium!=="None"?<Bdg t={st.brk.premium} c="#dc2626" bg="rgba(220,38,38,.08)"/>:<span style={{color:"#cbd5e1",fontSize:11}}>None</span>}</TD>
                      <TD style={{fontSize:11,color:"#64748b",maxWidth:220}}>{st.brk.mealNote}</TD>
                      <TD><Pill r={st.r} t={st.r.toUpperCase()}/></TD>
                      <TD><SrcLink url={st.src}/></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* OVERTIME */}
        {tab===5 && (
          <div>
            <Tip>💡 Only 4 states require daily overtime. Most follow FLSA weekly 40hrs. California is most complex — daily, double-time, and 7th-day rules all apply simultaneously.</Tip>
            <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <KPI label="Daily OT States" value={dailyOT.length} sub="CA, AK, NV, CO" color="#dc2626" onClick={()=>openList("Daily Overtime States","States requiring OT triggered by daily hours.",dailyOT)}/>
              <KPI label="Federal Threshold" value="40 hrs/wk" sub="FLSA standard" color="#6366f1"/>
              <KPI label="Exception: MN" value="48 hrs/wk" sub="Higher state threshold" color="#d97706"/>
              <KPI label="OT Rate" value="1.5x" sub="Min; CA adds 2x after 12hrs" color="#0284c7"/>
            </div>
            <Card style={{border:"1px solid #fecaca",background:"rgba(220,38,38,.02)",marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:13,color:"#dc2626",marginBottom:12}}>⚡ States with Daily Overtime Requirements</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
                {[{s:"California",trigger:"After 8hrs/day",rate:"1.5x (2x after 12hrs/day)",extra:"7th consecutive day: 1.5x first 8hrs, 2x after",src:"https://www.dir.ca.gov/dlse/faq_overtime.htm"},{s:"Alaska",trigger:"After 8hrs/day OR 40hrs/week",rate:"1.5x",extra:"Whichever threshold is reached first",src:"https://labor.alaska.gov/lss/whhome.htm"},{s:"Nevada",trigger:"After 8hrs/day (if earning <$18/hr)",rate:"1.5x",extra:"Also OT after 40hrs/week",src:"https://labor.nv.gov/"},{s:"Colorado",trigger:"After 12hrs/day OR 40hrs/week",rate:"1.5x",extra:"COMPS Order applies to hospitality",src:"https://cdle.colorado.gov/wages"}].map(({s,trigger,rate,extra,src})=>(
                  <div key={s} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontWeight:800,fontSize:14,marginBottom:6}}>{s}</div>
                    <div style={{fontSize:11,color:"#475569",marginBottom:3}}><strong>Trigger:</strong> {trigger}</div>
                    <div style={{fontSize:11,color:"#475569",marginBottom:3}}><strong>Rate:</strong> {rate}</div>
                    <div style={{fontSize:11,color:"#64748b",marginBottom:8}}>{extra}</div>
                    <SrcLink url={src}/>
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{padding:0,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{["State","OT Threshold","Daily OT","Rate","Special Notes","Risk","Source"].map(h=><TH key={h}>{h}</TH>)}</tr></thead>
                <tbody>
                  {STATES.map(st=>(
                    <tr key={st.a} onClick={()=>setStateModal(st)} style={{cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                      <TD><strong>{st.s}</strong></TD>
                      <TD style={{fontWeight:700,color:st.ot==="Weekly 48"?"#d97706":"#0f172a"}}>{st.ot}</TD>
                      <TD>{st.otD?<Bdg t="Yes" c="#dc2626" bg="rgba(220,38,38,.08)"/>:<span style={{color:"#cbd5e1",fontSize:11}}>No</span>}</TD>
                      <TD style={{fontSize:11}}>{st.a==="CA"?"1.5x / 2x":"1.5x"}</TD>
                      <TD style={{fontSize:11,color:"#64748b",maxWidth:280}}>{st.otNote}</TD>
                      <TD><Pill r={st.r} t={st.r.toUpperCase()}/></TD>
                      <TD><SrcLink url={st.src}/></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* SCHEDULING */}
        {tab===6 && (
          <div>
            <Tip>💡 Fair Workweek violations are the fastest-growing category in restaurant labor litigation. Starbucks settled $38.9M in NYC alone in 2025.</Tip>
            <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <KPI label="Active Jurisdictions" value="8" sub="Cities + states" color="#6366f1"/>
              <KPI label="States with Laws" value={STATES.filter(s=>s.sch).length} sub="OR, WA, CA, IL, MN, NY" color="#7c3aed"/>
              <KPI label="Standard Notice" value="14 days" sub="Across most jurisdictions" color="#0284c7"/>
            </div>
            {[{j:"Oregon (Statewide)",scope:"Food/hospitality 500+ employees",notice:"14 days",rules:"1.5x pay for clopening (<10hr gap); $1/hr premium per change within notice window",pen:"Civil penalties per violation",eff:"Jul 2018",r:"high",src:"https://www.oregon.gov/boli/workers/Pages/fair-work-week.aspx"},{j:"New York City",scope:"Fast food (30+ locs) & retail",notice:"14 days (fast food) / 72hrs (retail)",rules:"No clopening without consent + $100 premium; good-faith estimate at hire",pen:"$500–$2,500/violation",eff:"Nov 2017",r:"high",src:"https://www.nyc.gov/site/dca/about/fair-workweek-law.page"},{j:"Seattle, WA",scope:"Food service / retail 500+ employees",notice:"14 days",rules:"Clopening premium; hours to existing workers first; pay for on-call shifts",pen:"Civil penalties; back wages",eff:"Jul 2017",r:"high",src:"https://www.seattle.gov/laborstandards/ordinances/secure-scheduling"},{j:"San Francisco, CA",scope:"Retail 20+ employees",notice:"2 weeks",rules:"Predictability pay for changes; right to request flexible schedule",pen:"$50–$500/violation",eff:"Jul 2015",r:"high",src:"https://sfgov.org/olse/formula-retail-employee-rights-ordinances"},{j:"Chicago, IL",scope:"Hospitality/food service 100+ employees",notice:"14 days",rules:"Penalty pay for <14-day changes; right to decline hours; 11-hr rest between shifts",pen:"$300–$500/shift violation",eff:"Jul 2020",r:"high",src:"https://www.chicago.gov/city/en/depts/dol/provdrs/labor-standards.html"},{j:"Los Angeles, CA",scope:"Retail 300+ employees",notice:"14 days",rules:"Predictability pay; access to hours for existing employees before new hires",pen:"Civil action",eff:"Apr 2023",r:"high",src:"https://wagesla.lacity.org/"},{j:"Minneapolis, MN",scope:"Large employers",notice:"14 days",rules:"Premium pay for changes; good-faith schedule estimate at hire",pen:"Civil penalties",eff:"Jan 2021",r:"medium",src:"https://www.minneapolismn.gov/government/programs-initiatives/workplace-regulations/"},{j:"Philadelphia, PA",scope:"Retail 250+ employees / 30+ locs",notice:"10 days (→14 days)",rules:"Right of first refusal; no retaliation for not being on-call",pen:"$100–$2,000/violation",eff:"Apr 2020",r:"medium",src:"https://www.phila.gov/departments/office-of-worker-protections/"}].map((s,i)=>(
              <Card key={i}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div><div style={{fontWeight:700,fontSize:14}}>{s.j}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Effective {s.eff} · {s.scope}</div></div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0,marginLeft:10}}><SrcLink url={s.src}/><Pill r={s.r} t={s.r.toUpperCase()}/></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[["Notice Required",s.notice],["Key Rules",s.rules],["Penalties",s.pen]].map(([k,v])=>(
                    <div key={k} style={{background:"#f8fafc",borderRadius:8,padding:"8px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{k}</div><div style={{fontSize:11,color:"#334155"}}>{v}</div></div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* FEDERAL UPDATES */}
        {tab===7 && (
          <div>
            <Tip>💡 The regulatory environment shifted in late 2024. Monitor DOL rulemaking, WHD enforcement priorities, and potential reversals of paused rules.</Tip>
            {FEDERAL_UPDATES.map((f,i)=>(
              <Card key={i}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                  <div style={{flex:1}}><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}><Bdg t={f.cat}/><span style={{fontWeight:700,fontSize:13}}>{f.title}</span></div><div style={{fontSize:11,color:"#94a3b8"}}>{f.date}</div></div>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginLeft:10,flexShrink:0}}>
                    <Bdg t={f.status} c={f.status==="Active"?"#16a34a":f.status==="Blocked"?"#dc2626":f.status==="Expired"?"#64748b":"#16a34a"} bg={f.status==="Active"?"rgba(22,163,74,.08)":f.status==="Blocked"?"rgba(220,38,38,.07)":"rgba(100,116,139,.08)"}/>
                    <Pill r={f.sev} t={f.sev.toUpperCase()}/>
                  </div>
                </div>
                <div style={{fontSize:12,color:"#475569",lineHeight:1.6,marginBottom:8}}>{f.detail}</div>
                <SrcLink url={f.src} label="DOL Source"/>
              </Card>
            ))}
          </div>
        )}

        {/* UPCOMING CHANGES */}
        {tab===8 && (()=>{
          const SECTION_ORDER = ["Min Wage","Tipped Wage","Sick Leave","Minor Labor","Break Laws","Overtime","Scheduling","Restaurant-Specific"];
          const SECTION_META = {
            "Min Wage":      {icon:"💵", label:"Minimum Wage",        desc:"State and federal minimum wage increases and indexing changes"},
            "Tipped Wage":   {icon:"🍽️", label:"Tipped Wage",         desc:"Tip credit changes, phase-outs, and pending federal legislation"},
            "Sick Leave":    {icon:"🏥", label:"Sick Leave",           desc:"New state sick leave mandates and expansions"},
            "Minor Labor":   {icon:"🧑‍🍳", label:"Minor Labor",         desc:"Child labor enforcement changes and age-specific rule updates"},
            "Break Laws":    {icon:"⏸️", label:"Break Laws",           desc:"Meal and rest break regulation changes and new recordkeeping requirements"},
            "Overtime":      {icon:"⏱️", label:"Overtime",             desc:"OT threshold rulemakings and state-level threshold proposals"},
            "Scheduling":    {icon:"📅", label:"Scheduling",           desc:"Fair Workweek expansions and new predictive scheduling laws"},
            "Restaurant-Specific":{icon:"🏢", label:"Restaurant-Specific / Misc", desc:"Industry-wide laws, franchise liability, AI tools, and federal wage bills"},
          };

          const grouped = SECTION_ORDER.reduce((acc,cat)=>{
            const items = upcomingData.filter(u=>u.cat===cat&&(upYr==="all"||String(u.yr)===upYr));
            if(items.length>0) acc[cat]=items;
            return acc;
          },{});

          const totalShown = Object.values(grouped).flat().length;

          return (
            <div>
              <Tip>💡 Tracking {upcomingData.length} confirmed and proposed regulatory changes for 2026–2027. Items marked "Pending" are active legislation — verify timing with official sources before acting.</Tip>

              {/* KPIs */}
              <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
                <KPI label="Total Tracked" value={upcomingData.length} sub="2026–2027 changes" color="#6366f1"/>
                <KPI label="2026 Changes" value={upcomingData.filter(u=>u.yr===2026).length} sub="This calendar year" color="#d97706"/>
                <KPI label="2027 Changes" value={upcomingData.filter(u=>u.yr===2027).length} sub="Planning horizon" color="#7c3aed"/>
                <KPI label="Critical Impact" value={upcomingData.filter(u=>u.impact==="critical").length} sub="Immediate action needed" color="#dc2626"/>
              </div>

              {/* Year filter + summary */}
              <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
                <div style={{display:"flex",gap:6}}>
                  {["all","2026","2027"].map(yr=>(
                    <button key={yr} onClick={()=>setUpYr(yr)} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 16px",fontSize:11,fontWeight:600,cursor:"pointer",background:upYr===yr?"#6366f1":"#fff",color:upYr===yr?"#fff":"#64748b"}}>
                      {yr==="all"?"All Years":yr}
                    </button>
                  ))}
                </div>
                <span style={{fontSize:11,color:"#94a3b8"}}>{totalShown} item{totalShown!==1?"s":""} across {Object.keys(grouped).length} categor{Object.keys(grouped).length!==1?"ies":"y"}</span>
              </div>

              {/* Sectioned content */}
              {Object.entries(grouped).map(([cat,items])=>{
                const meta = SECTION_META[cat]||{icon:"📌",label:cat,desc:""};
                const cc = CAT_COLORS[cat]||{c:"#6366f1",bg:"rgba(99,102,241,.08)"};
                return (
                  <div key={cat} style={{marginBottom:28}}>
                    {/* Section header */}
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,paddingBottom:10,borderBottom:`2px solid ${cc.c}22`}}>
                      <div style={{background:cc.bg,border:`1.5px solid ${cc.c}44`,borderRadius:10,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:18}}>{meta.icon}</span>
                        <div>
                          <div style={{fontWeight:800,fontSize:14,color:cc.c}}>{meta.label}</div>
                          <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{meta.desc}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,marginLeft:"auto",flexShrink:0}}>
                        <span style={{background:"rgba(217,119,6,.1)",color:"#d97706",border:"1px solid rgba(217,119,6,.25)",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>
                          {items.filter(u=>u.yr===2026).length} in 2026
                        </span>
                        {items.filter(u=>u.yr===2027).length>0 && (
                          <span style={{background:"rgba(124,58,237,.1)",color:"#7c3aed",border:"1px solid rgba(124,58,237,.25)",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>
                            {items.filter(u=>u.yr===2027).length} in 2027
                          </span>
                        )}
                        {items.filter(u=>u.impact==="critical").length>0 && (
                          <span style={{background:"rgba(220,38,38,.1)",color:"#dc2626",border:"1px solid rgba(220,38,38,.25)",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>
                            {items.filter(u=>u.impact==="critical").length} critical
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Item cards */}
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {items.map((u,i)=>{
                        const impR=u.impact==="critical"?"critical":u.impact==="high"?"high":u.impact==="medium"?"medium":"low";
                        const isPending=u.eff.toLowerCase().includes("pending");
                        return (
                          <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"14px 18px",boxShadow:"0 1px 3px rgba(0,0,0,.04)",borderLeft:`4px solid ${cc.c}`,display:"flex",gap:14,alignItems:"flex-start"}}>
                            {/* Left: year badge */}
                            <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:6,paddingTop:2}}>
                              <div style={{background:u.yr===2026?"rgba(217,119,6,.12)":"rgba(124,58,237,.1)",color:u.yr===2026?"#d97706":"#7c3aed",border:`1px solid ${u.yr===2026?"rgba(217,119,6,.3)":"rgba(124,58,237,.3)"}`,borderRadius:6,padding:"3px 8px",fontSize:12,fontWeight:800,minWidth:44,textAlign:"center"}}>{u.yr}</div>
                              <Pill r={impR} t={u.impact==="critical"?"CRIT":u.impact==="high"?"HIGH":u.impact==="medium"?"MED":"LOW"}/>
                            </div>
                            {/* Right: content */}
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:6,marginBottom:4}}>
                                <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                                  <span style={{fontWeight:700,fontSize:13,color:"#0f172a"}}>{u.title}</span>
                                  {isPending&&<Bdg t="PENDING" c="#64748b" bg="rgba(100,116,139,.08)"/>}
                                </div>
                              </div>
                              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:7,flexWrap:"wrap"}}>
                                <span style={{fontSize:11,color:"#64748b",fontWeight:600}}>📍 {u.j}</span>
                                <span style={{color:"#e2e8f0"}}>│</span>
                                <span style={{fontSize:11,fontWeight:600,color:isPending?"#94a3b8":"#475569"}}>⏰ {u.eff}</span>
                              </div>
                              <div style={{fontSize:12,color:"#475569",lineHeight:1.65,marginBottom:8}}>{u.detail}</div>
                              <div style={{display:"flex",alignItems:"center",gap:12}}>
                                <SrcLink url={u.src} label="Official Reference"/>
                                {isPending&&<span style={{fontSize:10,color:"#94a3b8",fontStyle:"italic"}}>Track at congress.gov or state legislature site</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {totalShown===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"#94a3b8",background:"#fff",borderRadius:12,border:"1px solid #e2e8f0"}}>No items match the selected year filter.</div>}
            </div>
          );
        })()}
      </div>
    </div>
  );
}