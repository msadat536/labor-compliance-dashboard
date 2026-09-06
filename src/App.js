import React, { useState, useMemo, useEffect } from "react";

// ── Helpers ──────────────────────────────────────────────────────
function rc(r){ return r==="critical"||r==="high" ? "#dc2626" : r==="medium" ? "#d97706" : "#16a34a"; }
function rb(r){ return r==="critical" ? "rgba(220,38,38,.1)" : r==="high" ? "rgba(220,38,38,.07)" : r==="medium" ? "rgba(217,119,6,.1)" : "rgba(22,163,74,.08)"; }
function Pill(p){ return <span style={{background:rb(p.r),color:rc(p.r),border:"1px solid "+rc(p.r)+"44",borderRadius:4,padding:"3px 10px",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{p.t}</span>; }
function Bdg(p){ var c=p.c||"#6366f1"; var bg=p.bg||"rgba(99,102,241,.1)"; return <span style={{background:bg,color:c,border:"1px solid "+c+"33",borderRadius:4,padding:"3px 9px",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>{p.t}</span>; }
function KPI(p){ return <div onClick={p.onClick} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"18px 22px",flex:1,minWidth:140,boxShadow:"0 2px 8px rgba(0,0,0,.06)",cursor:p.onClick?"pointer":"default",transition:"box-shadow .15s"}} onMouseEnter={function(e){if(p.onClick)e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.12)";}} onMouseLeave={function(e){e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.06)"}}><div style={{color:"#94a3b8",fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6}}>{p.label}</div><div style={{color:p.color||"#6366f1",fontSize:30,fontWeight:800,lineHeight:1}}>{p.value}</div>{p.sub&&<div style={{color:"#94a3b8",fontSize:12,marginTop:5}}>{p.sub}</div>}{p.onClick&&<div style={{color:p.color||"#6366f1",fontSize:11,marginTop:7,fontWeight:700}}>Click to explore &rsaquo;</div>}</div>; }
function Card(p){ return <div onClick={p.onClick} style={{background:"#fff",border:"1px solid #e8edf3",borderRadius:14,padding:22,marginBottom:18,boxShadow:"0 2px 8px rgba(0,0,0,.05)",cursor:p.onClick?"pointer":"default",...(p.style||{})}}>{p.children}</div>; }
function TH(p){ return <th style={{background:"#f8fafc",color:"#64748b",fontWeight:700,padding:"12px 16px",textAlign:"left",borderBottom:"2px solid #e8edf3",fontSize:12,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap",...(p.style||{})}}>{p.children}</th>; }
function TD(p){ return <td style={{padding:"12px 16px",borderBottom:"1px solid #f1f5f9",verticalAlign:"top",lineHeight:1.55,fontSize:14,...(p.style||{})}}>{p.children}</td>; }
function Tip(p){ return <div style={{color:"#4f46e5",fontSize:13,marginBottom:18,background:"rgba(99,102,241,.06)",padding:"12px 18px",borderRadius:10,border:"1px solid rgba(99,102,241,.18)",fontWeight:500}}>{p.children}</div>; }
function SrcLink(p){ if(!p.url) return null; var host=""; try{ host=new URL(p.url).hostname.replace(/^www\./,""); }catch(e){} var gov=/\.gov($|\/)|\.gov\b|\.state\.[a-z]{2}\.us|\.ca\.us|sfgov\.org|lacity\.org|denvergov\.org|cityofevanston\.org|wyomingworkforce\.org|floridajobs\.org|laworks\.net/i.test(host); return <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={function(e){e.stopPropagation();}} title={p.url} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,textDecoration:"none",color:gov?"#15803d":"#6366f1",background:gov?"rgba(22,163,74,.08)":"rgba(99,102,241,.08)",border:"1px solid "+(gov?"rgba(22,163,74,.3)":"rgba(99,102,241,.3)"),borderRadius:6,padding:"3px 9px"}}><span>{(p.label||"Source")+(host?(" \u00b7 "+host):"")}</span><span style={{fontSize:10}}>{"\u2197"}</span></a>; }
function AgeCell(p){ return <td style={{padding:"7px 9px",borderBottom:"1px solid #f1f5f9",verticalAlign:"top",background:p.bg,minWidth:160,maxWidth:200}}>{(p.rules||[]).map(function(r,i){ return <div key={i} style={{display:"flex",gap:4,marginBottom:2}}><span style={{color:"#a5b4fc",flexShrink:0,fontSize:9,marginTop:2}}>{">"}</span><span style={{fontSize:10,color:"#334155",lineHeight:1.4}}>{r}</span></div>; })}</td>; }

function isPastDate(s){
  if(!s) return false;
  var str=String(s).trim();
  if(!str) return false;
  // Find ALL 4-digit years in the string
  var yrMatches=str.match(/\b(20\d{2})\b/g);
  if(!yrMatches||yrMatches.length===0) return false; // no year - keep
  var thisYear=(new Date()).getFullYear();
  var maxYear=Math.max.apply(null,yrMatches.map(Number));
  // If the latest year mentioned is current year or future, keep it
  // (even if a specific date in current year has technically passed - the item is still relevant)
  if(maxYear>=thisYear) return false;
  // All years mentioned are strictly before current year - it's past
  return true;
}

// Classify an upcoming change as enacted/confirmed vs proposed/under review, from its text.
function upcomingStatus(item){
  if(!item) return null;
  var t=((item.title||"")+" "+(item.eff||"")+" "+(item.detail||"")).toLowerCase();
  if(/\b(proposed|pending|under consideration|under review|being considered|if passed|would |introduced|in committee|awaiting|expected to|may revisit|watch for)\b/.test(t))
    return {label:"PROPOSED \u00b7 UNDER REVIEW",c:"#b45309",bg:"rgba(217,119,6,.12)"};
  return {label:"ENACTED \u00b7 CONFIRMED",c:"#15803d",bg:"rgba(22,163,74,.1)"};
}

function timeAgo(d){
  if(!d) return "";
  var now=new Date();
  var diff=Math.floor((now-d)/1000);
  if(diff<60) return "just now";
  if(diff<3600) return Math.floor(diff/60)+" min ago";
  if(diff<86400) return Math.floor(diff/3600)+" hr ago";
  var days=Math.floor(diff/86400);
  if(days<30) return days+" day"+(days!==1?"s":"")+" ago";
  return d.toLocaleDateString();
}

// ── Data ──────────────────────────────────────────────────────────
var B14=["3hrs/school day","18hrs/school wk","8hrs/non-school day","40hrs/non-school wk","7am-7pm (9pm Jun-Labor Day)","No hazardous equipment"];
var B16=["No federal hour restrictions","No hazardous work (under 18)","May work any shift"];

var STATES=[
  {s:"Alabama",a:"AL",mw:7.25,chg:false,note:"Federal $7.25",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum wage applies","No state sick leave","Tipped: $2.13"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://labor.alabama.gov/"},
  {s:"Alaska",a:"AK",mw:13.00,chg:true,cd:"Jul 1, 2026",nr:14.00,note:"$14 Jul 2026. No tip credit.",tip:"Full MW",tc:"None",sl:true,slN:"All employers Jul 2025. 1hr/30hrs.",sch:false,r:"medium",ot:"Daily 8 + Weekly 40",otD:true,otNote:"OT after 8hrs/day OR 40hrs/week",local:"None",laws:["Min wage $14.00 Jul 1 2026","No tip credit - full MW required","Daily OT after 8hrs","Paid sick leave all employers Jul 2025"],minor:"Work permit required.",brk:{rest:"None required for adults",meal:"None required for adults",premium:"None",note:"Minors must receive breaks per DOL standards"},src:"https://labor.alaska.gov/lss/whhome.htm"},
  {s:"Arizona",a:"AZ",mw:15.15,chg:false,note:"CPI-indexed. Flagstaff $17.85.",tip:12.15,tc:3.00,sl:true,slN:"1hr/30hrs up to 40hrs/yr.",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"Flagstaff: $17.85",laws:["PSL: 1hr/30hrs","Tipped: $12.15 (credit $3.00)","Flagstaff local: $17.85"],minor:"Work permit required under 16.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://www.azica.gov/divisions/labor-department/minimum-wage"},
  {s:"Arkansas",a:"AR",mw:11.00,chg:false,note:"State minimum $11.00.",tip:2.63,tc:8.37,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Tipped: $2.63 (credit $8.37)","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://www.labor.arkansas.gov/"},
  {s:"California",a:"CA",mw:16.90,chg:false,note:"Fast food 60+ locs: $20. Many locals significantly higher.",tip:"Full MW",tc:"None",sl:true,slN:"AB 406 Jan 2026: 40-80hrs/yr.",sch:true,r:"high",ot:"Daily 8+Weekly 40+7th day",otD:true,otNote:"1.5x after 8hrs/day; 2x after 12hrs/day; 7th consecutive day 1.5x/2x",local:"LA City $17.87 | LA County $17.81 | West Hollywood $20.25 | Santa Monica $17.81 | Pasadena $18.04 | SF $19.18 | Berkeley $18.67",laws:["No tip credit - full $16.90","Fast food: $20 (60+ locations chain-wide, AB 1228)","Healthcare workers: $18.63-$25/hr (tiered, increases Jul 1 2026)","Daily OT: 1.5x over 8hrs, 2x over 12hrs","7th consecutive day rules","Fair Workweek: SF, LA City, Berkeley, Emeryville","Exempt salary threshold: $70,304/yr (2x state min annualized)","SDI/PFL contribution 1.3%"],minor:"DLSE permit required. 14-15: 3hr/day school days.",brk:{rest:"10-min PAID per 4hrs worked",meal:"30-min UNPAID per 5hrs; 2nd meal over 10hrs",premium:"1 hour at regular pay per missed break",note:"Non-compliant meal periods must be paid as regular time"},src:"https://www.dir.ca.gov/dlse/faq_minimumwage.htm"},
  {s:"Colorado",a:"CO",mw:15.16,chg:false,note:"Denver $19.29. Edgewater $18.17. Boulder $16.82. COMPS Order applies.",tip:12.14,tc:3.02,sl:true,slN:"HFWA: 1hr/30hrs up to 48hrs/yr.",sch:false,r:"medium",ot:"Daily 12 + Weekly 40",otD:true,otNote:"OT after 12hrs/day OR 40hrs/week per COMPS Order",local:"Denver $19.29 | Edgewater $18.17 (tipped $13.50) | Boulder $16.82 | Boulder County $16.82",laws:["COMPS Order #40 effective Feb 1 2026","PAY CALC Order: $15.16 statewide","Denver local: $19.29","Daily OT after 12hrs (COMPS)","HFWA sick leave 1hr/30hrs","CPI-indexed annually","Exempt salary threshold: $57,784/yr"],minor:"Work permit required under 16. 85% youth wage allowed.",brk:{rest:"10-min PAID per 4hrs worked",meal:"30-min UNPAID per 5hrs",premium:"None specific; COMPS penalties apply",note:"COMPS Order section 5. Employee must be completely relieved."},src:"https://cdle.colorado.gov/dlss"},
  {s:"Connecticut",a:"CT",mw:16.94,chg:false,note:"CPI-W indexed. Annual Jan 1 adjustments.",tip:8.23,tc:8.71,sl:true,slN:"1hr/40hrs up to 40hrs/yr (CT PSL).",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["CPI-W indexed annually","Tipped: $8.23 (credit $8.71)","PSL: 1hr/40hrs - now covers all employers (2024 expansion)","Sunday/holiday premium for retail not restaurant"],minor:"Work permit required.",brk:{rest:"None required",meal:"30-min unpaid for shifts over 7.5hrs",premium:"None",note:"CT Gen. Stat. section 31-51ii applies"},src:"https://www.ctdol.state.ct.us/wgwkstnd/wage-hour.htm"},
  {s:"Delaware",a:"DE",mw:15.00,chg:false,note:"$15.00 since Jan 2025.",tip:2.23,tc:12.77,sl:true,slN:"1hr/30hrs up to 40hrs/yr.",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["$15.00 since Jan 2025","Tipped: $2.23 (credit $12.77)","PSL: 1hr/30hrs","Pay transparency in job postings (2026)"],minor:"Work permit required under 18.",brk:{rest:"None required",meal:"30-min unpaid for shifts over 7.5hrs",premium:"None",note:"Applies to employers with 10+ employees"},src:"https://labor.delaware.gov/divisions/industrial-affairs/wage-hour/"},
  {s:"District of Columbia",a:"DC",mw:17.95,chg:true,cd:"Jul 1, 2026",nr:"CPI-W indexed",note:"Highest US minimum wage. Tip credit eliminated under Initiative 82 phase-in (final step Jul 1 2027).",tip:12.00,tc:5.95,sl:true,slN:"DC Accrued Sick & Safe Leave: 1hr/37-87hrs (employer size).",sch:false,r:"high",ot:"Weekly 40",otD:false,otNote:"Follows FLSA. DC has spread-of-hours premium for shifts >10hrs.",local:"None - DC is a single jurisdiction",laws:["Min wage $17.95 - highest US rate","Initiative 82 phasing out tip credit by Jul 2027","Tipped: $12.00 (credit $5.95) - rising to eliminate credit","CPI-W indexed annually (Jul 1 adjustment)","ASSL sick leave: 1hr/37-87hrs based on employer size","Spread-of-hours premium for shifts >10hrs","Pay Transparency Act (effective 2024)"],minor:"Work permit required under 18.",brk:{rest:"None (FLSA only)",meal:"None for adults",premium:"None",note:"Minors under 18: 30-min uninterrupted break for shifts over 5hrs"},src:"https://does.dc.gov/page/minimum-wage-and-overtime"},
  {s:"Florida",a:"FL",mw:14.00,chg:true,cd:"Sep 30, 2026",nr:15.00,note:"$15.00 Sep 30 2026.",tip:10.98,tc:3.02,sl:false,slN:"None",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage $15.00 Sep 30 2026","Tipped $11.98 Sep 30 2026","No state sick leave"],minor:"Work permit required under 18.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://floridajobs.org/workforce-board-resources/policy-and-technical-assistance/labor-laws"},
  {s:"Georgia",a:"GA",mw:7.25,chg:false,note:"Federal $7.25 applies.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave","Tipped: $2.13"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://dol.georgia.gov/labor-law-faqs"},
  {s:"Hawaii",a:"HI",mw:16.00,chg:true,cd:"Jan 1, 2028",nr:18.00,note:"$16 Jan 2026, $18 Jan 2028 (final step of HB 2510 phase-in).",tip:14.75,tc:1.25,sl:true,slN:"Family leave for employers 100+. No general state PSL.",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage $16.00 since Jan 2026","Will rise to $18 Jan 1 2028","Tipped: $14.75 (credit $1.25)","Tip credit only allowed if combined wage exceeds full MW by $7.00","No general state PSL"],minor:"Work permit required under 16.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA. Minors under 16 get 30-min after 5hrs."},src:"https://labor.hawaii.gov/wage-standards-division/"},
  {s:"Idaho",a:"ID",mw:7.25,chg:false,note:"Federal rate.",tip:3.35,tc:3.90,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://labor.idaho.gov/"},
  {s:"Illinois",a:"IL",mw:15.00,chg:false,note:"Chicago $16.20. Cook County $15.00.",tip:9.00,tc:6.00,sl:true,slN:"1hr/40hrs up to 40hrs/yr.",sch:true,r:"high",ot:"Weekly 40",otD:false,otNote:"Follows FLSA. Chicago adds predictability pay.",local:"Chicago $16.20 | Cook County $15.00",laws:["Chicago local: $16.20","Chicago Fair Workweek: 14-day notice","Tipped: $9.00 (credit $6.00)","PSL: 1hr/40hrs"],minor:"Work permit required.",brk:{rest:"None required",meal:"20-min unpaid for shifts over 7.5hrs",premium:"None",note:"820 ILCS 140/3. Employee must be free from duties."},src:"https://labor.illinois.gov/"},
  {s:"Indiana",a:"IN",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave","Youth subminimum $4.25 first 90 days"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://www.in.gov/dol/"},
  {s:"Iowa",a:"IA",mw:7.25,chg:false,note:"Federal rate.",tip:4.35,tc:2.90,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None for adults. Minors: 30-min after 5hrs.",premium:"None",note:"Minor break rules: Iowa Code section 92.7"},src:"https://www.iwd.iowa.gov/"},
  {s:"Kansas",a:"KS",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://www.dol.ks.gov/"},
  {s:"Kentucky",a:"KY",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"10-min PAID per 4hrs worked",meal:"Reasonable unpaid meal break",premium:"None specific",note:"KRS section 337.355."},src:"https://labor.ky.gov/"},
  {s:"Louisiana",a:"LA",mw:7.25,chg:false,note:"Federal $7.25.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://www.laworks.net/"},
  {s:"Maine",a:"ME",mw:15.10,chg:false,note:"Portland $15.50. Rockland $15.10. CPI-indexed.",tip:7.55,tc:7.55,sl:true,slN:"1hr/40hrs up to 40hrs/yr (Earned Paid Leave - all employers 11+).",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"Portland: $15.50 | Rockland: $15.10",laws:["CPI-W indexed annually","Portland local: $15.50","Tipped: $7.55 (50% of MW)","Earned Paid Leave: 1hr/40hrs"],minor:"Work permit required.",brk:{rest:"None required",meal:"30-min unpaid per 6 consecutive hours",premium:"None",note:"26 MRS section 603. Employee must be relieved of all duties."},src:"https://www.maine.gov/labor/labor_laws/"},
  {s:"Maryland",a:"MD",mw:15.00,chg:false,note:"Montgomery County $17.15. PG County $16.50.",tip:3.63,tc:11.37,sl:true,slN:"1hr/30hrs up to 40-64hrs/yr.",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"Montgomery Co $17.15 | PG Co $16.50",laws:["Tipped: $3.63 (credit $11.37)","PSL: 1hr/30hrs","Montgomery Co and PG Co local rates"],minor:"Work permit required under 18.",brk:{rest:"None (FLSA only)",meal:"None for adults",premium:"None",note:"Minors under 16: 30-min unpaid break after 5hrs"},src:"https://www.dllr.state.md.us/labor/wages/"},
  {s:"Massachusetts",a:"MA",mw:15.00,chg:false,note:"$15.00. No further increase scheduled.",tip:6.75,tc:8.25,sl:true,slN:"1hr/30hrs up to 40hrs/yr.",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Tipped: $6.75","PSL: 1hr/30hrs","Sunday premium phased out 2023"],minor:"Work permit required under 18.",brk:{rest:"None required",meal:"30-min unpaid per 6hrs worked",premium:"None specific; civil fine",note:"M.G.L. c.149 section 100. Strictly enforced."},src:"https://www.mass.gov/minimum-wage-program"},
  {s:"Michigan",a:"MI",mw:13.73,chg:true,cd:"Feb 21, 2027",nr:15.00,note:"$13.73 since Feb 21 2026. Tip credit phasing out by 2031.",tip:5.49,tc:8.24,sl:true,slN:"ESTA: 1hr/30hrs up to 72hrs/yr (small employer 40hrs).",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage $13.73 Feb 2026; rises annually until $15 in 2027","Tipped wage stepping up annually to reach 50% of MW by 2031","Earned Sick Time Act (ESTA): 1hr/30hrs up to 72hrs/yr","Tip credit currently 40% (rises to 50% by 2031)"],minor:"Work permit required under 18.",brk:{rest:"None (FLSA only)",meal:"None for adults",premium:"None",note:"Minors under 18: 30-min uninterrupted break for shifts over 5hrs"},src:"https://www.michigan.gov/leo/bureaus-agencies/ors/wage-and-hour"},
  {s:"Minnesota",a:"MN",mw:11.41,chg:false,note:"Minneapolis $15.97. St. Paul $15.97 (large). CPI-indexed.",tip:"Full MW",tc:"None",sl:true,slN:"ESST: 1hr/30hrs up to 48hrs/yr (statewide 2024).",sch:true,r:"high",ot:"Weekly 48",otD:false,otNote:"State OT after 48hrs/week (not 40). Minneapolis/St. Paul may differ.",local:"Minneapolis $15.97 | St. Paul $15.97 (large) / $14.00 (small)",laws:["No tip credit - full MW required","Minneapolis local: $15.97 (Jan 2026)","St. Paul local: $15.97 large, tiered for smaller","Minneapolis Fair Workweek: 14-day notice","ESST sick leave statewide: 1hr/30hrs","State OT after 48hrs (not 40)"],minor:"Work permit required under 16.",brk:{rest:"Sufficient time per 4hrs (PAID if on-premises)",meal:"Sufficient time to eat - if under 20 min must be PAID",premium:"None specific",note:"Minn. Stat. sections 177.253-177.254. On-premises breaks must be paid."},src:"https://www.dli.mn.gov/business/employment-practices/minimum-wage-minnesota"},
  {s:"Mississippi",a:"MS",mw:7.25,chg:false,note:"Federal $7.25.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://mdes.ms.gov/"},
  {s:"Missouri",a:"MO",mw:15.00,chg:true,cd:"Jan 1, 2027",nr:"CPI-indexed",note:"$15 since Jan 2026 per Prop A. Annual CPI thereafter.",tip:7.50,tc:7.50,sl:true,slN:"Prop A PSL: 1hr/30hrs (eff May 1 2025).",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage $15.00 since Jan 2026 (Prop A)","Prop A PSL took effect May 1 2025: 1hr/30hrs","Tipped: $7.50 (50% of MW)","CPI-indexed annually starting 2027"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://labor.mo.gov/DLS/MinimumWage"},
  {s:"Montana",a:"MT",mw:10.30,chg:false,note:"Businesses over $110K gross. Others $4/hr.",tip:"Full MW",tc:"None",sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["No tip credit allowed","Small business exception $4/hr","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://dli.mt.gov/labor-standards/wage-and-hour"},
  {s:"Nebraska",a:"NE",mw:15.00,chg:true,cd:"Jan 1, 2027",nr:"CPI 1.75% increase",note:"$15 since Jan 2026. LB 258 caps annual CPI increases at 1.75%.",tip:2.13,tc:12.87,sl:true,slN:"Prop 436: 1hr/30hrs (eff Oct 2024).",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage $15.00 since Jan 2026","LB 258 caps annual CPI increases at 1.75% starting 2027","Youth wage $13.50 (ages 14-15)","Training wage $13.50 first 90 days for ages 16-19","Paid sick leave via Prop 436 (since Oct 2024)","Tipped: $2.13"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://labor.nebraska.gov/"},
  {s:"Nevada",a:"NV",mw:12.00,chg:false,note:"No tip credit. Daily OT after 8hrs if under $18/hr.",tip:"Full MW",tc:"None",sl:true,slN:"1hr/52hrs up to 40hrs/yr.",sch:false,r:"medium",ot:"Daily 8 + Weekly 40",otD:true,otNote:"OT after 8hrs/day if earning under $18/hr; also after 40hrs/week",local:"None",laws:["No tip credit allowed","Daily OT after 8hrs if paid under $18/hr","PSL: 1hr/52hrs"],minor:"Work permit required under 17.",brk:{rest:"10-min PAID per 4hrs worked",meal:"30-min unpaid per shift over 8hrs",premium:"None specific",note:"NRS section 608.019. Both paid rest AND meal requirements."},src:"https://labor.nv.gov/"},
  {s:"New Hampshire",a:"NH",mw:7.25,chg:false,note:"Federal rate.",tip:3.26,tc:3.99,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required",meal:"30-min unpaid per 5hrs worked",premium:"None",note:"NH RSA 275:30-a."},src:"https://www.nh.gov/labor/"},
  {s:"New Jersey",a:"NJ",mw:15.92,chg:false,note:"CPI-indexed. Small/seasonal $14.55 (under 6 employees).",tip:5.81,tc:10.11,sl:true,slN:"NJ Earned Sick Leave: 1hr/30hrs up to 40hrs/yr (all employers).",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["CPI-W indexed annually","Small/seasonal employers (under 6): $14.55","Tipped: $5.81 (credit $10.11)","NJ Earned Sick Leave: 1hr/30hrs (all employers)","Pay transparency for jobs at $40K+ (effective Jun 2025)"],minor:"Work permit required under 18.",brk:{rest:"None (FLSA only)",meal:"None for adults",premium:"None",note:"Minors under 18: 30-min break after 5hrs"},src:"https://www.nj.gov/labor/wageandhour/"},
  {s:"New Mexico",a:"NM",mw:12.00,chg:false,note:"Las Cruces $13.50.",tip:3.00,tc:9.00,sl:true,slN:"1hr/30hrs up to 64hrs/yr.",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"Albuquerque $12.00 | Las Cruces $13.50",laws:["PSL: 1hr/30hrs","Tipped: $3.00 (credit $9.00)","Local rates apply"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://www.dws.state.nm.us/"},
  {s:"New York",a:"NY",mw:16.00,chg:true,cd:"Jan 1, 2027",nr:"CPI-indexed",note:"NYC/LI/Westchester $17. Fast food $17 statewide. CPI-W indexed starting 2027.",tip:10.65,tc:5.35,sl:true,slN:"NYS PSL: 1hr/30hrs (40hrs/yr small, 56hrs/yr large 100+).",sch:true,r:"high",ot:"Weekly 40",otD:false,otNote:"FLSA weekly. NYC: spread-of-hours premium if shift over 10hrs.",local:"NYC/LI/Westchester $17.00",laws:["NYC/LI/Westchester: $17.00","Rest of state: $16.00","NYC Fair Workweek: 14-day notice (fast food + retail)","Fast food statewide: $17.00 (NYC/LI/W) / $16.00 (rest)","Spread-of-hours premium for shifts >10hrs","NYS PSL: 1hr/30hrs (40-56hr cap by employer size)","Annual CPI-W indexing starts 2027"],minor:"Working papers required under 18.",brk:{rest:"None required",meal:"30-min per 6hrs; 45-min for restaurant workers 11am-2pm; 20-min between 5pm-7pm if shift covers both periods",premium:"None; NYDOL enforcement",note:"NY Labor Law section 162. Restaurant-specific 45-min rule commonly violated."},src:"https://dol.ny.gov/minimum-wage"},
  {s:"North Carolina",a:"NC",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"30-min unpaid per shift - required for employers 5+",premium:"None",note:"NC Admin Code 13 NCAC 12.0104."},src:"https://www.labor.nc.gov/"},
  {s:"North Dakota",a:"ND",mw:7.25,chg:false,note:"Federal rate.",tip:4.86,tc:2.39,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"30-min unpaid per 5hrs",premium:"None",note:"ND Century Code section 34-06-03."},src:"https://www.nd.gov/labor/"},
  {s:"Ohio",a:"OH",mw:11.00,chg:false,note:"CPI-indexed. Employers under $394K gross: $7.25.",tip:5.50,tc:5.50,sl:false,slN:"Cleveland PSL only",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"Cleveland PSL",laws:["CPI indexing","Tipped: $5.50 (50% of MW)","Cleveland sick leave ordinance","Small employer threshold: $394K gross"],minor:"Work permit required under 18.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://com.ohio.gov/divisions/industrial-compliance/wage-and-hour"},
  {s:"Oklahoma",a:"OK",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://www.ok.gov/odol/"},
  {s:"Oregon",a:"OR",mw:15.05,chg:true,cd:"Jul 1, 2026",nr:"CPI-indexed",note:"Standard $15.05. Portland metro $16.30. Non-urban $14.05. Mid-year increase Jul 1.",tip:"Full MW",tc:"None",sl:true,slN:"PSST: 1hr/30hrs up to 40hrs/yr (employers 10+; smaller unpaid).",sch:true,r:"high",ot:"Weekly 40",otD:false,otNote:"FLSA weekly. Clopening premium under 10hrs between shifts.",local:"Portland metro $16.30 (Multnomah, Washington, Clackamas counties) | Non-urban $14.05",laws:["No tip credit allowed","Three-tier wage system: standard, Portland metro, non-urban","Statewide Fair Work Week Act for retail/food/hospitality 500+","Clopening premium 1.5x if under 10hr gap","PSST sick leave: 1hr/30hrs","Annual CPI-W indexing on Jul 1","Digital break waiver recordkeeping required Jul 2026"],minor:"Work permit required under 18.",brk:{rest:"10-min PAID per 4hrs worked",meal:"30-min unpaid after 6hrs; 2nd meal per 14hrs",premium:"None specific; BOLI enforcement",note:"ORS section 653.261. Oregon enforces both rest and meal breaks strictly."},src:"https://www.oregon.gov/boli/workers/Pages/minimum-wage.aspx"},
  {s:"Pennsylvania",a:"PA",mw:7.25,chg:false,note:"Increases stalled. Federal rate.",tip:2.83,tc:4.42,sl:false,slN:"Philadelphia PSL",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"Philadelphia PSL",laws:["Federal minimum; state increases stalled","Philadelphia PSL ordinance","Tipped: $2.83"],minor:"Work permit required.",brk:{rest:"None for adults",meal:"None for adults",premium:"None",note:"Minors under 18: 30-min break after 5hrs. PA Child Labor Act."},src:"https://www.dli.pa.gov/Individuals/Labor-Management-Relations/llc/Pages/Minimum-Wage.aspx"},
  {s:"Rhode Island",a:"RI",mw:16.00,chg:true,cd:"Jan 1, 2027",nr:17.00,note:"$16 since Jan 2026 per HB 5029. $17 in 2027.",tip:3.89,tc:12.11,sl:true,slN:"1hr/35hrs up to 40hrs/yr (employers 18+).",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage $16.00 since Jan 2026","Will rise to $17.00 Jan 2027","Tipped: $3.89 (credit $12.11)","PSL: 1hr/35hrs (employers 18+)"],minor:"Work permit required.",brk:{rest:"None required",meal:"20-min unpaid per 6hrs worked",premium:"None",note:"RI Gen. Laws section 28-3-14."},src:"https://dlt.ri.gov/employers/wage-and-hour/minimum-wage"},
  {s:"South Carolina",a:"SC",mw:7.25,chg:false,note:"Federal $7.25.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://llr.sc.gov/"},
  {s:"South Dakota",a:"SD",mw:11.85,chg:false,note:"CPI-W indexed annually.",tip:5.93,tc:5.92,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["CPI-W indexed annually","Tipped: $5.93 (50% of MW)","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://dlr.sd.gov/"},
  {s:"Tennessee",a:"TN",mw:7.25,chg:false,note:"Federal $7.25.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None required",meal:"30-min unpaid per 6hrs for employers 5+",premium:"None",note:"TCA section 50-2-103."},src:"https://www.tn.gov/workforce/"},
  {s:"Texas",a:"TX",mw:7.25,chg:false,note:"Federal rate. State preempts local.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA. State preempts local rules.",local:"None",laws:["Federal minimum; state preempts local","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://www.twc.texas.gov/"},
  {s:"Utah",a:"UT",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://laborcommission.utah.gov/"},
  {s:"Vermont",a:"VT",mw:14.42,chg:false,note:"CPI-W indexed annually.",tip:7.21,tc:7.21,sl:true,slN:"1hr/52hrs up to 40hrs/yr (employers 6+).",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["CPI-W indexed annually (Jan 1)","Tipped: $7.21 (50% of MW)","PSL: 1hr/52hrs (employers 6+)"],minor:"Work permit required under 16.",brk:{rest:"None required",meal:"Reasonable meal opportunity",premium:"None",note:"21 VSA section 309."},src:"https://labor.vermont.gov/"},
  {s:"Virginia",a:"VA",mw:12.77,chg:true,cd:"Jan 1, 2027",nr:13.75,note:"$12.77 in 2026, $13.75 Jan 2027, $15.00 Jan 2028 (SB 1).",tip:2.13,tc:10.64,sl:false,slN:"VA Sick Leave: home health workers only.",sch:false,r:"medium",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Min wage $12.77 since Jan 2026","SB 1: $13.75 Jan 2027, $15.00 Jan 2028","Tipped: $2.13 (credit $10.64)","No general state PSL (only home health workers)"],minor:"Work permit required under 16.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://www.doli.virginia.gov/"},
  {s:"Washington",a:"WA",mw:17.13,chg:true,cd:"Jan 1, 2027",nr:"TBD (CPI-W indexed)",note:"Seattle $21.30. Tukwila $21.65. SeaTac $20.74 hospitality.",tip:"Full MW",tc:"None",sl:true,slN:"1hr/40hrs up to 40hrs/yr.",sch:true,r:"high",ot:"Weekly 40",otD:false,otNote:"FLSA weekly. Seattle adds clopening premium.",local:"Seattle $21.30 | Tukwila $21.65 | SeaTac $20.74 (hospitality) | Bellingham $19.13 | Renton $21.57 (large) / $20.57 (mid)",laws:["No tip credit allowed","Seattle Secure Scheduling: 14-day notice","PSL: 1hr/40hrs","Annual CPI-W adjustments (2.8% increase Jan 2026)","Seattle unified $21.30 (no more tiered system as of 2025)","Bellingham +$2 over state floor"],minor:"Work permit required under 18. Ages 14-15 paid 85% of state min ($14.56 in 2026).",brk:{rest:"10-min PAID per 4hrs worked",meal:"30-min unpaid per 5hrs",premium:"None specific; L&I enforcement",note:"RCW section 49.12.187. Both rest and meal breaks strictly required."},src:"https://lni.wa.gov/workers-rights/wages/minimum-wage/"},
  {s:"West Virginia",a:"WV",mw:8.75,chg:false,note:"State min $8.75 for employers over 6 workers.",tip:2.62,tc:6.13,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["State MW $8.75 for larger employers","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"20-min unpaid per 6hrs",premium:"None",note:"WV Code section 21-3-10a."},src:"https://labor.wv.gov/"},
  {s:"Wisconsin",a:"WI",mw:7.25,chg:false,note:"Federal rate. State preempts local.",tip:2.33,tc:4.92,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA. State preempts local.",local:"None",laws:["Federal minimum; state preempts local","No state sick leave"],minor:"Work permit required under 16.",brk:{rest:"None required",meal:"30-min unpaid per 6hrs - recommended",premium:"None",note:"Wisconsin DWD Advisory. Not legally enforceable."},src:"https://dwd.wisconsin.gov/er/laborstandards/"},
  {s:"Wyoming",a:"WY",mw:7.25,chg:false,note:"Federal rate.",tip:2.13,tc:5.12,sl:false,slN:"None",sch:false,r:"low",ot:"Weekly 40",otD:false,otNote:"Follows FLSA",local:"None",laws:["Federal minimum applies","No state sick leave"],minor:"Follows FLSA.",brk:{rest:"None (FLSA only)",meal:"None (FLSA only)",premium:"None",note:"Short breaks under 20 min paid per FLSA"},src:"https://wyomingworkforce.org/"},
];

var MA_DEF={a14:B14,a15:["Same rules as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"};
var MINOR_AGES={
  AL:MA_DEF,AR:MA_DEF,GA:MA_DEF,ID:MA_DEF,KS:MA_DEF,KY:MA_DEF,LA:MA_DEF,MS:MA_DEF,MT:MA_DEF,ND:MA_DEF,NH:MA_DEF,NC:MA_DEF,OK:MA_DEF,SC:MA_DEF,SD:MA_DEF,TN:MA_DEF,TX:MA_DEF,UT:MA_DEF,WV:MA_DEF,WY:MA_DEF,
  IN:{a14:[...B14,"Youth subminimum $4.25/hr (first 90 days)"],a15:["Same as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"None required"},
  IA:{a14:B14,a15:["Same as age 14"],a16:B16,a17:["Same as age 16"],permit:false,permitNote:"Certificate recommended"},
  MO:MA_DEF,NE:MA_DEF,NM:MA_DEF,
  AK:{...MA_DEF,permit:true,permitNote:"Work permit required for all minors"},
  AZ:{a14:[...B14,"Work permit required (under 16)"],a15:["Same as age 14","Work permit required"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Required under 16"},
  CA:{a14:["3hrs/school day","18hrs/school wk","8hrs/non-school day","48hrs/summer wk","7am-7pm school nights","7am-9pm non-school nights","DLSE work permit required"],a15:["Same as age 14","DLSE work permit required"],a16:["4hrs/school day","28hrs/school wk","8hrs/non-school day","48hrs/non-school wk","Until 10pm school nights","DLSE work permit required"],a17:["Same as age 16","DLSE work permit required"],permit:true,permitNote:"DLSE work permit required for ALL minors under 18"},
  CO:{a14:[...B14,"Work permit required (under 16)"],a15:["Same as age 14","Work permit required"],a16:[...B16,"Work permit required"],a17:["Same as age 16"],permit:true,permitNote:"Required under 16"},
  CT:{...MA_DEF,permit:true,permitNote:"Work permit required under 18"},
  DE:{...MA_DEF,permit:true,permitNote:"Work permit required under 18"},
  FL:{a14:["3hrs/school day","15hrs/school wk (FL - stricter than FLSA)","8hrs/non-school day","40hrs/non-school wk","7am-7pm (9pm Jun 1 - Labor Day)","Work permit required"],a15:["Same as age 14","Work permit required"],a16:["8hrs/day","30hrs/school wk","40hrs/non-school wk","Until 11pm school nights","Work permit required"],a17:["Same as age 16","Work permit required"],permit:true,permitNote:"Work permit required under 18"},
  HI:{a14:[...B14,"Work permit required"],a15:["Same as age 14","Work permit required"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Required under 16"},
  IL:{a14:[...B14,"Employment certificate required","7am-7pm school days"],a15:["Same as age 14","Employment certificate required"],a16:[...B16,"Employment certificate required"],a17:["Same as age 16","Employment certificate required"],permit:true,permitNote:"Employment certificate required for minors under 16"},
  MD:{a14:[...B14,"Work permit required (under 16)"],a15:["Same as age 14","Work permit required"],a16:[...B16,"Work permit required"],a17:["Same as age 16","Work permit required"],permit:true,permitNote:"Required under 18"},
  MA:{a14:["3hrs/school day","18hrs/school wk","8hrs/non-school day","40hrs/non-school wk","Until 9pm school year","Working papers required"],a15:["Same as age 14","Working papers required"],a16:["9hrs/day","48hrs/wk during school","Until 10pm Sun-Thu","Working papers required"],a17:["Same as age 16","Working papers required"],permit:true,permitNote:"Working papers required under 18"},
  ME:{...MA_DEF,permit:true,permitNote:"Work permit required"},
  MI:{...MA_DEF,permit:true,permitNote:"Work permit required under 18"},
  MN:{a14:[...B14,"Work permit required (under 16)"],a15:["Same as age 14","Work permit required"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Required under 16"},
  NV:{a14:[...B14,"Work permit required (under 17)"],a15:["Same as age 14","Work permit required"],a16:[...B16,"Work permit required"],a17:["No hour restrictions","Work permit required","No hazardous work"],permit:true,permitNote:"Required under 17"},
  NJ:{a14:["3hrs/school day","18hrs/school wk","8hrs/non-school day","40hrs/non-school wk","Until 7pm school days","Work permit required"],a15:["Same as age 14","Work permit required"],a16:["6hrs/school day","40hrs/school wk","48hrs/non-school wk","Work permit required"],a17:["8hrs/day","40hrs/school wk","50hrs/non-school wk","Work permit required"],permit:true,permitNote:"Working papers required under 18"},
  NY:{a14:["3hrs/school day","18hrs/school wk","8hrs/non-school day","40hrs/non-school wk","Until 7pm (9pm Jun 21 - Labor Day)","Working papers required"],a15:["Same as age 14","Working papers required"],a16:["4hrs/school day","28hrs/school wk","8hrs/non-school day","48hrs/non-school wk","Until 10pm","Working papers required"],a17:["8hrs/day","28hrs/school wk","48hrs/non-school wk","Until midnight","Working papers required"],permit:true,permitNote:"Working papers (employment certificate) required under 18"},
  OH:{a14:[...B14,"Work permit required"],a15:["Same as age 14","Work permit required"],a16:[...B16,"Work permit required"],a17:["Same as age 16","Work permit required"],permit:true,permitNote:"Required under 18"},
  OR:{a14:[...B14,"Work permit required","No work during school hours"],a15:["Same as age 14","Work permit required"],a16:[...B16,"Until 10pm school nights","Work permit required"],a17:["Same as age 16","Work permit required"],permit:true,permitNote:"Work permit required under 18"},
  PA:{a14:["3hrs/school day","18hrs/school wk","8hrs/non-school day","40hrs/non-school wk","Until 7pm school days","Work permit required"],a15:["Same as age 14","Work permit required"],a16:["8hrs/day","28hrs/school wk","48hrs/non-school wk","Until 12am Fri-Sat","Work permit required"],a17:["8hrs/day","28hrs/school wk","48hrs/non-school wk","Until 12am","Work permit required"],permit:true,permitNote:"PA Child Labor Act strictly enforced"},
  RI:{...MA_DEF,permit:true,permitNote:"Work permit required"},
  VA:{a14:[...B14,"Work permit required (under 16)"],a15:["Same as age 14","Work permit required"],a16:[...B16,"Work permit required"],a17:["Same as age 16","Work permit required"],permit:true,permitNote:"Required under 16"},
  VT:{a14:[...B14,"Work permit required (under 16)"],a15:["Same as age 14"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Required under 16"},
  WA:{a14:["3hrs/school day","16hrs/school wk (WA - stricter than FLSA)","8hrs/non-school day","40hrs/non-school wk","7am-7pm (9pm Jun 1 - Labor Day)","Work permit required"],a15:["Same as age 14","Work permit required"],a16:["4hrs/school day","20hrs/school wk","8hrs/non-school day","48hrs/non-school wk","Until 10pm school nights","Work permit required"],a17:["Same as age 16","Work permit required"],permit:true,permitNote:"Work permit required under 18"},
  WI:{a14:[...B14,"Work permit required (under 16)"],a15:["Same as age 14"],a16:B16,a17:["Same as age 16"],permit:true,permitNote:"Required under 16"},
};

var CASES=[
  {yr:2025,co:"Starbucks",type:"Fair Workweek",pen:"$38.9M",who:"~8,000 NYC workers",sev:"critical",detail:"500,000+ violations since 2021: irregular schedules, hours cut over 15% without notice."},
  {yr:2024,co:"Chipotle (Seattle)",type:"Scheduling/Sick Leave",pen:"$2.9M",who:"Seattle workers",sev:"high",detail:"Failed sick leave accrual rate; retaliated against workers; violated advance notice rules."},
  {yr:2024,co:"McDonald's (CA)",type:"Wage Theft/Daily OT",pen:"$1.2M",who:"~300 workers",sev:"high",detail:"Failure to pay daily OT on shifts exceeding 8hrs; meal period violations."},
  {yr:2024,co:"Denny's (FL)",type:"Tip Credit/80-20 Rule",pen:"$620K",who:"Servers, bussers",sev:"high",detail:"Applied tip credit to employees spending over 20% of time on non-tipped duties."},
  {yr:2023,co:"Domino's (NY)",type:"Minor Labor/Wage",pen:"$900K",who:"Delivery minors",sev:"critical",detail:"Minors on hazardous delivery routes (e-bikes); no working papers; school-week hour violations."},
  {yr:2023,co:"Panera Bread (IL)",type:"Fair Workweek",pen:"$280K",who:"Chicago locations",sev:"medium",detail:"Failed 14-day advance notice; did not pay premiums for last-minute schedule changes."},
];

var FEDERAL_UPDATES=[
  {cat:"Tax/Payroll",title:"OBBBA No Tax on Tips & Overtime - W-2 Reporting Effective Jan 1 2026",date:"Jul 2025 (signed); Jan 1 2026 (W-2 reporting)",status:"Active",sev:"critical",detail:"One Big Beautiful Bill Act signed Jul 4 2025. Employees may deduct up to $25K qualified tips and $12.5K ($25K joint) qualified OT premium from federal income tax (tax years 2025-2028). Phase-out begins $150K AGI single / $300K joint. Employer compliance burden: starting 2026 W-2s, must separately report qualified tips (Box 12 Code TP), qualified OT comp (Box 12 Code TT), and Treasury Tipped Occupation Code TTOC (Box 14b). FICA/Medicare still apply. Restaurant employers must update payroll, timekeeping, and HR systems before year-end 2026 W-2 filing.",src:"https://www.irs.gov/newsroom/one-big-beautiful-bill-provisions"},
  {cat:"FLSA",title:"OT Salary Threshold - Reverted to $35,568",date:"Nov 2024 (court vacated)",status:"Reverted",sev:"medium",detail:"Biden DOL raised threshold to $58,656/yr; Texas federal court vacated Nov 2024. Threshold remains $35,568 ($684/wk) federally. Trump DOL has not yet issued replacement rule. Restaurant managers and shift leads near the old threshold remain vulnerable to reclassification when a new rule is issued. CA state threshold separately set at $70,304 (2026); WA $80,168.40 (2026).",src:"https://www.dol.gov/agencies/whd/overtime"},
  {cat:"Tip Credit",title:"80/20/30 Rule Vacated by 5th Circuit (2024)",date:"Aug 2024",status:"Vacated",sev:"medium",detail:"Restaurant Law Center v. DOL: 5th Circuit vacated the Biden 80/20/30 rule that limited tip-credit work to 20% non-tipped duties + 30-min consecutive cap. DOL removed it from regulations in 2024. Currently no time limits on tip-credit work in jurisdictions that follow the 5th Circuit ruling, provided work is part of the tipped occupation. Other circuits may apply different standards. Some state laws still impose limits (e.g., MA, CT). Watch for new DOL rulemaking.",src:"https://www.dol.gov/agencies/whd/restaurants"},
  {cat:"Child Labor",title:"DOL Child Labor Enforcement Surge",date:"2024-2025",status:"Active",sev:"critical",detail:"DOL investigated 950+ cases in 2024 involving minors. Restaurant industry is the #1 cited sector. Focus areas: kitchen equipment operation, delivery routes (including e-bikes), hazardous equipment, and hours violations during school weeks.",src:"https://www.dol.gov/agencies/whd/child-labor"},
  {cat:"I-9",title:"Remote I-9 Verification Expired",date:"Aug 2023",status:"Expired",sev:"medium",detail:"COVID-era remote I-9 verification ended Aug 2023. All I-9s must now be physically inspected (or via DHS-authorized E-Verify alternative for qualified employers). Employers who used remote inspection during the pandemic must have completed reverification. Ongoing audit risk for operators who did not complete the reverification process.",src:"https://www.uscis.gov/i-9-central"},
  {cat:"Tip Credit",title:"Dual Jobs / Manager Tip Pooling Enforcement",date:"2024-Ongoing",status:"Active",sev:"high",detail:"DOL enforces FLSA Section 3(m) prohibition on managers/supervisors keeping tips. Average back-wage assessment is $1,400 per worker. Tip pool inclusion of back-of-house only allowed when employer pays full minimum wage (no tip credit taken).",src:"https://www.dol.gov/agencies/whd/restaurants"},
  {cat:"Joint Employment",title:"Joint Employer Rule Withdrawn",date:"Mar 2024",status:"Resolved",sev:"medium",detail:"Biden-era joint employer rule was vacated by courts. Franchisors are generally not liable for franchisee wage violations under the current rule. However, the current administration may revisit this standard, which could create large-scale liability exposure for franchise systems.",src:"https://www.dol.gov/agencies/whd/flsa"},
];

var SCHED_ACTIVE=[
  {id:"sf",j:"San Francisco, CA",type:"City",state:"CA",law:"Formula Retail Employee Rights Ordinances",scope:"Formula retail (40+ locations worldwide) with 20+ employees in SF",eff:"Jul 2015",notice:"2 weeks",restaurant:true,r:"high",rules:["2-week advance schedule posting required","Predictability pay for employer-initiated changes after posting","Offer additional hours to existing part-time employees before hiring","Good faith estimate of hours at hire","Right to request flexible or predictable schedule"],penalties:"$50-$500 per violation; OLSE enforcement",notes:"First major Fair Workweek law in the US. Covers formula retail chains with 40+ global locations.",src:"https://sfgov.org/olse/formula-retail-employee-rights-ordinances"},
  {id:"sanjose",j:"San Jose, CA",type:"City",state:"CA",law:"Opportunity to Work Ordinance",scope:"Employers with 36+ part-time employees in San Jose",eff:"Mar 2017",notice:"N/A (access to hours law)",restaurant:true,r:"medium",rules:["Offer additional hours to existing qualified part-time employees before hiring new staff","Offer posted in writing at workplace for 3+ business days","Employee has 3 business days to respond","Anti-retaliation protections"],penalties:"Civil penalties; San Jose Office of Equality Assurance enforcement",notes:"Focuses on access to hours rather than advance notice. Directly impacts restaurants relying on part-time staff.",src:"https://www.sanjoseca.gov/your-government/departments-offices/city-manager/office-of-equality-assurance/opportunity-to-work"},
  {id:"emeryville",j:"Emeryville, CA",type:"City",state:"CA",law:"Fair Workweek Ordinance",scope:"Retail and food service with 56+ employees globally and 20+ in Emeryville",eff:"Jul 2018",notice:"14 days",restaurant:true,r:"high",rules:["14-day advance schedule notice required","Good faith estimate of hours and schedule at hire","Predictability pay (1hr at regular rate) for employer-initiated changes","Right to rest: 11 hours between shifts (1.5x premium if less)","Offer additional hours to existing part-time employees before hiring"],penalties:"Civil action; $50/day per employee (max $1,000/employee/year); back pay",notes:"One of the earliest comprehensive Fair Workweek laws covering food service directly.",src:"https://www.ci.emeryville.ca.us/1073/Fair-Workweek"},
  {id:"seattle",j:"Seattle, WA",type:"City",state:"WA",law:"Secure Scheduling Ordinance",scope:"Food service and retail with 500+ employees worldwide",eff:"Jul 2017",notice:"14 days",restaurant:true,r:"high",rules:["14-day advance schedule posting required","Good faith estimate of hours, days, and locations at hire","Offer additional hours to existing employees (72hr acceptance window)","Clopening premium: 1.5x pay if less than 10 hours between shifts","Premium pay for shifts cancelled with less than 14 days notice"],penalties:"Civil penalties; back wages; reinstatement; Seattle OLS enforcement",notes:"Chipotle paid $2.9M settlement in 2024 for violations here. Seattle OLS conducts proactive audits.",src:"https://www.seattle.gov/laborstandards/ordinances/secure-scheduling"},
  {id:"oregon",j:"Oregon (Statewide)",type:"State",state:"OR",law:"Fair Work Week Act (SB 828)",scope:"Retail, food service, and hospitality employers with 500+ employees worldwide",eff:"Jul 2018",notice:"14 days",restaurant:true,r:"high",rules:["14-day advance schedule posting required","Good faith estimate of median hours and schedule at hire","Predictability pay: $1/hr extra for changes within the 14-day notice window","Clopening premium: 1.5x pay if less than 10 hours between shifts","Offer additional hours to existing part-time employees before hiring new workers"],penalties:"Civil penalties; Oregon BOLI enforcement; back pay; attorney fees",notes:"First statewide Fair Workweek law in the US. New digital break waiver recordkeeping required Jul 2026.",src:"https://www.oregon.gov/boli/workers/Pages/fair-work-week.aspx"},
  {id:"nyc-ff",j:"New York City - Fast Food",type:"City",state:"NY",law:"NYC Fair Workweek Law (Fast Food)",scope:"Fast food employers with 30+ locations nationwide",eff:"Nov 2017",notice:"14 days",restaurant:true,r:"high",rules:["14-day advance schedule notice required","No clopening without employee written consent plus $100 premium","Good faith estimate of schedule provided at hire","Offer additional hours to current employees before new hires (3 days to respond)","Premium pay for schedule changes within 14 days: $10-$75/shift"],penalties:"$500-$2,500 per violation; NYC DCWP enforcement; proactive audits",notes:"Most aggressively enforced nationally. Starbucks paid $38.9M in 2025 for 500,000+ violations.",src:"https://www.nyc.gov/site/dca/about/fair-workweek-law.page"},
  {id:"nyc-retail",j:"New York City - Retail",type:"City",state:"NY",law:"NYC Fair Workweek Law (Retail)",scope:"Retail employers with 20+ employees in NYC",eff:"Nov 2019",notice:"72 hours",restaurant:false,r:"high",rules:["No on-call scheduling","72-hour advance notice required for any schedule changes","No shift cancellations within 72 hours without employee consent","Written schedule must be posted and provided to each employee"],penalties:"Civil penalties; NYC DCWP enforcement",notes:"Covers retail broadly including food retail. Restaurant retail components may be covered.",src:"https://www.nyc.gov/site/dca/about/fair-workweek-law.page"},
  {id:"philadelphia",j:"Philadelphia, PA",type:"City",state:"PA",law:"Fair Workweek Employment Standards Ordinance",scope:"Retail, food service, hospitality with 250+ employees AND 30+ locations worldwide",eff:"Jan 2020",notice:"10 days (expanding to 14)",restaurant:true,r:"high",rules:["10-day advance schedule notice (expanding to 14 days)","Good faith estimate of hours, days, and locations at hire","Right of first refusal: existing employees offered new hours before outside hiring","Predictability pay (1hr at regular rate) for changes inside notice window"],penalties:"$100-$2,000 per violation; Philadelphia OWP enforcement",notes:"Covers major restaurant chains with 30+ locations. Philadelphia OWP actively enforces.",src:"https://www.phila.gov/departments/office-of-worker-protections/"},
  {id:"chicago",j:"Chicago, IL",type:"City",state:"IL",law:"Chicago Fair Workweek Ordinance",scope:"Restaurant with 30+ locations AND 250+ employees; others 100+ employees",eff:"Jul 2020",notice:"14 days",restaurant:true,r:"high",rules:["14-day advance schedule posting required","Good faith estimate of schedule at hire","Right to 11-hour rest between shifts (1.25x premium if employee consents to less)","Predictability pay (1hr at regular rate) for employer-initiated changes","Right to decline hours not on original schedule","Offer additional hours to existing employees before new hires"],penalties:"$300-$500 per shift violation; Chicago OLR enforcement",notes:"Panera Bread paid $280K in 2023 for violations. Threshold reduction from 100 to 50 employees proposed.",src:"https://www.chicago.gov/city/en/depts/dol/provdrs/labor-standards.html"},
  {id:"minneapolis",j:"Minneapolis, MN",type:"City",state:"MN",law:"Minneapolis Workplace Regulations - Scheduling",scope:"Employers with 250+ employees globally in retail, food service, and hospitality",eff:"Jan 2021",notice:"14 days",restaurant:true,r:"medium",rules:["14-day advance schedule notice required","Good faith estimate of hours and schedule at hire","Predictability pay for employer-initiated changes within notice window","Offer additional hours to existing employees before new hires"],penalties:"Civil penalties; Minneapolis Dept of Civil Rights enforcement",notes:"Covers large restaurant chains (250+ employees). Enforced alongside Minneapolis minimum wage ($15.57/hr).",src:"https://www.minneapolismn.gov/government/programs-initiatives/workplace-regulations/"},
  {id:"la-city",j:"Los Angeles, CA (City)",type:"City",state:"CA",law:"Fair Work Week Ordinance",scope:"Retail establishments with 300+ employees worldwide",eff:"Apr 2023",notice:"14 days",restaurant:false,r:"high",rules:["14-day advance schedule posting required","Good faith estimate of hours, days, times, and locations at hire","Offer additional hours to existing employees before new hires","Right to rest: 10 hours between shifts (1.5x premium if less)","Predictability pay (1hr at regular rate) for employer-initiated changes"],penalties:"Civil action; back pay and liquidated damages; LA BCA enforcement",notes:"Currently covers retail. Restaurant concepts with retail sections may be covered.",src:"https://wagesla.lacity.org/"},
  {id:"berkeley",j:"Berkeley, CA",type:"City",state:"CA",law:"Fair Workweek Employment Standards Ordinance (BMC 13.102)",scope:"Restaurants with 100+ employees globally; retail/building services with 56+ globally; all need 10+ in Berkeley",eff:"Jan 12, 2024",notice:"14 days",restaurant:true,r:"high",rules:["14-day advance schedule notice required","Good faith estimate provided on first day of employment","Predictability pay even for minor changes - sending employee home 15 min early triggers pay","Right to rest: 11 hours between shifts (1.5x premium if less)","Offer additional hours to existing part-time employees (24hr window) before hiring"],penalties:"$50/day per employee (max $1,000/employee/year); civil action; back pay",notes:"All major QSR and fast casual chains with Berkeley locations are covered (100+ global employees).",src:"https://berkeleyca.gov/doing-business/operating-berkeley/workforce-standards-and-enforcement"},
  {id:"evanston",j:"Evanston, IL",type:"City",state:"IL",law:"Evanston Fair Workweek Ordinance",scope:"Retail, hospitality, food service, manufacturing, warehouse with 100+ employees",eff:"Jan 2024",notice:"14 days",restaurant:true,r:"medium",rules:["14-day advance schedule posting required","Good faith estimate of hours and schedule at hire","Predictability pay for employer-initiated changes","Right to rest: 11 hours between shifts (premium pay if less)","Offer additional hours to existing employees before new hires"],penalties:"Civil penalties; Evanston City enforcement",notes:"Passed in 2023, operative January 2024. Mirrors Chicago's ordinance.",src:"https://www.cityofevanston.org/government/city-council/ordinances"},
  {id:"la-county",j:"Los Angeles County, CA (Unincorporated)",type:"County",state:"CA",law:"Fair Work Week Ordinance - Unincorporated LA County",scope:"Retail establishments with 300+ employees worldwide in unincorporated LA County areas",eff:"Jul 1, 2025",notice:"14 days",restaurant:false,r:"high",rules:["14-day advance schedule posting required","Good faith estimate of schedule at hire and within 10 days of employee request","Right to decline schedule changes with less than 14-day notice","Right to rest: 10 hours between shifts (1.5x premium if less)","Predictability pay for employer-initiated changes"],penalties:"Civil action; back pay; LA County DCBA enforcement",notes:"Covers unincorporated LA County areas: parts of East LA, Compton, Lennox, Altadena. Effective July 1, 2025.",src:"https://dcba.lacounty.gov/"},
];

var SCHED_UPCOMING=[
  {id:"ny-state",j:"New York State",type:"State",state:"NY",law:"Statewide Fair Workweek Expansion - Proposed",scope:"All fast food and restaurant employers statewide (not just NYC)",eff:"Pending 2026-2027",notice:"14 days (proposed)",restaurant:true,impact:"high",rules:["14-day advance schedule notice for ALL NY restaurant locations","Call-in pay and premiums mirroring NYC law","Good faith estimate at hire","Offer hours to existing employees before new hires"],penalties:"TBD - expected to mirror NYC ($500-$2,500/violation)",notes:"Under active legislative consideration. Would extend NYC Fair Workweek rules to all 30+ location operators statewide.",src:"https://www.nysenate.gov/legislation"},
  {id:"chicago-thresh",j:"Chicago, IL - Threshold Reduction",type:"City",state:"IL",law:"Chicago Fair Workweek Amendment - Lower Threshold",scope:"Would extend to employers with 50+ employees (currently 100+)",eff:"Proposed 2026",notice:"14 days (same)",restaurant:true,impact:"medium",rules:["All current Chicago Fair Workweek rules would apply","Threshold drops from 100 to 50 employees","Would capture many mid-size restaurant groups currently exempt"],penalties:"Same as current: $300-$500/shift violation",notes:"Pending Chicago City Council vote. Would significantly expand coverage to mid-size operators.",src:"https://www.chicago.gov/city/en/depts/dol/provdrs/labor-standards.html"},
  {id:"seattle-delivery",j:"Seattle, WA - Delivery Expansion",type:"City",state:"WA",law:"Secure Scheduling - Delivery Platform Expansion",scope:"Restaurants using third-party delivery platforms in Seattle",eff:"2026",notice:"14 days (extended context)",restaurant:true,impact:"medium",rules:["New scheduling obligations for delivery workers from restaurant locations","Record-keeping and notification requirements","Extends Secure Scheduling to app-based delivery workers"],penalties:"TBD - same framework as Secure Scheduling ordinance",notes:"Seattle OLS rulemaking in progress. Affects all Seattle restaurants using DoorDash, UberEats, Grubhub.",src:"https://www.seattle.gov/laborstandards"},
  {id:"denver",j:"Denver, CO",type:"City",state:"CO",law:"Denver Fair Workweek Ordinance - Proposed",scope:"Retail and food service employers with 250+ employees (proposed)",eff:"Pending 2026-2027",notice:"14 days (proposed)",restaurant:true,impact:"medium",rules:["14-day advance schedule notice","Premium pay for changes within notice window","Offer hours to existing employees before new hires","Good faith estimate at hire"],penalties:"TBD",notes:"Under consideration by Denver City Council. Colorado already has COMPS Order, HFWA, and daily OT.",src:"https://denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Denver-Human-Rights-Community-Partnerships"},
  {id:"nj-state",j:"New Jersey (Statewide)",type:"State",state:"NJ",law:"New Jersey Fair Workweek Act - Proposed",scope:"Food service and retail with 250+ employees (proposed)",eff:"Pending 2026-2027",notice:"14 days (proposed)",restaurant:true,impact:"high",rules:["14-day advance schedule notice statewide","Predictability pay for changes","Good faith estimate at hire","Offer hours to existing employees before hiring"],penalties:"TBD",notes:"Reintroduced in NJ Legislature. Would be the third state with statewide fair scheduling after Oregon.",src:"https://www.njleg.state.nj.us/"},
  {id:"pittsburgh",j:"Pittsburgh, PA",type:"City",state:"PA",law:"Pittsburgh Fair Scheduling Ordinance - Re-Proposed",scope:"Retail and food service with 250+ employees (proposed)",eff:"Pending 2026",notice:"14 days (proposed)",restaurant:true,impact:"medium",rules:["14-day advance schedule notice","Predictability pay for changes","Good faith estimate at hire","Offer hours to existing employees first"],penalties:"TBD",notes:"Previously challenged. Re-proposed in 2025. PA state preemption risks may affect implementation.",src:"https://pittsburghpa.gov/council/"},
  {id:"maryland-state",j:"Maryland (Statewide)",type:"State",state:"MD",law:"Maryland Fair Scheduling Act - Proposed",scope:"Food service and retail with 500+ employees (proposed)",eff:"Pending 2027",notice:"14 days (proposed)",restaurant:true,impact:"medium",rules:["14-day advance schedule posting","Predictability pay for changes","Good faith estimate at hire","Offer hours to existing employees before new hires"],penalties:"TBD",notes:"Under consideration in Maryland General Assembly.",src:"https://mgaleg.maryland.gov/"},
  {id:"boston",j:"Boston, MA",type:"City",state:"MA",law:"Boston Fair Workweek Ordinance - Proposed",scope:"Retail and food service with 250+ employees (proposed)",eff:"Pending 2026-2027",notice:"14 days (proposed)",restaurant:true,impact:"medium",rules:["14-day advance schedule notice","Predictability pay for changes","Good faith estimate at hire","Offer hours to existing employees before hiring"],penalties:"TBD",notes:"Under active consideration by Boston City Council. Massachusetts has no statewide Fair Workweek law.",src:"https://www.boston.gov/departments/city-council"},
  {id:"dc",j:"Washington, DC",type:"City",state:"DC",law:"DC Fair Scheduling Act - Proposed",scope:"Retail and food service with 100+ employees (proposed)",eff:"Pending 2026-2027",notice:"14 days (proposed)",restaurant:true,impact:"medium",rules:["14-day advance schedule notice","Predictability pay for changes","Good faith estimate at hire","Offer additional hours to existing employees before new hires"],penalties:"TBD",notes:"DC Fair Workweek ordinance under active DC Council consideration.",src:"https://dccouncil.gov/"},
  {id:"ca-fast",j:"California - FAST Recovery Act",type:"State",state:"CA",law:"Fast Food Council - Scheduling Standards Authority",scope:"Fast food chains with 60+ locations nationally",eff:"2026 (ongoing quarterly meetings)",notice:"TBD - Council rulemaking authority",restaurant:true,impact:"high",rules:["Fast Food Council has authority to set scheduling standards beyond $20/hr minimum","May mandate advance schedule notice for all CA QSR chain locations","May set premium pay rules for schedule changes"],penalties:"TBD - CA Labor Commissioner enforcement",notes:"FAST Recovery Act (AB 1228) gives the Council authority over wages AND working conditions for all chains with 60+ locations.",src:"https://www.dir.ca.gov/dlse/fast-food-council.html"},
  {id:"ct-state",j:"Connecticut (Statewide)",type:"State",state:"CT",law:"Connecticut Fair Workweek Act - Proposed",scope:"Retail and food service with 250+ employees (proposed)",eff:"Pending 2027",notice:"14 days (proposed)",restaurant:true,impact:"medium",rules:["14-day advance schedule notice statewide","Predictability pay for changes","Good faith estimate at hire","Offer hours to existing employees before new hires"],penalties:"TBD",notes:"Connecticut is actively considering statewide predictive scheduling legislation.",src:"https://www.cga.ct.gov/"},
];

var UPCOMING=[
  // ═══ CALIFORNIA - Major 2026 Changes ═══
  {cat:"Min Wage",j:"California",title:"State Min Wage: $16.50 to $16.90 / Fast Food Stays $20",eff:"Jan 1, 2026",yr:2026,detail:"California statewide minimum wage increases to $16.90/hr. Fast food employers (60+ locations) remain at $20/hr set by FAST Act. Exempt salary threshold rises to $70,304/yr ($1,352/week). Healthcare workers already at higher industry rates. All employers must update payroll and wage notices by December 2025.",impact:"high",src:"https://www.dir.ca.gov/dlse/faq_minimumwage.htm"},
  
  {cat:"Restaurant-Specific",j:"California",title:"SB 648 - Labor Commissioner Tip Enforcement Expansion",eff:"Jan 1, 2026",yr:2026,detail:"Labor Commissioner gains direct authority to investigate tip violations, issue citations, and file civil actions. New penalties: $100 per employee per pay period (first violation), $250 per employee per pay period (subsequent violations). Restaurants must ensure tip pooling policies exclude managers/supervisors, pay credit card tips by next regular payday, and document tip distributions. Enforcement expected to significantly increase in 2026.",impact:"high",src:"https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB648"},
  
  {cat:"Restaurant-Specific",j:"California",title:"AB 2166 - Training Cost Repayment Ban",eff:"Jan 1, 2026",yr:2026,detail:"Employers can no longer require employees to repay training costs, sign-on bonuses, or fees if employee leaves. Applies to all employment agreements dated Jan 1, 2026 or later. Restaurant training programs, certification courses, and onboarding incentives cannot include repayment clauses. Remove all repayment language from contracts before year-end 2025.",impact:"medium",src:"https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2166"},
  
  {cat:"Sick Leave",j:"California",title:"AB 406 - Expanded Safe Time Leave Definitions",eff:"Jan 1, 2026",yr:2026,detail:"Expands definition of safe time under CA PSL to cover additional domestic violence, sexual assault, and stalking protections. Increases safe time use cap. Employees can use PSL for counseling, safety planning, relocation assistance, and legal proceedings related to qualifying events. Update employee handbooks, manager training materials, and leave policy documentation.",impact:"medium",src:"https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB406"},
  
  {cat:"Restaurant-Specific",j:"California",title:"AB 2499 - Worker Rights Notice Distribution Requirement",eff:"Feb 1, 2026",yr:2026,detail:"Employers must distribute new written notice outlining worker rights to ALL current employees by February 1, 2026, and to new hires upon onboarding. Labor Commissioner provides template notice covering wage, hour, break, sick leave, and anti-retaliation protections. Penalties for non-distribution. Include in onboarding packets and post in breakrooms.",impact:"medium",src:"https://www.dir.ca.gov/"},
  
  {cat:"Restaurant-Specific",j:"California",title:"AB 524 - Emergency Contact Designation Requirement",eff:"Mar 30, 2026",yr:2026,detail:"Employers must allow all employees to designate emergency contacts by March 30, 2026. If employee is arrested or detained on worksite (or off-site during work hours if employer has actual knowledge), employer must notify designated emergency contact. Designed to protect workers from immigration enforcement. Penalties up to $500 per employee for failure to make mandatory notifications. Labor Commissioner provides notice templates.",impact:"medium",src:"https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB524"},
  
  {cat:"Restaurant-Specific",j:"California",title:"AB 592 - Mandatory Pest Prevention Training for Restaurant Workers",eff:"Jan 1, 2026",yr:2026,detail:"Restaurant employees must receive training on pest prevention and pest control procedures (new Health & Safety Code 114266). Develop written pest prevention policy, train ALL applicable employees on prevention/response procedures, maintain records documenting training completion and ongoing monitoring of vermin activity (dates, observations, corrective actions). Health department violations and fines for non-compliance. Inspected during routine inspections.",impact:"medium",src:"https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB592"},
  
  {cat:"Restaurant-Specific",j:"California",title:"SB 858 - COVID-19 Recall and Rehire Rights Extended to Jan 1, 2027",eff:"Active through Jan 1, 2027",yr:2026,detail:"COVID-19 recall and reinstatement requirements extended through January 1, 2027. Applies to hospitality employers with 50+ rooms (hotels), airport hospitality/service providers, large event venues, and commercial building janitorial/security operations. Must notify and rehire qualified individuals laid off for COVID-related reasons. 3-year records retention requirement for layoffs and rehiring. DLSE enforcement active.",impact:"medium",src:"https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB858"},
  
  {cat:"Restaurant-Specific",j:"California",title:"SB 331 - Pay Data Reporting Privacy + Expansion to 23 Categories (2027)",eff:"Jan 1, 2027",yr:2027,detail:"Employers 100+ employees must collect demographic data for pay-data reporting separately from personnel files (privacy protection). Effective January 1, 2027, job categories expand from 10 to 23 for granular pay-equity analysis. Civil penalties now MANDATORY (not discretionary) when CRD imposes penalties for failure to file. Individual-level data remains confidential. Prepare for 2027 expanded reporting now.",impact:"medium",src:"https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240SB331"},
  
  // ═══ COLORADO - 2026 Changes ═══
  {cat:"Min Wage",j:"Colorado",title:"Edgewater Tip Credit Increase: $3.02 to $4.67",eff:"Jan 1, 2026",yr:2026,detail:"Edgewater became first Colorado city to increase tip credit under HB25-1208. Edgewater minimum wage is $18.17/hr in 2026, but higher tip credit ($4.67 vs. state $3.02) keeps tipped minimum wage at $13.50/hr, providing relief for restaurants. State law (HB25-1208) allows local governments to increase tip credit if they pass higher minimum wage than state. Monitor for other CO cities adopting similar approach.",impact:"medium",src:"https://leg.colorado.gov/bills/hb25-1208"},
  
  {cat:"Restaurant-Specific",j:"Colorado",title:"SB25-285 - Retail Food Establishment License Fee Increases",eff:"25% increase 2026 / 20% in 2027 / 20% in 2028",yr:2026,detail:"Three-year phased increase in retail food establishment license fees: 25% increase in 2026, 20% in 2027, 20% in 2028. Budget for higher annual license costs starting Jan 2026. Check with local health departments for updated fee schedules.",impact:"low",src:"https://leg.colorado.gov/bills/sb25-285"},
  
  {cat:"Restaurant-Specific",j:"Colorado",title:"HB24-1371 - Enhanced Disability Discrimination Penalties",eff:"Jan 1, 2026",yr:2026,detail:"Fines for disability-related discrimination under Colorado Anti-Discrimination Act increase from $3,500 to $5,000 per defendant per violation. Review and update anti-discrimination policies to ensure compliance with state and local disability laws. Train managers on accommodation requirements and prohibited discriminatory practices.",impact:"medium",src:"https://leg.colorado.gov/bills/hb24-1371"},
  
  // ═══ NEW YORK - 2026 Changes ═══
  {cat:"Min Wage",j:"New York",title:"Downstate $16.50 to $17.00 / Upstate $15.50 to $16.00",eff:"Jan 1, 2026",yr:2026,detail:"NYC, Long Island, Westchester minimum wage increases to $17.00/hr. Rest of state increases to $16.00/hr. Overtime rates rise accordingly: $25.50/hr downstate, $24.00/hr upstate (1.5x for hours over 40/week). Fast food workers already at $17.00 downstate / $16.00 upstate. Hospitality workers must receive updated Notice of Pay per Wage Theft Prevention Act. Ensure payroll providers update rates timely.",impact:"high",src:"https://dol.ny.gov/minimum-wage-0"},
  
  {cat:"Overtime",j:"New York",title:"Exempt Salary Thresholds Increase with Minimum Wage",eff:"Jan 1, 2026",yr:2026,detail:"Minimum salary for exempt employees (administrative, executive, professional) increases to match 2x state minimum wage. Downstate exempt threshold rises accordingly. Upstate threshold also increases. Review all exempt employee salaries and job duties to ensure compliance. Misclassified exempt employees exposed to back pay liability for unpaid overtime. Plan salary adjustments before December 2025.",impact:"high",src:"https://dol.ny.gov/minimum-wage-0"},
  
  {cat:"Min Wage",j:"New York",title:"Annual CPI Indexing Begins 2027",eff:"Jan 1, 2027",yr:2027,detail:"Starting January 1, 2027, New York will adjust minimum wage rates annually based on inflation tied to Consumer Price Index for Urban Wage Earners and Clerical Workers (CPI-W). Automatic increases each year thereafter. Plan for annual wage increases permanently built into NY labor cost structure.",impact:"medium",src:"https://dol.ny.gov/minimum-wage-0"},
  
  // ═══ WASHINGTON - 2026 Major Changes ═══
  {cat:"Min Wage",j:"Washington",title:"State Min Wage $16.66 to $17.13 + Local Increases",eff:"Jan 1, 2026",yr:2026,detail:"Washington statewide minimum wage increases to $17.13/hr (highest in US). Local rates: Seattle $21.30, Tukwila $21.65, SeaTac $20.74 (hospitality/transport only), Bellingham $19.13, Renton variable by employer size. No tip credit - full rate required for ALL employees including tipped workers. Exempt salary threshold rises to $80,168.40/yr ($1,541.70/week). Update payroll before Dec 31, 2025.",impact:"high",src:"https://lni.wa.gov/workers-rights/wages/minimum-wage/"},
  
  {cat:"Sick Leave",j:"Washington",title:"PFML Job Protection Expansion - Phased Employer Size Reduction",eff:"Jan 1, 2026 (25+ EEs) / Jan 1, 2027 (15+ EEs) / Jan 1, 2028 (8+ EEs)",yr:2026,detail:"Paid Family and Medical Leave (PFML) job protection expanded. 2026: employers with 25+ employees must provide job protection (down from 50+). 2027: 15+ employees. 2028: 8+ employees. Employees qualify after 180 days employment (down from 12 months/1,250 hours). Employers must maintain health insurance during PFML and notify employees after 14 days on leave about job protection expiration and expected return date. Anti-leave-stacking provisions added.",impact:"high",src:"https://paidleave.wa.gov/"},
  
  {cat:"Sick Leave",j:"Washington",title:"SB 5101 - Hate Crime Victim Leave and Safety Accommodations",eff:"Jan 1, 2026",yr:2026,detail:"Washington Domestic Violence Leave law expanded to cover victims (and family members of victims) of hate crimes, including online hate crimes. Employers must provide reasonable unpaid leave and safety accommodations (schedule changes, transfers, reassignments) to these individuals, absent undue hardship. Employees can use Washington paid sick leave for hate crime victim recovery and legal proceedings.",impact:"medium",src:"https://app.leg.wa.gov/billsummary?BillNumber=5101&Year=2025"},
  
  {cat:"Restaurant-Specific",j:"Washington",title:"HB 1524 - Isolated Worker Protection Expansion + Enforcement",eff:"Jan 1, 2026",yr:2026,detail:"Expands 2019 isolated worker sexual violence protections. Isolated employees = workers spending 50%+ of time alone (janitorial, housekeeping, hotel/motel staff, night security, delivery drivers). Employers must document completion of required training on isolated worker protections, make panic buttons available, and provide records to L&I upon request. L&I enforcement authority expanded. First offense penalty $1,000+. Repeat violations up to $10,000. 17% of workplaces currently non-compliant.",impact:"high",src:"https://app.leg.wa.gov/billsummary?BillNumber=1524&Year=2025"},
  
  {cat:"Restaurant-Specific",j:"Washington",title:"HB 1747 - Fair Chance Act Expansion (Ban the Box)",eff:"Jul 1, 2026 (15+ EEs) / Jan 1, 2027 (all sizes)",yr:2026,detail:"Employers cannot conduct background checks until AFTER conditional job offer given. Effective July 1, 2026 for employers 15+ employees. January 1, 2027 for all employers. Cannot rescind offers based on arrest records or juvenile convictions. Adult convictions require legitimate business reason + written notice + procedures. Cannot post job ads with 'No Felons' or 'no criminal background' language. Train hiring managers before July 2026.",impact:"high",src:"https://app.leg.wa.gov/billsummary?BillNumber=1747&Year=2025"},
  
  {cat:"Break Laws",j:"Washington",title:"SB 5217 - Pregnancy Accommodation + Paid Lactation Breaks for ALL Employers",eff:"Jan 1, 2027",yr:2027,detail:"Pregnancy accommodation law extends to ALL employers (currently 15+ only). Employers must pay employees at regular rate for ALL breaks for expressing breast milk - in ADDITION to required meal and rest breaks. Paid lactation breaks required for 2 years after childbirth. Private location (not bathroom) required. L&I takes over enforcement from attorney general. Employers cannot request written certification from healthcare provider. Prepare policies and lactation spaces before Jan 2027.",impact:"high",src:"https://app.leg.wa.gov/billsummary?BillNumber=5217&Year=2025"},
  
  {cat:"Restaurant-Specific",j:"Washington",title:"SB 5041 - Unemployment Benefits for Striking Workers",eff:"Jan 1, 2026",yr:2026,detail:"Striking workers now eligible for unemployment benefits. Disqualification period: until second Sunday after strike begins OR strike ends (whichever first). After disqualification period + standard 1-week waiting period, eligible strikers receive up to 6 calendar weeks of benefits. If strike found unlawful in final judgment, workers cannot receive benefits and must repay. Locked-out workers eligible after standard waiting period (no strike disqualification).",impact:"medium",src:"https://app.leg.wa.gov/billsummary?BillNumber=5041&Year=2025"},
  
  {cat:"Restaurant-Specific",j:"Washington",title:"Equal Pay Act Job Posting Cure Period Sunsets Jul 27, 2027",eff:"Jul 27, 2027 (sunset)",yr:2027,detail:"Washington Equal Pay and Opportunities Act (EPOA) requires wage scale, salary range, benefits disclosure in job postings (15+ employees). Current law allows employers to 'cure' noncompliant postings within 5 business days of written notice (enacted 2025, expires Jul 27, 2027). After July 27, 2027, plaintiffs can sue directly without cure period. Potential damages $5,000 per violation + attorney fees. Ensure ALL job postings compliant before mid-2027.",impact:"high",src:"https://lni.wa.gov/workers-rights/wages/equal-pay-opportunities-act"},
  
  // ═══ FEDERAL UPDATES ═══
  {cat:"Overtime",j:"Federal (DOL)",title:"New OT Salary Threshold Rulemaking Expected 2026-2027",eff:"2026-2027",yr:2026,detail:"After $58,656 threshold vacated Nov 2024, new DOL rulemaking expected. Current threshold remains $35,568/yr ($684/week) per 2019 rule. Likely range for new proposal: $43,000-$55,000. Restaurant managers, shift leads, assistant managers most at risk of reclassification to non-exempt. Audit all exempt employee salaries and duties tests NOW. Each $5,000 salary increase = $2,400-$3,000 annual cost impact per employee if reclassified.",impact:"high",src:"https://www.dol.gov/agencies/whd/overtime/rulemaking"},
  
  {cat:"Tipped Wage",j:"Federal (Congress)",title:"WAGES Act - Federal Tip Credit Elimination (Reintroduced)",eff:"Pending 2026-2027",yr:2026,detail:"Reintroduced bill proposes phasing out federal $2.13 tipped minimum over 5 years to reach full minimum wage parity. No Senate majority as of March 2026. If passed, impacts all 43 states using tip credit. Estimated annual cost increase: $2,000-$5,000 per tipped employee. Monitor Congressional movement closely. National Restaurant Association actively lobbying against.",impact:"critical",src:"https://www.congress.gov/"},
  
  {cat:"Tipped Wage",j:"Federal (DOL)",title:"80/20 Tip Credit Rule - Continued Active Enforcement",eff:"2026 (ongoing)",yr:2026,detail:"Tipped employees cannot spend over 20% of shift on non-tipped duties (sidework, cleaning, restocking). Top restaurant industry violation per DOL WHD. Average back-wage assessment $1,400 per tipped employee. Violations trigger liquidated damages equal to back wages owed. Sidework, restocking, cleaning tasks most commonly cited. Time-tracking systems should separate tipped vs. non-tipped duties. Train managers on 20% threshold calculation.",impact:"high",src:"https://www.dol.gov/agencies/whd/restaurants"},
  
  {cat:"Child Labor",j:"Federal (DOL)",title:"DOL Child Labor Enforcement Surge - Penalties Increased to $71,818",eff:"2026 (ongoing)",yr:2026,detail:"DOL WHD enforcement budget increased. Max civil penalty now $71,818 per willful minor labor violation (up from prior levels). Restaurant industry #1 targeted sector. 950+ investigations in 2024. Priority areas: kitchen equipment operation (slicers, fryers), delivery routes (including e-bikes), late-night hours violations for 14-17 year olds, school-week hour violations. Conduct internal audit of minor employment practices immediately.",impact:"critical",src:"https://www.dol.gov/agencies/whd/child-labor"},
  
  {cat:"Break Laws",j:"Federal (DOL)",title:"PUMP Act - Nursing Break Enforcement Expansion to Exempt Employees",eff:"2026 (ongoing)",yr:2026,detail:"PUMP for Nursing Mothers Act enforcement expanding to salaried/exempt employees. Restaurants must provide private, non-restroom lactation space. No employer size exemption. Breaks under 20 min are PAID time per FLSA. Active WHD enforcement in 2026. Violations trigger complaints and potential back pay for unpaid nursing break time. Designate lactation spaces and train managers on PUMP Act requirements.",impact:"medium",src:"https://www.dol.gov/agencies/whd/nursing-mothers"},
  
  {cat:"Restaurant-Specific",j:"Federal (DOL)",title:"Section 7(i) Commissioned Employee OT Exemption Clarification",eff:"Jan 5, 2026",yr:2026,detail:"DOL Opinion Letter FLSA2026-4 clarifies Section 7(i) overtime exemption for commissioned restaurant employees (servers with percentage-based service charges). Regular rate threshold uses FEDERAL minimum wage ($7.25), not higher state minimums. Tips counted as 'compensation' ONLY if employer takes tip credit. Service charges = commissions. Impacts restaurants in high-minimum-wage states using service charges instead of tipping. Evaluate server compensation structures.",impact:"medium",src:"https://www.dol.gov/sites/dolgov/files/WHD/opinion-letters/FLSA/FLSA2026-4.pdf"},
  
  {cat:"Restaurant-Specific",j:"Federal (IRS)",title:"One Big Beautiful Bill Act - Qualified Overtime and Tip Deductions",eff:"2025-2028 (employee personal returns)",yr:2026,detail:"New federal income tax deductions for employees (not employers): (1) Qualified tips deduction up to $25,000/yr; (2) Qualified overtime compensation deduction up to $25,000/yr (covers FLSA overtime premium - the extra half of time-and-a-half). Phase-outs for high earners ($150K single / $300K married). Educate employees on new tax benefits - could improve retention and job satisfaction. Form 1099 reporting threshold increases from $600 to $2,000 starting 2026 (inflation-adjusted annually).",impact:"medium",src:"https://www.irs.gov/newsroom/one-big-beautiful-bill-provisions"},
  
  // ═══ FLORIDA ═══
  {cat:"Min Wage",j:"Florida",title:"Min Wage $14.00 to $15.00 / Tipped to $11.98",eff:"Sep 30, 2026",yr:2026,detail:"Florida Amendment 2 annual step increase. Minimum wage rises to $15.00/hr. Tipped minimum rises to $11.98/hr simultaneously (tip credit $3.02). Update POS and payroll systems before Aug 2026. All employers must post updated wage notices 30 days prior to effective date per FL law.",impact:"high",src:"https://floridajobs.org/workforce-board-resources/policy-and-technical-assistance/labor-laws"},
  
  // ═══ ALASKA ═══
  {cat:"Min Wage",j:"Alaska",title:"Min Wage $13.00 to $14.00 + Paid Sick Leave Active",eff:"Jul 1, 2026",yr:2026,detail:"Per 2024 Measure 1. No tip credit - full $14.00 required for ALL employees including tipped workers. Paid sick leave for ALL employers (1hr/30hrs up to 40hrs/yr) already in effect since Jul 2025. Update payroll systems before Jun 30.",impact:"medium",src:"https://labor.alaska.gov/lss/whhome.htm"},
  
  // ═══ OREGON ═══
  {cat:"Min Wage",j:"Oregon",title:"Statewide to $15.50 / Portland Metro to $16.80",eff:"Jul 1, 2026",yr:2026,detail:"Annual three-tier increase. No tip credit - full rate required. Portland Urban Growth Boundary rises to $16.80/hr. Non-urban areas to $14.20/hr. Update payroll before Jun 30 pay cycle. Oregon BOLI requires digital break waiver recordkeeping starting Jul 1, 2026 (see Break Laws entry).",impact:"high",src:"https://www.oregon.gov/boli/workers/Pages/minimum-wage.aspx"},
  
  {cat:"Break Laws",j:"Oregon",title:"BOLI Digital Break Waiver Recordkeeping Requirement",eff:"Jul 1, 2026",yr:2026,detail:"Oregon BOLI requiring digital recordkeeping of ALL meal break waivers and premium pay events for employers with 10+ locations. Paper waivers will no longer be accepted during audits. Timekeeping system integration required before Jun 30. Failure to maintain digital records = audit violations and potential penalties. Oregon strictly enforces 10-min paid rest per 4hrs and 30-min unpaid meal per 6hrs.",impact:"medium",src:"https://www.oregon.gov/boli/workers/Pages/meal-and-rest-periods.aspx"},
  
  // ═══ CONNECTICUT ═══
  {cat:"Min Wage",j:"Connecticut",title:"Min Wage $16.35 to $17.00",eff:"Jan 1, 2027",yr:2027,detail:"Multi-year staircase reaches $17.00. Tipped wage adjusts proportionally. Advance payroll system and labor cost model updates recommended before Q4 2026.",impact:"medium",src:"https://www.ctdol.state.ct.us/wgwkstnd/wage-hour.htm"},
  
  // ═══ COLORADO (additional) ═══
  {cat:"Min Wage",j:"Colorado",title:"Min Wage to $15+ (CPI-indexed)",eff:"Jan 1, 2027",yr:2027,detail:"Annual COMPS Order CPI adjustment expected to push statewide minimum above $15.00. Denver local rate increases proportionally above $18.50+. Updated COMPS Order published each October by CDLE.",impact:"medium",src:"https://cdle.colorado.gov/wages"},
  
  // ═══ WASHINGTON (additional) ═══
  {cat:"Min Wage",j:"Washington",title:"Min Wage to $17.00+ (CPI-indexed)",eff:"Jan 1, 2027",yr:2027,detail:"Annual CPI increase pushes statewide rate above $17.00. Seattle, Tukwila ($21+), SeaTac local rates all rise further. No tip credit statewide - full rate required for all employees.",impact:"high",src:"https://lni.wa.gov/workers-rights/wages/minimum-wage/"},
  
  // ═══ NEW JERSEY ═══
  {cat:"Min Wage",j:"New Jersey",title:"Min Wage to $16.00+ (CPI-indexed)",eff:"Jan 1, 2027",yr:2027,detail:"Annual CPI adjustment. Small and seasonal employer subrate also adjusts. Tipped rate changes accordingly. Final rate announced each October by NJ DOL.",impact:"medium",src:"https://www.nj.gov/labor/wageandhour/"},
  
  // ═══ MICHIGAN ═══
  {cat:"Tipped Wage",j:"Michigan",title:"Tip Credit Phase-Out Continues Annually to 2031",eff:"Feb 2026 (next step)",yr:2026,detail:"Michigan Supreme Court-ordered phase-out advances again in Feb 2026. Full MW parity required by 2031. Operators must model annual labor cost impact and update payroll each February. Average tipped-to-MW gap currently ~$8.55. Plan multi-year labor cost increases through 2031.",impact:"high",src:"https://www.michigan.gov/leo/bureaus-agencies/ors/wage-and-hour"},
  
  {cat:"Sick Leave",j:"Michigan",title:"ESTA Expanded to ALL Employers",eff:"Feb 2025 (Active Enforcement 2026)",yr:2026,detail:"Michigan Earned Sick Time Act now covers employers of ALL sizes (previously 50+). Accrual: 1hr/30hrs up to 72hrs/yr (large) or 40hrs/yr (small). WHD enforcement increasing significantly in 2026. Update accrual tracking and PTO policies. New employers must implement ESTA immediately.",impact:"high",src:"https://www.michigan.gov/leo/bureaus-agencies/ors/wage-and-hour"},
  
  // ═══ MISSOURI ═══
  {cat:"Sick Leave",j:"Missouri",title:"Proposition A - New Statewide Paid Sick Leave + $15 Min Wage",eff:"Jan 1, 2026 (active)",yr:2026,detail:"Proposition A (passed Nov 2024) mandates paid sick leave AND minimum wage $15.00. 15+ employees: 1hr/30hrs up to 56hrs/yr. Under 15 employees: 1hr/30hrs up to 48hrs/yr. New accrual tracking, notice posting, recordkeeping requirements. Active enforcement began Jan 2026. Ensure compliance with both wage and sick leave components.",impact:"high",src:"https://labor.mo.gov/DLS/MinimumWage"},
  
  // ═══ NEBRASKA ═══
  {cat:"Sick Leave",j:"Nebraska",title:"Proposition 436 - New Statewide Sick Leave (Active)",eff:"Jan 1, 2025 (Active 2026)",yr:2026,detail:"Nebraska voters passed Prop 436 (Nov 2024). All employers must provide paid sick leave: 1hr/30hrs worked. Ongoing enforcement and employee awareness campaigns in 2026. Accrual and notice requirements must be met.",impact:"medium",src:"https://labor.nebraska.gov/"},
  
  // ═══ MINNESOTA ═══
  {cat:"Overtime",j:"Minnesota",title:"OT Threshold Proposal - Reduce from 48hrs to 40hrs (Pending)",eff:"Pending 2026-2027",yr:2027,detail:"Minnesota Legislature considering aligning state OT threshold with federal 40hr/week standard (currently 48hrs in MN). If passed, significantly increases OT costs for MN restaurant operators. Retroactive claims risk if implementation challenged. Monitor MN legislative session closely.",impact:"high",src:"https://www.dli.mn.gov/business/employment-practices/minimum-wage-minnesota"},
  
  // ═══ SCHEDULING LAWS - UPCOMING/EXPANSIONS ═══
  {cat:"Scheduling",j:"New York State",title:"Statewide Fair Workweek Expansion - Proposed",eff:"Pending 2026-2027",yr:2026,detail:"NY Legislature considering expanding NYC Fair Workweek rules statewide to ALL fast food and restaurant employers. If passed: mandatory 14-day advance notice, call-in pay, schedule change premiums apply to ALL NY restaurant locations - not just NYC. Would extend current NYC $500-$2,500/violation penalties statewide. Monitor NY Senate/Assembly bills.",impact:"high",src:"https://www.nysenate.gov/legislation"},
  
  {cat:"Scheduling",j:"Chicago, IL",title:"Fair Workweek Threshold Reduction - 100 to 50 Employees (Proposed)",eff:"Proposed 2026",yr:2026,detail:"Chicago considering lowering employer size threshold for Fair Workweek from 100 employees to 50. Would extend 14-day advance notice requirements and premium pay obligations to many more mid-size restaurant groups and independents. Pending Chicago City Council vote. Would capture hundreds of additional Chicago operators.",impact:"medium",src:"https://www.chicago.gov/city/en/depts/dol/provdrs/labor-standards.html"},
  
  {cat:"Scheduling",j:"Seattle, WA",title:"Secure Scheduling - Delivery Platform Expansion",eff:"2026",yr:2026,detail:"Seattle expanding Secure Scheduling provisions to third-party delivery platform workers operating at restaurant locations. Restaurants may face new notification and record obligations for delivery partner scheduling. Monitor Seattle OLS rulemaking. Affects all Seattle restaurants using DoorDash, UberEats, Grubhub.",impact:"medium",src:"https://www.seattle.gov/laborstandards"},
  
  {cat:"Scheduling",j:"Denver, CO",title:"Denver Fair Workweek Ordinance - Proposed",eff:"Pending 2026-2027",yr:2026,detail:"Denver City Council considering Fair Workweek ordinance for retail and food service employers with 250+ employees. Colorado already has COMPS Order, HFWA, and daily OT requirements - Fair Workweek law would add significant scheduling complexity. 14-day advance notice, premium pay for changes, offer hours to existing employees before new hires proposed.",impact:"medium",src:"https://denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Denver-Human-Rights-Community-Partnerships"},
  
  {cat:"Scheduling",j:"New Jersey (Statewide)",title:"NJ Fair Workweek Act - Proposed Statewide",eff:"Pending 2026-2027",yr:2027,detail:"Reintroduced in NJ Legislature. Would be third state with statewide fair scheduling after Oregon. Proposed scope: food service and retail employers with 250+ employees. Estimated to impact 200,000+ NJ restaurant workers. 14-day advance notice, predictability pay, good faith estimates proposed.",impact:"high",src:"https://www.njleg.state.nj.us/"},
  
  {cat:"Scheduling",j:"Boston, MA",title:"Boston Fair Workweek Ordinance - Proposed",eff:"Pending 2026-2027",yr:2026,detail:"Under active consideration by Boston City Council for retail and food service employers with 250+ employees. Massachusetts does not yet have statewide Fair Workweek law, making this potential trailblazer for the state. 14-day notice, predictability pay, good faith estimates proposed.",impact:"medium",src:"https://www.boston.gov/departments/city-council"},
  
  {cat:"Scheduling",j:"Washington, DC",title:"DC Fair Scheduling Act - Proposed",eff:"Pending 2026-2027",yr:2026,detail:"DC Fair Workweek ordinance under active DC Council consideration for employers with 100+ employees. Would add 14-day advance notice, predictability pay, clopening protections for major QSR and fast casual operators. Lower employer threshold (100+) captures more mid-size operators than other cities.",impact:"medium",src:"https://dccouncil.gov/"},
  
  {cat:"Scheduling",j:"California - FAST Council",title:"FAST Recovery Act - Council Authority Over Scheduling Standards",eff:"2026 (ongoing quarterly meetings)",yr:2026,detail:"Fast Food Council (AB 1228) has authority to set scheduling standards beyond $20/hr minimum for all CA QSR chain locations (60+ locations nationally). May mandate advance schedule notice, premium pay rules for schedule changes. Council meets quarterly. Could create statewide predictive scheduling requirements for fast food without formal legislation. Monitor Council proceedings.",impact:"high",src:"https://www.dir.ca.gov/dlse/fast-food-council.html"},
  
  {cat:"Scheduling",j:"Connecticut (Statewide)",title:"CT Fair Workweek Act - Proposed",eff:"Pending 2027",yr:2027,detail:"Connecticut actively considering statewide predictive scheduling legislation for retail and food service with 250+ employees. 14-day advance notice, predictability pay for changes, good faith estimate at hire, offer hours to existing employees before new hires proposed.",impact:"medium",src:"https://www.cga.ct.gov/"},
  
  {cat:"Scheduling",j:"Maryland (Statewide)",title:"Maryland Fair Scheduling Act - Proposed",eff:"Pending 2027",yr:2027,detail:"Under consideration in Maryland General Assembly for food service and retail with 500+ employees. 14-day advance schedule posting, predictability pay for changes, good faith estimate at hire, offer hours to existing employees before new hires proposed.",impact:"medium",src:"https://mgaleg.maryland.gov/"},
  
  {cat:"Scheduling",j:"Pittsburgh, PA",title:"Pittsburgh Fair Scheduling Ordinance - Re-Proposed",eff:"Pending 2026",yr:2026,detail:"Previously challenged. Re-proposed in 2025 for retail and food service with 250+ employees. 14-day advance notice, predictability pay for changes, good faith estimate at hire, offer hours to existing employees first. PA state preemption risks may affect implementation.",impact:"medium",src:"https://pittsburghpa.gov/council/"},
];

// ═══════════════════════════════════════════════════════════════
// END OF ENHANCED UPCOMING DATA
// ═══════════════════════════════════════════════════════════════


var CAT_COLORS={
  "Min Wage":{c:"#7c3aed",bg:"rgba(124,58,237,.08)"},
  "Tipped Wage":{c:"#0284c7",bg:"rgba(2,132,199,.08)"},
  "Sick Leave":{c:"#16a34a",bg:"rgba(22,163,74,.08)"},
  "Scheduling":{c:"#6366f1",bg:"rgba(99,102,241,.08)"},
  "Minor Labor":{c:"#dc2626",bg:"rgba(220,38,38,.08)"},
  "Overtime":{c:"#d97706",bg:"rgba(217,119,6,.08)"},
  "Break Laws":{c:"#b45309",bg:"rgba(180,83,9,.08)"},
  "Restaurant-Specific":{c:"#db2777",bg:"rgba(219,39,119,.08)"},
};

var TABS=["Overview","Min Wage","Tipped Wage","Minor Laws","Break Laws","Overtime","Scheduling","Federal Updates","Upcoming Changes","Risk Calculator"];

// ── API ───────────────────────────────────────────────────────────
function getApiKey(){
  if(typeof window!=="undefined"&&window.__ANTHROPIC_KEY__) return window.__ANTHROPIC_KEY__;
  // CRA/webpack substitutes process.env.REACT_APP_* at build time as a string literal.
  // Wrapping in try/catch in case process is fully undefined.
  try { if(process.env.REACT_APP_ANTHROPIC_API_KEY) return process.env.REACT_APP_ANTHROPIC_API_KEY; } catch(e){}
  return null;
}
// Builds request headers for the Anthropic API.
// In Claude.ai artifacts the platform authenticates the call for you, so NO key
// is sent (sending one, or the direct-browser header, can interfere). When this
// file is self-hosted as a real deployment, a key from window/env is attached
// along with the headers the API requires for direct browser access.
function anthropicHeaders(){
  var apiKey=getApiKey();
  var headers={"Content-Type":"application/json"};
  if(apiKey){
    headers["anthropic-version"]="2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"]="true";
    headers["x-api-key"]=apiKey;
  }
  return headers;
}
async function fetchLatestChanges(onChunk){
  var todayStr=new Date().toISOString().slice(0,10);
  var prompt="You are a labor law compliance research assistant for the US restaurant industry. Today is "+todayStr+".\n\n"+
    "Search the web COMPREHENSIVELY for ALL confirmed and proposed labor law changes affecting US restaurants for "+(new Date()).getFullYear()+" and "+((new Date()).getFullYear()+1)+". Be EXHAUSTIVE - your goal is comprehensive coverage, not curated highlights.\n\n"+
    "REQUIRED CATEGORY COVERAGE - you must return at least the minimums below for each category:\n\n"+
    "1) MIN WAGE (return at least 8 items): All states with wage increases this year and next, including mid-year increases (FL Sep 30, AK Jul 1, OR Jul 1, DC Jul 1, Chicago Jul 1). Include both state-level and major city/county increases (NYC, LA, SF, Seattle, Denver, Portland metro, Minneapolis, Boulder, etc.).\n\n"+
    "2) TIPPED WAGE (return at least 5 items): Tip credit changes - DC Initiative 82 final phase, Michigan stepped tipped wage increases, Chicago tip credit elimination ongoing, any state phasing out tip credit, federal RAISE Act / Wage Act proposals.\n\n"+
    "3) SICK LEAVE (return at least 6 items): New state mandates (MO Prop A, NE Prop 436, AK Initiative 1), expansions (CA AB 406, MA new accrual rules, CT all-employer expansion, NY accrual changes), municipal ordinances.\n\n"+
    "4) MINOR LABOR (return at least 4 items): State child labor enforcement priorities, Iowa/Kentucky/Indiana youth-hours expansion bills, federal proposed minor labor protections, state hazardous occupation rules updated for restaurants.\n\n"+
    "5) BREAK LAWS (return at least 4 items): Meal/rest break new rules, Oregon digital waiver recordkeeping, California meal premium enforcement updates, state attorney general enforcement priorities, new break recordkeeping requirements.\n\n"+
    "6) OVERTIME (return at least 4 items): Federal OT salary threshold rulemaking (DOL post-Restoring Overtime Pay Act activity), state OT threshold increases (CA, NY, WA, AK), tipped overtime calculation guidance, daily OT enforcement.\n\n"+
    "7) SCHEDULING (return at least 12 items - CRITICAL CATEGORY, BE COMPREHENSIVE): ALL Fair Workweek and Predictive Scheduling laws - include each ACTIVE jurisdiction (San Francisco FW, Seattle Secure Scheduling, NYC Fair Workweek, Philadelphia FW, Chicago FW, Emeryville FW, Berkeley FW, Los Angeles FW, LA County FW, Evanston FW, Euless TX, Oregon statewide) AND ALL upcoming/proposed ones (NY statewide proposal, Boston FW, Minneapolis FW expansion, St. Paul FW, Pittsburgh FW). Include any 2026/2027 amendments, threshold changes (employee count), penalty changes, predictability pay adjustments, or new ordinances. This is the most underrepresented category - be exhaustive.\n\n"+
    "8) RESTAURANT-SPECIFIC (return at least 6 items): CA AB 1228 fast food council adjustments, NYC fast food laws, OBBBA W-2 reporting requirements (Box 12 TT/TP, occupation codes), franchise liability changes, AI tools laws affecting hiring (Colorado AI Act delay), heat illness rules, joint employer rulemaking, state pay transparency expansions.\n\n"+
    "TARGET: Return 50-70 items minimum. If you have data for more than 70, include them all. DO NOT artificially limit count. Comprehensive coverage matters more than brevity.\n\n"+
    "FORMAT: Return ONLY a raw JSON array (no markdown, no preamble). Each object: "+
    "{\"cat\":\"Min Wage|Tipped Wage|Sick Leave|Minor Labor|Break Laws|Overtime|Scheduling|Restaurant-Specific\","+
    "\"j\":\"jurisdiction (state name or 'City, ST' or 'Federal')\","+
    "\"title\":\"short title max 80 chars\","+
    "\"eff\":\"effective date as text - use specific date if known, otherwise year only\","+
    "\"yr\":2026,"+
    "\"detail\":\"2-3 sentence explanation of what restaurant operators need to do\","+
    "\"impact\":\"critical|high|medium|low\","+
    "\"src\":\"official source URL (state DOL, federal agency, or municipal site)\"}.\n\n"+
    "Prefer official .gov sources. Skip exact duplicates only. Include items even if you have only partial details. Raw JSON array only.";
  var headers=anthropicHeaders();
  var resp;
  try{resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:headers,body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:16000,stream:true,tools:[{type:"web_search_20250305",name:"web_search"}],messages:[{role:"user",content:prompt}]})});}
  catch(e){throw new Error("Network error: "+e.message);}
  if(resp.status===401)throw new Error("Auth failed (401). Inside Claude.ai this runs with no key. For a self-hosted build, set REACT_APP_ANTHROPIC_API_KEY in .env (project root) and restart, or window.__ANTHROPIC_KEY__ in console.");
  if(resp.status===429){
    var retryAfter=resp.headers.get("retry-after")||resp.headers.get("anthropic-ratelimit-input-tokens-reset")||"";
    var waitMsg=retryAfter?(" Wait ~"+retryAfter+" seconds before retrying."):" Wait 60 seconds before retrying.";
    var bodyTxt=await resp.text().catch(function(){return "";});
    var rateLine="";
    var m=bodyTxt.match(/rate limit of ([0-9,]+) input tokens per minute/);
    if(m) rateLine=" (You have a "+m[1]+" input tokens/minute limit on your API tier.)";
    throw new Error("Rate limit hit."+waitMsg+rateLine+" The Risk Calculator and Sync Latest both consume tokens - avoid running them back-to-back.");
  }
  if(!resp.ok){
    var t=await resp.text().catch(function(){return "";});
    var ulMatch=t.match(/regain access on ([\d-]+) at ([\d:]+ UTC)/);
    if(ulMatch){
      throw new Error("API usage limit reached. You set a spend limit on your Anthropic account that has been hit. Access restored on "+ulMatch[1]+" at "+ulMatch[2]+". To raise it now, sign into console.anthropic.com -> Settings -> Limits.");
    }
    if(t.indexOf("usage limits")>=0||t.indexOf("usage_limit")>=0){
      throw new Error("API usage limit reached on your Anthropic account. Sign into console.anthropic.com -> Settings -> Limits to raise your spend cap.");
    }
    throw new Error("API error "+resp.status+": "+t.slice(0,200));
  }
  var reader=resp.body.getReader();var dec=new TextDecoder();var text="";var sc=0;
  while(true){var chunk=await reader.read();if(chunk.done)break;var lines=dec.decode(chunk.value).split("\n");for(var li=0;li<lines.length;li++){var line=lines[li];if(line.indexOf("data:")!==0)continue;var d=line.slice(5).trim();if(d==="[DONE]")continue;try{var ev=JSON.parse(d);if(ev.type==="content_block_start"&&ev.content_block&&ev.content_block.type==="tool_use"&&ev.content_block.name==="web_search"){sc++;onChunk({type:"search",count:sc});}if(ev.type==="content_block_delta"&&ev.delta&&ev.delta.type==="text_delta"){text+=ev.delta.text;onChunk({type:"text",text:text});}}catch(e){}}}
  return text;
}

// ── Compliance Calc Helpers ───────────────────────────────────────
// ── Upload column validation (tolerant header matching + clear errors) ─────
function normHdr(h){ return String(h==null?"":h).toLowerCase().replace(/[^a-z0-9]/g,""); }
function complianceColumnSpec(){
  return [
    {key:"store_number",req:true,norms:["storenumber"]},
    {key:"store_state",req:true,norms:["storestate"]},
    {key:"owner_name",req:true,norms:["ownername"]},
    {key:"assigned_labor_law_state",req:true,norms:["assignedlaborlawstate"]},
    {key:"labor_law_id",req:true,norms:["laborlawid"]},
    {key:"Labor Law Name",req:true,norms:["laborlawname"]},
    {key:"is_active",req:true,norms:["isactive"]},
    {key:"current_setting",req:true,norms:["currentsetting"]},
    {key:"minor_age",req:true,norms:["minorage"]},
    {key:"owner_number",req:false,norms:["ownernumber"]},
    {key:"assigned_labor_law_state_name",req:false,norms:["assignedlaborlawstatename"]},
    {key:"deactivation_date",req:false,norms:["deactivationdate"]}
  ];
}
function validateComplianceHeaders(headers){
  var spec=complianceColumnSpec(); var normToActual={}, i, j;
  for(i=0;i<headers.length;i++){ var nh=normHdr(headers[i]); if(nh&&!normToActual.hasOwnProperty(nh)) normToActual[nh]=headers[i]; }
  var map={}, missingReq=[], missingOpt=[], renamed=[];
  for(i=0;i<spec.length;i++){
    var c=spec[i], found=null;
    for(j=0;j<c.norms.length;j++){ if(normToActual.hasOwnProperty(c.norms[j])){ found=normToActual[c.norms[j]]; break; } }
    if(found){ map[c.key]=found; if(found!==c.key) renamed.push("'"+found+"' as "+c.key); }
    else if(c.req) missingReq.push(c.key);
    else missingOpt.push(c.key);
  }
  var matched={}, k; for(k in map){ if(map.hasOwnProperty(k)) matched[map[k]]=true; }
  var unknown=[]; for(i=0;i<headers.length;i++){ if(headers[i]&&!matched[headers[i]]) unknown.push(headers[i]); }
  return {map:map,missingReq:missingReq,missingOpt:missingOpt,renamed:renamed,unknown:unknown};
}

// Visual per-column checklist shown after a file is picked.
function ColChecklist(props){
  var rep=props.report; if(!rep) return null;
  var spec=complianceColumnSpec();
  var nMiss=rep.missingReq?rep.missingReq.length:0;
  return (
    <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #e2e8f0"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase"}}>Column Check</div>
        {nMiss===0
          ?<span style={{fontSize:10.5,fontWeight:700,color:"#15803d",background:"rgba(22,163,74,.1)",border:"1px solid rgba(22,163,74,.3)",borderRadius:5,padding:"2px 8px"}}>{"All required columns present"}</span>
          :<span style={{fontSize:10.5,fontWeight:700,color:"#dc2626",background:"rgba(220,38,38,.08)",border:"1px solid rgba(220,38,38,.3)",borderRadius:5,padding:"2px 8px"}}>{nMiss+" required column"+(nMiss>1?"s":"")+" missing"}</span>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:6}}>
        {spec.map(function(c){
          var actual=rep.map[c.key]; var ok=!!actual; var renamed=ok&&actual!==c.key;
          var color=ok?"#15803d":(c.req?"#dc2626":"#94a3b8");
          var bg=ok?"rgba(22,163,74,.06)":(c.req?"rgba(220,38,38,.05)":"rgba(148,163,184,.07)");
          var icon=ok?"\u2713":(c.req?"\u2717":"\u2013");
          var note=ok?(renamed?("matched from \u201c"+actual+"\u201d"):""):(c.req?"REQUIRED \u2014 not found":"optional \u2014 not provided");
          return <div key={c.key} style={{display:"flex",alignItems:"center",gap:8,background:bg,border:"1px solid "+color+"40",borderRadius:6,padding:"6px 9px"}}>
            <span style={{color:color,fontWeight:800,fontSize:13,width:14,textAlign:"center",flexShrink:0}}>{icon}</span>
            <div style={{minWidth:0}}>
              <div style={{fontSize:11.5,fontWeight:600,color:"#1f2937",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.key}{c.req?"":" *"}</div>
              {note?<div style={{fontSize:9.5,color:color}}>{note}</div>:null}
            </div>
          </div>;
        })}
      </div>
      {(rep.unknown&&rep.unknown.length)?<div style={{fontSize:10.5,color:"#94a3b8",marginTop:8}}>{"Ignored extra column(s): "+rep.unknown.join(", ")}</div>:null}
      <div style={{fontSize:10,color:"#94a3b8",marginTop:6}}>{"* optional \u00b7 matching ignores case, spaces and underscores"}</div>
    </div>
  );
}

function parseComplianceCsv(text){
  var lines=text.replace(/\r/g,"").split("\n").filter(function(l){return l.trim().length>0;});
  if(lines.length<2) return [];
  var firstLine=lines[0];
  var delim=firstLine.indexOf("\t")>=0?"\t":",";
  var headers=firstLine.split(delim).map(function(h){return h.trim();});
  var rows=[];
  for(var i=1;i<lines.length;i++){
    var parts=lines[i].split(delim);
    if(parts.length<headers.length-2) continue;
    var obj={};
    for(var h=0;h<headers.length;h++){ obj[headers[h]]=(parts[h]||"").trim(); }
    rows.push(obj);
  }
  return rows;
}

function aggIngestRow(byStore, r){
  var sn=r["Store Number"]||r["StoreNumber"]||r["store_number"]||"";
  if(!sn) return;
  var st=r["Store State"]||r["StoreState"]||r["store_state"]||"";
  var asgn=r["Assigned Labor Law State"]||r["AssignedLaborLawState"]||r["assigned_labor_law_state"]||st;
  var asgnName=r["Assigned Labor Law State Name"]||r["AssignedLaborLawStateName"]||r["assigned_labor_law_state_name"]||"";
  if(!byStore[sn]) byStore[sn]={storeNumber:sn,storeState:st,assignedState:asgn,assignedStateName:asgnName,owner:r["Owner Name"]||r["owner_name"]||"Unknown Owner",settings:[]};
  byStore[sn].settings.push({
    lawId:r["Labor Law ID"]||r["LaborLawID"]||r["labor_law_id"]||"",
    lawName:r["Labor Law Name"]||r["LaborLawName"]||r["labor_law_name"]||"",
    isActive:Number(r["Is Active"]||r["IsActive"]||r["is_active"]||"0"),
    currentSetting:r["Current Setting"]||r["CurrentSetting"]||r["current_setting"]||"-",
    deactivationDate:r["Deactivation Date"]||r["DeactivationDate"]||r["deactivation_date"]||"-",
    minorAge:Number(r["Minor Age"]||r["MinorAge"]||r["minor_age"]||"0")
  });
}
function aggFinish(byStore, totalRows){
  var stores=Object.keys(byStore).map(function(k){return byStore[k];});
  var configMap={}; var allOwners={}; var allStates={};
  for(var s=0;s<stores.length;s++){
    var st2=stores[s];
    allOwners[st2.owner]=true; allStates[st2.assignedState]=true;
    var sortedKey=st2.assignedState+"||"+st2.settings.slice().sort(function(a,b){
      var ak=a.lawId+":"+a.minorAge; var bk=b.lawId+":"+b.minorAge;
      return ak<bk?-1:(ak>bk?1:0);
    }).map(function(x){return x.lawId+"|"+x.minorAge+"|"+x.isActive+"|"+x.currentSetting;}).join("##");
    if(!configMap[sortedKey]) configMap[sortedKey]={key:sortedKey,assignedState:st2.assignedState,assignedStateName:st2.assignedStateName,settings:st2.settings,storeNumbers:[],ownerSet:{},storeOwnerMap:{}};
    configMap[sortedKey].storeNumbers.push(st2.storeNumber);
    configMap[sortedKey].ownerSet[st2.owner]=(configMap[sortedKey].ownerSet[st2.owner]||0)+1;
    configMap[sortedKey].storeOwnerMap[st2.storeNumber]=st2.owner;
  }
  var configs=Object.keys(configMap).map(function(k,i){
    var c=configMap[k]; c.configIndex=i;
    c.owners=Object.keys(c.ownerSet);
    var primaryOwner=c.owners[0]; var maxCount=0;
    for(var ow in c.ownerSet){ if(c.ownerSet[ow]>maxCount){ maxCount=c.ownerSet[ow]; primaryOwner=ow; } }
    c.primaryOwner=primaryOwner;
    return c;
  });
  return {totalRows:totalRows,totalStores:stores.length,configs:configs,storesByNumber:byStore,distinctOwners:Object.keys(allOwners),distinctStates:Object.keys(allStates)};
}
// Chunked aggregation: remaps + groups rows in batches with progress callbacks so the
// UI can show a progress bar on large files without freezing the browser.
function aggregateStoresByConfigChunked(rows, map, onProgress, done){
  var byStore={}, i=0, N=rows.length, CH=12000, blank=0;
  function remapOne(raw){ if(!map) return raw; var o={}, k; for(k in map){ if(map.hasOwnProperty(k)) o[k]=raw[map[k]]; } return o; }
  function step(){
    var end=Math.min(i+CH,N);
    for(; i<end; i++){
      var r=map?remapOne(rows[i]):rows[i];
      var sn=r["Store Number"]||r["StoreNumber"]||r["store_number"]||"";
      if(!sn){ blank++; continue; }
      aggIngestRow(byStore, r);
    }
    if(onProgress) onProgress(N?(i/N):1);
    if(i<N) setTimeout(step,0);
    else done(aggFinish(byStore, N), blank);
  }
  step();
}
// Full-screen loader/progress overlay used during file loading and analysis.
function LoaderOverlay(props){
  var info=props.info; if(!info) return null;
  var pct=(typeof info.pct==="number")?Math.max(0,Math.min(100,Math.round(info.pct))):null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.55)",zIndex:5000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <style>{"@keyframes lcSpin{to{transform:rotate(360deg)}}@keyframes lcIndet{0%{left:-42%}100%{left:100%}}"}</style>
      <div style={{background:"#fff",borderRadius:14,padding:"28px 32px",width:"min(420px,92vw)",boxShadow:"0 20px 60px rgba(0,0,0,.25)",textAlign:"center"}}>
        <div style={{width:38,height:38,margin:"0 auto 16px",border:"4px solid #e2e8f0",borderTopColor:"#6366f1",borderRadius:"50%",animation:"lcSpin .8s linear infinite"}}></div>
        <div style={{fontSize:15,fontWeight:800,color:"#0f172a",marginBottom:4}}>{info.title||"Working\u2026"}</div>
        {info.msg&&<div style={{fontSize:12,color:"#64748b",marginBottom:16}}>{info.msg}</div>}
        <div style={{position:"relative",height:8,background:"#eef2f6",borderRadius:6,overflow:"hidden"}}>
          {pct==null
            ?<div style={{position:"absolute",top:0,height:"100%",width:"42%",background:"#6366f1",borderRadius:6,animation:"lcIndet 1.1s ease-in-out infinite"}}></div>
            :<div style={{height:"100%",width:pct+"%",background:"#16a34a",borderRadius:6,transition:"width .12s linear"}}></div>}
        </div>
        {pct!=null&&<div style={{fontSize:11,color:"#94a3b8",marginTop:6,fontWeight:600}}>{pct+"%"}</div>}
      </div>
    </div>
  );
}



// Tolerant JSON parser: tries fast path, falls back to per-object recovery
// when the AI returns a malformed array (missing comma, truncation, etc.)

// ── Deterministic Compliance Engine (no API key, no network) ───────────────
// Peer-baseline method: within each assigned labor-law state, the configuration
// the majority of stores use is treated as the compliant baseline. A store that
// is missing a rule its in-state peers have, or whose value diverges from the
// peer-majority value, is flagged. Severity is modeled by category.
// This runs entirely in the browser - no AI, no key.
// ── Fixed statewide baseline (precomputed from the full store portfolio) ───
// Used as the compliance reference so a single-org upload is judged against the
// same statewide expectation as a full-portfolio run (not just against itself).
var LAW_NAMES={"mnrShiftLengthRest_1":"Shift length for 1st Rest Break","mnrShiftLengthMeal_2":"Shift length for 2nd Meal Break","mnrShiftLengthMeal_1":"Shift length for 1st Meal Break","mnrSchoolAndWorkHours":"Max school+work hrs/day - school in session","mnrLatestEndTimeSchool":"Latest end time - school next day","mnrLatestEndTime":"Latest end time - no school next day","mnrHrsPerWeekNotInSession":"Max hrs/week - school not in session","mnrHrsPerWeekInSession":"Max hrs/week - school in session","mnrHrsPerDayNotInSession":"Max hrs/day - school not in session","mnrShiftLengthRest_4":"Shift length for 4th Rest Break","mnrHrsPerDayInSession":"Max hrs/day - school in session","mnrEarliestStartTimeNotInSession":"Earliest start time - school not in session","mnrDaysPerWeekNotInSession":"Max days/week - school not in session","adtDailyDT":"Daily shift length prior to Dbl Time","mnrDaysPerWeekInSession":"Max days/week - school in session","mnrConsecutiveNights":"Max consecutive days - school next day","adtWeeklyDT":"Weekly hrs prior to Dbl Time","adtSpecialTermPaycheck":"Special Termination Paycheck","adtMinWage":"Minimum Wage","adtDaysPerWeek":"Max number of days/week","adtDailyOT":"Daily shift length prior to OT","mnrTimeBetweenSchoolEndAndShiftStart":"Length of time between school end and shift start*","mnrShiftLengthRest_3":"Shift length for 3rd Rest Break","mnrShiftLengthRest_2":"Shift length for 2nd Rest Break","adtPunchPrintout":"Punch Printout","adtAssumeFullTipCredit":"Assume Full Tip Credit for Job Code","adtMinWageForTippedEmp":"Min. Wage for Tipped Employees","adtApproachingOTAlertHoursSalaried":"Approaching Weekly OT Alert Mgr","mnrMinWage":"Minor Minimum Wage","adtRestBrkPayRate":"Rest Break Premium Pay Rate","adtRestBrkPremiumPayMins":"Rest Break Premium Pay Hours","adtSplitShiftPremiumPayMins":"Minutes For Split Shift Premium Pay","adtMinShiftMinsGapForSplitShift":"Minimum gap of time for Split Shift","adtAllowMealBrkWaiver":"Allow Meal Waiver","adtMinLengthTimeBetweenTwoShifts":"Minimum length of time between two shifts","adtDtPercent":"DT Percentage","adtMaxWage":"Maximum Wage","adtMealBrkPayRate":"Meal Break Premium Pay Rate","adtApproachingOTAlertHours":"Hours for Approaching OT Alert in Weekly Timekeeping","adtMealBrkPremiumPayMins":"Meal Break Premium Pay Hours","adtOtPercent":"OT Percentage","adtSplitShiftPayRate":"Split Shift Premium Pay Rate","adtWeeklyOTSalaried":"Weekly hrs prior to OT for Salaried Manager","mnrShiftLengthRest_0":"Shift Length for No Rest Break","adtMinCreditCardPercForTips":"Min. Credit Card Percentage for Tips","adtMaxDailyHrsPartTimeEmp":"Max Daily Hours For Part Time Employee","adtMinCashPercForTips":"Min. Cash Percentage for Tips","adtMaxWeeklyHrPartTimeForEmp":"Max Weekly Hour For Part Time Employee","adtWeeklyOT":"Weekly hrs prior to OT","adtMealBreak":"Meal Break length","adtShiftLengthRest_3":"Shift length for 3rd Rest Break","adtShiftLengthRest_1":"Shift length for 1st Rest Break","adtShiftLengthRest_0":"Shift length for No Rest Break","adtShiftLengthRest_4":"Shift length for 4th Rest Break","adtShiftLengthRest_2":"Shift length for 2nd Rest Break","adtShiftLengthMeal_2":"Shift length for 2nd Meal Break","adtShiftLengthMeal_1":"Shift length for 1st Meal Break","adtRestBreak":"Rest Break length","mnrAdtDailyOT":"Daily shift length prior to OT For Minors","adtDailyOTSalaried":"Daily shift length prior to OT for Salaried Manager","adtDtPercentSalaried":"DT Percentage for Managers","adtDailyDTSalaried":"Daily shift length prior to Dbl Time for Salaried Manager","adtOtPercentSalaried":"OT Percentage for Managers","seventhDayRuleCA":"7th Day Rule - CA","adtEnableEarnedBreakConcept":"Enable Earned Break Concept","adtCloserPunchLookMin":"Closer Punch Lookout Minutes","adtMinToAddCloserPunch":"Minutes to auto add for Closer Punches","adtMinToAddOpenerPunch":"Minutes to auto add for Opener Punches","adtOpenerPunchLookMin":"Opener Punch Lookout Minutes","adtPredictivePunchOffset":"Actual Punch Allowed Offset","adtRstReqInSplitShifts":"Rest Period Required Between Split Shifts (Hrs)","adtShowRsnOnSchAftrSchPublish":"Show Shift Edit Reasons","adtTrackSchHrsAddition":"Track Hours Added","adtTrackSchHrsReduction":"Track Hours Reduced","adtTrackSchNoHrsChange":"Track Schedule Changes (no gain/loss)","adtPostSchPriorToXDays":"Schedule Advance Notice (days)","adtPredictiveScheduling":"Enable Predictive Scheduling","adtHrsForClopening":"Hours For Rest Between the Shifts","adtMinShiftGapForRgtToRstShift":"Right to Rest Gap between two shifts","adtPredPrmPayHrs":"Track Schedule Changes (no gain/loss) - Premium Pay Hours","adtPredPrmPayHrsForHrsAdded":"Track Hours Added - Premium Pay Hours","adtPredPrmPayHrsMore24Reduce":"Track Hours Reduced more than 24 hours - Premium Pay Hours","adtPredPrmPayRateForHrsAdded":"Track Hours Added - Premium Pay Rate","adtPredPrmPayRateForHrsReduced":"Track Hours Reduced - Premium Pay Rate","adtPredPrmPayRateLessFortDays":"Premium Pay Rate less than 14 days(no gain/loss)","adtPredPrmPayRateLessFortDaysAdded":"Hours Added-Premium Pay Rate less than 14 days","adtPredPrmPayRateLessFortDaysReduced":"Hours Reduced-Premium Pay Rate less than 14 days","adtPredPrmPayRateLessHours":"Premium Pay Rate less than 24 Hours(no gain/loss)","adtPredPrmPayRateLessHoursAdded":"Hours Added-Premium Pay Rate less than 24 Hours","adtPredPrmPayRateLessHoursReduced":"Hours Reduced-Premium Pay Rate less than 24 Hours","adtPredPrmPayRateLessSevenDays":"Premium Pay Rate less than 7 days(no gain/loss)","adtPredPrmPayRateLessSevenDaysAdded":"Hours Added-Premium Pay Rate less than 7 days","adtPredPrmPayRateLessSevenDaysReduced":"Hours Reduced-Premium Pay Rate less than 7 days","adtPredPrmPayRatePercForHrsReduced":"Track Hours Reduced - Premium Pay Hours","adtPredPrmPayRatePercMore24Reduce":"Track Hours Reduced more than 24 hours - Premium Pay Rate","adtPredPrmPayRateTipEmp":"Predictive Premium Pay Rate for Tipped Employees","adtRgtToRstPercent":"Right to Rest Pay Rate %","adtTrackSchChangePrmPayRate":"Track Schedule Changes (no gain/loss)- Premium Pay Rate","adtPredPrmPayHrsLess24Reduce":"Track Hours Reduced less than 24 hours - Premium Pay Hours","adtPredPrmPayRatePercLess24Reduce":"Track Hours Reduced less than 24 hours - Premium Pay Rate","adtNVSpreadOfHours":"Nevada Spread of Hours (Rolling 24 hour shift length prior to OT)","seventhDayRuleKY":"7th Day Rule - KY","adtMinShiftLength":"Min Shift Length","adtMaxShiftLength":"Max Shift Length","adtNYBreakRules":"NY Break Rules","mnrNYBreakRules":"NY Break Rules","seventhDayRuleCT":"7th Day Rule - CT"};
var STATE_BASELINE={"MI":[["adtMinWage",0,"9.45",91,22],["adtWeeklyOT",0,"40:00:00",97,99],["adtOtPercent",0,"150",71,91]],"OH":[["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",71,61],["adtMinWage",0,"8.55",87,19],["adtWeeklyOT",0,"40:00:00",95,99]],"WI":[["adtWeeklyOT",0,"40:00:00",100,100],["adtMinWage",0,"7.25",75,70],["adtOtPercent",0,"150",68,100]],"CA":[["adtMinShiftMinsGapForSplitShift",0,"1:00",74,97],["adtMaxWage",0,"40",70,88],["adtSplitShiftPremiumPayMins",0,"1:00",76,93],["adtSplitShiftPayRate",0,"1",78,51],["adtMinLengthTimeBetweenTwoShifts",0,"8:00",69,62],["adtMealBrkPremiumPayMins",0,"1:00",76,96],["adtMealBrkPayRate",0,"1",75,68],["adtDailyOTSalaried",0,"12:00",68,61],["adtDtPercent",0,"200",78,98],["adtDtPercentSalaried",0,"200",80,98],["adtApproachingOTAlertHours",0,"30:00:00",76,85],["adtWeeklyOTSalaried",0,"40:00:00",67,96],["adtOtPercent",0,"150",81,99],["adtOtPercentSalaried",0,"150",81,100],["mnrTimeBetweenSchoolEndAndShiftStart",17,"0:30",75,97],["mnrLatestEndTimeSchool",16,"1350",76,53],["mnrLatestEndTime",16,"1350",71,67],["mnrHrsPerWeekNotInSession",16,"37:30:00",71,56],["mnrHrsPerWeekInSession",16,"22:30",74,53],["mnrHrsPerDayNotInSession",16,"7:30",71,55],["mnrHrsPerDayInSession",17,"3:30",69,63],["mnrHrsPerDayInSession",16,"3:30",83,52],["mnrEarliestStartTimeNotInSession",16,"330",67,59],["adtDailyDT",0,"12:00",88,98],["mnrDaysPerWeekInSession",16,"5",67,77],["adtWeeklyOT",0,"40:00:00",97,98],["adtShiftLengthRest_4",0,"0:00",90,78],["adtShiftLengthRest_3",0,"0:00",90,51],["adtShiftLengthRest_2",0,"0:00",90,49],["adtShiftLengthRest_1",0,"0:00",90,49],["adtShiftLengthMeal_2",0,"10:00",90,91],["adtShiftLengthMeal_1",0,"5:00",90,87],["adtRestBreak",0,"0:10",90,50],["adtMinWage",0,"15",92,49],["adtMealBreak",0,"0:30",90,100],["seventhDayRuleCA",0,"ON",84,100],["adtDailyOT",0,"8:00",92,99],["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",89,98],["mnrShiftLengthMeal_1",16,"5:00",71,83],["adtShiftLengthRest_0",0,"0:00",90,81],["adtEnableEarnedBreakConcept",0,"1",71,94],["mnrShiftLengthMeal_2",16,"10:00",71,85],["mnrShiftLengthRest_4",16,"0:00",71,90],["mnrShiftLengthRest_3",16,"0:00",71,67],["mnrShiftLengthRest_2",16,"0:00",71,67],["mnrShiftLengthRest_1",16,"0:00",71,65],["mnrShiftLengthRest_0",16,"0:00",71,88]],"IL":[["adtMinWage",0,"8.25",94,50],["adtWeeklyOT",0,"40:00:00",97,94],["adtOtPercent",0,"150",81,97]],"IN":[["adtWeeklyOT",0,"40:00:00",98,100],["adtMinWage",0,"7.25",88,74]],"FL":[["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",78,92],["adtMinWage",0,"8.46",99,57],["adtWeeklyOT",0,"40:00:00",95,100],["adtOtPercent",0,"150",76,91]],"AZ":[["adtOtPercent",0,"150",90,100],["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",81,100],["mnrTimeBetweenSchoolEndAndShiftStart",17,"0:30",81,100],["adtMinWage",0,"11",98,68],["adtWeeklyOT",0,"40:00:00",100,100]],"NV":[["adtShiftLengthRest_0",0,"0:00",76,77],["mnrTimeBetweenSchoolEndAndShiftStart",17,"0:30",96,100],["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",96,100],["adtShiftLengthRest_4",0,"0:00",76,77],["adtShiftLengthRest_3",0,"0:00",76,77],["adtShiftLengthRest_2",0,"0:00",76,77],["adtShiftLengthRest_1",0,"0:00",76,71],["adtShiftLengthMeal_2",0,"0:00",76,77],["adtShiftLengthMeal_1",0,"8:00",76,97],["adtRestBreak",0,"0:00",76,71],["adtMinWage",0,"8.25",76,74],["adtMealBreak",0,"0:30",76,100],["adtMaxWage",0,"30",70,100]],"TX":[["mnrTimeBetweenSchoolEndAndShiftStart",17,"0:30",80,100],["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",87,100],["adtWeeklyOT",0,"40:00:00",99,100],["adtMinWage",0,"7.25",99,96],["adtOtPercent",0,"150",77,99]],"SC":[["adtWeeklyOT",0,"40:00:00",99,100],["mnrTimeBetweenSchoolEndAndShiftStart",14,"0:30",67,69],["adtMinWage",0,"7.25",88,97]],"KY":[["adtWeeklyOT",0,"40:00:00",72,100],["adtMinWage",0,"7.25",91,71]],"WV":[["adtMinWage",0,"8.75",100,85],["adtWeeklyOT",0,"40:00:00",100,100]],"OK":[["mnrTimeBetweenSchoolEndAndShiftStart",14,"1:00",95,56],["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",88,98],["mnrTimeBetweenSchoolEndAndShiftStart",17,"0:30",88,98],["adtMinWage",0,"7.25",84,100],["adtWeeklyOT",0,"40:00:00",100,100],["adtOtPercent",0,"150",81,100]],"PA":[["adtMinWage",0,"7.25",89,100],["adtWeeklyOT",0,"40:00:00",99,100]],"NY":[["adtWeeklyOT",0,"40:00:00",99,99],["adtMinWage",0,"15",89,46]],"CO":[["adtWeeklyOT",0,"40:00:00",87,94],["adtMinWage",0,"11.1",97,27],["mnrTimeBetweenSchoolEndAndShiftStart",17,"0:30",71,100],["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",74,100]],"NC":[["adtMinWage",0,"7.25",92,97],["adtWeeklyOT",0,"40:00:00",99,98]],"AR":[["adtWeeklyOT",0,"40:00:00",100,98]],"AL":[["mnrTimeBetweenSchoolEndAndShiftStart",17,"0:30",88,100],["adtMinWage",0,"7.25",89,100],["adtWeeklyOT",0,"40:00:00",97,100],["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",86,100],["mnrLatestEndTimeSchool",16,"1320",68,85],["adtOtPercent",0,"150",80,99]],"MS":[["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",74,87],["adtWeeklyOT",0,"40:00:00",98,98],["adtMinWage",0,"7.25",88,95]],"TN":[["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",88,98],["adtWeeklyOT",0,"40:00:00",100,100],["adtMinWage",0,"7.25",82,95]],"WA":[["adtMinWage",0,"17.13",98,36],["adtWeeklyOT",0,"40:00:00",97,98],["adtMealBreak",0,"0:30",68,100],["adtRestBreak",0,"0:10",68,100],["adtShiftLengthMeal_1",0,"5:00",68,93],["adtShiftLengthMeal_2",0,"12:00",68,43],["adtShiftLengthRest_1",0,"4:00",68,68],["adtShiftLengthRest_2",0,"8:00",68,70],["adtShiftLengthRest_3",0,"10:00",68,61],["adtShiftLengthRest_4",0,"14:00",68,41],["adtShiftLengthRest_0",0,"3:00",68,43]],"GA":[["adtWeeklyOT",0,"40:00:00",99,100],["adtMinWage",0,"7.25",99,85]],"MO":[["adtMinWage",0,"8.6",95,38],["adtWeeklyOT",0,"40:00:00",97,100]],"VA":[["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",70,92],["adtMinWage",0,"12.77",93,42],["adtWeeklyOT",0,"40:00:00",100,100],["adtOtPercent",0,"150",79,93]],"OR":[["mnrHrsPerWeekInSession",16,"40:00:00",78,65],["mnrHrsPerWeekInSession",17,"40:00:00",73,69],["mnrHrsPerWeekNotInSession",16,"40:00:00",75,67],["mnrHrsPerWeekNotInSession",17,"40:00:00",73,69],["mnrShiftLengthMeal_1",16,"-",80,63],["mnrShiftLengthMeal_2",16,"-",80,63],["mnrShiftLengthRest_1",16,"2:00",80,63],["mnrShiftLengthRest_2",16,"-",80,63],["mnrShiftLengthRest_3",16,"-",80,63],["mnrShiftLengthRest_4",16,"-",80,63],["adtMealBreak",0,"0:30",95,97],["adtMinWage",0,"12.5",90,61],["adtRestBreak",0,"0:10",95,76],["mnrTimeBetweenSchoolEndAndShiftStart",16,"1:00",90,56],["mnrShiftLengthRest_0",16,"-",80,63],["adtShiftLengthRest_0",0,"0:00",95,92],["adtShiftLengthMeal_1",0,"5:59",95,53],["mnrTimeBetweenSchoolEndAndShiftStart",17,"1:00",78,65],["adtShiftLengthMeal_2",0,"10:00",95,55],["adtShiftLengthRest_1",0,"0:00",95,58],["adtShiftLengthRest_2",0,"8:00",95,58],["adtShiftLengthRest_3",0,"12:00",95,58],["adtShiftLengthRest_4",0,"0:00",95,87],["adtSpecialTermPaycheck",0,"ON",88,100],["adtWeeklyOT",0,"40:00:00",100,100],["adtOtPercent",0,"150",68,93]],"MD":[["adtMinWage",0,"15",100,44],["adtWeeklyOT",0,"40:00:00",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",14,"0:30",71,100]],"ND":[["adtWeeklyOT",0,"40:00:00",100,100],["adtMinWage",0,"7.25",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",15,"0:30",100,100],["adtOtPercent",0,"150",89,100]],"ID":[["mnrLatestEndTimeSchool",14,"1140",81,100],["mnrHrsPerWeekInSession",14,"18:00",81,100],["adtWeeklyOT",0,"40:00:00",90,100],["adtSpecialTermPaycheck",0,"ON",81,100],["adtMinWage",0,"7.25",100,90],["mnrTimeBetweenSchoolEndAndShiftStart",14,"0:30",81,100],["mnrLatestEndTime",14,"1140",81,100]],"MT":[["adtMinWage",0,"9",100,23],["adtWeeklyOT",0,"40:00:00",100,100]],"NE":[["adtWeeklyOT",0,"40:00:00",90,79],["mnrTimeBetweenSchoolEndAndShiftStart",14,"0:30",71,40],["adtMinWage",0,"9",67,29]],"UT":[["adtWeeklyOT",0,"40:00:00",100,100],["adtMinWage",0,"7.25",88,100],["adtOtPercent",0,"150",88,100],["mnrHrsPerDayInSession",14,"3:00",88,50],["mnrTimeBetweenSchoolEndAndShiftStart",14,"0:30",88,50]],"LA":[["adtWeeklyOT",0,"40:00:00",95,100],["adtMinWage",0,"7.25",100,98],["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",84,97],["mnrTimeBetweenSchoolEndAndShiftStart",17,"0:30",70,100]],"IA":[["adtWeeklyOT",0,"40:00:00",95,89],["adtMinWage",0,"7.25",100,79],["mnrTimeBetweenSchoolEndAndShiftStart",17,"0:30",68,100],["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",74,93]],"MA":[["adtWeeklyOT",0,"40:00:00",85,100],["adtMinWage",0,"15",100,100],["adtOtPercent",0,"150",69,78]],"MN":[["adtWeeklyOT",0,"40:00:00",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",14,"12:00",68,59]],"DC":[["adtWeeklyOT",0,"40:00:00",100,100],["adtMinWage",0,"15",100,100]],"CT":[["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",80,100],["adtWeeklyOT",0,"40:00:00",100,100],["adtMinWage",0,"14",80,75]],"WY":[["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",73,100],["adtMinWage",0,"7.25",100,100],["adtWeeklyOT",0,"40:00:00",91,80]],"KS":[["adtWeeklyOT",0,"40:00:00",100,100],["adtMinWage",0,"7.25",100,100],["adtOtPercent",0,"150",89,100]],"SD":[["adtWeeklyOT",0,"40:00:00",88,100],["adtMinWage",0,"9.25",100,38]],"NM":[["adtShiftLengthRest_4",0,"0:30",100,100],["adtShiftLengthRest_3",0,"0:30",100,100],["adtShiftLengthRest_2",0,"0:30",100,100],["adtShiftLengthRest_1",0,"0:30",100,100],["adtShiftLengthMeal_2",0,"0:30",100,100],["adtShiftLengthMeal_1",0,"0:30",100,100],["adtRestBreak",0,"0:30",100,100],["adtMinWage",0,"10.5",100,100],["adtMealBreak",0,"0:30",100,100],["adtShiftLengthRest_0",0,"0:00",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",14,"0:30",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",15,"0:30",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",17,"0:30",100,100],["adtWeeklyOT",0,"40:00:00",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",100,100],["adtOtPercent",0,"150",100,100]],"NJ":[["adtMinWage",0,"15.49",95,89],["adtWeeklyOT",0,"40:00:00",100,100]],"HI":[["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",100,67],["mnrTimeBetweenSchoolEndAndShiftStart",15,"0:30",67,100],["mnrTimeBetweenSchoolEndAndShiftStart",14,"0:30",67,100],["mnrTimeBetweenSchoolEndAndShiftStart",17,"0:30",100,67],["adtWeeklyOT",0,"40:00:00",100,100],["adtMinWage",0,"10.1",100,67]],"ME":[["mnrSchoolAndWorkHours",16,"15:00",100,100],["mnrConsecutiveNights",16,"5",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",100,100],["adtShiftLengthRest_0",0,"0:00",100,100],["mnrLatestEndTimeSchool",16,"1200",100,100],["mnrLatestEndTime",16,"1320",100,100],["mnrHrsPerWeekNotInSession",16,"49:00:00",100,100],["mnrHrsPerWeekInSession",16,"24:00:00",100,100],["mnrHrsPerDayNotInSession",16,"8:00",100,100],["mnrHrsPerDayInSession",16,"5:30",100,100],["mnrEarliestStartTimeNotInSession",16,"480",100,100],["mnrDaysPerWeekNotInSession",16,"5",100,100],["mnrDaysPerWeekInSession",16,"5",100,100],["adtWeeklyOT",0,"40:00:00",100,100],["adtShiftLengthRest_4",0,"0:00",100,100],["adtShiftLengthRest_3",0,"0:00",100,100],["adtShiftLengthRest_2",0,"0:00",100,100],["adtShiftLengthRest_1",0,"0:00",100,100],["adtShiftLengthMeal_1",0,"0:00",100,100],["adtMealBreak",0,"0:00",100,100],["adtRestBreak",0,"0:00",100,100],["adtShiftLengthMeal_2",0,"0:00",100,100],["adtMinWage",0,"15.1",100,100]],"AK":[["adtMealBreak",0,"0:30",100,100],["adtRestBreak",0,"0:15",100,100],["adtShiftLengthMeal_1",0,"5:00",100,100],["adtShiftLengthMeal_2",0,"8:00",100,100],["adtShiftLengthRest_1",0,"5:00",100,100],["adtShiftLengthRest_2",0,"8:00",100,100],["adtShiftLengthRest_3",0,"10:00",100,100],["adtShiftLengthRest_4",0,"10:00",100,100],["adtSpecialTermPaycheck",0,"ON",100,100],["adtWeeklyOT",0,"40:00:00",100,100],["mnrDaysPerWeekInSession",14,"6",100,100],["mnrDaysPerWeekInSession",15,"6",100,100],["mnrDaysPerWeekInSession",16,"6",100,100],["mnrDaysPerWeekInSession",17,"6",100,100],["mnrDaysPerWeekNotInSession",14,"6",100,100],["mnrDaysPerWeekNotInSession",15,"6",100,100],["mnrDaysPerWeekNotInSession",16,"6",100,100],["mnrHrsPerWeekInSession",14,"23:00",100,100],["mnrHrsPerWeekInSession",15,"23:00",100,100],["mnrLatestEndTimeSchool",14,"1260",100,100],["mnrLatestEndTimeSchool",15,"1260",100,100],["mnrSchoolAndWorkHours",14,"9:00",100,100],["mnrSchoolAndWorkHours",15,"9:00",100,100],["mnrShiftLengthMeal_1",14,"5:00",100,100],["mnrShiftLengthMeal_1",15,"5:00",100,100],["mnrShiftLengthMeal_1",16,"5:00",100,100],["mnrShiftLengthMeal_1",17,"5:00",100,100],["mnrShiftLengthMeal_2",14,"-",100,100],["mnrShiftLengthMeal_2",15,"-",100,100],["mnrShiftLengthMeal_2",17,"-",100,100],["mnrShiftLengthRest_1",14,"5:00",100,100],["mnrShiftLengthRest_1",16,"5:00",100,100],["mnrShiftLengthRest_1",17,"5:00",100,100],["mnrShiftLengthRest_2",14,"-",100,100],["mnrShiftLengthRest_2",15,"-",100,100],["mnrShiftLengthRest_2",17,"-",100,100],["mnrShiftLengthRest_3",14,"-",100,100],["mnrShiftLengthRest_3",15,"-",100,100],["mnrShiftLengthRest_3",17,"-",100,100],["mnrShiftLengthRest_4",14,"-",100,100],["mnrShiftLengthRest_4",16,"-",100,100],["mnrShiftLengthRest_4",17,"-",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",14,"0:30",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",15,"0:30",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",16,"0:30",100,100],["adtDailyOT",0,"8:00",100,100],["mnrDaysPerWeekNotInSession",17,"6",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",17,"0:30",100,100],["mnrShiftLengthRest_4",15,"-",100,100],["mnrShiftLengthRest_1",15,"5:00",100,100],["mnrShiftLengthRest_3",16,"-",100,100],["mnrShiftLengthMeal_2",16,"-",100,100],["mnrShiftLengthRest_2",16,"-",100,100],["mnrShiftLengthRest_0",17,"-",100,100],["adtShiftLengthRest_0",0,"4:59",100,100],["mnrShiftLengthRest_0",16,"-",100,100],["adtOtPercent",0,"1.5",100,100],["adtMinWage",0,"11.73",100,100]],"VT":[["adtShiftLengthRest_3",0,"12:00",100,100],["adtRestBreak",0,"0:15",100,100],["adtShiftLengthMeal_2",0,"8:00",100,100],["mnrHrsPerDayNotInSession",16,"6:00",100,100],["mnrHrsPerWeekNotInSession",16,"6:00",100,100],["mnrShiftLengthRest_4",16,"20:00",100,100],["mnrShiftLengthRest_1",16,"5:00",100,100],["mnrLatestEndTimeSchool",16,"1260",100,100],["adtMinWageForTippedEmp",0,"7.25",100,100],["adtAssumeFullTipCredit",0,"YES",100,100],["adtMinShiftMinsGapForSplitShift",0,"1:00",100,100],["mnrMinWage",16,"10.67",100,100],["adtAllowMealBrkWaiver",0,"1:00",100,100],["adtApproachingOTAlertHoursSalaried",0,"40:00:00",100,100],["adtApproachingOTAlertHours",0,"38:00:00",100,100],["adtOtPercent",0,"150",100,100],["adtShiftLengthRest_0",0,"4:00",100,100],["mnrShiftLengthRest_0",16,"4:00",100,100],["mnrShiftLengthMeal_2",16,"8:00",100,100],["mnrShiftLengthMeal_1",16,"8:00",100,100],["mnrSchoolAndWorkHours",16,"12:00",100,100],["mnrLatestEndTime",16,"1320",100,100],["mnrHrsPerWeekInSession",16,"20:00",100,100],["mnrHrsPerDayInSession",16,"4:00",100,100],["mnrEarliestStartTimeNotInSession",16,"480",100,100],["mnrDaysPerWeekNotInSession",16,"5",100,100],["mnrTimeBetweenSchoolEndAndShiftStart",16,"1:00",100,100],["mnrShiftLengthRest_3",16,"16:00",100,100],["mnrShiftLengthRest_2",16,"12:00",100,100],["mnrDaysPerWeekInSession",16,"5",100,100],["mnrConsecutiveNights",16,"2",100,100],["adtWeeklyOT",0,"40:00:00",100,100],["adtSpecialTermPaycheck",0,"ON",100,100],["adtShiftLengthRest_4",0,"16:00",100,100],["adtShiftLengthRest_2",0,"8:00",100,100],["adtShiftLengthRest_1",0,"5:00",100,100],["adtShiftLengthMeal_1",0,"5:00",100,100],["adtMinWage",0,"12.55",100,100],["adtMealBreak",0,"0:15",100,100]],"DE":[["adtOtPercent",0,"150",88,100],["adtWeeklyOT",0,"40:00:00",100,88],["adtMealBreak",0,"0:30",88,100],["adtRestBreak",0,"0:15",88,100],["adtShiftLengthMeal_1",0,"8:00",88,57],["adtShiftLengthMeal_2",0,"14:00",88,57],["adtShiftLengthRest_1",0,"5:00",88,57],["adtShiftLengthRest_2",0,"10:00",88,57],["adtShiftLengthRest_3",0,"12:00",88,57],["adtShiftLengthRest_4",0,"16:00",88,57],["adtShiftLengthRest_0",0,"5:00",88,57],["adtMinWage",0,"11.75",88,57]],"RI":[["adtWeeklyOT",0,"40:00:00",100,100],["adtOtPercent",0,"150",100,100],["adtMinWage",0,"14",100,75]]};

// Canonicalize a setting so equivalent values compare equal regardless of format
// (e.g. "40:00:00" == "1 day, 16:00:00" == 144000s; "8:00" == "8:00:00").
function normalizeSetting(v){
  var s=String(v==null?"":v).trim(); if(!s||s==="-") return s.toLowerCase();
  var d=s.match(/^(\d+)\s*days?[, ]+\s*(\d{1,3}):(\d{1,2})(?::(\d{1,2}))?$/i);
  if(d) return "dur:"+(parseInt(d[1],10)*86400+parseInt(d[2],10)*3600+parseInt(d[3],10)*60+(d[4]?parseInt(d[4],10):0));
  var t=s.match(/^(\d{1,4}):(\d{1,2})(?::(\d{1,2}))?$/);
  if(t) return "dur:"+(parseInt(t[1],10)*3600+parseInt(t[2],10)*60+(t[3]?parseInt(t[3],10):0));
  return s.toLowerCase();
}
// Treat OT/DT percent and multiplier forms as equal (150 == 1.5x); used for value compares.
function normalizeForLaw(lawId, v){
  var s=String(v==null?"":v).trim();
  if(lawId && lawId.toLowerCase().indexOf("percent")>=0){
    var n=parseFloat(s.replace(/%/g,""));
    if(!isNaN(n)){ if(n>=10) n=n/100; return "x"+n; }
  }
  return normalizeSetting(v);
}
// A setting that is effectively "off"/zero/unset, so it is not a meaningful peer standard.
function isZeroSetting(v){
  var s=String(v==null?"":v).trim();
  if(s===""||s==="-") return true;
  if(normalizeSetting(s)==="dur:0") return true;
  var n=parseFloat(s); if(!isNaN(n)&&n===0) return true;
  return false;
}
function parseWageNum(v){ var n=parseFloat(String(v==null?"":v).replace(/[^0-9.]/g,"")); return isNaN(n)?null:n; }
function RingPc(pc,color){var r=15.5,c=2*Math.PI*r,p2=Math.max(0,Math.min(100,pc)),off=c*(1-p2/100);return (<svg width="46" height="46" viewBox="0 0 36 36" style={{flexShrink:0}}><circle cx="18" cy="18" r={r} fill="none" stroke="#e8edf3" strokeWidth="4"/><circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 18 18)"/></svg>);}
// Operator adoption per state per rule (distinct operators with the rule ON / total operators in state).
var STATE_ORG_BASELINE={"MI":{"t":72,"l":{"adtMinWage":61,"adtWeeklyOT":67,"adtOtPercent":28}},"OH":{"t":44,"l":{"mnrTimeBetweenSchoolEndAndShiftStart@16":24,"adtMinWage":38,"adtWeeklyOT":38}},"WI":{"t":15,"l":{"adtWeeklyOT":15,"adtMinWage":8,"adtOtPercent":4}},"CA":{"t":95,"l":{"adtMinShiftMinsGapForSplitShift":42,"adtMaxWage":46,"adtSplitShiftPremiumPayMins":41,"adtSplitShiftPayRate":43,"adtMinLengthTimeBetweenTwoShifts":37,"adtMealBrkPremiumPayMins":39,"adtMealBrkPayRate":43,"adtDailyOTSalaried":43,"adtDtPercent":43,"adtDtPercentSalaried":45,"adtApproachingOTAlertHours":46,"adtWeeklyOTSalaried":39,"adtOtPercent":52,"adtOtPercentSalaried":47,"mnrTimeBetweenSchoolEndAndShiftStart@17":46,"mnrLatestEndTimeSchool@16":40,"mnrLatestEndTime@16":34,"mnrHrsPerWeekNotInSession@16":35,"mnrHrsPerWeekInSession@16":37,"mnrHrsPerDayNotInSession@16":36,"mnrHrsPerDayInSession@17":33,"mnrHrsPerDayInSession@16":50,"mnrEarliestStartTimeNotInSession@16":32,"adtDailyDT":61,"mnrDaysPerWeekInSession@16":33,"adtWeeklyOT":85,"adtShiftLengthRest_4":67,"adtShiftLengthRest_3":67,"adtShiftLengthRest_2":67,"adtShiftLengthRest_1":67,"adtShiftLengthMeal_2":67,"adtShiftLengthMeal_1":67,"adtRestBreak":67,"adtMinWage":78,"adtMealBreak":67,"seventhDayRuleCA":57,"adtDailyOT":72,"mnrTimeBetweenSchoolEndAndShiftStart@16":65,"mnrShiftLengthMeal_1@16":34,"adtShiftLengthRest_0":67,"adtEnableEarnedBreakConcept":32,"mnrShiftLengthMeal_2@16":34,"mnrShiftLengthRest_4@16":34,"mnrShiftLengthRest_3@16":34,"mnrShiftLengthRest_2@16":34,"mnrShiftLengthRest_1@16":34,"mnrShiftLengthRest_0@16":34}},"IL":{"t":24,"l":{"adtMinWage":22,"adtWeeklyOT":23,"adtOtPercent":11}},"IN":{"t":21,"l":{"adtWeeklyOT":19,"adtMinWage":17}},"FL":{"t":43,"l":{"mnrTimeBetweenSchoolEndAndShiftStart@16":28,"adtMinWage":42,"adtWeeklyOT":42,"adtOtPercent":24}},"AZ":{"t":16,"l":{"adtOtPercent":12,"mnrTimeBetweenSchoolEndAndShiftStart@16":10,"mnrTimeBetweenSchoolEndAndShiftStart@17":10,"adtMinWage":15,"adtWeeklyOT":16}},"NV":{"t":10,"l":{"adtShiftLengthRest_0":5,"mnrTimeBetweenSchoolEndAndShiftStart@17":9,"mnrTimeBetweenSchoolEndAndShiftStart@16":9,"adtShiftLengthRest_4":5,"adtShiftLengthRest_3":5,"adtShiftLengthRest_2":5,"adtShiftLengthRest_1":5,"adtShiftLengthMeal_2":5,"adtShiftLengthMeal_1":5,"adtRestBreak":5,"adtMinWage":5,"adtMealBreak":5,"adtMaxWage":3}},"TX":{"t":60,"l":{"mnrTimeBetweenSchoolEndAndShiftStart@17":31,"mnrTimeBetweenSchoolEndAndShiftStart@16":38,"adtWeeklyOT":58,"adtMinWage":58,"adtOtPercent":33}},"SC":{"t":17,"l":{"adtWeeklyOT":16,"mnrTimeBetweenSchoolEndAndShiftStart@14":8,"adtMinWage":12}},"KY":{"t":32,"l":{"adtWeeklyOT":28,"adtMinWage":26}},"WV":{"t":9,"l":{"adtMinWage":9,"adtWeeklyOT":9}},"OK":{"t":8,"l":{"mnrTimeBetweenSchoolEndAndShiftStart@14":7,"mnrTimeBetweenSchoolEndAndShiftStart@16":6,"mnrTimeBetweenSchoolEndAndShiftStart@17":6,"adtMinWage":7,"adtWeeklyOT":8,"adtOtPercent":5}},"PA":{"t":18,"l":{"adtMinWage":14,"adtWeeklyOT":17}},"NY":{"t":26,"l":{"adtWeeklyOT":25,"adtMinWage":21}},"CO":{"t":16,"l":{"adtWeeklyOT":13,"adtMinWage":15,"mnrTimeBetweenSchoolEndAndShiftStart@17":8,"mnrTimeBetweenSchoolEndAndShiftStart@16":9}},"NC":{"t":34,"l":{"adtMinWage":29,"adtWeeklyOT":33}},"AR":{"t":9,"l":{"adtWeeklyOT":9}},"AL":{"t":14,"l":{"mnrTimeBetweenSchoolEndAndShiftStart@17":9,"adtMinWage":11,"adtWeeklyOT":11,"mnrTimeBetweenSchoolEndAndShiftStart@16":8,"mnrLatestEndTimeSchool@16":4,"adtOtPercent":7}},"MS":{"t":17,"l":{"mnrTimeBetweenSchoolEndAndShiftStart@16":12,"adtWeeklyOT":16,"adtMinWage":15}},"TN":{"t":27,"l":{"mnrTimeBetweenSchoolEndAndShiftStart@16":24,"adtWeeklyOT":27,"adtMinWage":21}},"WA":{"t":18,"l":{"adtMinWage":17,"adtWeeklyOT":17,"adtMealBreak":10,"adtRestBreak":10,"adtShiftLengthMeal_1":10,"adtShiftLengthMeal_2":10,"adtShiftLengthRest_1":10,"adtShiftLengthRest_2":10,"adtShiftLengthRest_3":10,"adtShiftLengthRest_4":10,"adtShiftLengthRest_0":10}},"GA":{"t":35,"l":{"adtWeeklyOT":34,"adtMinWage":33}},"MO":{"t":20,"l":{"adtMinWage":17,"adtWeeklyOT":19}},"VA":{"t":18,"l":{"mnrTimeBetweenSchoolEndAndShiftStart@16":11,"adtMinWage":15,"adtWeeklyOT":18,"adtOtPercent":9}},"OR":{"t":14,"l":{"mnrHrsPerWeekInSession@16":7,"mnrHrsPerWeekInSession@17":7,"mnrHrsPerWeekNotInSession@16":6,"mnrHrsPerWeekNotInSession@17":7,"mnrShiftLengthMeal_1@16":7,"mnrShiftLengthMeal_2@16":7,"mnrShiftLengthRest_1@16":7,"mnrShiftLengthRest_2@16":7,"mnrShiftLengthRest_3@16":7,"mnrShiftLengthRest_4@16":7,"adtMealBreak":12,"adtMinWage":13,"adtRestBreak":12,"mnrTimeBetweenSchoolEndAndShiftStart@16":10,"mnrShiftLengthRest_0@16":7,"adtShiftLengthRest_0":12,"adtShiftLengthMeal_1":12,"mnrTimeBetweenSchoolEndAndShiftStart@17":8,"adtShiftLengthMeal_2":12,"adtShiftLengthRest_1":12,"adtShiftLengthRest_2":12,"adtShiftLengthRest_3":12,"adtShiftLengthRest_4":12,"adtSpecialTermPaycheck":10,"adtWeeklyOT":14,"adtOtPercent":4}},"MD":{"t":10,"l":{"adtMinWage":10,"adtWeeklyOT":10,"mnrTimeBetweenSchoolEndAndShiftStart@14":6}},"ND":{"t":3,"l":{"adtWeeklyOT":3,"adtMinWage":3,"mnrTimeBetweenSchoolEndAndShiftStart@15":3,"adtOtPercent":2}},"ID":{"t":4,"l":{"mnrLatestEndTimeSchool@14":1,"mnrHrsPerWeekInSession@14":1,"adtWeeklyOT":3,"adtSpecialTermPaycheck":1,"adtMinWage":4,"mnrTimeBetweenSchoolEndAndShiftStart@14":1,"mnrLatestEndTime@14":1}},"MT":{"t":6,"l":{"adtMinWage":6,"adtWeeklyOT":6}},"NE":{"t":14,"l":{"adtWeeklyOT":12,"mnrTimeBetweenSchoolEndAndShiftStart@14":9,"adtMinWage":8}},"UT":{"t":4,"l":{"adtWeeklyOT":4,"adtMinWage":2,"adtOtPercent":2,"mnrHrsPerDayInSession@14":2,"mnrTimeBetweenSchoolEndAndShiftStart@14":2}},"LA":{"t":15,"l":{"adtWeeklyOT":14,"adtMinWage":15,"mnrTimeBetweenSchoolEndAndShiftStart@16":12,"mnrTimeBetweenSchoolEndAndShiftStart@17":11}},"IA":{"t":9,"l":{"adtWeeklyOT":8,"adtMinWage":9,"mnrTimeBetweenSchoolEndAndShiftStart@17":4,"mnrTimeBetweenSchoolEndAndShiftStart@16":5}},"MA":{"t":5,"l":{"adtWeeklyOT":4,"adtMinWage":5,"adtOtPercent":3}},"MN":{"t":11,"l":{"adtWeeklyOT":11,"mnrTimeBetweenSchoolEndAndShiftStart@14":4}},"DC":{"t":1,"l":{"adtWeeklyOT":1,"adtMinWage":1}},"CT":{"t":3,"l":{"mnrTimeBetweenSchoolEndAndShiftStart@16":2,"adtWeeklyOT":3,"adtMinWage":2}},"WY":{"t":5,"l":{"mnrTimeBetweenSchoolEndAndShiftStart@16":3,"adtMinWage":5,"adtWeeklyOT":4}},"KS":{"t":5,"l":{"adtWeeklyOT":5,"adtMinWage":5,"adtOtPercent":4}},"SD":{"t":5,"l":{"adtWeeklyOT":4,"adtMinWage":5}},"NM":{"t":1,"l":{"adtShiftLengthRest_4":1,"adtShiftLengthRest_3":1,"adtShiftLengthRest_2":1,"adtShiftLengthRest_1":1,"adtShiftLengthMeal_2":1,"adtShiftLengthMeal_1":1,"adtRestBreak":1,"adtMinWage":1,"adtMealBreak":1,"adtShiftLengthRest_0":1,"mnrTimeBetweenSchoolEndAndShiftStart@14":1,"mnrTimeBetweenSchoolEndAndShiftStart@15":1,"mnrTimeBetweenSchoolEndAndShiftStart@17":1,"adtWeeklyOT":1,"mnrTimeBetweenSchoolEndAndShiftStart@16":1,"adtOtPercent":1}},"NJ":{"t":6,"l":{"adtMinWage":5,"adtWeeklyOT":6}},"HI":{"t":2,"l":{"mnrTimeBetweenSchoolEndAndShiftStart@16":2,"mnrTimeBetweenSchoolEndAndShiftStart@15":1,"mnrTimeBetweenSchoolEndAndShiftStart@14":1,"mnrTimeBetweenSchoolEndAndShiftStart@17":2,"adtWeeklyOT":2,"adtMinWage":2}},"ME":{"t":1,"l":{"mnrSchoolAndWorkHours@16":1,"mnrConsecutiveNights@16":1,"mnrTimeBetweenSchoolEndAndShiftStart@16":1,"adtShiftLengthRest_0":1,"mnrLatestEndTimeSchool@16":1,"mnrLatestEndTime@16":1,"mnrHrsPerWeekNotInSession@16":1,"mnrHrsPerWeekInSession@16":1,"mnrHrsPerDayNotInSession@16":1,"mnrHrsPerDayInSession@16":1,"mnrEarliestStartTimeNotInSession@16":1,"mnrDaysPerWeekNotInSession@16":1,"mnrDaysPerWeekInSession@16":1,"adtWeeklyOT":1,"adtShiftLengthRest_4":1,"adtShiftLengthRest_3":1,"adtShiftLengthRest_2":1,"adtShiftLengthRest_1":1,"adtShiftLengthMeal_1":1,"adtMealBreak":1,"adtRestBreak":1,"adtShiftLengthMeal_2":1,"adtMinWage":1}},"AK":{"t":1,"l":{"adtMealBreak":1,"adtRestBreak":1,"adtShiftLengthMeal_1":1,"adtShiftLengthMeal_2":1,"adtShiftLengthRest_1":1,"adtShiftLengthRest_2":1,"adtShiftLengthRest_3":1,"adtShiftLengthRest_4":1,"adtSpecialTermPaycheck":1,"adtWeeklyOT":1,"mnrDaysPerWeekInSession@14":1,"mnrDaysPerWeekInSession@15":1,"mnrDaysPerWeekInSession@16":1,"mnrDaysPerWeekInSession@17":1,"mnrDaysPerWeekNotInSession@14":1,"mnrDaysPerWeekNotInSession@15":1,"mnrDaysPerWeekNotInSession@16":1,"mnrHrsPerWeekInSession@14":1,"mnrHrsPerWeekInSession@15":1,"mnrLatestEndTimeSchool@14":1,"mnrLatestEndTimeSchool@15":1,"mnrSchoolAndWorkHours@14":1,"mnrSchoolAndWorkHours@15":1,"mnrShiftLengthMeal_1@14":1,"mnrShiftLengthMeal_1@15":1,"mnrShiftLengthMeal_1@16":1,"mnrShiftLengthMeal_1@17":1,"mnrShiftLengthMeal_2@14":1,"mnrShiftLengthMeal_2@15":1,"mnrShiftLengthMeal_2@17":1,"mnrShiftLengthRest_1@14":1,"mnrShiftLengthRest_1@16":1,"mnrShiftLengthRest_1@17":1,"mnrShiftLengthRest_2@14":1,"mnrShiftLengthRest_2@15":1,"mnrShiftLengthRest_2@17":1,"mnrShiftLengthRest_3@14":1,"mnrShiftLengthRest_3@15":1,"mnrShiftLengthRest_3@17":1,"mnrShiftLengthRest_4@14":1,"mnrShiftLengthRest_4@16":1,"mnrShiftLengthRest_4@17":1,"mnrTimeBetweenSchoolEndAndShiftStart@14":1,"mnrTimeBetweenSchoolEndAndShiftStart@15":1,"mnrTimeBetweenSchoolEndAndShiftStart@16":1,"adtDailyOT":1,"mnrDaysPerWeekNotInSession@17":1,"mnrTimeBetweenSchoolEndAndShiftStart@17":1,"mnrShiftLengthRest_4@15":1,"mnrShiftLengthRest_1@15":1,"mnrShiftLengthRest_3@16":1,"mnrShiftLengthMeal_2@16":1,"mnrShiftLengthRest_2@16":1,"mnrShiftLengthRest_0@17":1,"adtShiftLengthRest_0":1,"mnrShiftLengthRest_0@16":1,"adtOtPercent":1,"adtMinWage":1}},"VT":{"t":1,"l":{"adtShiftLengthRest_3":1,"adtRestBreak":1,"adtShiftLengthMeal_2":1,"mnrHrsPerDayNotInSession@16":1,"mnrHrsPerWeekNotInSession@16":1,"mnrShiftLengthRest_4@16":1,"mnrShiftLengthRest_1@16":1,"mnrLatestEndTimeSchool@16":1,"adtMinWageForTippedEmp":1,"adtAssumeFullTipCredit":1,"adtMinShiftMinsGapForSplitShift":1,"mnrMinWage@16":1,"adtAllowMealBrkWaiver":1,"adtApproachingOTAlertHoursSalaried":1,"adtApproachingOTAlertHours":1,"adtOtPercent":1,"adtShiftLengthRest_0":1,"mnrShiftLengthRest_0@16":1,"mnrShiftLengthMeal_2@16":1,"mnrShiftLengthMeal_1@16":1,"mnrSchoolAndWorkHours@16":1,"mnrLatestEndTime@16":1,"mnrHrsPerWeekInSession@16":1,"mnrHrsPerDayInSession@16":1,"mnrEarliestStartTimeNotInSession@16":1,"mnrDaysPerWeekNotInSession@16":1,"mnrTimeBetweenSchoolEndAndShiftStart@16":1,"mnrShiftLengthRest_3@16":1,"mnrShiftLengthRest_2@16":1,"mnrDaysPerWeekInSession@16":1,"mnrConsecutiveNights@16":1,"adtWeeklyOT":1,"adtSpecialTermPaycheck":1,"adtShiftLengthRest_4":1,"adtShiftLengthRest_2":1,"adtShiftLengthRest_1":1,"adtShiftLengthMeal_1":1,"adtMinWage":1,"adtMealBreak":1}},"DE":{"t":3,"l":{"adtOtPercent":2,"adtWeeklyOT":3,"adtMealBreak":2,"adtRestBreak":2,"adtShiftLengthMeal_1":2,"adtShiftLengthMeal_2":2,"adtShiftLengthRest_1":2,"adtShiftLengthRest_2":2,"adtShiftLengthRest_3":2,"adtShiftLengthRest_4":2,"adtShiftLengthRest_0":2,"adtMinWage":2}},"RI":{"t":2,"l":{"adtWeeklyOT":2,"adtOtPercent":2,"adtMinWage":2}}};

// Pre-baked US state SVG paths (geoAlbersUsa, viewBox 0 0 900 520) for the map view.
var STATE_PATHS={"AL":"M580,411L580,411L580,411ZM574,324L613,320L629,369L630,392L590,396L592,409L578,409Z","AK":"M146,454L146,454L146,454ZM145,466L145,466L145,466ZM142,467L142,467L142,467ZM142,467L142,467L142,467ZM141,467L141,467L141,467ZM141,473L141,473L141,473ZM141,468L141,468L141,468ZM140,459L140,459L140,459ZM140,468L140,468L140,468ZM139,460L139,460L139,460ZM136,474L136,474L136,474ZM136,465L136,465L136,465ZM134,483L134,483L134,483ZM133,484L133,484L133,484ZM132,478L140,475L134,482ZM131,484L131,484L131,484ZM128,488L128,488L128,488ZM124,487L124,487L124,487ZM124,486L124,486L124,486ZM123,483L123,483L123,483ZM120,485L120,485L120,485ZM117,488L117,488L117,488ZM116,487L116,487L116,487ZM115,494L115,494L115,494ZM115,488L115,488L115,488ZM114,493L114,493L114,493ZM114,494L114,494L114,494ZM114,492L114,492L114,492ZM113,494L113,494L113,494ZM113,492L113,492L113,492ZM112,490L112,490L112,490ZM111,493L111,493L111,493ZM113,469L113,469L113,469ZM111,490L111,490L111,490ZM113,469L113,469L113,469ZM109,490L109,490L109,490ZM111,469L111,469L111,469ZM107,491L107,491L107,491ZM106,491L106,491L106,491ZM105,491L105,491L105,491ZM103,492L103,492L103,492ZM110,437L110,437L110,437ZM101,495L101,495L101,495ZM101,489L101,489L101,489ZM94,495L94,495L94,495ZM92,496L92,496L92,496ZM91,496L91,496L91,496ZM91,496L91,496L91,496ZM91,495L91,495L91,495ZM89,495L89,495L89,495ZM89,496L89,496L89,496ZM92,456L92,456L92,456ZM82,499L82,499L82,499ZM97,421L108,417L109,421L116,420L115,415L104,405L111,402L117,394L128,389L154,396L158,395L164,397L175,456L181,456L188,462L193,455L202,461L211,470L218,471L219,480L209,474L194,458L197,464L192,465L178,459L166,459L156,453L154,460L142,467L142,455L136,468L118,484L118,487L94,494L122,477L124,469L117,471L114,466L109,469L108,459L103,461L97,448L106,438L115,436L115,429L111,431L101,429ZM76,501L76,501L76,501ZM75,501L75,501L75,501ZM74,499L74,499L74,499ZM79,477L79,477L79,477ZM74,499L74,499L74,499ZM73,500L73,500L73,500ZM72,500L72,500L72,500ZM72,501L72,501L72,501ZM78,473L78,473L78,473ZM69,501L69,501L69,501ZM68,500L68,500L68,500ZM67,501L67,501L67,501ZM84,432L92,436L89,437ZM62,501L62,501L62,501ZM75,450L75,450L75,450ZM75,448L75,448L75,448ZM56,500L56,500L56,500ZM51,499L51,499L51,499ZM50,499L50,499L50,499ZM51,498L51,498L51,498ZM50,499L50,499L50,499ZM49,499L49,499L49,499ZM48,498L48,498L48,498ZM47,499L47,499L47,499ZM44,499L44,499L44,499ZM43,497L43,497L43,497ZM42,498L42,498L42,498ZM40,496L40,496L40,496ZM38,497L38,497L38,497ZM37,497L37,497L37,497ZM37,496L37,496L37,496ZM36,498L36,498L36,498ZM35,498L35,498L35,498ZM32,492L32,492L32,492ZM28,493L28,493L28,493ZM28,491L28,491L28,491ZM27,491L27,491L27,491ZM27,490L27,490L27,490ZM23,489L23,489L23,489ZM20,484L20,484L20,484ZM15,479L15,479L15,479ZM14,478L14,478L14,478ZM14,478L14,478L14,478ZM11,479L11,479L11,479ZM10,475L10,475L10,475ZM216,479L216,479L216,479ZM216,480L216,480L216,480ZM215,480L215,480L215,480ZM215,480L215,480L215,480ZM213,478L213,478L213,478ZM209,472L209,472L209,472ZM209,473L209,473L209,473ZM209,472L209,472L209,472ZM211,482L211,482L211,482ZM208,474L208,474L208,474ZM207,473L207,473L207,473ZM208,479L208,479L208,479ZM209,483L209,483L209,483ZM207,478L207,478L207,478ZM207,478L207,478L207,478ZM207,480L207,480L207,480ZM206,477L207,474L214,482ZM203,468L203,468L203,468ZM205,477L205,477L205,477ZM204,477L204,477L204,477ZM202,472L209,471L204,476ZM197,463L197,463L197,463ZM197,462L197,462L197,462ZM195,459L195,459L195,459ZM197,470L197,470L197,470ZM195,464L195,464L195,464ZM196,471L196,471L196,471ZM193,463L193,463L193,463ZM194,465L194,465L194,465ZM193,467L193,467L193,467ZM161,457L161,457L161,457ZM159,457L159,457L159,457ZM155,455L155,455L155,455ZM155,456L155,456L155,456ZM155,459L155,459L155,459ZM154,462L154,462L154,462ZM153,459L153,459L153,459ZM153,456L153,456L153,456Z","AZ":"M173,342L188,316L183,301L198,267L270,279L256,382L224,378Z","CO":"M280,205L348,213L376,215L374,233L371,289L357,288L270,279Z","FL":"M714,494L714,494L714,494ZM713,495L713,495L713,495ZM708,497L708,497L708,497ZM697,502L697,502L697,502ZM694,503L694,503L694,503ZM691,503L691,503L691,503ZM684,465L684,465L684,465ZM678,503L678,503L678,503ZM638,414L638,414L638,414ZM630,392L686,390L719,453L708,490L672,445L672,426L644,407L592,409L590,396Z","GA":"M613,320L632,318L650,315L647,322L691,365L686,390L630,392L629,369Z","IN":"M573,199L583,197L610,196L616,243L602,265L573,272L579,254Z","KS":"M374,233L468,236L478,252L479,291L371,289Z","ME":"M815,106L815,106L815,106ZM814,107L814,107L814,107ZM813,104L813,104L813,104ZM809,107L809,107L809,107ZM810,114L810,114L810,114ZM808,110L808,110L808,110ZM808,108L808,108L808,108ZM791,135L776,96L788,52L807,54L829,90Z","MA":"M806,165L806,165L806,165ZM798,166L798,166L798,166ZM760,149L770,147L791,139L794,164L792,161L791,161L782,157L760,162Z","MN":"M444,71L538,86L509,112L500,147L522,170L452,171L451,127Z","NJ":"M742,212L743,211L743,209L747,178L758,188L758,189L756,193L742,213Z","NC":"M754,279L754,279L754,279ZM754,296L754,296L754,296ZM666,283L750,269L755,286L721,326L680,308L650,315L632,318Z","ND":"M361,67L444,71L451,127L356,122Z","OK":"M357,288L371,289L479,291L479,301L481,353L441,352L399,335L400,300L356,297Z","PA":"M667,182L676,175L735,169L747,178L743,209L739,211L688,221L671,207Z","SD":"M354,139L356,122L451,127L452,171L453,190L425,180L351,176Z","TX":"M356,297L400,300L399,335L441,352L481,353L488,355L488,355L488,365L497,398L493,426L451,451L435,469L436,496L407,485L402,465L372,422L344,435L323,421L296,379L349,380Z","WY":"M354,139L351,176L348,213L280,205L253,201L256,183L263,138L264,128Z","CT":"M760,162L782,157L785,170L762,182Z","MO":"M462,225L522,227L558,288L554,297L553,298L553,298L550,307L544,298L479,301L479,291L478,252L468,236Z","WV":"M648,252L669,224L671,207L688,221L714,224L689,245L684,263L660,267Z","IL":"M522,227L535,204L530,188L568,185L573,199L579,254L573,272L558,288Z","NM":"M270,279L357,288L356,297L349,380L296,379L256,382Z","AR":"M479,301L544,298L550,307L543,326L532,363L488,365L488,355L488,355L481,353Z","CA":"M119,316L119,316L119,316ZM117,324L117,324L117,324ZM112,314L112,314L112,314ZM109,303L109,303L109,303ZM103,316L103,316L103,316ZM102,300L102,300L102,300ZM97,301L97,301L97,301ZM94,299L94,299L94,299ZM83,143L137,158L137,158L124,212L183,301L188,316L173,342L137,338L122,306L96,292L72,199L71,173Z","DE":"M742,212L742,213L742,212ZM739,211L743,209L743,211L754,232Z","DC":"M723,229L725,232L723,229Z","HI":"M303,486L303,486L303,486ZM292,464L292,464L292,464ZM292,471L292,471L292,471ZM286,465L286,465L286,465ZM281,461L281,461L281,461ZM265,452L265,452L265,452ZM239,444L239,444L239,444ZM231,447L231,447L231,447Z","IA":"M452,171L522,170L530,188L535,204L522,227L462,225L453,190Z","KY":"M558,288L573,272L602,265L616,243L648,252L660,267L638,287L554,297ZM553,298L553,298L553,298Z","MD":"M743,244L742,244L743,244ZM741,241L741,241L741,241ZM734,230L734,230L734,230ZM688,221L739,211L754,232L753,240L747,243L724,235L725,232L723,229L714,224Z","MI":"M603,119L603,119L603,119ZM594,122L594,122L594,122ZM592,121L592,121L592,121ZM591,126L591,126L591,126ZM590,123L590,123L590,123ZM588,129L588,129L588,129ZM587,135L587,135L587,135ZM586,137L586,137L586,137ZM578,127L578,127L578,127ZM583,197L589,184L585,143L602,121L619,127L639,168L628,193L610,196ZM542,88L542,88L542,88ZM529,113L556,95L567,111L597,103L617,117L573,123L567,137L563,133L563,133L530,114L530,114Z","MS":"M577,412L577,412L577,412ZM573,412L573,412L573,412ZM569,413L569,413L569,413ZM567,412L567,412L567,412ZM532,363L543,326L574,324L578,409L561,414L556,399L527,401Z","MT":"M216,45L361,67L356,122L354,139L264,128L263,138L238,134L229,92L214,74Z","NH":"M772,103L776,96L791,135L791,139L770,147Z","NY":"M783,172L783,172L783,172ZM782,175L782,175L782,175ZM781,174L781,174L781,174ZM758,189L756,193L758,189ZM715,138L715,138L715,138ZM714,138L714,138L714,138ZM676,175L682,156L710,150L730,113L749,109L760,149L760,162L762,182L758,188L747,178L735,169Z","OH":"M638,194L638,194L638,194ZM637,193L637,193L637,193ZM610,196L628,193L642,197L667,182L671,207L669,224L648,252L616,243Z","OR":"M114,70L126,88L194,96L176,168L137,158L137,158L137,158L83,143L109,71Z","TN":"M550,307L553,298L553,298L554,297L638,287L666,283L632,318L613,320L574,324L543,326Z","UT":"M216,176L256,183L253,201L280,205L270,279L198,267Z","VA":"M743,246L743,246L743,246ZM747,243L753,240L747,243ZM743,244L742,244L743,244ZM660,267L684,263L689,245L714,224L723,229L725,232L724,235L750,269L666,283L638,287Z","WA":"M132,55L132,55L132,55ZM136,34L136,34L136,34ZM136,30L136,30L136,30ZM135,33L135,33L135,33ZM133,39L133,39L133,39ZM133,28L133,28L133,28ZM132,29L132,29L132,29ZM133,24L133,24L133,24ZM130,31L130,31L130,31ZM130,29L130,29L130,29ZM205,43L194,96L126,88L114,70L112,29L138,44L137,25Z","WI":"M575,132L575,132L575,132ZM570,135L570,135L570,135ZM528,105L528,105L528,105ZM527,107L527,107L527,107ZM526,107L526,107L526,107ZM524,108L524,108L524,108ZM525,106L525,106L525,106ZM524,105L524,105L524,105ZM524,109L524,109L524,109ZM521,106L521,106L521,106ZM509,112L529,113L530,114L530,114L563,133L563,133L567,137L568,185L530,188L522,170L500,147Z","NE":"M351,176L425,180L453,190L462,225L468,236L374,233L376,215L348,213Z","SC":"M650,315L680,308L721,326L691,365L647,322Z","ID":"M194,96L205,43L216,45L214,74L229,92L238,134L263,138L256,183L216,176L176,168Z","NV":"M137,158L137,158L176,168L216,176L198,267L183,301L124,212Z","VT":"M749,109L772,103L770,147L760,149Z","LA":"M571,415L571,415L571,415ZM564,416L564,416L564,416ZM560,426L560,426L560,426ZM549,434L549,434L549,434ZM546,435L546,435L546,435ZM543,436L543,436L543,436ZM522,427L522,427L522,427ZM488,365L532,363L527,401L556,399L561,414L542,436L524,422L493,426L497,398Z","RI":"M792,161L794,164L792,161ZM790,162L790,162L790,162ZM790,166L790,166L790,166ZM789,172L789,172L789,172ZM785,170L782,157L791,161Z"};

function classifyComplianceLaw(lid){
  var l=String(lid||"");
  // hours = relative severity weight kept for a future risk model (currently unused).
  function R(cat,sev,hours,uniform){ return {cat:cat,sev:sev,hours:hours,uniform:uniform}; }
  if(l.indexOf("seventhDayRule")===0) return R("Overtime","critical",15,true);
  if(l==="adtDailyOT"||l==="adtDailyOTSalaried"||l==="adtDailyDT"||l==="adtDailyDTSalaried"||
     l==="adtWeeklyOT"||l==="adtWeeklyOTSalaried"||l==="adtWeeklyDT"||l==="adtOtPercent"||
     l==="adtOtPercentSalaried"||l==="adtDtPercent"||l==="adtDtPercentSalaried"||
     l==="adtNVSpreadOfHours"||l==="mnrAdtDailyOT") return R("Overtime","critical",15,true);
  if(l.indexOf("adtApproachingOTAlert")===0) return R("Other","low",0.75,true);
  if(l.indexOf("adtPred")===0||l.indexOf("adtTrackSch")===0||l==="adtPostSchPriorToXDays"||
     l==="adtShowRsnOnSchAftrSchPublish") return R("Fair Scheduling","critical",12,true);
  if(l.indexOf("mnr")===0&&l!=="mnrMinWage"&&l!=="mnrNYBreakRules"&&l.indexOf("ShiftLength")<0)
     return R("Minor Labor","critical",10,true);
  if(l==="adtMinWage"||l==="adtMinWageForTippedEmp"||l==="mnrMinWage") return R("Min Wage","critical",12,false);
  if(l==="adtMinCashPercForTips"||l==="adtMinCreditCardPercForTips"||l==="adtAssumeFullTipCredit")
     return R("Tip Handling","high",6,false);
  if(l.indexOf("Meal")>=0||l==="adtAllowMealBrkWaiver"||l==="adtEnableEarnedBreakConcept")
     return R("Meal Break","high",9,true);
  if(l==="adtMinShiftGapForRgtToRstShift"||l==="adtRgtToRstPercent"||l==="adtMinLengthTimeBetweenTwoShifts"||
     l==="adtHrsForClopening"||l==="adtRstReqInSplitShifts") return R("Rest Break","medium",4,true);
  if((l.indexOf("Rest")>=0)||l==="adtNYBreakRules"||l==="mnrNYBreakRules") return R("Rest Break","high",6,true);
  if(l.indexOf("SplitShift")>=0) return R("Other","medium",4,true);
  if(l==="adtMaxShiftLength"||l==="adtMinShiftLength"||l==="adtDaysPerWeek"||
     l==="adtMaxDailyHrsPartTimeEmp"||l==="adtMaxWeeklyHrPartTimeForEmp") return R("Other","medium",3,true);
  return R("Other","low",0.75,true);
}

function runDeterministicAudit(agg, states){
  var EXPECT=0.66, MODAL_MIN=0.60, FED_MIN=7.25;
  var configs=(agg&&agg.configs)?agg.configs:[];
  var stateInfo={}, si;
  for(si=0; si<states.length; si++){ stateInfo[states[si].a]={src:states[si].src||"", mw:(typeof states[si].mw==="number"?states[si].mw:null)}; }
  var nameById={}, stateStats={}, c, s, set, key, v, L;
  for(c=0;c<configs.length;c++){
    var cfg=configs[c]; var stc=(cfg.storeNumbers?cfg.storeNumbers.length:1); var stt=cfg.assignedState||"";
    if(!stateStats[stt]) stateStats[stt]={total:0,laws:{}};
    stateStats[stt].total+=stc;
    var seen={};
    for(s=0;s<cfg.settings.length;s++){
      set=cfg.settings[s];
      if(set.lawName) nameById[set.lawId]=set.lawName;
      if(set.isActive!==1) continue;
      key=set.lawId; if(set.minorAge&&set.minorAge>0) key=set.lawId+"@"+set.minorAge;
      if(seen[key]) continue; seen[key]=true;
      L=stateStats[stt].laws;
      if(!L[key]) L[key]={lawId:set.lawId,minorAge:set.minorAge||0,active:0,settings:{}};
      L[key].active+=stc;
      v=String(set.currentSetting==null?"":set.currentSetting);
      L[key].settings[v]=(L[key].settings[v]||0)+stc;
    }
  }
  var expected={}, st, k;
  for(st in stateStats){
    if(!stateStats.hasOwnProperty(st)) continue;
    expected[st]={};
    if(typeof STATE_BASELINE!=="undefined" && STATE_BASELINE[st]){
      // Judge against the fixed statewide baseline (portfolio-derived), so the result
      // is the same whether one org or the whole portfolio was uploaded.
      var arr=STATE_BASELINE[st], bi2;
      for(bi2=0;bi2<arr.length;bi2++){
        var e=arr[bi2]; var blid=e[0], bage=e[1]||0;
        var bkey=bage>0?(blid+"@"+bage):blid;
        expected[st][bkey]={lawId:blid,minorAge:bage,modal:e[2],share:(e[3]||0)/100,modalShare:(e[4]||0)/100};
      }
    } else {
      // Fallback (state not in baseline): derive expectation from the uploaded file.
      var info=stateStats[st];
      for(k in info.laws){
        if(!info.laws.hasOwnProperty(k)) continue;
        var Ld=info.laws[k]; var share=info.total?Ld.active/info.total:0;
        if(share<EXPECT) continue;
        var modal=null,modalN=-1,tot=0,vv;
        for(vv in Ld.settings){ if(!Ld.settings.hasOwnProperty(vv))continue; tot+=Ld.settings[vv]; if(Ld.settings[vv]>modalN){modalN=Ld.settings[vv];modal=vv;} }
        expected[st][k]={lawId:Ld.lawId,minorAge:Ld.minorAge,share:share,modal:modal,modalShare:tot?modalN/tot:0};
      }
    }
  }
  var configFindings=[], totalIssues=0, catIssues={}, stateIssues={}, lawIssues={}, ci, x, ek;
  for(ci=0;ci<configs.length;ci++){
    var cf2=configs[ci]; var sc=(cf2.storeNumbers?cf2.storeNumbers.length:1); var stb=cf2.assignedState||"";
    var _ob=(typeof STATE_ORG_BASELINE!=="undefined"&&STATE_ORG_BASELINE[stb])||null; var oTot=_ob?_ob.t:0; var oLaws=_ob?_ob.l:{};
    var exp=expected[stb]||{}; var checks=[], configured=0, missing=0, hasFail=false, hasWarn=false;
    var have={};
    for(x=0;x<cf2.settings.length;x++){ var ss=cf2.settings[x]; if(ss.isActive===1){ var hk=ss.lawId; if(ss.minorAge&&ss.minorAge>0) hk=ss.lawId+"@"+ss.minorAge; have[hk]={val:String(ss.currentSetting==null?"":ss.currentSetting)}; } }
    for(ek in exp){
      if(!exp.hasOwnProperty(ek)) continue;
      var E=exp[ek]; var cls=classifyComplianceLaw(E.lawId);
      var lname=(typeof LAW_NAMES!=="undefined"&&LAW_NAMES[E.lawId])||nameById[E.lawId]||E.lawId;
      var cite=(stateInfo[stb]&&stateInfo[stb].src)||""; var got=have[ek]; var chk=null;
      var mw=(stateInfo[stb]&&typeof stateInfo[stb].mw==="number")?stateInfo[stb].mw:FED_MIN;
      var stName=cf2.assignedStateName||stb;
      var pctOn=Math.round(E.share*100), pctModal=Math.round(E.modalShare*100);
      if(E.lawId==="adtMinWage" && got){
        // Regulation-grounded: compare the configured wage to the state legal minimum.
        configured++;
        var wageNum=parseWageNum(got.val);
        if(wageNum!==null && wageNum > 1 && wageNum < mw-0.005){
          hasFail=true;
          chk={category:"Min Wage",lawId:E.lawId,lawName:lname,minorAge:E.minorAge,configurable:true,csvHasRow:true,basis:"regulation",
               status:"fail",severity:"critical",
               expected:"At least $"+mw.toFixed(2)+" ("+stName+" minimum wage)",
               actual:"$"+wageNum.toFixed(2),
               issue:"Minimum wage here is set to $"+wageNum.toFixed(2)+", which is below "+stName+"'s legal minimum of $"+mw.toFixed(2)+".",
               recommendation:"Raise the minimum wage setting to at least $"+mw.toFixed(2)+" so this location meets "+stName+" law.",
               citation:cite,perStoreExposureUSD:0};
        } else {
          chk={category:"Min Wage",lawId:E.lawId,lawName:lname,minorAge:E.minorAge,configurable:true,csvHasRow:true,basis:"regulation",
               status:"pass",severity:"info",
               expected:"At least $"+mw.toFixed(2)+" ("+stName+" minimum wage)",
               actual:"$"+(wageNum!==null?wageNum.toFixed(2):got.val),issue:"",recommendation:"",citation:cite,perStoreExposureUSD:0};
        }
      } else if(got){
        configured++;
        var divergent = cls.uniform && E.modalShare>=MODAL_MIN && !isZeroSetting(E.modal) && got.val!=="" && normalizeForLaw(E.lawId,got.val)!==normalizeForLaw(E.lawId,E.modal);
        if(divergent){
          hasWarn=true;
          chk={category:cls.cat,lawId:E.lawId,lawName:lname,minorAge:E.minorAge,configurable:true,csvHasRow:true,basis:"peer",
               status:"warn",severity:cls.sev,
               expected:"'"+E.modal+"' (used by "+pctModal+"% of "+stb+" stores brand-wide, across all operators)",
               actual:"'"+got.val+"'",
               issue:"This is set to '"+got.val+"', but "+pctModal+"% of "+stb+" stores brand-wide (all operators, not just yours) use '"+E.modal+"'.",
               recommendation:"Consider matching the "+stb+" brand norm of '"+E.modal+"', or mark this store as an intentional exception.",
               citation:cite,perStoreExposureUSD:0};
        } else {
          chk={category:cls.cat,lawId:E.lawId,lawName:lname,minorAge:E.minorAge,configurable:true,csvHasRow:true,basis:"peer",
               status:"pass",severity:"info",
               expected:"On at "+pctOn+"% of "+stb+" stores brand-wide",
               actual:"'"+got.val+"'",issue:"",recommendation:"",citation:cite,perStoreExposureUSD:0};
        }
      } else {
        missing++; hasFail=true;
        chk={category:cls.cat,lawId:"MISSING:"+E.lawId,lawName:lname,minorAge:E.minorAge,configurable:true,csvHasRow:false,basis:"peer",
             status:"fail",severity:cls.sev,
             expected:"On at "+pctOn+"% of "+stb+" stores brand-wide",
             actual:"Not set up here",
             issue:"'"+lname+"' is not set up here, but "+pctOn+"% of "+stb+" stores brand-wide (all operators, not just yours) have it on.",
             recommendation:"Turn on "+lname+" to match the "+stName+" brand norm, or confirm it's intentionally off for your stores.",
             citation:cite,perStoreExposureUSD:0};
      }
      if(chk){ chk.storePct=pctOn; chk.orgsTotal=oTot; chk.orgsOn=(typeof oLaws[ek]==="number")?oLaws[ek]:0; }
      checks.push(chk);
      if(chk.status==="fail"||chk.status==="warn"||chk.status==="missing"){
        totalIssues+=sc;
        catIssues[cls.cat]=(catIssues[cls.cat]||0)+sc;
        stateIssues[stb]=(stateIssues[stb]||0)+sc;
        lawIssues[lname]=(lawIssues[lname]||0)+sc;
      }
    }
    var overall=hasFail?"non_compliant":(hasWarn?"warning":"compliant");
    configFindings.push({configIndex:ci,stateAbbrev:stb,overallStatus:overall,
      totalApplicableLaws:checks.length,configuredCount:configured,missingCount:missing,checks:checks});
  }
  function topKey(o){ var bk=null,bv=-1,kk; for(kk in o){ if(o.hasOwnProperty(kk)&&o[kk]>bv){bv=o[kk];bk=kk;} } return bk; }
  var topState=topKey(stateIssues), topCat=topKey(catIssues), topLaw=topKey(lawIssues);
  var nStores=agg.totalStores||0;
  var summary="Deterministic audit of "+nStores+" stores across "+(agg.distinctStates?agg.distinctStates.length:0)+" state(s). "+
    totalIssues.toLocaleString()+" store-level issue(s) flagged. "+
    (topState?("Most issues in "+topState+(stateIssues[topState]?(" ("+stateIssues[topState].toLocaleString()+")"):"")+". "):"")+
    (topCat?("Largest gap area: "+topCat+". "):"")+
    "Findings compare each store to a fixed brand-wide baseline and the app's regulatory data. They are prioritization signals for review, not legal determinations.";
  var patterns=[];
  if(topCat) patterns.push(topCat+" has the most findings across the portfolio.");
  if(topLaw) patterns.push("'"+topLaw+"' is the most frequently flagged rule.");
  patterns.push("Judged against a fixed statewide baseline (from the full portfolio), so a single-org upload is flagged the same as a full-portfolio run.");
  return {summary:summary,estimatedAnnualExposureUSD:0,patterns:patterns,configFindings:configFindings};
}

// Lazy-load the SheetJS Excel parser from CDN only when an .xlsx/.xls is uploaded.
function ensureSheetJS(cb){
  if(typeof window!=="undefined"&&window.XLSX) return cb(null);
  var sc=document.createElement("script");
  sc.src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
  sc.onload=function(){cb(null);};
  sc.onerror=function(){cb(new Error("Could not load the Excel parser (offline?). Please upload a CSV instead."));};
  document.head.appendChild(sc);
}


// ── Modals ────────────────────────────────────────────────────────
function StateModal(props){
  var st=props.st; var onClose=props.onClose;
  var m=MINOR_AGES[st.a]||MA_DEF;
  function fmtTip(){ return typeof st.tip==="number" ? "$"+st.tip.toFixed(2)+"/hr" : st.tip; }
  function fmtTc(){ return st.tc==="None" ? "None" : (typeof st.tc==="number" ? "$"+st.tc.toFixed(2) : "N/A"); }
  function fmtNr(){ if(st.nr==null) return ""; return typeof st.nr==="number" ? st.nr.toFixed(2) : String(st.nr); }
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:"#fff",borderRadius:14,maxWidth:940,width:"96vw",maxHeight:"90vh",overflowY:"auto",padding:30,boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontSize:22,fontWeight:800}}>{st.s} <span style={{color:"#94a3b8",fontWeight:400,fontSize:16}}>({st.a})</span></div>
            <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap",alignItems:"center"}}><Pill r={st.r} t={st.r.toUpperCase()+" RISK"}/><SrcLink url={st.src} label="Official State Source"/></div>
          </div>
          <button onClick={onClose} style={{border:"none",background:"#f1f5f9",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:14,flexShrink:0}}>X</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Min Wage</div><div style={{fontSize:13,fontWeight:700}}>{"$"+st.mw.toFixed(2)+"/hr"}</div></div>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>OT Rule</div><div style={{fontSize:13,fontWeight:700}}>{st.ot}</div></div>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Tipped Rate</div><div style={{fontSize:13,fontWeight:700}}>{fmtTip()}</div></div>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Tip Credit</div><div style={{fontSize:13,fontWeight:700}}>{fmtTc()}</div></div>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Paid Sick Leave</div><div style={{fontSize:13,fontWeight:700}}>{st.sl?"Required":"None"}</div></div>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Fair Scheduling</div><div style={{fontSize:13,fontWeight:700}}>{st.sch?"Active":"None"}</div></div>
        </div>
        {st.chg&&<div style={{background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.2)",borderRadius:8,padding:"10px 14px",marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:"#dc2626",marginBottom:3}}>UPCOMING CHANGE</div><div style={{fontSize:12,color:"#7f1d1d"}}>{st.cd+": Min wage to $"+fmtNr()+"/hr"}</div></div>}
        {st.local&&st.local!=="None"&&<div style={{background:"rgba(99,102,241,.06)",border:"1px solid rgba(99,102,241,.2)",borderRadius:8,padding:"10px 14px",marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:"#6366f1",marginBottom:3}}>LOCAL RATES</div><div style={{fontSize:12,color:"#312e81"}}>{st.local}</div></div>}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",marginBottom:8}}>Key Compliance Requirements</div>
          {st.laws.map(function(l,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:12,color:"#334155"}}><span style={{color:"#6366f1",flexShrink:0}}>*</span>{l}</div>;})}
        </div>
        <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8,padding:"12px 14px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"#92400e",textTransform:"uppercase",marginBottom:8}}>Minor Labor - Age-Specific Rules</div>
          {m.permitNote&&<div style={{fontSize:11,color:"#b45309",fontWeight:600,marginBottom:8}}>{"Work Permit: "+m.permitNote}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Age 14",m.a14,"#fef9c3"],["Age 15",m.a15,"#fef3c7"],["Age 16",m.a16,"#f0fdf4"],["Age 17",m.a17,"#dcfce7"]].map(function(item){
              return <div key={item[0]} style={{background:item[2],borderRadius:6,padding:"8px 10px"}}><div style={{fontSize:10,fontWeight:700,color:"#374151",marginBottom:4,textTransform:"uppercase"}}>{item[0]}</div>{(item[1]||[]).map(function(r,i){return <div key={i} style={{fontSize:10,color:"#334155",marginBottom:2,lineHeight:1.4}}>{"> "+r}</div>;})}</div>;
            })}
          </div>
        </div>
        <div style={{background:"#fefce8",border:"1px solid #fde68a",borderRadius:8,padding:"10px 14px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"#92400e",textTransform:"uppercase",marginBottom:6}}>Break Laws</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:6}}>
            <div><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>Rest Break</div><div style={{fontSize:12,fontWeight:600}}>{st.brk.rest}</div></div>
            <div><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>Meal Break</div><div style={{fontSize:12,fontWeight:600}}>{st.brk.meal}</div></div>
          </div>
          <div style={{marginBottom:4}}><span style={{fontSize:10,color:"#92400e",fontWeight:700,textTransform:"uppercase"}}>Premium Pay: </span><span style={{fontSize:12}}>{st.brk.premium}</span></div>
          <div style={{fontSize:11,color:"#78350f",fontStyle:"italic"}}>{st.brk.note}</div>
        </div>
        <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 14px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",marginBottom:4}}>Overtime</div>
          <div style={{fontSize:12,color:"#334155"}}>{st.otNote}</div>
        </div>
        {st.sl&&<div style={{fontSize:12,color:"#475569",marginBottom:6}}><strong>Sick Leave: </strong>{st.slN}</div>}
      </div>
    </div>
  );
}

function SyncDiffModal(props){
  var diff=props.diff; var onClose=props.onClose; var onItemClick=props.onItemClick;
  var added=diff.added||[];
  var hasChanges=added.length>0;
  var imp=function(i){return i==="critical"?"#dc2626":i==="high"?"#dc2626":i==="medium"?"#d97706":"#16a34a";};
  var impBg=function(i){return i==="critical"?"rgba(220,38,38,.1)":i==="high"?"rgba(220,38,38,.07)":i==="medium"?"rgba(217,119,6,.1)":"rgba(22,163,74,.08)";};
  var alreadyKnown=(diff.syncReturned||0)-added.length;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.65)",zIndex:1600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:"#fff",borderRadius:14,maxWidth:980,width:"96vw",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
        <div style={{background:"linear-gradient(135deg,#1e1b4b 0%,#3730a3 100%)",padding:"18px 24px",borderRadius:"14px 14px 0 0",color:"#fff"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
            <div>
              <div style={{fontSize:18,fontWeight:800,letterSpacing:"-.01em"}}>Sync Complete</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,.7)",marginTop:3}}>{"AI returned "+(diff.syncReturned||0)+" items - catalog grew from "+diff.prevTotal+" to "+diff.total+" total"}</div>
            </div>
            <button onClick={onClose} style={{border:"none",background:"rgba(255,255,255,.15)",color:"#fff",borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13,fontWeight:700,flexShrink:0}}>Close</button>
          </div>
          <div style={{display:"flex",gap:14,marginTop:14,flexWrap:"wrap"}}>
            <div style={{background:"rgba(22,163,74,.25)",border:"1px solid rgba(134,239,172,.4)",borderRadius:8,padding:"7px 14px"}}><div style={{fontSize:10,color:"rgba(255,255,255,.7)",fontWeight:700,letterSpacing:".06em"}}>NEW</div><div style={{fontSize:22,fontWeight:800,color:"#86efac"}}>{added.length}</div></div>
            <div style={{background:"rgba(99,102,241,.2)",border:"1px solid rgba(165,180,252,.3)",borderRadius:8,padding:"7px 14px"}}><div style={{fontSize:10,color:"rgba(255,255,255,.7)",fontWeight:700,letterSpacing:".06em"}}>ALREADY KNOWN</div><div style={{fontSize:22,fontWeight:800,color:"#a5b4fc"}}>{alreadyKnown}</div></div>
            <div style={{background:"rgba(148,163,184,.2)",border:"1px solid rgba(203,213,225,.3)",borderRadius:8,padding:"7px 14px"}}><div style={{fontSize:10,color:"rgba(255,255,255,.7)",fontWeight:700,letterSpacing:".06em"}}>CATALOG TOTAL</div><div style={{fontSize:22,fontWeight:800,color:"#cbd5e1"}}>{diff.total}</div></div>
          </div>
        </div>
        <div style={{padding:"20px 24px"}}>
          {!hasChanges&&(
            <div style={{textAlign:"center",padding:"32px 16px",color:"#64748b"}}>
              <div style={{fontSize:15,fontWeight:700,color:"#16a34a",marginBottom:6}}>No new items found</div>
              <div style={{fontSize:13}}>This sync returned items that were already in your catalog. Nothing new to add.</div>
            </div>
          )}
          {added.length>0&&(
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:8,borderBottom:"2px solid rgba(22,163,74,.2)"}}>
                <div style={{background:"rgba(22,163,74,.12)",color:"#16a34a",border:"1px solid rgba(22,163,74,.3)",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:800}}>{added.length+" NEW ITEMS ADDED"}</div>
                <div style={{fontSize:11,color:"#64748b"}}>Items returned this sync that were not previously in your catalog</div>
              </div>
              {added.map(function(item,i){
                return <div key={"a"+i} onClick={function(){if(onItemClick)onItemClick(item);}} style={{padding:"10px 12px",border:"1px solid rgba(22,163,74,.2)",background:"rgba(22,163,74,.04)",borderRadius:8,marginBottom:8,cursor:onItemClick?"pointer":"default"}} onMouseEnter={function(e){if(onItemClick)e.currentTarget.style.background="rgba(22,163,74,.08)";}} onMouseLeave={function(e){if(onItemClick)e.currentTarget.style.background="rgba(22,163,74,.04)";}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{background:"rgba(22,163,74,.15)",color:"#15803d",fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:3,letterSpacing:".05em"}}>NEW</span>
                      <Bdg t={item.cat}/>
                      <span style={{fontSize:11,color:"#64748b",fontWeight:600}}>{item.j}</span>
                    </div>
                    <span style={{fontSize:10,color:"#64748b",background:"#f1f5f9",padding:"2px 8px",borderRadius:4,fontWeight:600}}>{item.eff}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:3}}>{item.title}</div>
                  <div style={{fontSize:11,color:"#475569",lineHeight:1.5}}>{(item.detail||"").length>180?String(item.detail||"").slice(0,180)+"...":item.detail}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginTop:6}}>
                    <span style={{fontSize:10,color:imp(item.impact),fontWeight:700,background:impBg(item.impact),padding:"1px 7px",borderRadius:3,textTransform:"uppercase",letterSpacing:".04em"}}>{item.impact}</span>
                    {item.src&&<a href={item.src} target="_blank" rel="noopener noreferrer" onClick={function(e){e.stopPropagation();}} style={{fontSize:10,color:"#6366f1",textDecoration:"none",fontWeight:600}}>Source &rsaquo;</a>}
                  </div>
                </div>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListModal(props){
  var title=props.title; var desc=props.desc; var states=props.states; var onSelect=props.onSelect; var onClose=props.onClose;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.6)",zIndex:1500,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:"#fff",borderRadius:14,maxWidth:760,width:"96vw",maxHeight:"88vh",overflowY:"auto",padding:26,boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div style={{fontSize:18,fontWeight:800}}>{title}</div>
          <button onClick={onClose} style={{border:"none",background:"#f1f5f9",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:14,flexShrink:0}}>X</button>
        </div>
        {desc&&<div style={{fontSize:12,color:"#64748b",marginBottom:14}}>{desc}</div>}
        {states.map(function(st){
          return <div key={st.a} onClick={function(){onSelect(st);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderBottom:"1px solid #f1f5f9",cursor:"pointer",borderRadius:8}} onMouseEnter={function(e){e.currentTarget.style.background="#f8fafc";}} onMouseLeave={function(e){e.currentTarget.style.background="";}}>
            <div><span style={{fontWeight:700,fontSize:13}}>{st.s}</span><span style={{color:"#94a3b8",fontSize:11,marginLeft:8}}>{st.a}</span><span style={{color:"#64748b",fontSize:11,marginLeft:8}}>{"$"+st.mw.toFixed(2)+"/hr"}</span></div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>{st.chg&&<Bdg t={"to "+(typeof st.nr==="number"?"$"+st.nr.toFixed(2):String(st.nr||""))} c="#7c3aed" bg="rgba(124,58,237,.07)"/>}<Pill r={st.r} t={st.r.toUpperCase()}/><span style={{color:"#94a3b8",fontSize:11}}>{">"}</span></div>
          </div>;
        })}
      </div>
    </div>
  );
}

function SchedModal(props){
  var item=props.item; var isUpcoming=props.isUpcoming; var onClose=props.onClose;
  var tc=item.type==="State"?"#7c3aed":item.type==="County"?"#0284c7":"#6366f1";
  var tbg=item.type==="State"?"rgba(124,58,237,.1)":item.type==="County"?"rgba(2,132,199,.1)":"rgba(99,102,241,.1)";
  var impR=item.impact==="critical"?"critical":item.impact==="high"?"high":item.impact==="medium"?"medium":"low";
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:"#fff",borderRadius:14,maxWidth:900,width:"96vw",maxHeight:"90vh",overflowY:"auto",padding:30,boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,marginBottom:6}}>{item.j}</div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{background:tbg,color:tc,border:"1px solid "+tc+"33",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>{item.type}</span>
              {isUpcoming?<span style={{background:"rgba(217,119,6,.1)",color:"#d97706",border:"1px solid rgba(217,119,6,.3)",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>UPCOMING</span>:<span style={{background:"rgba(22,163,74,.1)",color:"#16a34a",border:"1px solid rgba(22,163,74,.3)",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>ACTIVE</span>}
              {item.restaurant&&<Bdg t="Covers Restaurants" c="#dc2626" bg="rgba(220,38,38,.07)"/>}
              {isUpcoming&&item.impact&&<Pill r={impR} t={item.impact.toUpperCase()}/>}
            </div>
          </div>
          <button onClick={onClose} style={{border:"none",background:"#f1f5f9",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:14,flexShrink:0}}>X</button>
        </div>
        <div style={{background:"#f8fafc",borderRadius:8,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:11,color:"#475569",textTransform:"uppercase",marginBottom:4}}>{item.law}</div>
          <div style={{fontSize:12,color:"#334155"}}>{item.scope}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"9px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Effective Date</div><div style={{fontSize:12,fontWeight:700}}>{item.eff}</div></div>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"9px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Notice Required</div><div style={{fontSize:12,fontWeight:700}}>{item.notice}</div></div>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"9px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Jurisdiction Type</div><div style={{fontSize:12,fontWeight:700}}>{item.type}</div></div>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"9px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>Covers Restaurants</div><div style={{fontSize:12,fontWeight:700}}>{item.restaurant?"Yes - directly":"Indirect/retail only"}</div></div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",marginBottom:8}}>Key Requirements</div>
          {item.rules.map(function(r,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:12,color:"#334155"}}><span style={{color:"#6366f1",flexShrink:0,fontWeight:700}}>*</span>{r}</div>;})}
        </div>
        <div style={{background:"#fef9c3",border:"1px solid #fde68a",borderRadius:8,padding:"10px 14px",marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:700,color:"#92400e",textTransform:"uppercase",marginBottom:3}}>Penalties</div>
          <div style={{fontSize:12,color:"#78350f"}}>{item.penalties}</div>
        </div>
        <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"10px 14px",marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:"#0c4a6e",textTransform:"uppercase",marginBottom:3}}>Operator Notes</div>
          <div style={{fontSize:12,color:"#0c4a6e",lineHeight:1.6}}>{item.notes}</div>
        </div>
        <SrcLink url={item.src} label="Official Source"/>
      </div>
    </div>
  );
}

function DetailModal(props){
  var item=props.item; var type=props.type; var onClose=props.onClose;
  if(!item) return null;
  var isFed=(type==="federal");
  var impStr=isFed?item.sev:item.impact;
  var impR="low";
  if(impStr==="critical") impR="critical";
  else if(impStr==="high") impR="high";
  else if(impStr==="medium") impR="medium";
  var catC="#6366f1"; var catBg="rgba(99,102,241,.08)";
  if(item.cat&&CAT_COLORS[item.cat]){catC=CAT_COLORS[item.cat].c;catBg=CAT_COLORS[item.cat].bg;}
  var stC="#64748b"; var stBg="rgba(100,116,139,.08)";
  if(item.status==="Active"){stC="#16a34a";stBg="rgba(22,163,74,.08)";}
  if(item.status==="Blocked"){stC="#dc2626";stBg="rgba(220,38,38,.07)";}
  var isPending=(!isFed&&item.eff&&item.eff.toLowerCase().indexOf("pending")>=0);
  var us=(!isFed)?upcomingStatus(item):null;
  var meta1=isFed?{k:"Date",v:item.date}:{k:"Jurisdiction",v:item.j};
  var meta2=isFed?{k:"Status",v:item.status}:{k:"Effective",v:item.eff};
  var meta3={k:"Category",v:item.cat};
  var meta4=isFed?{k:"Severity",v:(item.sev||"").toUpperCase()}:{k:"Impact",v:(item.impact||"").toUpperCase()};
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,23,42,.6)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={function(e){e.stopPropagation();}} style={{background:"#fff",borderRadius:14,maxWidth:880,width:"96vw",maxHeight:"90vh",overflowY:"auto",padding:30,boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div style={{flex:1,paddingRight:12}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
              <Bdg t={item.cat} c={catC} bg={catBg}/>
              {isFed&&<Bdg t={item.status} c={stC} bg={stBg}/>}
              {us&&<Bdg t={us.label} c={us.c} bg={us.bg}/>}
              <Pill r={impR} t={impR.toUpperCase()}/>
            </div>
            <div style={{fontSize:18,fontWeight:800,color:"#0f172a",lineHeight:1.3,marginBottom:4}}>{item.title}</div>
            <div style={{fontSize:12,color:"#94a3b8"}}>{isFed?item.date:(item.j+" | "+item.eff)}</div>
          </div>
          <button onClick={onClose} style={{border:"none",background:"#f1f5f9",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:14,flexShrink:0}}>X</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{meta1.k}</div><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{meta1.v}</div></div>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{meta2.k}</div><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{meta2.v}</div></div>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{meta3.k}</div><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{meta3.v}</div></div>
          <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px"}}><div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:3}}>{meta4.k}</div><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{meta4.v}</div></div>
        </div>
        <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"14px 16px",marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:"#475569",textTransform:"uppercase",marginBottom:8}}>Full Detail</div>
          <div style={{fontSize:13,color:"#334155",lineHeight:1.7}}>{item.detail}</div>
        </div>
        {isPending&&(
          <div style={{background:"rgba(217,119,6,.06)",border:"1px solid rgba(217,119,6,.2)",borderRadius:8,padding:"10px 14px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#92400e",marginBottom:3}}>PENDING LEGISLATION</div>
            <div style={{fontSize:12,color:"#78350f"}}>This is a proposed or pending change. Verify current status at the official source before taking compliance action.</div>
          </div>
        )}
        <SrcLink url={item.src} label={isFed?"Official Gov Source":"Official Reference"}/>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(p){super(p);this.state={err:null};}
  static getDerivedStateFromError(e){return{err:e};}
  render(){
    if(this.state.err){
      return <div style={{padding:30,fontFamily:"monospace",background:"#fff",color:"#dc2626",lineHeight:1.6}}>
        <div style={{fontSize:18,fontWeight:700,marginBottom:12}}>Dashboard Error</div>
        <div style={{marginBottom:8}}><strong>{this.state.err.message}</strong></div>
        <pre style={{fontSize:10,overflow:"auto",background:"#f8fafc",padding:12,borderRadius:8,whiteSpace:"pre-wrap"}}>{this.state.err.stack||""}</pre>
        <button onClick={function(){this.setState({err:null});}.bind(this)} style={{marginTop:12,padding:"8px 16px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,cursor:"pointer"}}>Try Again</button>
      </div>;
    }
    return this.props.children;
  }
}

// ── App ───────────────────────────────────────────────────────────
export default function App(){
  var stateModalS=useState(null); var stateModal=stateModalS[0]; var setStateModal=stateModalS[1];
  var listModalS=useState(null); var listModal=listModalS[0]; var setListModal=listModalS[1];
  var schedModalS=useState(null); var schedModal=schedModalS[0]; var setSchedModal=schedModalS[1];
  var detailModalS=useState(null); var detailModal=detailModalS[0]; var setDetailModal=detailModalS[1];
  var searchS=useState(""); var search=searchS[0]; var setSearch=searchS[1];
  var rFilterS=useState("all"); var rFilter=rFilterS[0]; var setRFilter=rFilterS[1];
  var upYrS=useState("all"); var upYr=upYrS[0]; var setUpYr=upYrS[1];
  var upDataS=useState(function(){
    try{
      var saved=localStorage.getItem("lcd_upcoming");
      if(saved){
        var parsed=JSON.parse(saved);
        if(Array.isArray(parsed)&&parsed.length>0) return parsed;
      }
    }catch(e){}
    return UPCOMING;
  });
  var upcomingData=upDataS[0]; var setUpcomingData=upDataS[1];
  var syncingS=useState(false); var syncing=syncingS[0]; var setSyncing=syncingS[1];
  var syncStatusS=useState(null); var syncStatus=syncStatusS[0]; var setSyncStatus=syncStatusS[1];
  var lastSyncedS=useState(function(){
    try{
      var saved=localStorage.getItem("lcd_lastSynced");
      if(saved){ var d=new Date(saved); if(!isNaN(d.getTime())) return d; }
    }catch(e){}
    return null;
  });
  var lastSynced=lastSyncedS[0]; var setLastSynced=lastSyncedS[1];
  var syncDiffS=useState(null); var syncDiff=syncDiffS[0]; var setSyncDiff=syncDiffS[1];
  var tabS=useState(0); var tab=tabS[0]; var setTab=tabS[1];

  // Persist sync data across page refreshes
  useEffect(function(){
    try{ localStorage.setItem("lcd_upcoming", JSON.stringify(upcomingData)); }catch(e){}
  },[upcomingData]);
  useEffect(function(){
    try{
      if(lastSynced) localStorage.setItem("lcd_lastSynced", lastSynced.toISOString());
      else localStorage.removeItem("lcd_lastSynced");
    }catch(e){}
  },[lastSynced]);

  function resetUpcomingCatalog(){
    if(!window.confirm("Reset the upcoming changes catalog to the original built-in list? This will remove all items added by Sync Latest. This cannot be undone.")) return;
    try{ localStorage.removeItem("lcd_upcoming"); localStorage.removeItem("lcd_lastSynced"); }catch(e){}
    setUpcomingData(UPCOMING);
    setLastSynced(null);
    setSyncDiff(null);
    setSyncStatus({msg:"Upcoming catalog reset to built-in list ("+UPCOMING.length+" items)",type:"info"});
    setTimeout(function(){setSyncStatus(null);},4000);
  }

  var compFileNameS=useState(""); var compFileName=compFileNameS[0]; var setCompFileName=compFileNameS[1];
  var compAggS=useState(null); var compAgg=compAggS[0]; var setCompAgg=compAggS[1];
  var compValidatingS=useState(false); var compValidating=compValidatingS[0]; var setCompValidating=compValidatingS[1];
  var compValStatusS=useState(null); var compValStatus=compValStatusS[0]; var setCompValStatus=compValStatusS[1];
  var compResultS=useState(null); var compResult=compResultS[0]; var setCompResult=compResultS[1];
  var compFilterStatusS=useState("issues"); var compFilterStatus=compFilterStatusS[0]; var setCompFilterStatus=compFilterStatusS[1];
  var compFilterCategoryS=useState("all"); var compFilterCategory=compFilterCategoryS[0]; var setCompFilterCategory=compFilterCategoryS[1];
  var compCollapsedS=useState({}); var compCollapsed=compCollapsedS[0]; var setCompCollapsed=compCollapsedS[1];
  var compOpenRowsS=useState({}); var compOpenRows=compOpenRowsS[0]; var setCompOpenRows=compOpenRowsS[1];
  var compGroupOpenS=useState({}); var compGroupOpen=compGroupOpenS[0]; var setCompGroupOpen=compGroupOpenS[1];
  var compOverviewOpenS=useState(true); var compOverviewOpen=compOverviewOpenS[0]; var setCompOverviewOpen=compOverviewOpenS[1];
  var compSelectedS=useState(null); var compSelected=compSelectedS[0]; var setCompSelected=compSelectedS[1];
  var compViewModeS=useState("findings"); var compViewMode=compViewModeS[0]; var setCompViewMode=compViewModeS[1];
  var compGroupByS=useState("none"); var compGroupBy=compGroupByS[0]; var setCompGroupBy=compGroupByS[1];
  var compShowUploadS=useState(true); var compShowUpload=compShowUploadS[0]; var setCompShowUpload=compShowUploadS[1];
  var compColReportS=useState(null); var compColReport=compColReportS[0]; var setCompColReport=compColReportS[1];
  var compBusyS=useState(null); var compBusy=compBusyS[0]; var setCompBusy=compBusyS[1];
  var compFilterOwnerS=useState("all"); var compFilterOwner=compFilterOwnerS[0]; var setCompFilterOwner=compFilterOwnerS[1];
  var compFilterStateS=useState("all"); var compFilterState=compFilterStateS[0]; var setCompFilterState=compFilterStateS[1];
  var compTaskAssigneesS=useState({}); var compTaskAssignees=compTaskAssigneesS[0]; var setCompTaskAssignees=compTaskAssigneesS[1];
  var compDecisionsS=useState({}); var compDecisions=compDecisionsS[0]; var setCompDecisions=compDecisionsS[1];
  var compStateViewS=useState("map"); var compStateView=compStateViewS[0]; var setCompStateView=compStateViewS[1];

  function handleComplianceFile(ev){
    var file=ev.target.files&&ev.target.files[0];
    if(!file) return;
    setCompFileName(file.name);
    setCompResult(null); setCompValStatus(null); setCompColReport(null);
    var lower=file.name.toLowerCase();
    var isExcel=lower.lastIndexOf(".xlsx")===lower.length-5||lower.lastIndexOf(".xls")===lower.length-4;
    function fail(msg){ setCompBusy(null); setCompValStatus({msg:msg,type:"error"}); }
    function proceed(rows){
      if(!rows||rows.length===0){ fail("No data rows found. Make sure row 1 is the header row and there is at least one data row below it."); return; }
      var headers=[], hk; for(hk in rows[0]){ if(rows[0].hasOwnProperty(hk)) headers.push(hk); }
      var v=validateComplianceHeaders(headers); setCompColReport(v);
      if(v.missingReq.length){
        fail("Upload error \u2014 "+v.missingReq.length+" required column"+(v.missingReq.length>1?"s are":" is")+" missing: "+v.missingReq.join(", ")+".  Columns found in your file: "+headers.join(", ")+".  Rename the headers to match exactly (case/spaces don't matter) and re-upload.");
        return;
      }
      var rowLabel=(rows.length).toLocaleString();
      setCompBusy({title:"Analyzing file",msg:"Grouping "+rowLabel+" rows into stores",pct:0});
      aggregateStoresByConfigChunked(rows, v.map, function(prog){
        setCompBusy({title:"Analyzing file",msg:"Grouping "+rowLabel+" rows into stores",pct:prog*100});
      }, function(agg, blank){
        setCompBusy(null);
        if(agg.totalStores===0){ setCompValStatus({msg:"All required columns were found, but no stores could be read \u2014 the store_number column looks empty in every row.",type:"error"}); return; }
        var notes=[];
        if(v.renamed.length) notes.push("auto-matched "+v.renamed.length+" header(s): "+v.renamed.slice(0,3).join(", ")+(v.renamed.length>3?(" +"+(v.renamed.length-3)+" more"):""));
        if(v.missingOpt.length) notes.push("optional column(s) not present, ignored: "+v.missingOpt.join(", "));
        if(v.unknown.length) notes.push("ignored "+v.unknown.length+" extra column(s): "+v.unknown.slice(0,4).join(", ")+(v.unknown.length>4?" \u2026":""));
        if(blank) notes.push(blank+" row(s) skipped (blank store_number)");
        setCompAgg(agg);
        var base="Loaded "+agg.totalStores+" stores ("+agg.configs.length+" configurations) across "+(agg.distinctStates?agg.distinctStates.length:0)+" state(s) and "+(agg.distinctOwners?agg.distinctOwners.length:0)+" owner(s) from "+agg.totalRows+" rows.";
        if(notes.length) setCompValStatus({msg:base+"  Loaded with minor adjustments \u2014 "+notes.join("; ")+".  Click Run Compliance Check.",type:"info"});
        else setCompValStatus({msg:base+"  All columns matched cleanly. Click Run Compliance Check.",type:"success"});
      });
    }
    setCompBusy({title:"Loading file",msg:"Reading "+file.name,pct:null});
    if(isExcel){
      var rb=new FileReader();
      rb.onload=function(e){
        ensureSheetJS(function(err){
          if(err){ fail(err.message); return; }
          setCompBusy({title:"Loading file",msg:"Parsing spreadsheet \u2026",pct:null});
          setTimeout(function(){
            try{
              var wb=window.XLSX.read(new Uint8Array(e.target.result),{type:"array"});
              var ws=wb.Sheets[wb.SheetNames[0]];
              proceed(window.XLSX.utils.sheet_to_json(ws,{raw:false,defval:""}));
            }catch(er){ fail("Excel parse error: "+er.message); }
          },30);
        });
      };
      rb.onerror=function(){ fail("File read error"); };
      rb.readAsArrayBuffer(file);
    } else {
      var reader=new FileReader();
      reader.onload=function(e){
        setCompBusy({title:"Loading file",msg:"Parsing rows \u2026",pct:null});
        setTimeout(function(){
          try{ proceed(parseComplianceCsv(e.target.result)); }
          catch(er){ fail("Parse error: "+er.message); }
        },30);
      };
      reader.onerror=function(){ fail("File read error"); };
      reader.readAsText(file);
    }
    ev.target.value="";
  }

  function runComplianceValidation(){
    if(!compAgg) return;
    setCompValidating(true);
    setCompBusy({title:"Running compliance check",msg:"Evaluating "+compAgg.configs.length+" configuration(s) against in-state peer baselines",pct:null});
    setTimeout(function(){
      try{
        var result=runDeterministicAudit(compAgg, STATES);
        setCompResult(result);
        setCompShowUpload(false);
        var issues=0, i, j, ch;
        for(i=0;i<result.configFindings.length;i++){ ch=result.configFindings[i].checks; for(j=0;j<ch.length;j++){ if(ch[j].status==="fail"||ch[j].status==="warn") issues++; } }
        setCompValStatus({msg:"Compliance check complete - "+issues+" issue(s) found. Review findings below.",type:"success"});
        setTimeout(function(){setCompValStatus(null);},6000);
      }catch(err){setCompValStatus({msg:"Compliance check failed: "+err.message,type:"error"}); setTimeout(function(){setCompValStatus(null);},8000);}
      finally{setCompValidating(false); setCompBusy(null);}
    },30);
  }

  function toggleDecision(key,field,value){
    var next=Object.assign({},compDecisions);
    if(!next[key]) next[key]={};
    next[key][field]=value;
    setCompDecisions(next);
  }

  function buildTaskList(){
    if(!compResult||!compResult.configFindings||!compAgg) return [];
    var tasks=[];
    var sevPriority={critical:1,high:2,medium:3,low:4,info:5};
    for(var fi=0;fi<compResult.configFindings.length;fi++){
      var cf=compResult.configFindings[fi]; var conf=compAgg.configs[cf.configIndex]; if(!conf||!cf.checks) continue;
      for(var ci=0;ci<cf.checks.length;ci++){
        var ck=cf.checks[ci];
        if(ck.status==="pass"||ck.status==="not_applicable") continue;
        var dKey=cf.configIndex+"::"+ck.lawId+"::"+(ck.minorAge||0);
        var dec=compDecisions[dKey]||{};
        var ass=compTaskAssignees[dKey]||"";
        tasks.push({
          key:dKey, configIndex:cf.configIndex, owner:conf.primaryOwner, owners:conf.owners||[], ownerCount:conf.owners.length,
          state:conf.assignedStateName, stateAbbrev:conf.assignedState, storeCount:conf.storeNumbers.length,
          category:ck.category||"Other", lawName:ck.lawName||ck.lawId, lawId:ck.lawId, minorAge:ck.minorAge||0,
          status:ck.status, severity:ck.severity, severityRank:sevPriority[ck.severity]||6,
          expected:ck.expected, actual:ck.actual, issue:ck.issue, recommendation:ck.recommendation, citation:ck.citation,
          basis:ck.basis, storePct:ck.storePct, orgsOn:ck.orgsOn, orgsTotal:ck.orgsTotal,
          acked:!!dec.acked, note:dec.note||"", assignee:ass
        });
      }
    }
    tasks.sort(function(a,b){
      if(a.acked!==b.acked) return a.acked?1:-1;
      if(a.severityRank!==b.severityRank) return a.severityRank-b.severityRank;
      return b.storeCount-a.storeCount;
    });
    return tasks;
  }

  function generateExecBriefPDF(){
    if(!compResult||!compAgg) return;
    var totalChecks=0,passCount=0,failCount=0,missingCount=0,warnCount=0,critCount=0;
    var byCategory={}, byState={}, byOwner={};
    for(var fi=0;fi<compResult.configFindings.length;fi++){
      var cf=compResult.configFindings[fi]; var conf=compAgg.configs[cf.configIndex]; if(!cf.checks||!conf) continue;
      var sc=conf.storeNumbers.length; var stKey=conf.assignedStateName||conf.assignedState||"-"; var owKey=conf.primaryOwner;
      if(!byState[stKey]) byState[stKey]={name:stKey,stores:0,issues:0,critical:0};
      if(!byOwner[owKey]) byOwner[owKey]={name:owKey,state:stKey,stores:0,issues:0,critical:0};
      byState[stKey].stores+=sc; byOwner[owKey].stores+=sc;
      for(var ci=0;ci<cf.checks.length;ci++){
        var ck=cf.checks[ci]; totalChecks++;
        var cat=ck.category||"Other";
        if(!byCategory[cat]) byCategory[cat]={name:cat,pass:0,warn:0,fail:0,missing:0,critical:0,stores:{}};
        var isIssue=(ck.status==="fail"||ck.status==="missing"||ck.status==="warn");
        if(ck.status==="pass") {passCount++; byCategory[cat].pass++;}
        else if(ck.status==="warn") {warnCount++; byCategory[cat].warn++;}
        else if(ck.status==="fail") {failCount++; byCategory[cat].fail++;}
        else if(ck.status==="missing") {missingCount++; byCategory[cat].missing++;}
        if(isIssue){ byState[stKey].issues++; byOwner[owKey].issues++; }
        if(ck.severity==="critical"){critCount++; byCategory[cat].critical++; byState[stKey].critical++; byOwner[owKey].critical++;}
      }
    }
    function catIss(r){return r.fail+r.missing+r.warn;}
    function byCatIssues(a,b){return (catIss(b)-catIss(a))||(b.critical-a.critical);}
    function byIssues(a,b){return (b.issues-a.issues)||(b.critical-a.critical)||(b.stores-a.stores);}
    var catRows=Object.keys(byCategory).map(function(k){return byCategory[k];}).sort(byCatIssues);
    var stateRows=Object.keys(byState).map(function(k){return byState[k];}).sort(byIssues);
    var ownerRows=Object.keys(byOwner).map(function(k){return byOwner[k];}).sort(byIssues);
    var tasks=buildTaskList();
    var topActions=tasks.filter(function(t){return !t.acked && (t.severity==="critical"||t.severity==="high");}).slice(0,10);
    var dt=new Date(); var dateStr=dt.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
    var html='<!doctype html><html><head><meta charset="utf-8"><title>Compliance Audit - Executive Brief - '+dateStr+'</title>';
    html+='<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1e293b;margin:0;padding:30px;line-height:1.5;font-size:11pt;}h1{font-size:22pt;margin:0 0 4px 0;color:#0f172a;}h2{font-size:15pt;margin:24px 0 10px 0;color:#1e3a8a;border-bottom:2px solid #1e3a8a;padding-bottom:4px;}h3{font-size:12pt;margin:14px 0 8px 0;color:#475569;}.subtitle{color:#64748b;margin-bottom:18px;font-size:10pt;}.kpis{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;}.kpi{flex:1;min-width:130px;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;}.kpi .l{font-size:8pt;color:#64748b;text-transform:uppercase;font-weight:700;letter-spacing:.04em;}.kpi .v{font-size:18pt;font-weight:800;margin-top:2px;}.danger{color:#dc2626;}.warn{color:#d97706;}.ok{color:#16a34a;}.muted{color:#64748b;}table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:9.5pt;}th{background:#1e3a8a;color:#fff;text-align:left;padding:7px 9px;font-weight:600;font-size:9pt;text-transform:uppercase;letter-spacing:.03em;}td{border-bottom:1px solid #e2e8f0;padding:7px 9px;vertical-align:top;}.r{text-align:right;}.bar{height:7px;background:#eef2f6;border-radius:4px;overflow:hidden;margin-top:3px;}.bar>span{display:block;height:100%;background:#dc2626;}.action{background:#fff;border:1px solid #e2e8f0;border-left:4px solid #dc2626;border-radius:4px;padding:10px 12px;margin-bottom:8px;page-break-inside:avoid;}.action.high{border-left-color:#d97706;}.action h4{margin:0 0 4px 0;font-size:10pt;color:#0f172a;}.action .meta{font-size:8.5pt;color:#64748b;margin-bottom:4px;}.action .rec{font-size:9.5pt;color:#312e81;background:#eef2ff;padding:6px 9px;border-radius:4px;margin-top:5px;}.pill{display:inline-block;padding:1px 7px;border-radius:3px;font-size:8pt;font-weight:700;text-transform:uppercase;}.pill.crit{background:#fee2e2;color:#991b1b;}.pill.high{background:#ffedd5;color:#9a3412;}.note{font-size:8.5pt;color:#94a3b8;margin:-6px 0 14px 0;}.footer{margin-top:30px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:8pt;color:#94a3b8;}@media print{body{padding:18px;}h2{page-break-after:avoid;}.kpi,.action{break-inside:avoid;}}</style></head><body>';
    html+='<h1>Labor compliance - what to fix</h1>';
    html+='<div class="subtitle">'+dateStr+' &middot; '+compAgg.totalStores+' stores &middot; '+compAgg.distinctOwners.length+' owner(s) &middot; '+compAgg.distinctStates.length+' state(s)</div>';
    html+='<div class="kpis">';
    html+='<div class="kpi"><div class="l">Stores</div><div class="v">'+compAgg.totalStores+'</div></div>';
    html+='<div class="kpi"><div class="l">To fix</div><div class="v warn">'+(failCount+missingCount+warnCount)+'</div></div>';
    html+='<div class="kpi"><div class="l">Urgent</div><div class="v danger">'+critCount+'</div></div>';
    var _sp=totalChecks?Math.round(passCount*100/totalChecks):100;
    html+='<div class="kpi"><div class="l">On track</div><div class="v ok">'+_sp+'%</div></div>';
    html+='</div>';
    html+='<h2>Executive Summary</h2><p>'+(compResult.summary||"")+'</p>';
    if(compResult.patterns&&compResult.patterns.length){ html+='<h3>What stands out</h3><ul>'; for(var pi=0;pi<compResult.patterns.length;pi++) html+='<li>'+compResult.patterns[pi]+'</li>'; html+='</ul>'; }
    html+='<h2>Where the gaps are</h2>';
    html+='<table><thead><tr><th>Category</th><th class="r">To fix</th><th class="r">Urgent</th></tr></thead><tbody>';
    for(var c1=0;c1<catRows.length;c1++){ var cr=catRows[c1]; var iss=cr.fail+cr.missing+cr.warn;
      html+='<tr><td><strong>'+cr.name+'</strong></td><td class="r '+(iss>0?"danger":"ok")+'">'+iss+'</td><td class="r danger">'+cr.critical+'</td></tr>'; }
    html+='</tbody></table>';
    html+='<h2>By state</h2><table><thead><tr><th>State</th><th class="r">Stores</th><th class="r">To fix</th><th class="r">Urgent</th></tr></thead><tbody>';
    for(var s1=0;s1<Math.min(stateRows.length,15);s1++){ var sr=stateRows[s1]; html+='<tr><td>'+sr.name+'</td><td class="r">'+sr.stores+'</td><td class="r danger">'+sr.issues+'</td><td class="r danger">'+sr.critical+'</td></tr>'; }
    html+='</tbody></table>';
    if(stateRows.length>15) html+='<div class="note">Showing top 15 of '+stateRows.length+' states by number to fix. Full detail is in the CSV export.</div>';
    if(ownerRows.length>1){
    html+='<h2>Owners to focus on</h2><table><thead><tr><th>Owner</th><th>State</th><th class="r">Stores</th><th class="r">To fix</th><th class="r">Urgent</th></tr></thead><tbody>';
    for(var o1=0;o1<Math.min(ownerRows.length,15);o1++){ var or=ownerRows[o1]; html+='<tr><td>'+or.name+'</td><td>'+or.state+'</td><td class="r">'+or.stores+'</td><td class="r danger">'+or.issues+'</td><td class="r danger">'+or.critical+'</td></tr>'; }
    html+='</tbody></table>';
    if(ownerRows.length>15) html+='<div class="note">Showing top 15 of '+ownerRows.length+' owners by number to fix. Per-store, per-rule detail is in the CSV export.</div>';
    }
    html+='<h2>What to fix first</h2>';
    if(topActions.length===0) html+='<p class="muted">Nothing urgent outstanding - you are in good shape.</p>';
    for(var ti=0;ti<topActions.length;ti++){ var t=topActions[ti];
      var tTag=t.basis==="regulation"?"Breaks the law":(t.severity==="critical"?"Urgent":"Worth checking");
      var sevClass=(t.basis==="regulation"||t.severity==="critical")?"crit":"high";
      var borderClass=(t.basis==="regulation"||t.severity==="critical")?"":" high";
      html+='<div class="action'+borderClass+'"><h4>'+(ti+1)+'. '+t.lawName+'</h4>';
      html+='<div class="meta"><span class="pill '+sevClass+'">'+tTag+'</span> &middot; '+t.category+' &middot; '+t.owner+' / '+t.state+' &middot; '+t.storeCount+' stores</div>';
      if(t.basis!=="regulation"&&t.orgsTotal>0){ var _opc=Math.round((t.orgsOn||0)*100/t.orgsTotal); html+='<div class="meta">'+_opc+'% of '+t.stateAbbrev+' operators use this rule ('+t.orgsOn+' of '+t.orgsTotal+').</div>'; }
      if(t.issue) html+='<div style="margin-top:5px;font-size:9.5pt;">'+t.issue+'</div>';
      if(t.recommendation) html+='<div class="rec"><strong>To stay compliant:</strong> '+t.recommendation+'</div>';
      html+='</div>'; }
    html+='<div class="footer">Generated by Altametrics Labor Compliance Dashboard &middot; '+dateStr+' &middot; This is a high-level executive brief; the per-store, per-rule detail is in the CSV export. Findings are prioritization signals, not legal determinations. Confirm material decisions with qualified counsel.</div>';
    html+='</body></html>';
    var w=window.open("","_blank");
    if(!w){ alert("Pop-up blocked. Please allow pop-ups for this site to generate the PDF."); return; }
    w.document.write(html); w.document.close();
    setTimeout(function(){ w.focus(); w.print(); },400);
  }

  function exportTasksToCsv(){
    if(!compResult||!compResult.configFindings||!compAgg){ alert("Run a compliance check first."); return; }
    var headers=["Owner","Store Number","State","Category","Setting (rule)","What's wrong","Why it's flagged","What it should be","What it's set to now","What to do","How sure we are","Severity","Official source"];
    function esc(v){ v=(v==null?"":String(v)); if(v.indexOf(",")>=0||v.indexOf("\"")>=0||v.indexOf("\n")>=0) v="\""+v.replace(/"/g,"\"\"")+"\""; return v; }
    var rows=[headers.join(",")];
    for(var fi=0;fi<compResult.configFindings.length;fi++){
      var cf=compResult.configFindings[fi]; var conf=compAgg.configs[cf.configIndex]; if(!cf.checks||!conf) continue;
      for(var ci=0;ci<cf.checks.length;ci++){
        var ck=cf.checks[ci];
        if(ck.status!=="fail"&&ck.status!=="missing"&&ck.status!=="warn") continue;
        var label=(ck.basis==="regulation")?"Below the legal minimum":(ck.csvHasRow===false?"Not set up (brand norm has it on)":"Different from the brand norm");
        var sure=(ck.basis==="regulation")?"High - checked against the law":"Compared to the brand-wide norm in this state (all operators, not just your stores)";
        for(var si=0;si<conf.storeNumbers.length;si++){
          var sn=conf.storeNumbers[si];
          var owner=(conf.storeOwnerMap&&conf.storeOwnerMap[sn])||conf.primaryOwner;
          rows.push([owner,sn,conf.assignedState,ck.category||"Other",ck.lawName||"",label,ck.issue||"",ck.expected||"",ck.actual||"",ck.recommendation||"",sure,ck.severity||"",ck.citation||""].map(esc).join(","));
        }
      }
    }
    if(rows.length<=1){ alert("No issues to export - all checks passed."); return; }
    var blob=new Blob([rows.join("\n")],{type:"text/csv"});
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a"); a.href=url; a.download="compliance-findings-detailed-"+(new Date().toISOString().slice(0,10))+".csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function bulkAcknowledgeVisibleTasks(taskList){
    var next=Object.assign({},compDecisions);
    for(var i=0;i<taskList.length;i++){ var k=taskList[i].key; if(!next[k]) next[k]={}; next[k].acked=true; }
    setCompDecisions(next);
  }


  var filtered=useMemo(function(){return STATES.filter(function(s){return (rFilter==="all"||s.r===rFilter)&&(s.s.toLowerCase().indexOf(search.toLowerCase())>=0||s.a.toLowerCase().indexOf(search.toLowerCase())>=0);});}, [search,rFilter]);
  var highRisk=STATES.filter(function(s){return s.r==="high";});
  var medRisk=STATES.filter(function(s){return s.r==="medium";});
  var upcomingWage=STATES.filter(function(s){return s.chg && !isPastDate(s.cd);});
  var noTipCredit=STATES.filter(function(s){return s.tc==="None";});
  var hasSL=STATES.filter(function(s){return s.sl;});
  var dailyOT=STATES.filter(function(s){return s.otD;});
  var hasBreakLaws=STATES.filter(function(s){return !s.brk.rest.includes("FLSA only")&&!s.brk.meal.includes("FLSA only");});
  var hasPremium=STATES.filter(function(s){return s.brk.premium!=="None";});

  function openList(title,desc,states){setListModal({title:title,desc:desc,states:states});}
  function openState(st){setListModal(null);setStateModal(st);}

  
  function mergeUpcoming(oldArr, newArr){
    function key(u){ return (u.src||"")+"||"+(u.j||"")+"||"+(u.title||""); }
    var seen={}; var merged=[];
    // Keep all old items first, in their existing order
    oldArr.forEach(function(u){ var k=key(u); if(!seen[k]){seen[k]=true; merged.push(u);} });
    // Then append new items not already present
    var newOnly=[];
    newArr.forEach(function(u){ var k=key(u); if(!seen[k]){seen[k]=true; merged.push(u); newOnly.push(u);} });
    return {merged:merged, newItems:newOnly};
  }

  async function handleSync(){
    setSyncing(true);setSyncStatus({msg:"Connecting to web search...",type:"info"});
    try{
      var raw=await fetchLatestChanges(function(ev){
        if(ev.type==="search"){setSyncStatus({msg:"Searching the web... ("+ev.count+" queries completed)",type:"info"});}
        else if(ev.type==="text")setSyncStatus({msg:"Receiving latest data...",type:"info"});
      });
      var match=raw.match(/\[[\s\S]*\]/);
      if(!match)throw new Error("No JSON array found in response");
      var parsed=JSON.parse(match[0]);
      var valid=parsed.filter(function(u){return u.cat&&u.j&&u.title&&u.eff&&u.yr&&u.detail&&u.impact&&u.src&&["Min Wage","Tipped Wage","Sick Leave","Minor Labor","Break Laws","Overtime","Scheduling","Restaurant-Specific"].indexOf(u.cat)>=0&&(Number(u.yr)===(new Date()).getFullYear()||Number(u.yr)===((new Date()).getFullYear()+1));}).map(function(u){return Object.assign({},u,{yr:Number(u.yr)});});
      if(valid.length===0)throw new Error("No valid items returned");
      var prev=upcomingData;
      var mergeResult=mergeUpcoming(prev,valid);
      var diff={added:mergeResult.newItems,removed:[],total:mergeResult.merged.length,prevTotal:prev.length,timestamp:new Date(),syncReturned:valid.length};
      setSyncDiff(diff);
      setUpcomingData(mergeResult.merged);setLastSynced(new Date());
      setSyncStatus({msg:"Sync added "+mergeResult.newItems.length+" new items ("+valid.length+" returned, "+(valid.length-mergeResult.newItems.length)+" already known). Catalog now "+mergeResult.merged.length+" total.",type:"success"});
      setTab(8);setTimeout(function(){setSyncStatus(null);},6000);
    }catch(err){
      setSyncStatus({msg:"Sync failed: "+err.message,type:"error"});
      setTimeout(function(){setSyncStatus(null);},6000);
    }finally{setSyncing(false);}
  }

  var sC=syncStatus?syncStatus.type==="success"?"rgba(22,163,74,.2)":syncStatus.type==="error"?"rgba(220,38,38,.2)":"rgba(99,102,241,.2)":null;
  var sB=syncStatus?syncStatus.type==="success"?"rgba(22,163,74,.4)":syncStatus.type==="error"?"rgba(220,38,38,.4)":"rgba(99,102,241,.4)":null;
  var sT=syncStatus?syncStatus.type==="success"?"#86efac":syncStatus.type==="error"?"#fca5a5":"#c7d2fe":null;

  // ── Scheduling card sub-component ──
  function SchedCard(p2){
    var item=p2.item; var isUpcoming=p2.isUpcoming;
    var tc=item.type==="State"?"#7c3aed":item.type==="County"?"#0284c7":"#6366f1";
    var tbg=item.type==="State"?"rgba(124,58,237,.1)":item.type==="County"?"rgba(2,132,199,.1)":"rgba(99,102,241,.1)";
    var impR=item.impact==="critical"?"critical":item.impact==="high"?"high":item.impact==="medium"?"medium":"low";
    return <div onClick={function(){setSchedModal({item:item,isUpcoming:isUpcoming});}} style={{background:"#fff",border:"1px solid "+(isUpcoming?"#fed7aa":"#e2e8f0"),borderRadius:10,padding:"14px 16px",cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,.05)",borderLeft:"4px solid "+(isUpcoming?"#f97316":tc),marginBottom:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:14,color:"#0f172a",marginBottom:4}}>{item.j}</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{background:tbg,color:tc,border:"1px solid "+tc+"33",borderRadius:4,padding:"1px 7px",fontSize:10,fontWeight:700}}>{item.type}</span>
            {item.restaurant&&<Bdg t="Restaurants" c="#dc2626" bg="rgba(220,38,38,.07)"/>}
            {isUpcoming&&item.impact&&<Pill r={impR} t={item.impact.toUpperCase()}/>}
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
          {!isUpcoming?<div style={{background:"rgba(22,163,74,.1)",color:"#16a34a",border:"1px solid rgba(22,163,74,.25)",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700}}>{"Active "+item.eff}</div>:<div style={{background:"rgba(217,119,6,.1)",color:"#d97706",border:"1px solid rgba(217,119,6,.25)",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{item.eff}</div>}
        </div>
      </div>
      <div style={{fontSize:11,color:"#64748b",marginBottom:8,lineHeight:1.4}}>{item.scope}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
        <div style={{background:"#f8fafc",borderRadius:6,padding:"6px 10px"}}><div style={{fontSize:9,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>Notice Required</div><div style={{fontSize:11,fontWeight:700}}>{item.notice}</div></div>
        <div style={{background:"#f8fafc",borderRadius:6,padding:"6px 10px"}}><div style={{fontSize:9,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",marginBottom:2}}>Penalties</div><div style={{fontSize:11,color:"#334155"}}>{item.penalties.length>50?item.penalties.slice(0,50)+"...":item.penalties}</div></div>
      </div>
      <div style={{fontSize:11,color:"#6366f1",fontWeight:600}}>Click for full details</div>
    </div>;
  }

  return (
    <ErrorBoundary>
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",color:"#0f172a",minHeight:"100vh",background:"#f1f5f9",width:"100%",boxSizing:"border-box",fontSize:15}}>
      {compBusy&&<LoaderOverlay info={compBusy}/>}
      {stateModal&&<StateModal st={stateModal} onClose={function(){setStateModal(null);}}/>}
      {schedModal&&<SchedModal item={schedModal.item} isUpcoming={schedModal.isUpcoming} onClose={function(){setSchedModal(null);}}/>}
      {detailModal&&<DetailModal item={detailModal.item} type={detailModal.type} onClose={function(){setDetailModal(null);}}/>}
      {listModal&&!stateModal&&!schedModal&&!detailModal&&<ListModal title={listModal.title} desc={listModal.desc} states={listModal.states} onSelect={openState} onClose={function(){setListModal(null);}}/>}
      {syncDiff&&!stateModal&&!schedModal&&!detailModal&&!listModal&&<SyncDiffModal diff={syncDiff} onClose={function(){setSyncDiff(null);}} onItemClick={function(item){setDetailModal({item:item,type:"upcoming"});}}/>}

      <div style={{background:"linear-gradient(135deg,#1e1b4b 0%,#3730a3 60%,#312e81 100%)",padding:"22px 28px 0",boxShadow:"0 4px 24px rgba(0,0,0,.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:20}}>
          <div>
            <div style={{fontSize:24,fontWeight:800,color:"#fff",letterSpacing:"-.02em"}}>Labor Compliance Dashboard</div>
            <div style={{color:"rgba(255,255,255,.55)",fontSize:13,marginTop:4,letterSpacing:".01em"}}>{"Restaurant Industry - 50-State Tracker - "+(new Date()).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</div>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <span style={{background:"rgba(220,38,38,.3)",color:"#fca5a5",border:"1px solid rgba(220,38,38,.5)",borderRadius:8,padding:"5px 14px",fontSize:12,fontWeight:700}}>{highRisk.length+" High Risk States"}</span>
            <span style={{background:"rgba(217,119,6,.25)",color:"#fcd34d",border:"1px solid rgba(217,119,6,.4)",borderRadius:8,padding:"5px 14px",fontSize:12,fontWeight:700}}>{upcomingWage.length+" Wage Changes 2026"}</span>
            {lastSynced ? (
              <span title={"Last successful sync: "+lastSynced.toLocaleString()} style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(34,197,94,.18)",color:"#86efac",border:"1px solid rgba(134,239,172,.45)",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700}}>
                <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e"}}/>
                {"Synced "+timeAgo(lastSynced)+" - "+lastSynced.toLocaleDateString("en-US",{month:"short",day:"numeric"})+" "+lastSynced.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}
              </span>
            ) : (
              <span style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(148,163,184,.2)",color:"#cbd5e1",border:"1px solid rgba(203,213,225,.3)",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700}}>
                <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:"#94a3b8"}}/>Never synced
              </span>
            )}
            <button onClick={handleSync} disabled={syncing} style={{display:"flex",alignItems:"center",gap:8,background:syncing?"rgba(99,102,241,.4)":"rgba(165,180,252,.15)",color:syncing?"rgba(255,255,255,.5)":"#fff",border:"1.5px solid rgba(165,180,252,.4)",borderRadius:8,padding:"7px 18px",fontSize:12,fontWeight:700,cursor:syncing?"not-allowed":"pointer",backdropFilter:"blur(4px)"}}>{syncing?"Syncing...":"Sync Latest"}</button>
          </div>
        </div>
        {syncStatus&&<div style={{margin:"0 0 14px",padding:"9px 18px",borderRadius:8,fontSize:12,fontWeight:600,background:sC,color:sT,border:"1px solid "+sB}}>{syncStatus.msg}</div>}
        <div style={{display:"flex",gap:0,overflowX:"auto",borderTop:"1px solid rgba(255,255,255,.08)"}}>
                {TABS.map(function(t,i){return <button key={i} onClick={function(){setTab(i);}} style={{border:"none",background:"none",padding:"13px 18px",whiteSpace:"nowrap",borderBottom:tab===i?"3px solid #a5b4fc":"3px solid transparent",color:tab===i?"#a5b4fc":"rgba(255,255,255,.65)",fontWeight:tab===i?700:500,fontSize:14,cursor:"pointer",letterSpacing:".01em"}}>{t}</button>;})}    
        </div>
      </div>

      <div style={{padding:"20px 28px"}}>

      {tab===0&&(
        <div>
          <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
            <KPI label="High Risk States" value={highRisk.length} sub="Immediate audit needed" color="#dc2626" onClick={function(){openList("High Risk States","States with complex multi-layered compliance requirements.",highRisk);}}/>
            <KPI label="Medium Risk" value={medRisk.length} sub="Monitor closely" color="#d97706" onClick={function(){openList("Medium Risk States","States with active wage increases, sick leave mandates, or notable local rates.",medRisk);}}/>
            <KPI label="2026 Wage Changes" value={upcomingWage.length} sub="Pending increases" color="#7c3aed" onClick={function(){openList("States with 2026 Wage Changes","All states with minimum wage increases scheduled in 2026.",upcomingWage);}}/>
            <KPI label="No Tip Credit" value={noTipCredit.length} sub="Full MW required" color="#0284c7" onClick={function(){openList("No Tip Credit States","States where tip credit is not allowed.",noTipCredit);}}/>
            <KPI label="Sick Leave Laws" value={hasSL.length} sub="State mandates active" color="#16a34a" onClick={function(){openList("States with Sick Leave Mandates","States requiring paid sick leave.",hasSL);}}/>
            <KPI label="Daily OT States" value={dailyOT.length} sub="CA, AK, NV, CO" color="#dc2626" onClick={function(){openList("States with Daily Overtime","States requiring OT based on daily hours.",dailyOT);}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{background:"rgba(220,38,38,.1)",color:"#dc2626",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>HIGH RISK STATES</span>
                <span style={{fontSize:11,color:"#94a3b8"}}>Click any card for full detail</span>
              </div>
              {highRisk.map(function(st){
                return <div key={st.a} onClick={function(){setStateModal(st);}} style={{background:"#fff",border:"1px solid #fecaca",borderRadius:10,padding:"12px 14px",marginBottom:10,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div><span style={{fontWeight:800,fontSize:15}}>{st.s}</span><span style={{color:"#94a3b8",fontSize:12,marginLeft:6}}>{st.a}</span></div>
                    <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:15}}>{"$"+st.mw.toFixed(2)}<span style={{fontWeight:400,fontSize:11,color:"#94a3b8"}}>/hr</span></div>{st.chg&&<div style={{fontSize:10,color:"#dc2626",fontWeight:700}}>{"to "+(typeof st.nr==="number"?"$"+st.nr.toFixed(2):String(st.nr||""))+" on "+st.cd}</div>}</div>
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
                    {st.tc==="None"&&<Bdg t="No Tip Credit" c="#dc2626" bg="rgba(220,38,38,.07)"/>}
                    {st.sch&&<Bdg t="Fair Scheduling" c="#7c3aed" bg="rgba(124,58,237,.07)"/>}
                    {st.sl&&<Bdg t="Sick Leave" c="#0284c7" bg="rgba(2,132,199,.07)"/>}
                    {st.otD&&<Bdg t="Daily OT" c="#d97706" bg="rgba(217,119,6,.08)"/>}
                    {st.local&&st.local!=="None"&&<Bdg t="Local Rates" c="#6366f1" bg="rgba(99,102,241,.07)"/>}
                  </div>
                  <div style={{fontSize:11,color:"#64748b"}}>{st.note}</div>
                </div>;
              })}
            </div>
            <div>
              <div style={{marginBottom:10}}><span style={{background:"rgba(124,58,237,.1)",color:"#7c3aed",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>2026 WAGE CHANGES</span></div>
              <Card style={{padding:0,overflow:"hidden",marginBottom:16}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr><TH>State</TH><TH>Effective</TH><TH>Change</TH></tr></thead>
                  <tbody>
                    {upcomingWage.map(function(st){
                      return <tr key={st.a} onClick={function(){setStateModal(st);}} style={{cursor:"pointer"}} onMouseEnter={function(e){e.currentTarget.style.background="#f8fafc";}} onMouseLeave={function(e){e.currentTarget.style.background="";}}>
                        <TD><strong>{st.s}</strong></TD><TD style={{color:"#94a3b8",fontSize:11}}>{st.cd}</TD>
                        <TD style={{fontWeight:700,color:"#7c3aed",whiteSpace:"nowrap"}}>{"$"+st.mw.toFixed(2)+" to "+(typeof st.nr==="number"?"$"+st.nr.toFixed(2):String(st.nr||""))}</TD>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </Card>
              <div style={{marginBottom:10}}><span style={{background:"rgba(220,38,38,.1)",color:"#dc2626",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700}}>RECENT ENFORCEMENT</span></div>
              {CASES.slice(0,3).map(function(c,i){
                return <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",marginBottom:10,boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                    <div style={{fontWeight:700,fontSize:13}}>{c.co} <span style={{color:"#94a3b8",fontWeight:400,fontSize:11}}>{"("+c.yr+")"}</span></div>
                    <div style={{fontWeight:800,color:"#dc2626",fontSize:13,flexShrink:0,marginLeft:8}}>{c.pen}</div>
                  </div>
                  <div style={{display:"flex",gap:6,marginBottom:5}}><Bdg t={c.type}/><Pill r={c.sev} t={c.sev.toUpperCase()}/></div>
                  <div style={{fontSize:11,color:"#64748b",lineHeight:1.5}}>{c.detail}</div>
                </div>;
              })}
            </div>
          </div>
        </div>
      )}

      {tab===1&&(
        <div>
          <Tip>Click any state row for full compliance details including age-specific minor rules, break laws, OT, and sick leave.</Tip>
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <input style={{padding:"7px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12,outline:"none",minWidth:180}} placeholder="Search state..." value={search} onChange={function(e){setSearch(e.target.value);}}/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {["all","high","medium","low"].map(function(v){return <button key={v} onClick={function(){setRFilter(v);}} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer",background:rFilter===v?"#6366f1":"#fff",color:rFilter===v?"#fff":"#64748b"}}>{v==="all"?"All":v==="high"?"High Risk":v==="medium"?"Medium":"Low Risk"}</button>;})}
            </div>
          </div>
          <Card style={{padding:0,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["State","Min Wage","Tipped Rate","Tip Credit","OT Rule","Upcoming Change","Local Rates","Risk","Source"].map(function(h){return <TH key={h}>{h}</TH>;})}</tr></thead>
              <tbody>
                {filtered.map(function(st){
                  return <tr key={st.a} onClick={function(){setStateModal(st);}} style={{cursor:"pointer"}} onMouseEnter={function(e){e.currentTarget.style.background="#f8fafc";}} onMouseLeave={function(e){e.currentTarget.style.background="";}}>
                    <TD><strong>{st.s}</strong> <span style={{color:"#94a3b8",fontSize:10}}>{st.a}</span></TD>
                    <TD style={{fontWeight:700}}>{"$"+st.mw.toFixed(2)}</TD>
                    <TD>{typeof st.tip==="number"?"$"+st.tip.toFixed(2):st.tip}</TD>
                    <TD>{st.tc==="None"?<Bdg t="None" c="#dc2626" bg="rgba(220,38,38,.07)"/>:(typeof st.tc==="number"?"$"+st.tc.toFixed(2):"--")}</TD>
                    <TD style={{color:"#64748b",fontSize:11}}>{st.ot}</TD>
                    <TD>{st.chg?<span style={{color:"#7c3aed",fontWeight:700,fontSize:11}}>{(typeof st.nr==="number"?"$"+st.nr.toFixed(2):String(st.nr||""))+" - "+st.cd}</span>:<span style={{color:"#cbd5e1",fontSize:11}}>--</span>}</TD>
                    <TD style={{color:"#64748b",fontSize:11}}>{st.local&&st.local!=="None"?st.local:"--"}</TD>
                    <TD><Pill r={st.r} t={st.r.toUpperCase()}/></TD>
                    <TD><SrcLink url={st.src} label="Source"/></TD>
                  </tr>;
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab===2&&(
        <div>
          <Tip>80/20 Rule: tipped employees cannot spend over 20% of shift on non-tipped duties. Top DOL enforcement focus. Avg back-wage finding: $1,400/employee.</Tip>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <KPI label="No Tip Credit States" value={noTipCredit.length} sub="Full MW required" color="#dc2626" onClick={function(){openList("No Tip Credit States","States prohibiting tip credit.",noTipCredit);}}/>
            <KPI label="Highest Tipped Rate" value="$12.75" sub="Hawaii" color="#0284c7"/>
            <KPI label="Federal Tip Credit" value="$5.12" sub="At $7.25 federal MW" color="#6366f1"/>
          </div>
          <Card style={{padding:0,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["State","Min Wage","Tipped Cash Wage","Tip Credit","Notes","Risk","Source"].map(function(h){return <TH key={h}>{h}</TH>;})}</tr></thead>
              <tbody>
                {STATES.map(function(st){
                  return <tr key={st.a} onClick={function(){setStateModal(st);}} style={{cursor:"pointer"}} onMouseEnter={function(e){e.currentTarget.style.background="#f8fafc";}} onMouseLeave={function(e){e.currentTarget.style.background="";}}>
                    <TD><strong>{st.s}</strong></TD>
                    <TD style={{fontWeight:700}}>{"$"+st.mw.toFixed(2)}</TD>
                    <TD style={{fontWeight:700,color:st.tc==="None"?"#dc2626":"#0f172a"}}>{typeof st.tip==="number"?"$"+st.tip.toFixed(2):st.tip}</TD>
                    <TD>{st.tc==="None"?<Bdg t="No Credit" c="#dc2626" bg="rgba(220,38,38,.07)"/>:(typeof st.tc==="number"?"$"+st.tc.toFixed(2):"--")}</TD>
                    <TD style={{fontSize:11,color:"#64748b",maxWidth:200}}>{st.note}</TD>
                    <TD><Pill r={st.r} t={st.r.toUpperCase()}/></TD>
                    <TD><SrcLink url={st.src} label="Source"/></TD>
                  </tr>;
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab===3&&(
        <div>
          <Tip>Restaurant industry is the #1 DOL child labor enforcement sector. 950+ investigations in 2024. Florida and Washington are stricter than federal for ages 14-15.</Tip>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <KPI label="DOL Investigations" value="950+" sub="Child labor cases 2024" color="#dc2626"/>
            <KPI label="Avg Penalty" value="$15K+" sub="Per minor violation" color="#d97706"/>
            <KPI label="States Requiring Permit" value={Object.values(MINOR_AGES).filter(function(m){return m.permit;}).length} sub="Work/employment permit" color="#7c3aed"/>
          </div>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:13}}>Federal FLSA Baseline - All States Must Meet or Exceed</div>
              <SrcLink url="https://www.dol.gov/agencies/whd/child-labor/restaurant" label="DOL Restaurant Guide"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{background:"#fef9c3",borderRadius:8,padding:"10px 14px",border:"1px solid #fde68a"}}>
                <div style={{fontWeight:700,fontSize:11,color:"#92400e",marginBottom:6,textTransform:"uppercase"}}>Ages 14-15 Federal Limits</div>
                {B14.map(function(r,i){return <div key={i} style={{fontSize:11,color:"#334155",marginBottom:3}}>{"> "+r}</div>;})}
              </div>
              <div style={{background:"#f0fdf4",borderRadius:8,padding:"10px 14px",border:"1px solid #bbf7d0"}}>
                <div style={{fontWeight:700,fontSize:11,color:"#14532d",marginBottom:6,textTransform:"uppercase"}}>Ages 16-17 Federal Limits</div>
                {B16.map(function(r,i){return <div key={i} style={{fontSize:11,color:"#334155",marginBottom:3}}>{"> "+r}</div>;})}
              </div>
            </div>
            <div style={{marginTop:10,padding:"8px 12px",background:"#fef2f2",borderRadius:8,border:"1px solid #fecaca",fontSize:11,color:"#7f1d1d"}}>NOTE: Hazardous work banned under 18: meat slicers, power-driven equipment, most cooking appliances, delivery on public roads or e-bikes.</div>
          </Card>
          <Card style={{padding:0,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",fontWeight:700,fontSize:13,borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span>State-by-State Age-Specific Minor Labor Rules</span>
              <span style={{fontSize:11,color:"#94a3b8",fontWeight:400}}>Click any row for full detail - Scroll right</span>
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
                  {STATES.map(function(st){
                    var m=MINOR_AGES[st.a]||MA_DEF;
                    return <tr key={st.a} onClick={function(){setStateModal(st);}} style={{cursor:"pointer"}} onMouseEnter={function(e){e.currentTarget.style.opacity=".85";}} onMouseLeave={function(e){e.currentTarget.style.opacity="1";}}>
                      <td style={{padding:"8px 10px",borderBottom:"1px solid #f1f5f9",verticalAlign:"top",position:"sticky",left:0,background:"#fff",zIndex:1,minWidth:130}}><div style={{fontWeight:700,fontSize:12}}>{st.s}</div><div style={{fontSize:10,color:"#94a3b8"}}>{st.a}</div></td>
                      <td style={{padding:"8px 10px",borderBottom:"1px solid #f1f5f9",verticalAlign:"top",minWidth:90}}>{m.permit?<div><Bdg t="Required" c="#dc2626" bg="rgba(220,38,38,.08)"/><div style={{fontSize:9,color:"#64748b",marginTop:4,lineHeight:1.3}}>{m.permitNote}</div></div>:<span style={{color:"#94a3b8",fontSize:11}}>None</span>}</td>
                      <AgeCell rules={m.a14} bg="rgba(254,249,195,.4)"/>
                      <AgeCell rules={m.a15} bg="rgba(254,243,199,.3)"/>
                      <AgeCell rules={m.a16} bg="rgba(240,253,244,.5)"/>
                      <AgeCell rules={m.a17} bg="rgba(220,252,231,.4)"/>
                      <td style={{padding:"8px 10px",borderBottom:"1px solid #f1f5f9",verticalAlign:"top"}}><Pill r={st.r} t={st.r.toUpperCase()}/></td>
                      <td style={{padding:"8px 10px",borderBottom:"1px solid #f1f5f9",verticalAlign:"top"}} onClick={function(e){e.stopPropagation();}}><SrcLink url={st.src} label="Source"/></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab===4&&(
        <div>
          <Tip>California is the only state with statutory premium pay (1hr at regular rate) for missed breaks. Most other states have meal break requirements but no premium.</Tip>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <KPI label="States w/ Break Laws" value={hasBreakLaws.length} sub="Beyond FLSA minimum" color="#d97706" onClick={function(){openList("States with Break Requirements","States requiring breaks beyond federal FLSA baseline.",hasBreakLaws);}}/>
            <KPI label="Premium Pay States" value={hasPremium.length} sub="Penalty pay for violations" color="#dc2626" onClick={function(){openList("States with Break Premium Pay","States requiring extra compensation when a required break is missed.",hasPremium);}}/>
            <KPI label="FLSA Baseline" value="0 req." sub="No adult break mandate federally" color="#6366f1"/>
            <KPI label="Paid Rest Rule" value="under 20 min" sub="Short breaks must be paid (FLSA)" color="#16a34a"/>
          </div>
          <Card style={{background:"#fffbeb",border:"1px solid #fde68a",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:"#92400e"}}>Federal FLSA Baseline</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              {[["Rest Breaks","Short breaks (5-20 min) must be counted as paid work time. No minimum frequency required federally."],["Meal Breaks","Bona fide meal period (30+ min, fully relieved) need NOT be paid. No federal requirement to provide one."],["Premium Pay","None federally. Only California mandates 1hr premium pay per missed break. Other states impose civil penalties."]].map(function(item){return <div key={item[0]} style={{background:"#fff",borderRadius:8,padding:"10px 14px",border:"1px solid #fde68a"}}><div style={{fontWeight:700,fontSize:11,color:"#92400e",marginBottom:4,textTransform:"uppercase"}}>{item[0]}</div><div style={{fontSize:11,color:"#78350f",lineHeight:1.5}}>{item[1]}</div></div>;})}</div>
          </Card>
          <Card style={{padding:0,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["State","Rest Break","Meal Break","Premium Pay","Notes","Risk","Source"].map(function(h){return <TH key={h}>{h}</TH>;})}</tr></thead>
              <tbody>
                {STATES.map(function(st){
                  return <tr key={st.a} onClick={function(){setStateModal(st);}} style={{cursor:"pointer"}} onMouseEnter={function(e){e.currentTarget.style.background="#f8fafc";}} onMouseLeave={function(e){e.currentTarget.style.background="";}}>
                    <TD><strong>{st.s}</strong></TD>
                    <TD style={{fontSize:11,color:st.brk.rest.indexOf("FLSA")>=0?"#94a3b8":st.brk.rest.indexOf("PAID")>=0?"#16a34a":"#334155",fontWeight:st.brk.rest.indexOf("PAID")>=0?"700":"400"}}>{st.brk.rest}</TD>
                    <TD style={{fontSize:11,color:st.brk.meal.indexOf("FLSA")>=0?"#94a3b8":"#334155"}}>{st.brk.meal}</TD>
                    <TD>{st.brk.premium!=="None"?<Bdg t={st.brk.premium} c="#dc2626" bg="rgba(220,38,38,.08)"/>:<span style={{color:"#cbd5e1",fontSize:11}}>None</span>}</TD>
                    <TD style={{fontSize:11,color:"#64748b",maxWidth:220}}>{st.brk.note}</TD>
                    <TD><Pill r={st.r} t={st.r.toUpperCase()}/></TD>
                    <TD><SrcLink url={st.src} label="Source"/></TD>
                  </tr>;
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab===5&&(
        <div>
          <Tip>Only 4 states require daily overtime. Most follow FLSA weekly 40hrs. California is most complex - daily, double-time, and 7th-day rules all apply simultaneously.</Tip>
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            <KPI label="Daily OT States" value={dailyOT.length} sub="CA, AK, NV, CO" color="#dc2626" onClick={function(){openList("Daily Overtime States","States requiring OT triggered by daily hours.",dailyOT);}}/>
            <KPI label="Federal Threshold" value="40 hrs/wk" sub="FLSA standard" color="#6366f1"/>
            <KPI label="Exception: MN" value="48 hrs/wk" sub="Higher state threshold" color="#d97706"/>
            <KPI label="OT Rate" value="1.5x" sub="Min; CA adds 2x after 12hrs" color="#0284c7"/>
          </div>
          <Card style={{border:"1px solid #fecaca",background:"rgba(220,38,38,.02)",marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:13,color:"#dc2626",marginBottom:12}}>States with Daily Overtime Requirements</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12}}>
              {[{s:"California",trigger:"After 8hrs/day",rate:"1.5x (2x after 12hrs/day)",extra:"7th consecutive day: 1.5x first 8hrs, 2x after",src:"https://www.dir.ca.gov/dlse/faq_overtime.htm"},{s:"Alaska",trigger:"After 8hrs/day OR 40hrs/week",rate:"1.5x",extra:"Whichever threshold reached first",src:"https://labor.alaska.gov/lss/whhome.htm"},{s:"Nevada",trigger:"After 8hrs/day (if earning under $18/hr)",rate:"1.5x",extra:"Also OT after 40hrs/week",src:"https://labor.nv.gov/"},{s:"Colorado",trigger:"After 12hrs/day OR 40hrs/week",rate:"1.5x",extra:"COMPS Order applies to hospitality",src:"https://cdle.colorado.gov/wages"}].map(function(item){
                return <div key={item.s} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px"}}><div style={{fontWeight:800,fontSize:14,marginBottom:6}}>{item.s}</div><div style={{fontSize:11,color:"#475569",marginBottom:3}}><strong>Trigger: </strong>{item.trigger}</div><div style={{fontSize:11,color:"#475569",marginBottom:3}}><strong>Rate: </strong>{item.rate}</div><div style={{fontSize:11,color:"#64748b",marginBottom:8}}>{item.extra}</div><SrcLink url={item.src} label="Source"/></div>;
              })}
            </div>
          </Card>
          <Card style={{padding:0,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["State","OT Threshold","Daily OT","Rate","Special Notes","Risk","Source"].map(function(h){return <TH key={h}>{h}</TH>;})}</tr></thead>
              <tbody>
                {STATES.map(function(st){
                  return <tr key={st.a} onClick={function(){setStateModal(st);}} style={{cursor:"pointer"}} onMouseEnter={function(e){e.currentTarget.style.background="#f8fafc";}} onMouseLeave={function(e){e.currentTarget.style.background="";}}>
                    <TD><strong>{st.s}</strong></TD>
                    <TD style={{fontWeight:700,color:st.ot==="Weekly 48"?"#d97706":"#0f172a"}}>{st.ot}</TD>
                    <TD>{st.otD?<Bdg t="Yes" c="#dc2626" bg="rgba(220,38,38,.08)"/>:<span style={{color:"#cbd5e1",fontSize:11}}>No</span>}</TD>
                    <TD style={{fontSize:11}}>{st.a==="CA"?"1.5x / 2x":"1.5x"}</TD>
                    <TD style={{fontSize:11,color:"#64748b",maxWidth:280}}>{st.otNote}</TD>
                    <TD><Pill r={st.r} t={st.r.toUpperCase()}/></TD>
                    <TD><SrcLink url={st.src} label="Source"/></TD>
                  </tr>;
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab===6&&(function(){
        var schedUpcomingFuture=SCHED_UPCOMING.filter(function(s){return !isPastDate(s.eff);});
        var schedUpcomingHidden=SCHED_UPCOMING.length-schedUpcomingFuture.length;
        return (
        <div>
          <Tip>{"Click any jurisdiction card for full rules, penalties, and enforcement notes. "+SCHED_ACTIVE.length+" active laws + "+schedUpcomingFuture.length+" upcoming/proposed tracked"+(schedUpcomingHidden>0?" ("+schedUpcomingHidden+" past-effective items hidden)":"")+"."}</Tip>
          <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
            <KPI label="Active Laws" value={SCHED_ACTIVE.length} sub="Currently enforced" color="#16a34a"/>
            <KPI label="Upcoming / Proposed" value={schedUpcomingFuture.length} sub="Bills and expansions" color="#d97706"/>
            <KPI label="States with Laws" value={[...new Set(SCHED_ACTIVE.map(function(s){return s.state;}))].length} sub="Incl. Oregon statewide" color="#7c3aed"/>
            <KPI label="Cities / Counties" value={SCHED_ACTIVE.filter(function(s){return s.type==="City"||s.type==="County";}).length} sub="Local ordinances" color="#6366f1"/>
            <KPI label="Cover Restaurants" value={SCHED_ACTIVE.filter(function(s){return s.restaurant;}).length} sub="Directly applicable" color="#dc2626"/>
            <KPI label="Standard Notice" value="14 days" sub="Across most jurisdictions" color="#0284c7"/>
          </div>
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:10,borderBottom:"2px solid rgba(22,163,74,.2)"}}>
              <div style={{background:"rgba(22,163,74,.1)",border:"1.5px solid rgba(22,163,74,.3)",borderRadius:8,padding:"6px 14px"}}>
                <div style={{fontWeight:800,fontSize:13,color:"#16a34a"}}>Active Fair Workweek and Predictive Scheduling Laws</div>
                <div style={{fontSize:10,color:"#94a3b8"}}>{SCHED_ACTIVE.length+" active jurisdictions - currently enforced - Click any card for full detail"}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
              {SCHED_ACTIVE.map(function(item){return <SchedCard key={item.id} item={item} isUpcoming={false}/>;})}
            </div>
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:10,borderBottom:"2px solid rgba(217,119,6,.2)"}}>
              <div style={{background:"rgba(217,119,6,.1)",border:"1.5px solid rgba(217,119,6,.3)",borderRadius:8,padding:"6px 14px"}}>
                <div style={{fontWeight:800,fontSize:13,color:"#d97706"}}>Upcoming, Proposed and Expanding Laws</div>
                <div style={{fontSize:10,color:"#94a3b8"}}>{schedUpcomingFuture.length+" proposals tracked - not yet in effect"}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
              {schedUpcomingFuture.map(function(item){return <SchedCard key={item.id} item={item} isUpcoming={true}/>;})}
            </div>
          </div>
          <div style={{marginTop:20,background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"12px 16px"}}>
            <div style={{fontWeight:700,fontSize:12,color:"#dc2626",marginBottom:6}}>States that Preempt Local Scheduling Laws</div>
            <div style={{fontSize:11,color:"#7f1d1d",lineHeight:1.6}}>Some states block cities from enacting their own scheduling ordinances. Known preemption states include <strong>Arkansas, Iowa, Missouri, Tennessee, and Georgia</strong>.</div>
          </div>
        </div>
        );
      })()}

      {tab===7&&(
        <div>
          <Tip>Click any card for full detail. The regulatory environment shifted in late 2024. Monitor DOL rulemaking, WHD enforcement priorities, and potential reversals of paused rules.</Tip>
          {FEDERAL_UPDATES.map(function(f,i){
            return <Card key={i} onClick={function(){setDetailModal({item:f,type:"federal"});}} style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1}}><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}><Bdg t={f.cat}/><span style={{fontWeight:700,fontSize:13}}>{f.title}</span></div><div style={{fontSize:11,color:"#94a3b8"}}>{f.date}</div></div>
                <div style={{display:"flex",gap:8,alignItems:"center",marginLeft:10,flexShrink:0}}>
                  <Bdg t={f.status} c={f.status==="Active"?"#16a34a":f.status==="Blocked"?"#dc2626":"#64748b"} bg={f.status==="Active"?"rgba(22,163,74,.08)":f.status==="Blocked"?"rgba(220,38,38,.07)":"rgba(100,116,139,.08)"}/>
                  <Pill r={f.sev} t={f.sev.toUpperCase()}/>
                </div>
              </div>
              <div style={{fontSize:12,color:"#475569",lineHeight:1.6,marginBottom:10}}>{f.detail.length>140?f.detail.slice(0,140)+"...":f.detail}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <SrcLink url={f.src} label="Gov Source"/>
                <span style={{fontSize:11,color:"#6366f1",fontWeight:600}}>Click for full detail</span>
              </div>
            </Card>;
          })}
        </div>
      )}

      {tab===8&&(function(){
        var upcomingFuture=upcomingData.filter(function(u){return !isPastDate(u.eff);});
        var SECTION_ORDER=["Min Wage","Tipped Wage","Sick Leave","Minor Labor","Break Laws","Overtime","Scheduling","Restaurant-Specific"];
        var SECTION_META={
          "Min Wage":{icon:"💵",label:"Minimum Wage",desc:"State and federal minimum wage increases and indexing changes"},
          "Tipped Wage":{icon:"💰",label:"Tipped Wage",desc:"Tip credit changes, phase-outs, and pending federal legislation"},
          "Sick Leave":{icon:"🏥",label:"Sick Leave",desc:"New state sick leave mandates and expansions"},
          "Minor Labor":{icon:"👷",label:"Minor Labor",desc:"Child labor enforcement changes and age-specific rule updates"},
          "Break Laws":{icon:"🕐",label:"Break Laws",desc:"Meal and rest break regulation changes and new recordkeeping requirements"},
          "Overtime":{icon:"📊",label:"Overtime",desc:"OT threshold rulemakings and state-level threshold proposals"},
          "Scheduling":{icon:"📅",label:"Scheduling",desc:"Fair Workweek expansions and new predictive scheduling laws"},
          "Restaurant-Specific":{icon:"🏢",label:"Restaurant-Specific / Misc",desc:"Industry-wide laws, franchise liability, AI tools, and federal wage bills"},
        };
        var grouped={};
        SECTION_ORDER.forEach(function(cat){
          var items=upcomingFuture.filter(function(u){return u.cat===cat&&(upYr==="all"||String(u.yr)===upYr);});
          if(items.length>0) grouped[cat]=items;
        });
        var totalShown=Object.values(grouped).reduce(function(a,v){return a+v.length;},0);
        var hiddenCount=upcomingData.length-upcomingFuture.length;
        return (
          <div>
            <Tip>{"Tracking "+upcomingFuture.length+" upcoming regulatory changes for 2026-2027"+(hiddenCount>0?" ("+hiddenCount+" past-effective items hidden)":"")+". Items marked PENDING are active legislation. Click any item for full detail."}</Tip>
            <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              <KPI label="Total Upcoming" value={upcomingFuture.length} sub="Future-effective only" color="#6366f1"/>
              <KPI label="2026 Changes" value={upcomingFuture.filter(function(u){return u.yr===2026;}).length} sub="This calendar year" color="#d97706"/>
              <KPI label="2027 Changes" value={upcomingFuture.filter(function(u){return u.yr===2027;}).length} sub="Planning horizon" color="#7c3aed"/>
              <KPI label="Critical Impact" value={upcomingFuture.filter(function(u){return u.impact==="critical";}).length} sub="Immediate action needed" color="#dc2626"/>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
              <div style={{display:"flex",gap:6}}>
                {["all","2026","2027"].map(function(yr){return <button key={yr} onClick={function(){setUpYr(yr);}} style={{border:"1px solid #e2e8f0",borderRadius:6,padding:"5px 16px",fontSize:11,fontWeight:600,cursor:"pointer",background:upYr===yr?"#6366f1":"#fff",color:upYr===yr?"#fff":"#64748b"}}>{yr==="all"?"All Years":yr}</button>;})}
              </div>
              <span style={{fontSize:11,color:"#94a3b8"}}>{totalShown+" item"+(totalShown!==1?"s":"")+" shown"}</span>
              <span style={{fontSize:11,color:"#cbd5e1"}}>|</span>
              <span style={{fontSize:11,color:"#94a3b8"}}>{upcomingData.length+" total in catalog (persisted across refresh)"}</span>
              {lastSynced ? (
                <span style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(34,197,94,.1)",color:"#15803d",border:"1px solid rgba(134,239,172,.5)",borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:700}} title={lastSynced.toLocaleString()}>
                  <span style={{display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#22c55e"}}/>
                  {"Last sync: "+lastSynced.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})+" at "+lastSynced.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})+" ("+timeAgo(lastSynced)+")"}
                </span>
              ) : (
                <span style={{background:"#f1f5f9",color:"#64748b",border:"1px solid #e2e8f0",borderRadius:6,padding:"3px 9px",fontSize:11,fontWeight:600}}>Never synced - click Sync Latest above</span>
              )}
              <button onClick={resetUpcomingCatalog} style={{marginLeft:"auto",border:"1px solid #fecaca",background:"#fff",color:"#dc2626",borderRadius:6,padding:"5px 12px",fontSize:11,fontWeight:600,cursor:"pointer"}} title="Restore catalog to original built-in items, removing all sync additions">Reset Catalog</button>
            </div>
            {SECTION_ORDER.filter(function(cat){return grouped[cat];}).map(function(cat){
              var items=grouped[cat];
              var meta=SECTION_META[cat]||{icon:"*",label:cat,desc:""};
              var cc=CAT_COLORS[cat]||{c:"#6366f1",bg:"rgba(99,102,241,.08)"};
              return (
                <div key={cat} style={{marginBottom:28}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,paddingBottom:10,borderBottom:"2px solid "+cc.c+"22"}}>
                    <div style={{background:cc.bg,border:"1.5px solid "+cc.c+"44",borderRadius:10,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:18}}>{meta.icon}</span>
                      <div>
                        <div style={{fontWeight:800,fontSize:14,color:cc.c}}>{meta.label}</div>
                        <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{meta.desc}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,marginLeft:"auto",flexShrink:0,flexWrap:"wrap"}}>
                      {items.filter(function(u){return u.yr===2026;}).length>0&&<span style={{background:"rgba(217,119,6,.1)",color:"#d97706",border:"1px solid rgba(217,119,6,.25)",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>{items.filter(function(u){return u.yr===2026;}).length+" in 2026"}</span>}
                      {items.filter(function(u){return u.yr===2027;}).length>0&&<span style={{background:"rgba(124,58,237,.1)",color:"#7c3aed",border:"1px solid rgba(124,58,237,.25)",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>{items.filter(function(u){return u.yr===2027;}).length+" in 2027"}</span>}
                      {items.filter(function(u){return u.impact==="critical";}).length>0&&<span style={{background:"rgba(220,38,38,.1)",color:"#dc2626",border:"1px solid rgba(220,38,38,.25)",borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700}}>{items.filter(function(u){return u.impact==="critical";}).length+" critical"}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {items.map(function(u,i){
                      var impR=u.impact==="critical"?"critical":u.impact==="high"?"high":u.impact==="medium"?"medium":"low";
                      var isPending=u.eff.toLowerCase().indexOf("pending")>=0;
                      return (
                        <div key={i} onClick={function(){setDetailModal({item:u,type:"upcoming"});}} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:"14px 18px",boxShadow:"0 1px 3px rgba(0,0,0,.04)",borderLeft:"4px solid "+cc.c,display:"flex",gap:14,alignItems:"flex-start",cursor:"pointer"}}>
                          <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:6,paddingTop:2}}>
                            <div style={{background:u.yr===2026?"rgba(217,119,6,.12)":"rgba(124,58,237,.1)",color:u.yr===2026?"#d97706":"#7c3aed",border:"1px solid "+(u.yr===2026?"rgba(217,119,6,.3)":"rgba(124,58,237,.3)"),borderRadius:6,padding:"3px 8px",fontSize:12,fontWeight:800,minWidth:44,textAlign:"center"}}>{u.yr}</div>
                            <Pill r={impR} t={u.impact==="critical"?"CRIT":u.impact==="high"?"HIGH":u.impact==="medium"?"MED":"LOW"}/>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                              <span style={{fontWeight:700,fontSize:13,color:"#0f172a"}}>{u.title}</span>
                              {isPending&&<Bdg t="PENDING" c="#64748b" bg="rgba(100,116,139,.08)"/>}
                            </div>
                            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:7,flexWrap:"wrap"}}>
                              <span style={{fontSize:11,color:"#64748b",fontWeight:600}}>{u.j}</span>
                              <span style={{fontSize:11,fontWeight:600,color:isPending?"#94a3b8":"#475569"}}>{u.eff}</span>
                            </div>
                            <div style={{fontSize:12,color:"#475569",lineHeight:1.65,marginBottom:8}}>{u.detail.length>120?u.detail.slice(0,120)+"...":u.detail}</div>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                              <SrcLink url={u.src} label="Official Reference"/>
                              <span style={{fontSize:11,color:"#6366f1",fontWeight:600}}>Click for full detail</span>
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

      {tab===9&&(function(){
        var compSC=compValStatus?compValStatus.type==="success"?"rgba(22,163,74,.1)":compValStatus.type==="error"?"rgba(220,38,38,.1)":"rgba(99,102,241,.1)":null;
        var compSB=compValStatus?compValStatus.type==="success"?"rgba(22,163,74,.3)":compValStatus.type==="error"?"rgba(220,38,38,.3)":"rgba(99,102,241,.3)":null;
        var compST=compValStatus?compValStatus.type==="success"?"#16a34a":compValStatus.type==="error"?"#dc2626":"#4f46e5":null;
        var hasResult=compResult&&compResult.configFindings;
        var totalChecks=0,passCount=0,warnCount=0,failCount=0,missingCount=0,critCount=0,belowMin=0;
        var byCategory={}, byStateH={}; var fStores={}, fOwners={}, fStates={};
        var anyFilter=(compFilterCategory!=="all"||compFilterOwner!=="all"||compFilterState!=="all");
        if(hasResult){
          for(var fi=0;fi<compResult.configFindings.length;fi++){
            var cf=compResult.configFindings[fi]; var bconf=compAgg?compAgg.configs[cf.configIndex]:null; if(!cf.checks||!bconf) continue;
            // State filter is config-level; owner filter is per-store (configs are shared across operators)
            if(compFilterState!=="all" && bconf.assignedState!==compFilterState) continue;
            var allSn=bconf.storeNumbers||[], som=bconf.storeOwnerMap||{}, bsc=0, sni, sOwn;
            for(sni=0;sni<allSn.length;sni++){
              sOwn=som[allSn[sni]]||bconf.primaryOwner;
              if(compFilterOwner==="all" || sOwn===compFilterOwner){ bsc++; fStores[allSn[sni]]=1; fOwners[sOwn]=1; }
            }
            if(bsc===0) continue;
            fStates[bconf.assignedState]=1;
            var _sth=bconf.assignedState; if(!byStateH[_sth]) byStateH[_sth]={stores:0,checks:0,pass:0,gaps:0,critical:0,top:{}}; byStateH[_sth].stores+=bsc;
            for(var ci=0;ci<cf.checks.length;ci++){
              var ck=cf.checks[ci]; var cat=ck.category||"Other";
              // Category cards reflect owner+state scope (every category still shown)
              if(!byCategory[cat]) byCategory[cat]={pass:0,warn:0,fail:0,missing:0,info:0,total:0};
              byCategory[cat].total++;
              if(ck.status==="pass") byCategory[cat].pass++;
              else if(ck.status==="warn") byCategory[cat].warn++;
              else if(ck.status==="fail") byCategory[cat].fail++;
              else if(ck.status==="missing") byCategory[cat].missing++;
              else byCategory[cat].info++;
              byStateH[_sth].checks++; if(ck.basis==="regulation"&&ck.status==="fail") belowMin++;
              if(ck.status==="pass") byStateH[_sth].pass++;
              else if(ck.status==="fail"||ck.status==="warn"||ck.status==="missing"){ byStateH[_sth].gaps++; if(ck.severity==="critical") byStateH[_sth].critical++; var _ln=ck.lawName||ck.lawId; byStateH[_sth].top[_ln]=(byStateH[_sth].top[_ln]||0)+1; }
              // KPI tiles additionally honor the active Category filter
              if(compFilterCategory!=="all" && cat!==compFilterCategory) continue;
              totalChecks++;
              if(ck.status==="pass") passCount++;
              else if(ck.status==="warn") warnCount++;
              else if(ck.status==="fail") failCount++;
              else if(ck.status==="missing") missingCount++;
              if(ck.severity==="critical") critCount++;
            }
          }
        }
        var fStoreCount=Object.keys(fStores).length, fOwnerCount=Object.keys(fOwners).length, fStateCount=Object.keys(fStates).length;
        function _topKey(o){var bk="",bv=-1,kk;for(kk in o){if(o.hasOwnProperty(kk)&&o[kk]>bv){bv=o[kk];bk=kk;}}return bk;}
        var stateHealthList=[]; var stateColorMap={};
        for(var _sh in byStateH){ if(!byStateH.hasOwnProperty(_sh)) continue; var _H=byStateH[_sh];
          var _sev=_H.critical>0?"crit":(_H.gaps>0?"warn":"ok");
          var _hp=_H.checks>0?Math.round(_H.pass*100/_H.checks):100;
          stateColorMap[_sh]=_sev;
          stateHealthList.push({ab:_sh,stores:_H.stores,checks:_H.checks,gaps:_H.gaps,critical:_H.critical,health:_hp,top:_topKey(_H.top),sev:_sev});
        }
        stateHealthList.sort(function(a,b){ var r={crit:0,warn:1,ok:2}; if(r[a.sev]!==r[b.sev]) return r[a.sev]-r[b.sev]; return b.gaps-a.gaps; });
        var infoCount=totalChecks-passCount-warnCount-failCount-missingCount;
        function pct(n,d){return d===0?0:Math.round(n*1000/d)/10;}
        var passPct=pct(passCount,totalChecks),warnPct=pct(warnCount,totalChecks),failPct=pct(failCount,totalChecks),missingPct=pct(missingCount,totalChecks),infoPct=pct(infoCount,totalChecks);
        var categoryNames=Object.keys(byCategory).sort(function(a,b){
          var aBad=byCategory[a].fail+byCategory[a].missing+byCategory[a].warn;
          var bBad=byCategory[b].fail+byCategory[b].missing+byCategory[b].warn;
          return bBad-aBad;
        });
        var sevRank={critical:0,high:1,medium:2,low:3,info:4};
        function sortChecks(arr){
          return arr.slice().sort(function(a,b){
            var statRank={fail:0,missing:1,warn:2,info:3,informational:3,pass:4,not_applicable:5};
            var as=statRank[a.status]==null?6:statRank[a.status];
            var bs=statRank[b.status]==null?6:statRank[b.status];
            if(as!==bs) return as-bs;
            var av=sevRank[a.severity]==null?5:sevRank[a.severity];
            var bv=sevRank[b.severity]==null?5:sevRank[b.severity];
            return av-bv;
          });
        }
        function flatRank(ck){
          var r=0;
          if(ck.basis==="regulation") r-=1000;
          var sr={fail:0,missing:1,warn:2,info:3,pass:5};
          r+=(sr[ck.status]==null?4:sr[ck.status])*10;
          r+=(sevRank[ck.severity]==null?5:sevRank[ck.severity]);
          return r;
        }
        function passesFilter(ck,conf){
          if(compFilterCategory!=="all"&&(ck.category||"Other")!==compFilterCategory) return false;
          if(compFilterOwner!=="all"&&conf&&!(conf.owners&&conf.owners.indexOf(compFilterOwner)>=0)) return false;
          if(compFilterState!=="all"&&conf&&conf.assignedState!==compFilterState) return false;
          if(compFilterStatus==="all") return true;
          if(compFilterStatus==="issues") return ck.status==="fail"||ck.status==="warn"||ck.status==="missing";
          return ck.status===compFilterStatus;
        }
        var multiOwner=compAgg&&compAgg.distinctOwners&&compAgg.distinctOwners.length>1;
        var multiState=compAgg&&compAgg.distinctStates&&compAgg.distinctStates.length>1;
        var effectiveGroupBy=compGroupBy;
        if(effectiveGroupBy==="auto") effectiveGroupBy=multiOwner?"owner":(multiState?"state":"none");
        var groupedFindings=[];
        var flatChecks=[];
        if(hasResult){
          var grpMap={};
          for(var gfi=0;gfi<compResult.configFindings.length;gfi++){
            var gcf=compResult.configFindings[gfi]; var gconf=compAgg.configs[gcf.configIndex]; if(!gconf) continue;
            var gKey=effectiveGroupBy==="owner"?gconf.primaryOwner:effectiveGroupBy==="state"?gconf.assignedStateName:"All Configurations";
            if(!grpMap[gKey]) grpMap[gKey]={key:gKey,configs:[],totalStores:0,totalIssues:0};
            grpMap[gKey].configs.push({cf:gcf,conf:gconf});
            grpMap[gKey].totalStores+=gconf.storeNumbers.length;
            for(var gck=0;gck<(gcf.checks||[]).length;gck++){
              var gc=gcf.checks[gck];
              if(gc.status==="fail"||gc.status==="missing"||gc.status==="warn") grpMap[gKey].totalIssues++;
            }
          }
          groupedFindings=Object.keys(grpMap).map(function(k){return grpMap[k];}).sort(function(a,b){return b.totalIssues-a.totalIssues;});
          for(var ffi=0;ffi<compResult.configFindings.length;ffi++){
            var fcf=compResult.configFindings[ffi]; var fconf=compAgg.configs[fcf.configIndex]; if(!fconf) continue;
            var fvis=(fcf.checks||[]).filter(function(c){return passesFilter(c,fconf);});
            for(var fvj=0;fvj<fvis.length;fvj++){ flatChecks.push({ck:fvis[fvj],cf:fcf,conf:fconf}); }
          }
          flatChecks.sort(function(a,b){return flatRank(a.ck)-flatRank(b.ck);});
        }
        var taskList=hasResult?buildTaskList():[];
        var visibleTasks=taskList.filter(function(t){
          if(compFilterCategory!=="all"&&t.category!==compFilterCategory) return false;
          if(compFilterOwner!=="all"&&!(t.owners&&t.owners.indexOf(compFilterOwner)>=0)) return false;
          if(compFilterState!=="all"&&t.stateAbbrev!==compFilterState) return false;
          if(compFilterStatus==="all") return true;
          if(compFilterStatus==="issues") return t.status==="fail"||t.status==="missing"||t.status==="warn";
          return t.status===compFilterStatus;
        });
        var openTaskCount=0; for(var tci=0;tci<taskList.length;tci++) if(!taskList[tci].acked) openTaskCount++;
        function renderCheckCard(ck,cf2,conf2,showState){
          var plain=ck.basis==="regulation"?{t:"Breaks the law",c:"#dc2626",b:"#fef2f2"}:((ck.severity==="critical"&&ck.status!=="pass")?{t:"Urgent",c:"#dc2626",b:"#fef2f2"}:(ck.status==="pass"?{t:"On track",c:"#16a34a",b:"#f0fdf4"}:{t:"Worth checking",c:"#b45309",b:"#fffbeb"}));
          var dKey=cf2.configIndex+"::"+ck.lawId+"::"+(ck.minorAge||0);
          var dec=compDecisions[dKey]||{};
          var showBench=(ck.status==="fail"||ck.status==="warn")&&ck.basis!=="regulation"&&ck.orgsTotal>0;
          var opc=ck.orgsTotal>0?Math.round((ck.orgsOn||0)*100/ck.orgsTotal):0;
          var isSel=compSelected&&compSelected.ck===ck;
          return (
            <div key={dKey} className="rc-frow-wrap" style={{flex:"1 1 380px",minWidth:0,borderLeft:"3px solid "+plain.c,opacity:dec.acked?.6:1,boxShadow:isSel?"0 0 0 2px #4f46e5":"none"}}>
              <div className="rc-frow" onClick={function(){setCompSelected({ck:ck,cf:cf2,conf:conf2});}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:plain.c,flexShrink:0}}/>
                {showState&&<span className="rc-frow-state" title={conf2.assignedStateName||conf2.assignedState}>{conf2.assignedState}</span>}
                <span className="rc-frow-name" title={ck.lawName||ck.lawId}>{ck.lawName||ck.lawId}</span>
                {ck.minorAge>0&&<span style={{fontSize:10,color:"#64748b",fontWeight:700,flexShrink:0}}>Age {ck.minorAge}</span>}
                {ck.category&&<span className="rc-frow-cat">{ck.category}</span>}
                <span className="rc-frow-spacer"/>
                {showBench&&<span className="rc-frow-pct" title="operators in this state using this rule">{opc+"% ops"}</span>}
                <span className="rc-frow-tag" style={{color:plain.c,background:plain.b}}>{plain.t}</span>
                {dec.acked&&<span className="rc-frow-ack" title="handled">{"\u2713"}</span>}
                <i className="rc-chev">{"\u203a"}</i>
              </div>
            </div>
          );
        }
        function renderDrawer(){
          if(!compSelected) return null;
          var ck=compSelected.ck, cf2=compSelected.cf, conf2=compSelected.conf;
          var plain=ck.basis==="regulation"?{t:"Breaks the law",c:"#dc2626",b:"#fef2f2"}:((ck.severity==="critical"&&ck.status!=="pass")?{t:"Urgent",c:"#dc2626",b:"#fef2f2"}:(ck.status==="pass"?{t:"On track",c:"#16a34a",b:"#f0fdf4"}:{t:"Worth checking",c:"#b45309",b:"#fffbeb"}));
          var dKey=cf2.configIndex+"::"+ck.lawId+"::"+(ck.minorAge||0);
          var dec=compDecisions[dKey]||{};
          var showBench=(ck.status==="fail"||ck.status==="warn")&&ck.basis!=="regulation"&&ck.orgsTotal>0;
          var opc=ck.orgsTotal>0?Math.round((ck.orgsOn||0)*100/ck.orgsTotal):0;
          function closeDrawer(){setCompSelected(null);}
          return (
            <div onClick={closeDrawer} style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(15,23,42,.35)",zIndex:9998}}>
              <div onClick={function(e){e.stopPropagation();}} style={{position:"fixed",top:0,right:0,bottom:0,width:"min(460px,94vw)",background:"#fff",boxShadow:"-10px 0 34px rgba(15,23,42,.2)",zIndex:9999,display:"flex",flexDirection:"column"}}>
                <div style={{padding:"14px 16px",borderBottom:"1px solid #eef1f6",display:"flex",alignItems:"flex-start",gap:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
                      <span className="rc-frow-state">{conf2.assignedState}</span>
                      {ck.category&&<span className="rc-frow-cat">{ck.category}</span>}
                      <span className="rc-frow-tag" style={{color:plain.c,background:plain.b}}>{plain.t}</span>
                    </div>
                    <div style={{fontWeight:800,fontSize:16,color:"#0f172a",lineHeight:1.25}}>{(ck.lawName||ck.lawId)+(ck.minorAge>0?(" (Age "+ck.minorAge+")"):"")}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{(conf2.assignedStateName||conf2.assignedState)+(conf2.storeNumbers?(" \u00b7 "+conf2.storeNumbers.length+" store"+(conf2.storeNumbers.length!==1?"s":"")):"")}</div>
                  </div>
                  <button onClick={closeDrawer} style={{border:"none",background:"#f1f5f9",borderRadius:8,width:30,height:30,fontSize:18,lineHeight:1,cursor:"pointer",color:"#475569",flexShrink:0}}>{"\u00d7"}</button>
                </div>
                <div style={{padding:16,overflowY:"auto",flex:1}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10,fontSize:12}}>
                    <div style={{background:"#f8fafc",border:"1px solid #e8edf3",borderRadius:9,padding:"8px 10px"}}><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>Brand norm</div><div style={{color:"#334155"}}>{ck.expected||"-"}</div></div>
                    <div style={{background:"#f8fafc",border:"1px solid #e8edf3",borderRadius:9,padding:"8px 10px"}}><div style={{fontSize:9,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>Your setting</div><div style={{color:"#334155"}}>{ck.actual||"-"}</div></div>
                  </div>
                  {ck.issue&&<div style={{background:"rgba(220,38,38,.05)",borderLeft:"3px solid #dc2626",borderRadius:9,padding:"9px 11px",marginBottom:10,fontSize:12,color:"#7f1d1d",lineHeight:1.45}}>{ck.issue}</div>}
                  {showBench&&(
                    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
                      <div className="rc-statbox">{RingPc(opc,"#1d9e75")}<div><div className="pc">{opc+"%"}</div><div className="cap">{"of "+conf2.assignedState+" operators use this"}</div></div></div>
                      <div className="rc-statbox">{RingPc(ck.storePct||0,"#378add")}<div><div className="pc">{(ck.storePct||0)+"%"}</div><div className="cap">{"of "+conf2.assignedState+" stores use this"}</div></div></div>
                    </div>
                  )}
                  {ck.recommendation&&<div className="rc-comply" style={{marginBottom:12}}><span style={{fontWeight:800,color:"#16a34a",flexShrink:0}}>{"\u2713"}</span><div><span style={{fontWeight:700}}>To stay compliant: </span>{ck.recommendation}{ck.citation&&<a href={ck.citation} target="_blank" rel="noreferrer" style={{marginLeft:6,whiteSpace:"nowrap"}}>Official source</a>}</div></div>}
                  <div style={{borderTop:"1px solid #eef1f6",paddingTop:12}}>
                    <label style={{fontSize:12,color:"#475569",display:"flex",alignItems:"center",gap:6,cursor:"pointer",marginBottom:8}}><input type="checkbox" checked={!!dec.acked} onChange={function(e){toggleDecision(dKey,"acked",e.target.checked);}}/>Mark handled</label>
                    <input placeholder="Add a note..." value={dec.note||""} onChange={function(e){toggleDecision(dKey,"note",e.target.value);}} style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12,outline:"none"}}/>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        function renderCheckRow(ck,cf2,conf2,showState){
          var plain=ck.basis==="regulation"?{t:"Breaks the law",c:"#dc2626",b:"#fef2f2"}:((ck.severity==="critical"&&ck.status!=="pass")?{t:"Urgent",c:"#dc2626",b:"#fef2f2"}:(ck.status==="pass"?{t:"On track",c:"#16a34a",b:"#f0fdf4"}:{t:"Worth checking",c:"#b45309",b:"#fffbeb"}));
          var dKey=cf2.configIndex+"::"+ck.lawId+"::"+(ck.minorAge||0);
          var dec=compDecisions[dKey]||{};
          var showBench=(ck.status==="fail"||ck.status==="warn")&&ck.basis!=="regulation"&&ck.orgsTotal>0;
          var opc=ck.orgsTotal>0?Math.round((ck.orgsOn||0)*100/ck.orgsTotal):0;
          var isSel=compSelected&&compSelected.ck===ck;
          return (
            <tr key={dKey} className={isSel?"rc-trsel":""} onClick={function(){setCompSelected({ck:ck,cf:cf2,conf:conf2});}} style={{opacity:dec.acked?.5:1}}>
              <td className="rc-td-dot"><span style={{display:"inline-block",width:9,height:9,borderRadius:"50%",background:plain.c}}/></td>
              {showState&&<td><span className="rc-frow-state">{conf2.assignedState}</span></td>}
              <td className="rc-td-name"><span style={{fontWeight:600,color:"#0f172a"}}>{ck.lawName||ck.lawId}</span>{ck.minorAge>0&&<span style={{fontSize:10,color:"#64748b",fontWeight:700,marginLeft:6}}>Age {ck.minorAge}</span>}</td>
              <td className="rc-td-cur" title={ck.actual||""} style={{color:(ck.status==="fail"||ck.status==="missing")?"#b91c1c":(ck.status==="warn"?"#b45309":"#334155"),fontWeight:(ck.status==="fail"||ck.status==="missing")?600:400}}>{ck.actual||"—"}</td>
              <td className="rc-td-exp" title={ck.expected||""}>{ck.expected||"—"}</td>
              <td>{ck.category&&<span className="rc-frow-cat">{ck.category}</span>}</td>
              <td><span className="rc-frow-tag" style={{color:plain.c,background:plain.b}}>{plain.t}</span></td>
              <td className="rc-td-bench">{showBench?(
                <span style={{display:"inline-flex",alignItems:"center",gap:7}}>
                  <svg width="26" height="26" viewBox="0 0 36 36" style={{flexShrink:0}}>
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#eef1f6" strokeWidth="5"/>
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#1d9e75" strokeWidth="5" strokeLinecap="round" strokeDasharray={2*Math.PI*15} strokeDashoffset={(2*Math.PI*15)*(1-opc/100)} transform="rotate(-90 18 18)"/>
                  </svg>
                  <span style={{whiteSpace:"nowrap"}}><span style={{fontSize:12,fontWeight:700,color:"#0f172a"}}>{opc+"%"}</span><span style={{color:"#94a3b8",fontSize:10,marginLeft:4}}>{"("+(ck.orgsOn||0)+"/"+ck.orgsTotal+")"}</span></span>
                </span>
              ):"\u2014"}</td>
              <td className="rc-td-chev">{dec.acked?<span style={{color:"#16a34a",fontWeight:800}}>{"\u2713"}</span>:<span style={{color:"#cbd5e1"}}>{"\u203a"}</span>}</td>
            </tr>
          );
        }
        return (
          <div className="rc-dash">
            <style>{`.rc-dash{color:#0f172a;}.rc-dash .rc-label{font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:.05em;}.rc-dash select.rc-select{appearance:none;-webkit-appearance:none;-moz-appearance:none;background-color:#fff;background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 10 6%22%3E%3Cpath fill=%22%2394a3b8%22 d=%22M0 0l5 6 5-6z%22/%3E%3C/svg%3E');background-repeat:no-repeat;background-position:right 12px center;background-size:9px;border:1px solid #e2e8f0;border-radius:10px;padding:9px 32px 9px 13px;font-size:13px;font-weight:500;color:#1e293b;cursor:pointer;outline:none;transition:all .15s;max-width:260px;}.rc-dash select.rc-select:hover{border-color:#cbd5e1;}.rc-dash select.rc-select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12);}.rc-dash .rc-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid #e2e8f0;background:#fff;color:#334155;border-radius:10px;padding:9px 16px;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;line-height:1;white-space:nowrap;}.rc-dash .rc-btn:hover{border-color:#cbd5e1;background:#f8fafc;}.rc-dash .rc-btn:active{transform:translateY(1px);}.rc-dash .rc-btn-primary{background:#4f46e5;border-color:#4f46e5;color:#fff;}.rc-dash .rc-btn-primary:hover{background:#4338ca;border-color:#4338ca;}.rc-dash .rc-seg{display:inline-flex;border:1px solid #e2e8f0;border-radius:11px;background:#f1f5f9;padding:3px;gap:2px;}.rc-dash .rc-seg button{border:none;background:transparent;color:#64748b;padding:7px 16px;font-size:13px;font-weight:500;cursor:pointer;border-radius:8px;transition:all .12s;}.rc-dash .rc-seg button:hover{color:#1e293b;}.rc-dash .rc-seg button.active{background:#fff;color:#4f46e5;box-shadow:0 1px 3px rgba(15,23,42,.1);}.rc-dash .rc-pill{border:1px solid #e2e8f0;background:#fff;color:#475569;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:500;cursor:pointer;transition:all .12s;}.rc-dash .rc-pill:hover{border-color:#cbd5e1;background:#f8fafc;}.rc-dash .rc-chip{display:inline-flex;align-items:center;gap:6px;background:#eef2ff;border:1px solid #c7d2fe;color:#4338ca;border-radius:999px;padding:5px 12px;font-size:12px;font-weight:600;}.rc-dash .rc-chip button{border:none;background:transparent;cursor:pointer;color:#6366f1;font-weight:700;font-size:15px;line-height:1;padding:0;}.rc-dash .rc-card{background:#fff;border:1px solid #eaedf3;border-radius:14px;box-shadow:0 1px 3px rgba(15,23,42,.04);}.rc-dash .rc-tile{border-radius:14px;padding:13px 15px;border:1px solid transparent;}.rc-dash .rc-tile .lbl{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;opacity:.9;}.rc-dash .rc-tile .val{font-size:36px;font-weight:800;margin-top:4px;line-height:1.02;}.rc-dash .rc-tile .sub{font-size:11px;opacity:.85;margin-top:2px;}.rc-dash .t-neutral{background:#f8fafc;border-color:#eef1f6;color:#0f172a;}.rc-dash .t-info{background:#eff6ff;border-color:#dbeafe;color:#1d4ed8;}.rc-dash .t-warn{background:#fffbeb;border-color:#fde68a;color:#b45309;}.rc-dash .t-danger{background:#fef2f2;border-color:#fecaca;color:#dc2626;}.rc-dash .t-ok{background:#f0fdf4;border-color:#bbf7d0;color:#16a34a;}.rc-dash .rc-mapwrap{background:#fff;border:1px solid #eaedf3;border-radius:14px;padding:14px 16px;box-shadow:0 1px 3px rgba(15,23,42,.04);}.rc-dash .rc-map path{stroke:#fff;stroke-width:1;transition:opacity .15s;}.rc-dash .rc-map path:hover{opacity:.82;}.rc-dash .rc-legend{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:#64748b;margin-top:10px;}.rc-dash .rc-legend i{width:11px;height:11px;border-radius:3px;display:inline-block;margin-right:5px;vertical-align:-1px;}.rc-dash .rc-statecard{background:#fff;border:1px solid #eaedf3;border-left-width:4px;border-radius:10px;padding:12px 14px;}.rc-dash .rc-bar{height:8px;background:#f1f5f9;border-radius:5px;overflow:hidden;margin:8px 0 6px;}.rc-dash .rc-bar>span{display:block;height:100%;border-radius:5px;}.rc-dash .rc-gapcard{background:#fff;border:1px solid #eaedf3;border-left:4px solid #e2e8f0;border-radius:12px;padding:13px 15px;margin-bottom:10px;box-shadow:0 1px 2px rgba(15,23,42,.03);}.rc-dash .rc-comply{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:11px 13px;font-size:15px;line-height:1.45;color:#15803d;display:flex;gap:9px;align-items:flex-start;}.rc-dash .rc-comply a{color:#15803d;font-weight:600;}.rc-dash .rc-bench{font-size:12px;color:#475569;}.rc-dash .rc-statbox{flex:1;min-width:150px;background:#f8fafc;border:1px solid #eef1f6;border-radius:12px;padding:11px 13px;display:flex;align-items:center;gap:12px;}.rc-dash .rc-statbox .pc{font-size:23px;font-weight:800;line-height:1;color:#0f172a;}.rc-dash .rc-statbox .cap{font-size:12px;color:#64748b;margin-top:3px;line-height:1.3;}.rc-dash .rc-cmprow{display:flex;align-items:center;gap:10px;margin-bottom:9px;}.rc-dash .rc-cmprow .ab{width:28px;font-weight:800;font-size:13px;color:#0f172a;flex-shrink:0;}.rc-dash .rc-cmptrack{flex:1;height:20px;background:#f1f5f9;border-radius:6px;overflow:hidden;}.rc-dash .rc-cmptrack>span{display:flex;align-items:center;height:100%;border-radius:6px;padding-left:8px;font-size:11px;font-weight:800;color:#fff;white-space:nowrap;}.rc-dash .rc-cmpmeta{width:84px;text-align:right;font-size:12px;font-weight:600;color:#64748b;flex-shrink:0;}.rc-dash .rc-fgrid{display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start;}.rc-dash .rc-frow-wrap{background:#fff;border:1px solid #eef1f6;border-radius:8px;overflow:hidden;}.rc-dash .rc-frow{display:flex;align-items:center;gap:8px;padding:6px 10px;cursor:pointer;transition:background .12s;}.rc-dash .rc-frow:hover{background:#f8fafc;}.rc-dash .rc-frow-name{flex:0 1 auto;min-width:40px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;font-size:13px;color:#0f172a;}.rc-dash .rc-frow-cat{font-size:11px;color:#6366f1;background:rgba(99,102,241,.08);padding:1px 8px;border-radius:999px;font-weight:600;white-space:nowrap;flex-shrink:0;}.rc-dash .rc-frow-state{font-size:10px;font-weight:800;color:#475569;background:#eef2f7;border:1px solid #e3e9f0;border-radius:5px;padding:1px 6px;flex-shrink:0;letter-spacing:.02em;}.rc-dash .rc-tblwrap{border:1px solid #eef1f6;border-radius:10px;overflow:hidden;background:#fff;margin-bottom:8px;}.rc-dash table.rc-tbl{width:100%;border-collapse:collapse;font-size:13px;}.rc-dash .rc-tbl th{text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#94a3b8;font-weight:800;padding:7px 12px;background:#f8fafc;border-bottom:1px solid #eef1f6;white-space:nowrap;}.rc-dash .rc-tbl td{padding:7px 12px;border-bottom:1px solid #f3f5f9;vertical-align:middle;}.rc-dash .rc-tbl tbody tr{cursor:pointer;}.rc-dash .rc-tbl tbody tr:last-child td{border-bottom:none;}.rc-dash .rc-tbl tbody tr:hover{background:#f8fafc;}.rc-dash .rc-tbl tr.rc-trsel{background:#eef2ff;}.rc-dash .rc-td-dot{width:8px;padding-right:0;}.rc-dash .rc-td-name{max-width:360px;}.rc-dash .rc-td-bench{color:#475569;font-size:12px;white-space:nowrap;}.rc-dash .rc-td-chev{width:22px;text-align:right;font-size:15px;}.rc-dash .rc-td-cur,.rc-dash .rc-td-exp{font-size:12px;max-width:230px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.rc-dash .rc-td-exp{color:#0f766e;}.rc-dash .rc-frow-spacer{flex:1;min-width:6px;}.rc-dash .rc-frow-pct{font-size:11px;font-weight:700;color:#0f766e;background:#e1f5ee;padding:2px 9px;border-radius:999px;white-space:nowrap;flex-shrink:0;}.rc-dash .rc-frow-tag{font-size:11px;font-weight:700;padding:2px 10px;border-radius:999px;white-space:nowrap;flex-shrink:0;}.rc-dash .rc-frow-ack{color:#16a34a;font-weight:800;flex-shrink:0;}.rc-dash .rc-chev{font-style:normal;color:#94a3b8;font-size:17px;line-height:1;transition:transform .15s;flex-shrink:0;width:12px;text-align:center;}.rc-dash .rc-fdet{padding:9px 11px 11px;border-top:1px solid #f1f5f9;}`}</style>
            {(!hasResult||compShowUpload)&&(
              <Card>
                <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:220}}>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{hasResult?"Upload New Configuration File":"Step 1 - Upload Configuration File"}</div>
                    <div style={{fontSize:12,color:"#64748b"}}>Upload a CSV or Excel (.xlsx) export. Required columns: store_number, store_state, owner_name, assigned_labor_law_state, labor_law_id, Labor Law Name, is_active, current_setting, minor_age. Optional: owner_number, assigned_labor_law_state_name, deactivation_date. Header names must match exactly (comma- or tab-separated).</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <label style={{background:"#6366f1",color:"#fff",padding:"7px 14px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,border:"none"}}>
                      Choose File
                      <input type="file" accept=".csv,.tsv,.txt,.xlsx,.xls" onChange={handleComplianceFile} style={{display:"none"}}/>
                    </label>
                    {compFileName&&<span style={{fontSize:11,color:"#475569"}}>{compFileName}</span>}
                    {hasResult&&<button onClick={function(){setCompShowUpload(false);}} style={{border:"1px solid #e2e8f0",background:"#fff",borderRadius:6,padding:"6px 10px",fontSize:11,cursor:"pointer",color:"#475569"}}>Cancel</button>}
                  </div>
                </div>
                {compColReport&&<ColChecklist report={compColReport}/>}
                {compAgg&&!hasResult&&(
                  <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid #e2e8f0",display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:220}}>
                      <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>Step 2 - Run Compliance Check</div>
                      <div style={{fontSize:12,color:"#64748b"}}>{"Loaded "+compAgg.totalStores+" stores grouped into "+compAgg.configs.length+" distinct configuration(s) across "+(compAgg.distinctStates?compAgg.distinctStates.length:0)+" state(s) and "+(compAgg.distinctOwners?compAgg.distinctOwners.length:0)+" owner(s)."}</div>
                    </div>
                    <button onClick={runComplianceValidation} disabled={compValidating} style={{background:compValidating?"rgba(99,102,241,.4)":"#16a34a",color:"#fff",border:"none",borderRadius:6,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:compValidating?"not-allowed":"pointer"}}>{compValidating?"Evaluating...":"Run Compliance Check"}</button>
                  </div>
                )}
                {compValStatus&&<div style={{marginTop:10,padding:"7px 12px",borderRadius:6,fontSize:11,fontWeight:600,background:compSC,color:compST,border:"1px solid "+compSB}}>{compValStatus.msg}</div>}
              </Card>
            )}

            {hasResult&&!compShowUpload&&(
              <div style={{background:"linear-gradient(90deg,#1e1b4b 0%,#3730a3 100%)",borderRadius:8,padding:"10px 16px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",color:"#fff"}}>
                <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{fontSize:11,fontWeight:700,letterSpacing:".05em",textTransform:"uppercase",color:"#a5b4fc"}}>Compliance Results</div>
                  <span style={{fontSize:12}}><strong>{compAgg.totalStores}</strong> stores</span>
                  <span style={{fontSize:12,color:"#cbd5e1"}}>&middot;</span>
                  <span style={{fontSize:12}}><strong>{compAgg.distinctOwners?compAgg.distinctOwners.length:1}</strong> owner(s)</span>
                  <span style={{fontSize:12,color:"#cbd5e1"}}>&middot;</span>
                  <span style={{fontSize:12}}><strong>{compAgg.distinctStates?compAgg.distinctStates.length:1}</strong> state(s)</span>
                  <span style={{fontSize:12,color:"#cbd5e1"}}>&middot;</span>
                  <span style={{fontSize:12}}><strong>{totalChecks}</strong> checks</span>
                  <span style={{fontSize:12,color:"#cbd5e1"}}>&middot;</span>
                  <span style={{fontSize:12,color:"#fca5a5"}}><strong>{failCount+missingCount}</strong> issues</span>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={function(){setCompShowUpload(true);}} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.2)",borderRadius:5,padding:"5px 10px",fontSize:11,cursor:"pointer",fontWeight:600}}>New File</button>
                  <button onClick={runComplianceValidation} disabled={compValidating} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"1px solid rgba(255,255,255,.2)",borderRadius:5,padding:"5px 10px",fontSize:11,cursor:"pointer",fontWeight:600}}>{compValidating?"Evaluating...":"Re-run"}</button>
                </div>
              </div>
            )}
            {hasResult&&compValStatus&&<div style={{marginBottom:10,padding:"7px 12px",borderRadius:6,fontSize:11,fontWeight:600,background:compSC,color:compST,border:"1px solid "+compSB}}>{compValStatus.msg}</div>}

            {hasResult&&(
              <div>
                {anyFilter&&(
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap",background:"rgba(99,102,241,.06)",border:"1px solid rgba(99,102,241,.25)",borderRadius:6,padding:"6px 10px"}}>
                    <span style={{fontSize:11,fontWeight:800,color:"#4f46e5",textTransform:"uppercase",letterSpacing:".04em"}}>Filtered view</span>
                    <span style={{fontSize:11,color:"#475569"}}>{"showing "+fStoreCount+" store(s)"+(compFilterState!=="all"?(" \u00b7 "+compFilterState):"")+(compFilterOwner!=="all"?(" \u00b7 "+compFilterOwner):"")+(compFilterCategory!=="all"?(" \u00b7 "+compFilterCategory):"")}</span>
                    <button onClick={function(){setCompFilterCategory("all");setCompFilterOwner("all");setCompFilterState("all");}} style={{marginLeft:"auto",border:"1px solid #e2e8f0",background:"#fff",borderRadius:5,padding:"3px 10px",fontSize:10,cursor:"pointer",color:"#475569",fontWeight:700}}>Clear all filters</button>
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:14}}>
                  {[
                    {l:"Stores",v:fStoreCount,cls:"t-neutral"},
                    {l:"To fix",v:failCount+missingCount+warnCount,cls:(failCount+missingCount+warnCount)>0?"t-warn":"t-ok"},
                    {l:"Urgent",v:critCount,cls:critCount>0?"t-danger":"t-ok"},
                    {l:"On track",v:passPct+"%",cls:passPct>=90?"t-ok":(passPct>=70?"t-warn":"t-danger")}
                  ].map(function(k,ki){
                    return <div key={ki} className={"rc-tile "+k.cls}>
                      <div className="lbl">{k.l}</div>
                      <div className="val" title={String(k.v)}>{k.v}</div>
                    </div>;
                  })}
                </div>

                <div onClick={function(){setCompOverviewOpen(!compOverviewOpen);}} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 12px",background:"#fff",border:"1px solid #eaedf3",borderRadius:12,marginBottom:8,boxShadow:"0 1px 3px rgba(15,23,42,.04)"}}>
                  <span style={{fontStyle:"normal",color:"#94a3b8",fontSize:16,lineHeight:1,transform:compOverviewOpen?"rotate(90deg)":"none",transition:"transform .15s",display:"inline-block",width:11,textAlign:"center"}}>{"\u203a"}</span>
                  <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>Compliance overview</span>
                  <span style={{fontSize:12,color:"#64748b",marginLeft:"auto"}}>{compOverviewOpen?"map, peer comparison & categories":(stateHealthList.length>0?(stateHealthList.filter(function(x){return x.sev!=="ok";}).length+" of "+stateHealthList.length+" states need attention"):"map & categories")}</span>
                </div>
                {compOverviewOpen&&(
                <div>
                {stateHealthList.length>0&&(
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                      <div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>Compliance by state</div>
                      {stateHealthList.length>1&&(
                      <div className="rc-seg" style={{marginLeft:"auto"}}>
                        <button className={compStateView==="map"?"active":""} onClick={function(){setCompStateView("map");}}>Map view</button>
                        <button className={compStateView==="state"?"active":""} onClick={function(){setCompStateView("state");}}>By state</button>
                      </div>
                      )}
                    </div>
                    {(compStateView==="map"&&stateHealthList.length>1)?(
                      <div className="rc-mapwrap">
                        <div style={{display:"flex",gap:20,flexWrap:"wrap",alignItems:"flex-start"}}>
                          <div style={{flex:"1 1 300px",maxWidth:430}}>
                            <svg className="rc-map" viewBox="0 0 900 520" style={{width:"100%",height:"auto",display:"block"}}>
                              {Object.keys(STATE_PATHS).map(function(ab){
                                var sev=stateColorMap[ab];
                                var fill=sev==="crit"?"#ef4444":sev==="warn"?"#f59e0b":sev==="ok"?"#22c55e":"#eef1f6";
                                return <path key={ab} d={STATE_PATHS[ab]} fill={fill}><title>{ab+(sev?(" - "+(byStateH[ab]?byStateH[ab].gaps:0)+" to fix, "+(byStateH[ab]?byStateH[ab].stores:0)+" store(s)"):" - no stores")}</title></path>;
                              })}
                            </svg>
                            <div className="rc-legend">
                              <span><i style={{background:"#ef4444"}}/>Urgent</span>
                              <span><i style={{background:"#f59e0b"}}/>Worth checking</span>
                              <span><i style={{background:"#22c55e"}}/>On track</span>
                              <span><i style={{background:"#eef1f6"}}/>No stores</span>
                            </div>
                          </div>
                          <div style={{flex:"1 1 260px",minWidth:230}}>
                            <div style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".04em",marginBottom:12}}>Your states compared</div>
                            {stateHealthList.map(function(stx,sxi){
                              var ac=stx.sev==="crit"?"#ef4444":stx.sev==="warn"?"#f59e0b":"#22c55e";
                              return <div key={sxi} className="rc-cmprow">
                                <span className="ab">{stx.ab}</span>
                                <div className="rc-cmptrack"><span style={{width:Math.max(stx.health,14)+"%",background:ac}}>{stx.health+"%"}</span></div>
                                <span className="rc-cmpmeta">{stx.gaps>0?(stx.gaps+" to fix"):"all clear"}</span>
                              </div>;
                            })}
                          </div>
                        </div>
                      </div>
                    ):(
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(208px,1fr))",gap:12}}>
                        {stateHealthList.map(function(stx,sxi){
                          var ac=stx.sev==="crit"?"#ef4444":stx.sev==="warn"?"#f59e0b":"#22c55e";
                          var lab=stx.critical>0?(stx.gaps+" gaps \u00b7 "+stx.critical+" critical"):(stx.gaps>0?(stx.gaps+" gap"+(stx.gaps!==1?"s":"")):"All clear");
                          return <div key={sxi} className="rc-statecard" style={{borderLeftColor:ac}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:6}}>
                              <span style={{fontWeight:700,fontSize:14}}>{stx.ab}</span>
                              <span style={{fontSize:12,fontWeight:600,color:ac}}>{lab}</span>
                            </div>
                            <div className="rc-bar"><span style={{width:stx.health+"%",background:ac}}/></div>
                            <div style={{fontSize:12,color:"#64748b"}}>{stx.stores+" store"+(stx.stores!==1?"s":"")+(stx.top?(" \u00b7 top gap: "+stx.top):"")}</div>
                          </div>;
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Card style={{marginBottom:8,padding:"8px 12px"}}>
                  <div style={{fontWeight:700,fontSize:10,color:"#0f172a",textTransform:"uppercase",letterSpacing:".04em",marginBottom:5}}>Categories (click to filter)</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:5}}>
                    <div onClick={function(){setCompFilterCategory("all");}} style={{cursor:"pointer",background:compFilterCategory==="all"?"rgba(99,102,241,.12)":"#f8fafc",border:"1.5px solid "+(compFilterCategory==="all"?"#6366f1":"#e2e8f0"),borderRadius:4,padding:"5px 8px"}}>
                      <div style={{fontWeight:700,fontSize:10,color:"#0f172a"}}>All ({totalChecks})</div>
                      <div style={{fontSize:9,color:"#64748b",marginTop:1}}>{passCount}p / {failCount+missingCount}i</div>
                    </div>
                    {categoryNames.map(function(cat,cati){
                      var b=byCategory[cat];
                      var bad=b.fail+b.missing;
                      var rowColor=bad>0?"#dc2626":b.warn>0?"#d97706":"#16a34a";
                      var rowBg=bad>0?"rgba(220,38,38,.05)":b.warn>0?"rgba(217,119,6,.05)":"rgba(22,163,74,.05)";
                      var selected=compFilterCategory===cat;
                      return (
                        <div key={cati} onClick={function(){setCompFilterCategory(selected?"all":cat);}} style={{cursor:"pointer",background:selected?"rgba(99,102,241,.12)":rowBg,border:"1.5px solid "+(selected?"#6366f1":rowColor+"33"),borderRadius:4,padding:"5px 8px",borderLeft:"3px solid "+rowColor}}>
                          <div style={{fontWeight:700,fontSize:11,color:"#0f172a"}}>{cat}</div>
                          <div style={{fontSize:11,marginTop:2,fontWeight:800,color:rowColor}}>{(b.fail+b.missing+b.warn)>0?((b.fail+b.missing+b.warn)+" issue"+((b.fail+b.missing+b.warn)===1?"":"s")):"All clear"}</div>
                          <div style={{fontSize:9.5,color:"#64748b",marginTop:1}}>{b.total+" checks"}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
                </div>
                )}

                <Card style={{marginBottom:8,padding:"9px 12px"}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <div className="rc-seg">
                      <button className={compViewMode==="findings"?"active":""} onClick={function(){setCompViewMode("findings");}}>Findings</button>
                      <button className={compViewMode==="tasks"?"active":""} onClick={function(){setCompViewMode("tasks");}}>Tasks ({openTaskCount})</button>
                    </div>
                    {compViewMode==="findings"&&(
                      <select className="rc-select" value={compFilterStatus} onChange={function(e){setCompFilterStatus(e.target.value);}} title="Show which findings">
                        <option value="issues">Issues only</option>
                        <option value="fail">Fail</option>
                        <option value="missing">Missing</option>
                        <option value="warn">Warn</option>
                        <option value="pass">Pass</option>
                        <option value="all">All</option>
                      </select>
                    )}
                    {compViewMode==="findings"&&multiState&&(
                      <select className="rc-select" value={compFilterState} onChange={function(e){setCompFilterState(e.target.value);}} title="State">
                        <option value="all">All states</option>
                        {compAgg.distinctStates.map(function(st9,si){return <option key={si} value={st9}>{st9}</option>;})}
                      </select>
                    )}
                    {compViewMode==="findings"&&multiOwner&&(
                      <select className="rc-select" value={compFilterOwner} onChange={function(e){setCompFilterOwner(e.target.value);}} title="Owner">
                        <option value="all">All owners</option>
                        {compAgg.distinctOwners.map(function(o9,oi){return <option key={oi} value={o9}>{o9}</option>;})}
                      </select>
                    )}
                    {compViewMode==="findings"&&(
                      <select className="rc-select" value={compGroupBy} onChange={function(e){setCompGroupBy(e.target.value);}} title="Group by">
                        <option value="auto">Group: auto</option>
                        <option value="owner">Group: owner</option>
                        <option value="state">Group: state</option>
                        <option value="none">Flat: all issues</option>
                      </select>
                    )}
                    {compFilterCategory!=="all"&&<span className="rc-chip">{compFilterCategory} <button onClick={function(){setCompFilterCategory("all");}}>×</button></span>}
                    <div style={{flex:1}}/>
                    <button className="rc-btn rc-btn-primary" onClick={generateExecBriefPDF}>PDF brief</button>
                    <button className="rc-btn" onClick={exportTasksToCsv}>CSV</button>
                  </div>
                </Card>

                {compResult.summary&&(
                  <div style={{fontSize:12,color:"#64748b",lineHeight:1.4,margin:"0 2px 8px"}}>{compResult.summary}</div>
                )}
                {compViewMode==="findings"&&effectiveGroupBy!=="none"&&groupedFindings.length>1&&(
                  <div style={{display:"flex",gap:10,marginBottom:8,fontSize:12,alignItems:"center"}}>
                    <button onClick={function(){var n={}; groupedFindings.forEach(function(g){n[g.key]=true;}); setCompGroupOpen(n);}} style={{border:"none",background:"transparent",color:"#4f46e5",fontWeight:600,cursor:"pointer",padding:0}}>Expand all</button>
                    <span style={{color:"#cbd5e1"}}>|</span>
                    <button onClick={function(){var n={}; groupedFindings.forEach(function(g){n[g.key]=false;}); setCompGroupOpen(n);}} style={{border:"none",background:"transparent",color:"#64748b",fontWeight:600,cursor:"pointer",padding:0}}>Collapse all</button>
                    <span style={{color:"#94a3b8",marginLeft:"auto"}}>{groupedFindings.length+" "+(effectiveGroupBy==="owner"?"owners":"states")+" \u00b7 tap one to open"}</span>
                  </div>
                )}

                {compViewMode==="findings"&&effectiveGroupBy==="none"&&(
                  flatChecks.length>0
                    ? <div className="rc-tblwrap"><table className="rc-tbl"><thead><tr><th></th><th>State</th><th>Finding</th><th>Current setting</th><th>Expected</th><th>Category</th><th>Status</th><th>Operators using</th><th></th></tr></thead><tbody>{flatChecks.map(function(fc){return renderCheckRow(fc.ck,fc.cf,fc.conf,true);})}</tbody></table></div>
                    : <div style={{textAlign:"center",padding:"26px",color:"#94a3b8",fontSize:13}}>No findings match the current filter.</div>
                )}
                {compViewMode==="findings"&&effectiveGroupBy!=="none"&&groupedFindings.map(function(grp,gi){
                  var grpRows=[];
                  for(var ci2=0;ci2<grp.configs.length;ci2++){
                    var entry=grp.configs[ci2];
                    var vis=(entry.cf.checks||[]).filter(function(c){return passesFilter(c,entry.conf);});
                    for(var vj=0;vj<vis.length;vj++){ grpRows.push({ck:vis[vj],cf:entry.cf,conf:entry.conf}); }
                  }
                  if(grpRows.length===0) return null;
                  grpRows.sort(function(a,b){return flatRank(a.ck)-flatRank(b.ck);});
                  var gOpen=(grp.key in compGroupOpen)?compGroupOpen[grp.key]:true;
                  var showSt=effectiveGroupBy==="owner";
                  return (
                    <div key={gi} style={{marginBottom:8}}>
                      <div onClick={function(){var n=Object.assign({},compGroupOpen); n[grp.key]=!gOpen; setCompGroupOpen(n);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 11px",background:"linear-gradient(90deg,#1e293b 0%,#334155 100%)",borderRadius:gOpen?"7px 7px 0 0":"8px",color:"#fff",cursor:"pointer"}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                          <span style={{fontStyle:"normal",color:"#94a3b8",fontSize:15,lineHeight:1,transform:gOpen?"rotate(90deg)":"none",transition:"transform .15s",display:"inline-block",width:10,textAlign:"center"}}>{"\u203a"}</span>
                          <span style={{fontSize:9,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:".05em"}}>{effectiveGroupBy==="owner"?"Owner":"State"}</span>
                          <span style={{fontWeight:800,fontSize:13}}>{grp.key}</span>
                          <span style={{fontSize:10,color:"#cbd5e1"}}>{grp.totalStores+" stores"}</span>
                        </div>
                        <div style={{fontSize:11}}><span style={{color:"#fca5a5",fontWeight:700}}>{grp.totalIssues+" to fix"}</span></div>
                      </div>
                      {gOpen&&(
                        <div className="rc-tblwrap" style={{borderTop:"none",borderTopLeftRadius:0,borderTopRightRadius:0,marginBottom:0}}>
                          <table className="rc-tbl"><thead><tr><th></th>{showSt&&<th>State</th>}<th>Finding</th><th>Current setting</th><th>Expected</th><th>Category</th><th>Status</th><th>Operators using</th><th></th></tr></thead><tbody>{grpRows.map(function(fc){return renderCheckRow(fc.ck,fc.cf,fc.conf,showSt);})}</tbody></table>
                        </div>
                      )}
                    </div>
                  );
                })}

                {renderDrawer()}
                {compViewMode==="tasks"&&(
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,gap:6,flexWrap:"wrap"}}>
                      <div style={{fontSize:10,color:"#64748b",fontWeight:700,textTransform:"uppercase"}}>{visibleTasks.length+" tasks"}</div>
                      <button onClick={function(){bulkAcknowledgeVisibleTasks(visibleTasks);}} disabled={visibleTasks.length===0} style={{background:visibleTasks.length===0?"#e2e8f0":"#16a34a",color:"#fff",border:"none",borderRadius:4,padding:"4px 11px",fontSize:10,fontWeight:700,cursor:visibleTasks.length===0?"not-allowed":"pointer"}}>Acknowledge All Visible ({visibleTasks.length})</button>
                    </div>
                    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:5,overflow:"hidden"}}>
                      <div style={{display:"grid",gridTemplateColumns:"30px 60px 70px 100px 1fr 90px 80px 60px 200px",gap:0,background:"#1e293b",color:"#cbd5e1",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em",padding:"5px 0"}}>
                        <div style={{padding:"0 6px",textAlign:"center"}}>#</div>
                        <div style={{padding:"0 6px"}}>Status</div>
                        <div style={{padding:"0 6px"}}>Severity</div>
                        <div style={{padding:"0 6px"}}>Category</div>
                        <div style={{padding:"0 6px"}}>Action Item</div>
                        <div style={{padding:"0 6px"}}>Owner</div>
                        <div style={{padding:"0 6px"}}>State</div>
                        <div style={{padding:"0 6px",textAlign:"right"}}>Stores</div>
                        <div style={{padding:"0 6px"}}>Assignee / Note</div>
                      </div>
                      {visibleTasks.length===0&&<div style={{padding:"20px",textAlign:"center",color:"#94a3b8",fontSize:12}}>No tasks match the current filters.</div>}
                      {visibleTasks.map(function(t,ti){
                        var tStColor=t.status==="warn"?"#d97706":t.status==="fail"?"#dc2626":t.status==="missing"?"#991b1b":"#64748b";
                        var tSevColor=t.severity==="critical"?"#dc2626":t.severity==="high"?"#dc2626":t.severity==="medium"?"#d97706":t.severity==="low"?"#16a34a":"#64748b";
                        return (
                          <div key={ti} style={{display:"grid",gridTemplateColumns:"30px 60px 70px 100px 1fr 90px 80px 60px 200px",gap:0,borderTop:"1px solid #e8edf3",fontSize:10,padding:"6px 0",alignItems:"center",background:t.acked?"rgba(99,102,241,.04)":"#fff"}}>
                            <div style={{padding:"0 6px",textAlign:"center",color:"#94a3b8",fontWeight:700}}>{ti+1}</div>
                            <div style={{padding:"0 6px"}}><span style={{background:tStColor+"15",color:tStColor,padding:"1px 5px",borderRadius:3,fontSize:9,fontWeight:700,textTransform:"uppercase"}}>{t.status}</span></div>
                            <div style={{padding:"0 6px"}}><span style={{background:tSevColor+"15",color:tSevColor,padding:"1px 5px",borderRadius:3,fontSize:9,fontWeight:700,textTransform:"uppercase"}}>{t.severity}</span></div>
                            <div style={{padding:"0 6px",fontSize:9,color:"#6366f1",fontWeight:700}}>{t.category}</div>
                            <div style={{padding:"0 6px"}}>
                              <div style={{fontWeight:700,color:"#0f172a",fontSize:11}}>{t.lawName}</div>
                              {t.recommendation&&<div style={{fontSize:9,color:"#312e81",marginTop:1}}>{t.recommendation.length>140?t.recommendation.slice(0,140)+"...":t.recommendation}</div>}
                            </div>
                            <div style={{padding:"0 6px",fontSize:10,color:"#475569",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.owner}</div>
                            <div style={{padding:"0 6px",fontSize:10,color:"#475569"}}>{t.state}</div>
                            <div style={{padding:"0 6px",textAlign:"right",fontWeight:700,color:"#475569"}}>{t.storeCount}</div>
                            <div style={{padding:"0 6px",display:"flex",gap:3,alignItems:"center"}}>
                              <input type="checkbox" checked={t.acked} onChange={function(e){toggleDecision(t.key,"acked",e.target.checked);}}/>
                              <input placeholder="Assignee" value={t.assignee} onChange={function(e){var n=Object.assign({},compTaskAssignees); n[t.key]=e.target.value; setCompTaskAssignees(n);}} style={{width:65,padding:"2px 4px",border:"1px solid #e2e8f0",borderRadius:3,fontSize:9}}/>
                              <input placeholder="Note" value={t.note} onChange={function(e){toggleDecision(t.key,"note",e.target.value);}} style={{flex:1,padding:"2px 4px",border:"1px solid #e2e8f0",borderRadius:3,fontSize:9}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      </div>
    </div>
    </ErrorBoundary>
  );
}