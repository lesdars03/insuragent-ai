import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase, loadClients, addClient as dbAddClient, updateClient as dbUpdateClient, deleteClient as dbDeleteClient, loadPolicies, loadTeam } from "./supabase";

/* ═══════════════════════════════════════════
   INSURAGENT AI — Full SaaS Platform
   7 Modules: Command · Pipeline · Clients
   AI Copilot · Commission · Team · Prospect Bot
   ═══════════════════════════════════════════ */

const STAGES=["Lead","Contacted","Needs Analysis","Proposal Sent","Closing","Won","Lost"];
const SC={Lead:"#6d28d9",Contacted:"#7c3aed","Needs Analysis":"#2563eb","Proposal Sent":"#d97706",Closing:"#ea580c",Won:"#059669",Lost:"#dc2626"};
const PRODUCTS=["PRULife Your Legacy","PRULink Exact Protector","PRULink Assurance Account Plus","Sun Fit and Well","Sun Maxilink Prime","Sun Starter","Sun Smarter Life","PRUTerm Lindungi","Sun Brighter Life"];
const TAGS=["OFW Family","Young Professional","Business Owner","Senior","Student","Parent","Couple"];
const gid=()=>Math.random().toString(36).substr(2,9);
const fmtD=d=>d?new Date(d).toLocaleDateString("en-PH",{month:"short",day:"numeric"}):"—";
const daysFrom=d=>d?Math.ceil((new Date(d)-new Date())/(864e5)):null;
const P=n=>n>0?`₱${n.toLocaleString()}`:"—";
const pct=(a,b)=>b>0?Math.round(a/b*100):0;

// Commission rates for PH insurance
const COMM_RATES={year1:0.30,year2:0.15,renewal:0.05};

// ─── Demo Data ───
const DEMO_CLIENTS=[
  {id:gid(),name:"Maria Santos",phone:"+63 917 123 4567",email:"maria.s@gmail.com",stage:"Proposal Sent",product:"Sun Maxilink Prime",premium:3000,tag:"Young Professional",notes:"VUL with education fund rider. Comparing with Insular Life. Payday 15th & 30th.",nextFollowUp:new Date(Date.now()+2*864e5).toISOString().split("T")[0],created:"2026-02-15",lastContact:"2026-03-28",closeProb:65,agent:"You"},
  {id:gid(),name:"Juan dela Cruz",phone:"+63 918 987 6543",email:"juan.dc@yahoo.com",stage:"Needs Analysis",product:"PRULink Exact Protector",premium:2500,tag:"Parent",notes:"3 kids. Wife is teacher. Household income ~60k/month.",nextFollowUp:new Date(Date.now()+1*864e5).toISOString().split("T")[0],created:"2026-03-01",lastContact:"2026-03-25",closeProb:45,agent:"You"},
  {id:gid(),name:"Angela Reyes",phone:"+63 919 555 8888",email:"angela.r@outlook.com",stage:"Lead",product:"",premium:0,tag:"OFW Family",notes:"Husband in Dubai. Wants family protection.",nextFollowUp:new Date(Date.now()-1*864e5).toISOString().split("T")[0],created:"2026-03-20",lastContact:"",closeProb:20,agent:"You"},
  {id:gid(),name:"Roberto Lim",phone:"+63 920 111 2222",email:"rob.lim@gmail.com",stage:"Won",product:"Sun Fit and Well",premium:5000,tag:"Business Owner",notes:"Policy issued. Owns restaurant chain. Interested in group insurance.",nextFollowUp:new Date(Date.now()+30*864e5).toISOString().split("T")[0],created:"2026-01-10",lastContact:"2026-03-15",closeProb:100,agent:"You"},
  {id:gid(),name:"Patricia Go",phone:"+63 921 333 4444",email:"patgo@gmail.com",stage:"Closing",product:"PRULife Your Legacy",premium:4500,tag:"Senior",notes:"Ready to sign. Medical exam April 3.",nextFollowUp:new Date(Date.now()+3*864e5).toISOString().split("T")[0],created:"2026-02-28",lastContact:"2026-03-29",closeProb:85,agent:"You"},
  {id:gid(),name:"Mark Tan",phone:"+63 922 666 7777",email:"mark.tan@hotmail.com",stage:"Contacted",product:"",premium:0,tag:"Student",notes:"UST senior. Budget ~1000/month max.",nextFollowUp:new Date(Date.now()+5*864e5).toISOString().split("T")[0],created:"2026-03-18",lastContact:"2026-03-22",closeProb:25,agent:"Reina Bautista"},
  {id:gid(),name:"Diego Aquino",phone:"+63 917 444 5555",email:"diego.a@gmail.com",stage:"Proposal Sent",product:"PRULink Assurance Account Plus",premium:3500,tag:"Parent",notes:"Comparing with Insular Life and AXA. BPO couple.",nextFollowUp:new Date(Date.now()).toISOString().split("T")[0],created:"2026-03-05",lastContact:"2026-03-27",closeProb:50,agent:"You"},
  {id:gid(),name:"Sofia Mendoza",phone:"+63 923 888 1111",email:"sofia.m@gmail.com",stage:"Lead",product:"",premium:0,tag:"Couple",notes:"Newly married. Mid-20s. Reached out via TikTok.",nextFollowUp:new Date(Date.now()+2*864e5).toISOString().split("T")[0],created:"2026-03-28",lastContact:"",closeProb:15,agent:"Reina Bautista"},
  {id:gid(),name:"Carlo Villanueva",phone:"+63 918 222 3333",email:"carlo.v@gmail.com",stage:"Won",product:"PRULink Exact Protector",premium:3000,tag:"Young Professional",notes:"IT developer. Closed last month. Referred 2 friends.",nextFollowUp:new Date(Date.now()+60*864e5).toISOString().split("T")[0],created:"2025-12-05",lastContact:"2026-03-01",closeProb:100,agent:"James Reyes"},
  {id:gid(),name:"Lea Gonzales",phone:"+63 919 444 6666",email:"lea.g@yahoo.com",stage:"Closing",product:"Sun Starter",premium:1500,tag:"Student",notes:"Graduating nurse. Starting salary expected 25k.",nextFollowUp:new Date(Date.now()+1*864e5).toISOString().split("T")[0],created:"2026-02-20",lastContact:"2026-03-28",closeProb:75,agent:"James Reyes"},
  {id:gid(),name:"Ramon Pascual",phone:"+63 920 777 8888",email:"ramon.p@gmail.com",stage:"Needs Analysis",product:"Sun Maxilink Prime",premium:4000,tag:"Business Owner",notes:"Owns trucking company. 15 employees. Wants group + personal.",nextFollowUp:new Date(Date.now()+4*864e5).toISOString().split("T")[0],created:"2026-03-10",lastContact:"2026-03-26",closeProb:55,agent:"Reina Bautista"},
];

const DEMO_TEAM=[
  {id:"you",name:"You (Agent)",role:"Senior Financial Advisor",avatar:"👤",clients:0,won:0,pipeline:0,target:15,mdrt:false},
  {id:"reina",name:"Reina Bautista",role:"Financial Advisor",avatar:"👩",clients:0,won:0,pipeline:0,target:12,mdrt:false},
  {id:"james",name:"James Reyes",role:"Financial Advisor",avatar:"👨",clients:0,won:0,pipeline:0,target:12,mdrt:true},
];

const AGENT_MAP={"You":"you","Reina Bautista":"reina","James Reyes":"james"};

// Demo existing policies for commission calc
const EXISTING_POLICIES=[
  {client:"Roberto Lim",product:"Sun Fit and Well",annualPremium:60000,yearIssued:2026,month:3},
  {client:"Carlo Villanueva",product:"PRULink Exact Protector",annualPremium:36000,yearIssued:2026,month:2},
  {client:"Ana Torres",product:"Sun Maxilink Prime",annualPremium:48000,yearIssued:2025,month:6},
  {client:"Ben Cruz",product:"PRULife Your Legacy",annualPremium:72000,yearIssued:2025,month:1},
  {client:"Clara Sy",product:"Sun Starter",annualPremium:18000,yearIssued:2024,month:8},
];

// Prospect chatbot demo conversation
const PROSPECT_DEMO=[
  {role:"bot",text:"Kumusta! 👋 Welcome to InsurAgent. I'm here to help you understand insurance in a simple, no-pressure way.\n\nWhat would you like to learn about?\n\n🛡️ Life Insurance basics\n💰 How much coverage do I need?\n📊 VUL vs Traditional insurance\n👨‍👩‍👧‍👦 Plans for OFW families\n🎓 Education fund options"},
];

// ─── AI Caller ───
async function callAI(sys,msg){
  try{
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[{role:"user",content:msg}]})});
    const d=await r.json();
    return d.content?.map(b=>b.text||"").join("\n")||"No response.";
  }catch(e){return "AI temporarily unavailable. Please retry.";}
}

const AI_SYS=`You are InsurAgent AI, an expert copilot for insurance agents in the Philippines selling Pru Life UK and Sun Life products. You speak professional Taglish when drafting client messages, clear English for coaching.
Key context: PH insurance penetration 1.79% GDP, 25% financial literacy (lowest ASEAN). Common objections: "malas", can't afford, trust issues, "may PhilHealth naman". Top products: VUL, traditional life, term. Agents earn commission-only. OFW families key segment. Payday 15th/30th. Always be specific and actionable.`;

const PROSPECT_SYS=`You are a friendly, educational insurance chatbot for Filipino prospects. You speak warm Taglish (mix of Tagalog and English). Your goal is to educate, NOT hard-sell.
Rules:
- Explain insurance concepts simply using Filipino analogies (palengke, jeepney, bayanihan)
- Never pressure. Always say "no rush, take your time"
- Use emojis naturally but not excessively
- If they seem interested, offer to connect them with a licensed advisor
- Address common Filipino concerns: "malas" superstition, affordability, PhilHealth adequacy
- Keep responses concise (3-5 sentences max unless explaining a concept)
- Products available: Pru Life UK and Sun Life Philippines
- For VUL, explain it as "insurance + investment in one"
- Always be honest about costs and limitations`;

// ─── Icons ───
const I=({n,s=16,c="currentColor"})=>{
const d={
search:<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
plus:<><path d="M12 5v14M5 12h14"/></>,
user:<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
phone:<><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></>,
mail:<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></>,
calendar:<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
edit:<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
trash:<><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
x:<><path d="M18 6L6 18M6 6l12 12"/></>,
bell:<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
chart:<><path d="M18 20V10M12 20V4M6 20v-6"/></>,
grid:<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
list:<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
check:<><path d="M20 6L9 17l-5-5"/></>,
alert:<><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></>,
send:<><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></>,
bot:<><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/><path d="M8 11V7a4 4 0 018 0v4"/><path d="M12 2v2"/></>,
zap:<><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></>,
target:<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
brain:<><path d="M12 2a5 5 0 015 5v1a3 3 0 012 5.13V17a3 3 0 01-3 3h-1.5M12 2a5 5 0 00-5 5v1a3 3 0 00-2 5.13V17a3 3 0 003 3h1.5M12 2v20"/></>,
msg:<><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
trend:<><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
copy:<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>,
star:<><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></>,
clock:<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
activity:<><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>,
layers:<><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
dollar:<><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
users:<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
globe:<><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
award:<><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></>,
bar:<><path d="M12 20V10M18 20V4M6 20v-4"/></>,
};
return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d[n]}</svg>;
};

// ─── Sub Components ───
const Modal=({open,onClose,title,ch,wide})=>{if(!open)return null;return <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.55)",backdropFilter:"blur(8px)",animation:"fi .2s"}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:"#0c0f1a",borderRadius:18,width:"92%",maxWidth:wide?820:560,maxHeight:"90vh",overflow:"auto",border:"1px solid rgba(255,255,255,.06)",boxShadow:"0 30px 80px rgba(0,0,0,.6)",animation:"su .25s"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,.06)"}}><h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#e2e8f0"}}>{title}</h3><button onClick={onClose} style={{background:"rgba(255,255,255,.06)",border:"none",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><I n="x" s={14} c="#94a3b8"/></button></div><div style={{padding:"16px 20px 20px"}}>{ch}</div></div></div>;};
const Pill=({stage,sm})=><span style={{display:"inline-flex",alignItems:"center",gap:4,padding:sm?"1px 7px":"3px 10px",borderRadius:16,fontSize:sm?9:11,fontWeight:700,background:(SC[stage]||"#888")+"22",color:SC[stage]||"#888"}}><span style={{width:5,height:5,borderRadius:"50%",background:SC[stage]}}/>{stage}</span>;
const Bdg=({ch,color="#7c3aed"})=><span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:12,background:color+"1a",color,letterSpacing:".03em"}}>{ch}</span>;
const Prob=({v})=>{const c=v>=70?"#059669":v>=40?"#d97706":"#dc2626";return <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:40,height:4,borderRadius:4,background:"rgba(255,255,255,.06)",overflow:"hidden"}}><div style={{width:`${v}%`,height:"100%",borderRadius:4,background:c,transition:"width .5s"}}/></div><span style={{fontSize:9,fontWeight:700,color:c,fontFamily:"'JetBrains Mono',monospace"}}>{v}%</span></div>;};
const Stat=({label,value,sub,icon,color})=><div style={{background:"rgba(255,255,255,.02)",borderRadius:12,padding:"14px 16px",border:"1px solid rgba(255,255,255,.04)",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:-8,right:-8,width:50,height:50,borderRadius:"50%",background:color+"08"}}/><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}><div style={{width:26,height:26,borderRadius:7,background:color+"14",display:"flex",alignItems:"center",justifyContent:"center"}}><I n={icon} s={13} c={color}/></div><span style={{fontSize:9,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".06em"}}>{label}</span></div><div style={{fontSize:20,fontWeight:900,color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace"}}>{value}</div><div style={{fontSize:10,color:"#64748b",marginTop:1}}>{sub}</div></div>;

// ═══ MAIN APP ═══
export default function App(){
const [clients,setClients]=useState(DEMO_CLIENTS);
const [view,setView]=useState("command");
const [search,setSearch]=useState("");
const [sel,setSel]=useState(null);
const [modalOpen,setModalOpen]=useState(false);
const [editCl,setEditCl]=useState(null);
const [copIn,setCopIn]=useState("");
const [copMsgs,setCopMsgs]=useState([{role:"ai",text:"Magandang araw! 🇵🇭 I'm your InsurAgent AI copilot.\n\n• **Draft follow-up messages** — tell me which client\n• **Sales coaching** — ask about any deal\n• **Objection handling** — \"client says malas\"\n• **Product recommendation** — describe the situation\n• **Commission forecast** — \"project my earnings\"\n• **Team insights** — \"how is Reina performing?\"\n\nTry anything!"}]);
const [aiLoad,setAiLoad]=useState(false);
const [proMsgs,setProMsgs]=useState(PROSPECT_DEMO);
const [proIn,setProIn]=useState("");
const [proLoad,setProLoad]=useState(false);
const [copiedId,setCopiedId]=useState(null);
const chatRef=useRef(null);
const proRef=useRef(null);

const [autoActions]=useState([
  {id:gid(),type:"follow_up",client:"Angela Reyes",action:"Drafted Viber message for overdue follow-up",status:"pending",time:"2 min ago",draft:"Hi po Angela! 😊 Kamusta na po kayo? Follow up lang po regarding sa insurance plan natin for your family. Since nasa Dubai po si Sir, extra important po na may protection ang pamilya dito. May I schedule a quick call po this week? 🙏"},
  {id:gid(),type:"coaching",client:"Diego Aquino",action:"Close probability dropped — send comparison sheet",status:"pending",time:"15 min ago",draft:"Diego is comparing with 2 competitors. Send side-by-side comparison: (1) fund performance last 3 years, (2) rider flexibility, (3) online servicing. Include wife in next meeting — she handles finances."},
  {id:gid(),type:"education",client:"Mark Tan",action:"Generated starter insurance explainer for student budget",status:"pending",time:"1 hr ago",draft:"Hey Mark! 📱 Alam mo ba na for less than 2 milk teas per week, may life insurance + investment ka na? 🍵🍵\n\n✅ ₱500-1000/month lang\n✅ Life insurance + investment\n✅ Pwedeng i-withdraw in the future\n\nInterested to learn more? 😊"},
  {id:gid(),type:"alert",client:"Patricia Go",action:"Medical exam in 5 days — send prep reminder",status:"pending",time:"3 hrs ago",draft:"Good day po Ma'am Patricia! 😊 Reminder po — medical exam on April 3.\n\n1. Fasting 8-12 hrs before\n2. Bring valid ID + eyeglasses\n3. List of current medications\n4. Hydrate well day before\n\nAfter the exam, we finalize your PRULife Your Legacy na po! 🙏"},
]);
const [actions,setActions]=useState(autoActions);

useEffect(()=>{chatRef.current?.scrollIntoView({behavior:"smooth"})},[copMsgs]);
useEffect(()=>{proRef.current?.scrollIntoView({behavior:"smooth"})},[proMsgs]);

// ─── Load data from Supabase on startup ───
const [dbConnected,setDbConnected]=useState(false);
const [dbLoading,setDbLoading]=useState(true);
useEffect(()=>{
  async function init(){
    if(!supabase){setDbLoading(false);return;}
    try{
      const dbClients=await loadClients();
      if(dbClients&&dbClients.length>0){
        // Map database columns (snake_case) to app format (camelCase)
        const mapped=dbClients.map(c=>({
          id:c.id,name:c.name,phone:c.phone||"",email:c.email||"",
          stage:c.stage||"Lead",product:c.product||"",premium:c.premium||0,
          tag:c.tag||"",notes:c.notes||"",
          nextFollowUp:c.next_follow_up||"",created:c.created||"",
          lastContact:c.last_contact||"",closeProb:c.close_prob||15,
          agent:c.agent||"You"
        }));
        setClients(mapped);
      }
      setDbConnected(true);
    }catch(e){console.error("DB init error:",e);}
    setDbLoading(false);
  }
  init();
},[]);

// ─── Computed ───
const overdues=useMemo(()=>clients.filter(c=>c.nextFollowUp&&!["Won","Lost"].includes(c.stage)&&daysFrom(c.nextFollowUp)<0),[clients]);
const todays=useMemo(()=>clients.filter(c=>c.nextFollowUp&&!["Won","Lost"].includes(c.stage)&&daysFrom(c.nextFollowUp)===0),[clients]);
const active=useMemo(()=>clients.filter(c=>!["Won","Lost"].includes(c.stage)),[clients]);
const pipeVal=useMemo(()=>active.reduce((s,c)=>s+(c.premium||0),0),[active]);
const wonCl=useMemo(()=>clients.filter(c=>c.stage==="Won"),[clients]);
const wonVal=useMemo(()=>wonCl.reduce((s,c)=>s+(c.premium||0),0),[wonCl]);
const avgProb=useMemo(()=>active.length>0?Math.round(active.reduce((s,c)=>s+(c.closeProb||0),0)/active.length):0,[active]);
const pending=actions.filter(a=>a.status==="pending").length;

// Team computed
const teamStats=useMemo(()=>{
  return DEMO_TEAM.map(t=>{
    const agentName=t.id==="you"?"You":t.name.split(" ")[0]+" "+t.name.split(" ").slice(1).join(" ");
    const myCl=clients.filter(c=>{
      if(t.id==="you") return c.agent==="You";
      return c.agent===t.name;
    });
    const myWon=myCl.filter(c=>c.stage==="Won");
    const myActive=myCl.filter(c=>!["Won","Lost"].includes(c.stage));
    const pipeline=myActive.reduce((s,c)=>s+(c.premium||0),0);
    return {...t,clients:myCl.length,won:myWon.length,active:myActive.length,pipeline,wonValue:myWon.reduce((s,c)=>s+(c.premium||0),0)};
  });
},[clients]);

// Commission forecast
const commForecast=useMemo(()=>{
  const currentYear=2026;
  // Existing policies
  let yr1=0,yr2=0,renewal=0;
  EXISTING_POLICIES.forEach(p=>{
    const age=currentYear-p.yearIssued;
    if(age===0) yr1+=p.annualPremium;
    else if(age===1) yr2+=p.annualPremium;
    else renewal+=p.annualPremium;
  });
  // Pipeline projected (weighted by close probability)
  const projected=active.reduce((s,c)=>s+((c.premium||0)*12*(c.closeProb/100)),0);

  const commYr1=yr1*COMM_RATES.year1;
  const commYr2=yr2*COMM_RATES.year2;
  const commRenewal=renewal*COMM_RATES.renewal;
  const commProjected=projected*COMM_RATES.year1;
  const total=commYr1+commYr2+commRenewal;
  const totalWithPipeline=total+commProjected;

  // Monthly breakdown
  const monthly=[];
  const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for(let i=0;i<12;i++){
    const base=Math.round(total/12);
    const pipe=i>=3?Math.round(commProjected/9):0; // pipeline kicks in Q2
    monthly.push({month:months[i],base,pipeline:pipe,total:base+pipe});
  }

  return {yr1,yr2,renewal,commYr1,commYr2,commRenewal,projected,commProjected,total,totalWithPipeline,monthly};
},[active]);

// ─── Handlers ───
const sendCopilot=useCallback(async()=>{
  if(!copIn.trim()||aiLoad) return;
  const msg=copIn.trim(); setCopIn(""); setCopMsgs(p=>[...p,{role:"user",text:msg}]); setAiLoad(true);
  const ctx=clients.map(c=>`- ${c.name}|${c.stage}|${c.product||"none"}|₱${c.premium}/mo|${c.tag}|${c.closeProb}%|Agent:${c.agent}|Notes:${c.notes}`).join("\n");
  const commCtx=`Commission forecast: Year1 policies ₱${commForecast.yr1} (30% = ₱${commForecast.commYr1}), Year2 ₱${commForecast.yr2} (15%), Renewals ₱${commForecast.renewal} (5%). Total existing: ₱${commForecast.total}/yr. Pipeline projected: ₱${Math.round(commForecast.commProjected)}/yr.`;
  const teamCtx=teamStats.map(t=>`${t.name}: ${t.won} won, ${t.active} active, pipeline ₱${t.pipeline}/mo`).join("; ");
  const r=await callAI(AI_SYS,`Pipeline:\n${ctx}\n\n${commCtx}\nTeam: ${teamCtx}\n\nRequest: ${msg}`);
  setCopMsgs(p=>[...p,{role:"ai",text:r}]); setAiLoad(false);
},[copIn,aiLoad,clients,commForecast,teamStats]);

const sendProspect=useCallback(async()=>{
  if(!proIn.trim()||proLoad) return;
  const msg=proIn.trim(); setProIn(""); setProMsgs(p=>[...p,{role:"user",text:msg}]); setProLoad(true);
  const history=proMsgs.slice(-6).map(m=>m.role==="user"?`Human: ${m.text}`:`Assistant: ${m.text}`).join("\n");
  const r=await callAI(PROSPECT_SYS,`${history}\nHuman: ${msg}`);
  setProMsgs(p=>[...p,{role:"bot",text:r}]); setProLoad(false);
},[proIn,proLoad,proMsgs]);

const approveAct=id=>setActions(p=>p.map(a=>a.id===id?{...a,status:"approved"}:a));
const dismissAct=id=>setActions(p=>p.map(a=>a.id===id?{...a,status:"dismissed"}:a));
const copyTxt=(id,t)=>{navigator.clipboard?.writeText(t);setCopiedId(id);setTimeout(()=>setCopiedId(null),2000);};
const handleSave=async(c)=>{
  if(editCl?.id){
    const updated={...c,id:editCl.id};
    setClients(p=>p.map(x=>x.id===editCl.id?updated:x));
    if(dbConnected){
      await dbUpdateClient(editCl.id,{name:c.name,phone:c.phone,email:c.email,stage:c.stage,product:c.product,premium:c.premium,tag:c.tag,notes:c.notes,next_follow_up:c.nextFollowUp||null,last_contact:c.lastContact||null,close_prob:c.closeProb||15,agent:c.agent||"You"});
    }
  }else{
    const newId=gid();
    const newClient={...c,id:newId,closeProb:c.closeProb||15,agent:c.agent||"You",created:new Date().toISOString().split("T")[0]};
    setClients(p=>[...p,newClient]);
    if(dbConnected){
      await dbAddClient({id:newId,name:c.name,phone:c.phone,email:c.email,stage:c.stage,product:c.product,premium:c.premium,tag:c.tag,notes:c.notes,next_follow_up:c.nextFollowUp||null,created:newClient.created,last_contact:c.lastContact||null,close_prob:c.closeProb||15,agent:"You"});
    }
  }
  setModalOpen(false);setEditCl(null);
};

const inp={width:"100%",padding:"9px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",fontSize:13,fontFamily:"'Outfit',sans-serif",color:"#e2e8f0",background:"rgba(255,255,255,.04)",outline:"none",boxSizing:"border-box"};

const css=`
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes su{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes glow{0%,100%{box-shadow:0 0 6px rgba(124,58,237,.12)}50%{box-shadow:0 0 18px rgba(124,58,237,.25)}}
@keyframes typing{0%{opacity:.3}50%{opacity:1}100%{opacity:.3}}
@keyframes slideIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:8px}
.hov:hover{background:rgba(255,255,255,.04)!important}
.card-h:hover{border-color:rgba(124,58,237,.25)!important;transform:translateY(-1px)}
input:focus,select:focus,textarea:focus{border-color:#7c3aed!important;outline:none}
`;

const NAV=[
  {key:"command",icon:"zap",label:"Command"},
  {key:"pipeline",icon:"layers",label:"Pipeline"},
  {key:"clients",icon:"user",label:"Clients"},
  {key:"copilot",icon:"brain",label:"AI Chat"},
  {key:"commission",icon:"dollar",label:"Earnings"},
  {key:"team",icon:"users",label:"Team"},
  {key:"prospect",icon:"globe",label:"Prospect Bot"},
];

return <div style={{fontFamily:"'Outfit',sans-serif",background:"#060812",color:"#e2e8f0",minHeight:"100vh",display:"flex"}}>
<style>{css}</style>

{/* ═══ SIDEBAR ═══ */}
<div style={{width:64,background:"#0a0d1a",borderRight:"1px solid rgba(255,255,255,.04)",display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 0",position:"fixed",top:0,bottom:0,zIndex:50}}>
  <div style={{width:36,height:36,borderRadius:11,background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20,boxShadow:"0 4px 16px rgba(124,58,237,.3)"}}><I n="bot" s={18} c="#fff"/></div>
  {NAV.map(v=><button key={v.key} onClick={()=>setView(v.key)} title={v.label} style={{width:42,height:42,borderRadius:10,border:"none",cursor:"pointer",marginBottom:4,background:view===v.key?"rgba(124,58,237,.15)":"transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,transition:"all .15s",position:"relative"}}>
    <I n={v.icon} s={16} c={view===v.key?"#a78bfa":"#475569"}/>
    <span style={{fontSize:7,fontWeight:600,color:view===v.key?"#a78bfa":"#475569"}}>{v.label}</span>
    {v.key==="command"&&pending>0&&<span style={{position:"absolute",top:3,right:3,width:13,height:13,borderRadius:"50%",background:"#dc2626",fontSize:7,fontWeight:800,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",animation:"pulse 2s infinite"}}>{pending}</span>}
  </button>)}
  <div style={{flex:1}}/>
  <button onClick={()=>{setEditCl(null);setModalOpen(true)}} style={{width:36,height:36,borderRadius:10,border:"1px dashed rgba(255,255,255,.1)",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="plus" s={16} c="#475569"/></button>
</div>

{/* ═══ MAIN ═══ */}
<div style={{marginLeft:64,flex:1,minHeight:"100vh"}}>

{/* Top Bar */}
<div style={{padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.04)",background:"rgba(10,13,26,.85)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:40}}>
  <div>
    <h1 style={{fontSize:16,fontWeight:800,background:"linear-gradient(135deg,#a78bfa,#60a5fa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.2}}>InsurAgent AI</h1>
    <span style={{fontSize:10,color:"#475569",fontWeight:500}}>Autonomous Insurance Copilot • SaaS Platform {dbConnected?<span style={{color:"#059669",marginLeft:6}}>● Cloud synced</span>:dbLoading?<span style={{color:"#d97706",marginLeft:6}}>● Connecting...</span>:<span style={{color:"#64748b",marginLeft:6}}>○ Local mode</span>}</span>
  </div>
  <div style={{display:"flex",alignItems:"center",gap:8}}>
    {(overdues.length>0||todays.length>0)&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:8,background:overdues.length>0?"rgba(220,38,38,.1)":"rgba(217,119,6,.1)",border:`1px solid ${overdues.length>0?"rgba(220,38,38,.2)":"rgba(217,119,6,.2)"}`}}>
      <span style={{animation:"pulse 2s infinite"}}><I n="bell" s={12} c={overdues.length>0?"#ef4444":"#f59e0b"}/></span>
      <span style={{fontSize:10,fontWeight:700,color:overdues.length>0?"#fca5a5":"#fcd34d"}}>{overdues.length>0?`${overdues.length} overdue`:`${todays.length} today`}</span>
    </div>}
    <div style={{position:"relative"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...inp,width:180,paddingLeft:30,fontSize:12,background:"rgba(255,255,255,.03)"}}/>
      <div style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><I n="search" s={13} c="#475569"/></div>
    </div>
  </div>
</div>

{/* ═══ COMMAND CENTER ═══ */}
{view==="command"&&<div style={{padding:20}}>
  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
    <Stat label="Active Pipeline" value={active.length} sub={`${P(pipeVal)}/mo`} icon="activity" color="#7c3aed"/>
    <Stat label="Won Revenue" value={P(wonVal)} sub={`${wonCl.length} policies`} icon="check" color="#059669"/>
    <Stat label="Avg Close %" value={`${avgProb}%`} sub="pipeline average" icon="target" color="#d97706"/>
    <Stat label="AI Actions" value={pending} sub="pending approval" icon="zap" color="#2563eb"/>
    <Stat label="Monthly Commission" value={P(Math.round(commForecast.total/12))} sub="from existing book" icon="dollar" color="#059669"/>
  </div>

  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
    {/* AI Actions */}
    <div style={{background:"rgba(255,255,255,.02)",borderRadius:14,border:"1px solid rgba(255,255,255,.04)",overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:24,height:24,borderRadius:7,background:"rgba(124,58,237,.12)",display:"flex",alignItems:"center",justifyContent:"center",animation:"glow 3s infinite"}}><I n="zap" s={12} c="#a78bfa"/></div><span style={{fontSize:12,fontWeight:700}}>AI Actions Queue</span></div>
        <Bdg ch={`${pending} pending`} color="#7c3aed"/>
      </div>
      <div style={{maxHeight:400,overflowY:"auto",padding:8}}>
        {actions.filter(a=>a.status==="pending").map(a=><div key={a.id} style={{background:"rgba(255,255,255,.02)",borderRadius:10,border:"1px solid rgba(255,255,255,.05)",padding:12,marginBottom:6,animation:"slideIn .3s"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <I n={a.type==="follow_up"?"send":a.type==="coaching"?"target":a.type==="education"?"brain":"bell"} s={12} c={a.type==="follow_up"?"#7c3aed":a.type==="coaching"?"#2563eb":a.type==="education"?"#059669":"#d97706"}/>
              <span style={{fontSize:11,fontWeight:700}}>{a.client}</span>
            </div>
            <span style={{fontSize:9,color:"#475569"}}>{a.time}</span>
          </div>
          <p style={{fontSize:11,color:"#94a3b8",marginBottom:8,lineHeight:1.4}}>{a.action}</p>
          <div style={{background:"rgba(0,0,0,.25)",borderRadius:7,padding:"8px 10px",marginBottom:8,border:"1px solid rgba(255,255,255,.03)"}}>
            <div style={{fontSize:8,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>AI Draft</div>
            <p style={{fontSize:10,color:"#cbd5e1",lineHeight:1.5,whiteSpace:"pre-wrap",margin:0}}>{a.draft}</p>
          </div>
          <div style={{display:"flex",gap:5,justifyContent:"flex-end"}}>
            <button onClick={()=>copyTxt(a.id,a.draft)} style={{padding:"4px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,.06)",background:"transparent",color:"#94a3b8",fontSize:10,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
              <I n={copiedId===a.id?"check":"copy"} s={10} c={copiedId===a.id?"#059669":"#94a3b8"}/>{copiedId===a.id?"Copied":"Copy"}
            </button>
            <button onClick={()=>dismissAct(a.id)} style={{padding:"4px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,.05)",background:"transparent",color:"#64748b",fontSize:10,fontWeight:600,cursor:"pointer"}}>Dismiss</button>
            <button onClick={()=>approveAct(a.id)} style={{padding:"4px 10px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><I n="check" s={10} c="#fff"/>Approve</button>
          </div>
        </div>)}
        {actions.filter(a=>a.status==="pending").length===0&&<div style={{textAlign:"center",padding:30,color:"#475569"}}><I n="check" s={28} c="#059669"/><p style={{marginTop:8,fontSize:12}}>All caught up! 🎉</p></div>}
      </div>
    </div>

    {/* Right: Pipeline + Hot Deals */}
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{background:"rgba(255,255,255,.02)",borderRadius:14,border:"1px solid rgba(255,255,255,.04)",padding:16}}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:5}}><I n="layers" s={14} c="#a78bfa"/>Pipeline</div>
        {STAGES.filter(s=>s!=="Lost").map(s=>{const cnt=clients.filter(c=>c.stage===s).length;const val=clients.filter(c=>c.stage===s).reduce((a,c)=>a+(c.premium||0),0);return <div key={s} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:10,fontWeight:600,color:"#94a3b8",width:90,textAlign:"right"}}>{s}</span>
          <div style={{flex:1,height:18,background:"rgba(255,255,255,.04)",borderRadius:5,overflow:"hidden"}}><div style={{height:"100%",borderRadius:5,width:`${clients.length>0?(cnt/clients.length*100):0}%`,background:SC[s],transition:"width .5s",minWidth:cnt>0?18:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{cnt>0&&<span style={{fontSize:8,fontWeight:800,color:"#fff"}}>{cnt}</span>}</div></div>
          <span style={{fontSize:9,fontWeight:600,color:"#475569",fontFamily:"'JetBrains Mono',monospace",width:60,textAlign:"right"}}>{P(val)}</span>
        </div>;})}
      </div>
      <div style={{background:"rgba(255,255,255,.02)",borderRadius:14,border:"1px solid rgba(255,255,255,.04)",padding:16,flex:1}}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:5}}><I n="star" s={14} c="#d97706"/>Hot Deals</div>
        {clients.filter(c=>!["Won","Lost"].includes(c.stage)).sort((a,b)=>(b.closeProb||0)-(a.closeProb||0)).slice(0,5).map(c=><div key={c.id} className="hov" onClick={()=>setSel(c)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 8px",borderRadius:7,cursor:"pointer",marginBottom:1}}>
          <div><div style={{fontSize:11,fontWeight:600}}>{c.name}</div><div style={{fontSize:9,color:"#475569"}}>{c.product||"—"}</div></div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:10,fontWeight:700,color:"#059669",fontFamily:"'JetBrains Mono',monospace"}}>{P(c.premium)}</span><Prob v={c.closeProb}/></div>
        </div>)}
      </div>
    </div>
  </div>
</div>}

{/* ═══ PIPELINE ═══ */}
{view==="pipeline"&&<div style={{padding:16,overflowX:"auto"}}><div style={{display:"flex",gap:8}}>
  {STAGES.filter(s=>s!=="Lost").map(stage=>{const sc=clients.filter(c=>c.stage===stage);return <div key={stage} style={{minWidth:210,flex:"0 0 210px",background:"rgba(255,255,255,.02)",borderRadius:12,border:"1px solid rgba(255,255,255,.04)"}}>
    <div style={{padding:"10px 12px",borderBottom:"1px solid rgba(255,255,255,.04)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:7,height:7,borderRadius:"50%",background:SC[stage]}}/><span style={{fontSize:11,fontWeight:700,color:"#cbd5e1"}}>{stage}</span></div>
      <span style={{fontSize:9,fontWeight:700,color:SC[stage],background:SC[stage]+"14",padding:"1px 6px",borderRadius:8}}>{sc.length}</span>
    </div>
    <div style={{padding:5,maxHeight:480,overflowY:"auto"}}>
      {sc.map(c=>{const d=daysFrom(c.nextFollowUp),ov=d!==null&&d<0,td=d===0;return <div key={c.id} className="card-h" onClick={()=>setSel(c)} style={{background:ov?"rgba(220,38,38,.06)":"rgba(255,255,255,.02)",borderRadius:8,padding:"8px 10px",marginBottom:4,cursor:"pointer",border:ov?"1px solid rgba(220,38,38,.12)":"1px solid rgba(255,255,255,.03)",transition:"all .2s"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,fontWeight:700}}>{c.name}</span><Prob v={c.closeProb}/></div>
        {c.product&&<div style={{fontSize:9,color:"#475569",marginBottom:4}}>{c.product}</div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          {c.tag&&<Bdg ch={c.tag} color="#7c3aed"/>}{c.premium>0&&<span style={{fontSize:10,fontWeight:700,color:"#059669",fontFamily:"'JetBrains Mono',monospace"}}>{P(c.premium)}</span>}
        </div>
        {c.nextFollowUp&&<div style={{display:"flex",alignItems:"center",gap:3,marginTop:5,fontSize:9,fontWeight:600,color:ov?"#ef4444":td?"#f59e0b":"#475569"}}><I n={ov?"alert":"calendar"} s={9} c={ov?"#ef4444":td?"#f59e0b":"#475569"}/>{ov?`${Math.abs(d)}d overdue`:td?"Today":`In ${d}d`}</div>}
        <div style={{fontSize:8,color:"#3f3f46",marginTop:3}}>Agent: {c.agent}</div>
      </div>;})}
    </div>
  </div>;})}
</div></div>}

{/* ═══ CLIENTS ═══ */}
{view==="clients"&&<div style={{padding:16}}>
  <div style={{background:"rgba(255,255,255,.02)",borderRadius:12,border:"1px solid rgba(255,255,255,.04)",overflow:"hidden"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
      <thead><tr style={{borderBottom:"1px solid rgba(255,255,255,.06)"}}>
        {["Client","Stage","Product","Premium","Close %","Agent","Follow-Up",""].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:".06em"}}>{h}</th>)}
      </tr></thead>
      <tbody>{(search?clients.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())):clients).map(c=>{const d=daysFrom(c.nextFollowUp),ov=d!==null&&d<0;return <tr key={c.id} className="hov" style={{borderBottom:"1px solid rgba(255,255,255,.03)",cursor:"pointer"}} onClick={()=>setSel(c)}>
        <td style={{padding:"8px 12px"}}><div style={{fontWeight:600}}>{c.name}</div><div style={{fontSize:9,color:"#475569"}}>{c.phone}</div></td>
        <td style={{padding:"8px 12px"}}><Pill stage={c.stage} sm/></td>
        <td style={{padding:"8px 12px",color:"#94a3b8",fontSize:10}}>{c.product||"—"}</td>
        <td style={{padding:"8px 12px",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:c.premium>0?"#059669":"#333"}}>{P(c.premium)}</td>
        <td style={{padding:"8px 12px"}}><Prob v={c.closeProb}/></td>
        <td style={{padding:"8px 12px",fontSize:10,color:"#64748b"}}>{c.agent}</td>
        <td style={{padding:"8px 12px",fontSize:10,fontWeight:600,color:ov?"#ef4444":"#475569"}}>{fmtD(c.nextFollowUp)}{ov&&" ⚠️"}</td>
        <td style={{padding:"8px 12px"}}><button onClick={e=>{e.stopPropagation();setEditCl(c);setModalOpen(true)}} style={{background:"rgba(255,255,255,.05)",border:"none",borderRadius:5,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><I n="edit" s={11} c="#475569"/></button></td>
      </tr>;})}</tbody>
    </table>
  </div>
</div>}

{/* ═══ AI COPILOT ═══ */}
{view==="copilot"&&<div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 53px)"}}>
  <div style={{flex:1,overflowY:"auto",padding:"16px 24px"}}>
    {copMsgs.map((m,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:14,justifyContent:m.role==="user"?"flex-end":"flex-start",animation:"su .3s"}}>
      {m.role==="ai"&&<div style={{width:28,height:28,borderRadius:9,background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}><I n="bot" s={14} c="#fff"/></div>}
      <div style={{maxWidth:"72%",padding:"10px 14px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",background:m.role==="user"?"linear-gradient(135deg,#7c3aed,#6d28d9)":"rgba(255,255,255,.04)",border:m.role==="ai"?"1px solid rgba(255,255,255,.06)":"none",fontSize:12,lineHeight:1.65,whiteSpace:"pre-wrap"}}>
        {m.text.split(/(\*\*.*?\*\*)/).map((p,j)=>p.startsWith("**")&&p.endsWith("**")?<strong key={j} style={{color:"#a78bfa",fontWeight:700}}>{p.slice(2,-2)}</strong>:<span key={j}>{p}</span>)}
      </div>
    </div>)}
    {aiLoad&&<div style={{display:"flex",gap:8,marginBottom:14}}><div style={{width:28,height:28,borderRadius:9,background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n="bot" s={14} c="#fff"/></div><div style={{padding:"12px 16px",borderRadius:"14px 14px 14px 4px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",display:"flex",gap:3}}>{[0,1,2].map(i=><span key={i} style={{width:5,height:5,borderRadius:"50%",background:"#7c3aed",animation:`typing 1.4s ${i*.2}s infinite`}}/>)}</div></div>}
    <div ref={chatRef}/>
  </div>
  <div style={{padding:"0 24px 6px",display:"flex",gap:5,flexWrap:"wrap"}}>
    {["Draft follow-up for my most overdue client","Which deals are at risk?","Project my commission this quarter","How is my team performing?","Handle 'insurance is malas' objection"].map((q,i)=><button key={i} onClick={()=>setCopIn(q)} style={{padding:"4px 10px",borderRadius:16,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.02)",color:"#64748b",fontSize:10,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap"}}>{q}</button>)}
  </div>
  <div style={{padding:"10px 24px 16px",borderTop:"1px solid rgba(255,255,255,.04)"}}>
    <div style={{display:"flex",gap:6}}>
      <textarea value={copIn} onChange={e=>setCopIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendCopilot()}}} rows={2} placeholder="Ask your AI copilot..." style={{...inp,flex:1,resize:"none",minHeight:40,maxHeight:100}}/>
      <button onClick={sendCopilot} disabled={aiLoad||!copIn.trim()} style={{width:40,height:40,borderRadius:10,border:"none",background:copIn.trim()?"linear-gradient(135deg,#7c3aed,#2563eb)":"rgba(255,255,255,.04)",cursor:copIn.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n="send" s={16} c={copIn.trim()?"#fff":"#333"}/></button>
    </div>
  </div>
</div>}

{/* ═══ COMMISSION FORECASTING ═══ */}
{view==="commission"&&<div style={{padding:20}}>
  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
    <Stat label="Annual Commission" value={P(commForecast.total)} sub="from existing policies" icon="dollar" color="#059669"/>
    <Stat label="Pipeline Potential" value={P(Math.round(commForecast.commProjected))} sub="weighted by close %" icon="trend" color="#7c3aed"/>
    <Stat label="Total Forecast" value={P(Math.round(commForecast.totalWithPipeline))} sub="existing + pipeline" icon="star" color="#d97706"/>
    <Stat label="Monthly Average" value={P(Math.round(commForecast.totalWithPipeline/12))} sub="projected per month" icon="calendar" color="#2563eb"/>
  </div>

  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
    {/* Commission Breakdown */}
    <div style={{background:"rgba(255,255,255,.02)",borderRadius:14,border:"1px solid rgba(255,255,255,.04)",padding:18}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:16,display:"flex",alignItems:"center",gap:6}}><I n="bar" s={15} c="#059669"/>Commission Breakdown</div>
      {[
        {label:"Year 1 Policies (30%)",premium:commForecast.yr1,comm:commForecast.commYr1,color:"#059669"},
        {label:"Year 2 Policies (15%)",premium:commForecast.yr2,comm:commForecast.commYr2,color:"#2563eb"},
        {label:"Renewal Policies (5%)",premium:commForecast.renewal,comm:commForecast.commRenewal,color:"#7c3aed"},
        {label:"Pipeline Projected (30%)",premium:Math.round(commForecast.projected),comm:Math.round(commForecast.commProjected),color:"#d97706"},
      ].map((r,i)=><div key={i} style={{padding:"12px 14px",background:"rgba(255,255,255,.02)",borderRadius:10,border:"1px solid rgba(255,255,255,.04)",marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:11,fontWeight:600,color:"#cbd5e1"}}>{r.label}</span>
          <span style={{fontSize:14,fontWeight:900,color:r.color,fontFamily:"'JetBrains Mono',monospace"}}>{P(r.comm)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#475569"}}>
          <span>Premium Base: {P(r.premium)}/yr</span>
          <span>= {P(Math.round(r.comm/12))}/mo</span>
        </div>
      </div>)}

      <div style={{padding:"14px",background:"rgba(5,150,105,.06)",borderRadius:10,border:"1px solid rgba(5,150,105,.12)",marginTop:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:700,color:"#059669"}}>TOTAL ANNUAL FORECAST</span>
          <span style={{fontSize:22,fontWeight:900,color:"#059669",fontFamily:"'JetBrains Mono',monospace"}}>{P(Math.round(commForecast.totalWithPipeline))}</span>
        </div>
        <div style={{fontSize:10,color:"#059669",marginTop:2}}>= {P(Math.round(commForecast.totalWithPipeline/12))}/month average</div>
      </div>
    </div>

    {/* Monthly Projection Chart */}
    <div style={{background:"rgba(255,255,255,.02)",borderRadius:14,border:"1px solid rgba(255,255,255,.04)",padding:18}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:16,display:"flex",alignItems:"center",gap:6}}><I n="chart" s={15} c="#2563eb"/>Monthly Projection (2026)</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:4,height:200,padding:"0 4px"}}>
        {commForecast.monthly.map((m,i)=>{
          const max=Math.max(...commForecast.monthly.map(x=>x.total));
          const h=max>0?(m.total/max*160):0;
          const bh=max>0?(m.base/max*160):0;
          return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:8,fontWeight:700,color:"#cbd5e1",fontFamily:"'JetBrains Mono',monospace"}}>{P(m.total)}</span>
            <div style={{width:"100%",height:h,borderRadius:4,overflow:"hidden",position:"relative",background:"rgba(255,255,255,.04)"}}>
              <div style={{position:"absolute",bottom:0,width:"100%",height:bh,background:"#059669",borderRadius:"0 0 4px 4px"}}/>
              <div style={{position:"absolute",bottom:bh,width:"100%",height:h-bh,background:"#7c3aed",borderRadius:"4px 4px 0 0"}}/>
            </div>
            <span style={{fontSize:8,fontWeight:600,color:"#475569"}}>{m.month}</span>
          </div>;
        })}
      </div>
      <div style={{display:"flex",gap:16,justifyContent:"center",marginTop:14}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"#059669"}}/><span style={{fontSize:10,color:"#64748b"}}>Existing Book</span></div>
        <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"#7c3aed"}}/><span style={{fontSize:10,color:"#64748b"}}>Pipeline (projected)</span></div>
      </div>
    </div>
  </div>

  {/* Policy Book */}
  <div style={{background:"rgba(255,255,255,.02)",borderRadius:14,border:"1px solid rgba(255,255,255,.04)",padding:18,marginTop:14}}>
    <div style={{fontSize:13,fontWeight:700,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><I n="list" s={15} c="#a78bfa"/>Existing Policy Book</div>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
      <thead><tr style={{borderBottom:"1px solid rgba(255,255,255,.06)"}}>
        {["Client","Product","Annual Premium","Year Issued","Commission Rate","Annual Commission"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:"#475569",textTransform:"uppercase"}}>{h}</th>)}
      </tr></thead>
      <tbody>{EXISTING_POLICIES.map((p,i)=>{
        const age=2026-p.yearIssued;const rate=age===0?COMM_RATES.year1:age===1?COMM_RATES.year2:COMM_RATES.renewal;
        return <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
          <td style={{padding:"8px 12px",fontWeight:600}}>{p.client}</td>
          <td style={{padding:"8px 12px",color:"#94a3b8"}}>{p.product}</td>
          <td style={{padding:"8px 12px",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:"#e2e8f0"}}>{P(p.annualPremium)}</td>
          <td style={{padding:"8px 12px",color:"#64748b"}}>{p.yearIssued}</td>
          <td style={{padding:"8px 12px"}}><Bdg ch={`${Math.round(rate*100)}%`} color={age===0?"#059669":age===1?"#2563eb":"#7c3aed"}/></td>
          <td style={{padding:"8px 12px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:"#059669"}}>{P(Math.round(p.annualPremium*rate))}</td>
        </tr>;
      })}</tbody>
    </table>
  </div>
</div>}

{/* ═══ TEAM MANAGEMENT ═══ */}
{view==="team"&&<div style={{padding:20}}>
  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
    {teamStats.map(t=><div key={t.id} style={{background:"rgba(255,255,255,.02)",borderRadius:14,border:"1px solid rgba(255,255,255,.04)",padding:18}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,rgba(124,58,237,.2),rgba(37,99,235,.2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{t.avatar}</div>
        <div>
          <div style={{fontSize:14,fontWeight:700}}>{t.name}</div>
          <div style={{fontSize:10,color:"#64748b"}}>{t.role}</div>
        </div>
        {t.mdrt&&<div style={{marginLeft:"auto",padding:"3px 8px",borderRadius:8,background:"rgba(217,119,6,.12)",border:"1px solid rgba(217,119,6,.2)"}}><span style={{fontSize:9,fontWeight:800,color:"#d97706"}}>MDRT</span></div>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        <div style={{padding:"10px 12px",background:"rgba(255,255,255,.03)",borderRadius:8}}>
          <div style={{fontSize:9,fontWeight:700,color:"#475569",textTransform:"uppercase"}}>Active Clients</div>
          <div style={{fontSize:20,fontWeight:900,color:"#e2e8f0",fontFamily:"'JetBrains Mono',monospace"}}>{t.active}</div>
        </div>
        <div style={{padding:"10px 12px",background:"rgba(5,150,105,.06)",borderRadius:8}}>
          <div style={{fontSize:9,fontWeight:700,color:"#475569",textTransform:"uppercase"}}>Won</div>
          <div style={{fontSize:20,fontWeight:900,color:"#059669",fontFamily:"'JetBrains Mono',monospace"}}>{t.won}</div>
        </div>
      </div>

      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:10,color:"#64748b"}}>Pipeline Value</span>
          <span style={{fontSize:11,fontWeight:700,color:"#a78bfa",fontFamily:"'JetBrains Mono',monospace"}}>{P(t.pipeline)}/mo</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:10,color:"#64748b"}}>Won Revenue</span>
          <span style={{fontSize:11,fontWeight:700,color:"#059669",fontFamily:"'JetBrains Mono',monospace"}}>{P(t.wonValue)}/mo</span>
        </div>
      </div>

      {/* Target progress */}
      <div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:10,fontWeight:600,color:"#64748b"}}>Monthly Target</span>
          <span style={{fontSize:10,fontWeight:700,color:t.won>=t.target?"#059669":"#d97706"}}>{t.won}/{t.target} policies</span>
        </div>
        <div style={{height:6,background:"rgba(255,255,255,.06)",borderRadius:4,overflow:"hidden"}}>
          <div style={{height:"100%",borderRadius:4,width:`${Math.min(100,pct(t.won,t.target))}%`,background:t.won>=t.target?"#059669":"linear-gradient(90deg,#7c3aed,#2563eb)",transition:"width .5s"}}/>
        </div>
      </div>

      <button onClick={()=>{setView("copilot");setCopIn(`Give me a performance analysis and coaching tips for ${t.name}. They have ${t.active} active clients, ${t.won} won, pipeline value ₱${t.pipeline}/mo.`)}} style={{width:"100%",padding:"8px 0",borderRadius:8,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.02)",color:"#a78bfa",fontSize:11,fontWeight:600,cursor:"pointer",marginTop:12,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
        <I n="brain" s={12} c="#a78bfa"/>AI Coaching Tips
      </button>
    </div>)}
  </div>

  {/* Team Leaderboard */}
  <div style={{background:"rgba(255,255,255,.02)",borderRadius:14,border:"1px solid rgba(255,255,255,.04)",padding:18}}>
    <div style={{fontSize:13,fontWeight:700,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><I n="award" s={15} c="#d97706"/>Team Leaderboard</div>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
      <thead><tr style={{borderBottom:"1px solid rgba(255,255,255,.06)"}}>
        {["Rank","Agent","Role","Clients","Won","Pipeline","Won Revenue","Target %"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:9,fontWeight:700,color:"#475569",textTransform:"uppercase"}}>{h}</th>)}
      </tr></thead>
      <tbody>{teamStats.sort((a,b)=>b.wonValue-a.wonValue).map((t,i)=><tr key={t.id} style={{borderBottom:"1px solid rgba(255,255,255,.03)"}}>
        <td style={{padding:"8px 12px"}}><span style={{fontSize:14,fontWeight:900,color:i===0?"#d97706":i===1?"#94a3b8":"#78350f"}}>{i===0?"🥇":i===1?"🥈":"🥉"}</span></td>
        <td style={{padding:"8px 12px",fontWeight:600}}>{t.avatar} {t.name}</td>
        <td style={{padding:"8px 12px",color:"#64748b"}}>{t.role}</td>
        <td style={{padding:"8px 12px",fontFamily:"'JetBrains Mono',monospace"}}>{t.clients}</td>
        <td style={{padding:"8px 12px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:"#059669"}}>{t.won}</td>
        <td style={{padding:"8px 12px",fontFamily:"'JetBrains Mono',monospace"}}>{P(t.pipeline)}</td>
        <td style={{padding:"8px 12px",fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:"#059669"}}>{P(t.wonValue)}</td>
        <td style={{padding:"8px 12px"}}><div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:50,height:5,borderRadius:3,background:"rgba(255,255,255,.06)",overflow:"hidden"}}><div style={{width:`${Math.min(100,pct(t.won,t.target))}%`,height:"100%",borderRadius:3,background:pct(t.won,t.target)>=100?"#059669":"#7c3aed"}}/></div><span style={{fontSize:9,fontWeight:700,color:pct(t.won,t.target)>=100?"#059669":"#64748b"}}>{pct(t.won,t.target)}%</span></div></td>
      </tr>)}</tbody>
    </table>
  </div>
</div>}

{/* ═══ PROSPECT CHATBOT ═══ */}
{view==="prospect"&&<div style={{padding:20}}>
  <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:16,height:"calc(100vh - 93px)"}}>
    {/* Config Panel */}
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"rgba(255,255,255,.02)",borderRadius:14,border:"1px solid rgba(255,255,255,.04)",padding:18}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:6}}><I n="globe" s={15} c="#2563eb"/>Prospect-Facing Chatbot</div>
        <p style={{fontSize:12,color:"#94a3b8",lineHeight:1.6,marginBottom:14}}>
          This is the widget your prospects see on your website, Facebook page, or Viber. It educates them about insurance in Taglish, handles common objections gently, and pre-qualifies leads before connecting them to you.
        </p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{padding:"12px 14px",background:"rgba(255,255,255,.03)",borderRadius:10,border:"1px solid rgba(255,255,255,.04)"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#059669",marginBottom:4}}>What it does</div>
            <ul style={{fontSize:10,color:"#94a3b8",lineHeight:1.8,paddingLeft:14,margin:0}}>
              <li>Explains insurance concepts simply</li>
              <li>Handles "malas" and other objections</li>
              <li>Answers VUL vs Traditional questions</li>
              <li>Pre-qualifies based on budget/needs</li>
              <li>Books appointments with you</li>
            </ul>
          </div>
          <div style={{padding:"12px 14px",background:"rgba(255,255,255,.03)",borderRadius:10,border:"1px solid rgba(255,255,255,.04)"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#d97706",marginBottom:4}}>What it never does</div>
            <ul style={{fontSize:10,color:"#94a3b8",lineHeight:1.8,paddingLeft:14,margin:0}}>
              <li>Hard-sell or pressure prospects</li>
              <li>Provide specific financial advice</li>
              <li>Quote exact premiums</li>
              <li>Replace the human agent</li>
              <li>Collect sensitive personal data</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{background:"rgba(255,255,255,.02)",borderRadius:14,border:"1px solid rgba(255,255,255,.04)",padding:18,flex:1}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:12,display:"flex",alignItems:"center",gap:6}}><I n="chart" s={15} c="#a78bfa"/>Bot Performance</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[
            {label:"Conversations",value:"247",sub:"this month",color:"#7c3aed"},
            {label:"Qualified Leads",value:"38",sub:"15.4% conversion",color:"#059669"},
            {label:"Avg. Duration",value:"4.2m",sub:"per session",color:"#2563eb"},
          ].map((s,i)=><div key={i} style={{padding:"12px",background:"rgba(255,255,255,.03)",borderRadius:10}}>
            <div style={{fontSize:9,fontWeight:700,color:"#475569",textTransform:"uppercase",marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:20,fontWeight:900,color:s.color,fontFamily:"'JetBrains Mono',monospace"}}>{s.value}</div>
            <div style={{fontSize:9,color:"#475569"}}>{s.sub}</div>
          </div>)}
        </div>
        <div style={{marginTop:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"#cbd5e1",marginBottom:8}}>Top Questions Asked</div>
          {["How much does insurance cost?","What is VUL?","Is insurance worth it?","Do I need insurance if I have PhilHealth?","Can I cancel anytime?"].map((q,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <span style={{fontSize:10,fontWeight:700,color:"#475569",width:20,textAlign:"right"}}>{5-i}</span>
            <div style={{flex:1,height:16,background:"rgba(255,255,255,.04)",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,width:`${(5-i)/5*100}%`,background:"linear-gradient(90deg,#7c3aed,#2563eb)"}}/></div>
            <span style={{fontSize:10,color:"#94a3b8",flex:2}}>{q}</span>
          </div>)}
        </div>
      </div>
    </div>

    {/* Live Chat Preview */}
    <div style={{background:"#0f1225",borderRadius:14,border:"1px solid rgba(255,255,255,.06)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"12px 16px",background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center"}}><I n="bot" s={18} c="#fff"/></div>
        <div><div style={{fontSize:13,fontWeight:700,color:"#fff"}}>InsurAgent Assistant</div><div style={{fontSize:9,color:"rgba(255,255,255,.7)"}}>🟢 Online • Speaks Filipino & English</div></div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"12px 14px"}}>
        {proMsgs.map((m,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:10,justifyContent:m.role==="user"?"flex-end":"flex-start",animation:"su .3s"}}>
          {m.role==="bot"&&<div style={{width:24,height:24,borderRadius:8,background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}><I n="bot" s={12} c="#fff"/></div>}
          <div style={{maxWidth:"80%",padding:"8px 12px",borderRadius:m.role==="user"?"12px 12px 3px 12px":"12px 12px 12px 3px",background:m.role==="user"?"#7c3aed":"rgba(255,255,255,.06)",fontSize:11,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.text}</div>
        </div>)}
        {proLoad&&<div style={{display:"flex",gap:6,marginBottom:10}}><div style={{width:24,height:24,borderRadius:8,background:"linear-gradient(135deg,#7c3aed,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n="bot" s={12} c="#fff"/></div><div style={{padding:"10px 14px",borderRadius:"12px 12px 12px 3px",background:"rgba(255,255,255,.06)",display:"flex",gap:3}}>{[0,1,2].map(i=><span key={i} style={{width:4,height:4,borderRadius:"50%",background:"#7c3aed",animation:`typing 1.4s ${i*.2}s infinite`}}/>)}</div></div>}
        <div ref={proRef}/>
      </div>

      <div style={{padding:"8px 12px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
        <div style={{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap"}}>
          {["How much is insurance?","What is VUL?","I have PhilHealth na","Insurance is malas"].map((q,i)=><button key={i} onClick={()=>setProIn(q)} style={{padding:"3px 8px",borderRadius:12,border:"1px solid rgba(255,255,255,.08)",background:"transparent",color:"#64748b",fontSize:9,cursor:"pointer"}}>{q}</button>)}
        </div>
        <div style={{display:"flex",gap:4}}>
          <input value={proIn} onChange={e=>setProIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendProspect()}} placeholder="Type a message..." style={{...inp,fontSize:11}}/>
          <button onClick={sendProspect} disabled={proLoad||!proIn.trim()} style={{width:34,height:34,borderRadius:8,border:"none",background:proIn.trim()?"#7c3aed":"rgba(255,255,255,.04)",cursor:proIn.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><I n="send" s={14} c={proIn.trim()?"#fff":"#333"}/></button>
        </div>
      </div>
    </div>
  </div>
</div>}

</div>

{/* ═══ CLIENT DETAIL SLIDE-OVER ═══ */}
{sel&&<div style={{position:"fixed",inset:0,zIndex:60,display:"flex",justifyContent:"flex-end"}} onClick={()=>setSel(null)}>
  <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",backdropFilter:"blur(4px)"}}/>
  <div onClick={e=>e.stopPropagation()} style={{width:380,background:"#0c0f1a",borderLeft:"1px solid rgba(255,255,255,.06)",padding:20,overflowY:"auto",position:"relative",animation:"su .2s"}}>
    <button onClick={()=>setSel(null)} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,.06)",border:"none",borderRadius:7,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><I n="x" s={13} c="#94a3b8"/></button>
    <h2 style={{fontSize:18,fontWeight:800,margin:"0 0 4px"}}>{sel.name}</h2>
    <div style={{display:"flex",gap:5,marginBottom:14}}><Pill stage={sel.stage}/>{sel.tag&&<Bdg ch={sel.tag} color="#7c3aed"/>}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
      {[{l:"Phone",v:sel.phone},{l:"Email",v:sel.email}].map(f=><div key={f.l} style={{padding:"8px 10px",background:"rgba(255,255,255,.03)",borderRadius:8,border:"1px solid rgba(255,255,255,.04)"}}><div style={{fontSize:8,fontWeight:700,color:"#475569",textTransform:"uppercase"}}>{f.l}</div><div style={{fontSize:11,fontWeight:600,wordBreak:"break-all"}}>{f.v||"—"}</div></div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
      <div style={{padding:"8px 10px",background:"rgba(5,150,105,.06)",borderRadius:8,border:"1px solid rgba(5,150,105,.1)"}}><div style={{fontSize:8,fontWeight:700,color:"#475569",textTransform:"uppercase"}}>Premium</div><div style={{fontSize:16,fontWeight:900,color:"#059669",fontFamily:"'JetBrains Mono',monospace"}}>{P(sel.premium)}</div></div>
      <div style={{padding:"8px 10px",background:"rgba(124,58,237,.06)",borderRadius:8,border:"1px solid rgba(124,58,237,.1)"}}><div style={{fontSize:8,fontWeight:700,color:"#475569",textTransform:"uppercase"}}>Close %</div><div style={{marginTop:4}}><Prob v={sel.closeProb}/></div></div>
    </div>
    {sel.product&&<div style={{padding:"8px 10px",background:"rgba(255,255,255,.03)",borderRadius:8,border:"1px solid rgba(255,255,255,.04)",marginBottom:10}}><div style={{fontSize:8,fontWeight:700,color:"#475569",textTransform:"uppercase"}}>Product</div><div style={{fontSize:12,fontWeight:600}}>{sel.product}</div></div>}
    {sel.notes&&<div style={{padding:"8px 10px",background:"rgba(255,255,255,.03)",borderRadius:8,border:"1px solid rgba(255,255,255,.04)",marginBottom:14}}><div style={{fontSize:8,fontWeight:700,color:"#475569",textTransform:"uppercase",marginBottom:3}}>Notes</div><div style={{fontSize:11,color:"#cbd5e1",lineHeight:1.5}}>{sel.notes}</div></div>}
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:700,color:"#a78bfa",marginBottom:6,display:"flex",alignItems:"center",gap:4}}><I n="zap" s={12} c="#a78bfa"/>AI Quick Actions</div>
      {[{l:"Draft follow-up",p:`Draft a Viber follow-up for ${sel.name}. Stage=${sel.stage}, Product=${sel.product||"none"}, Notes=${sel.notes}`},{l:"Sales coaching",p:`Sales coaching for closing ${sel.name}. Close prob ${sel.closeProb}%. Details: ${sel.notes}`},{l:"Handle objections",p:`What objections will ${sel.name} raise? Profile: ${sel.tag}, notes: ${sel.notes}`},{l:"Product recommendation",p:`Best product for ${sel.name}? Tag=${sel.tag}, budget=₱${sel.premium}/mo, notes: ${sel.notes}`}].map((a,i)=><button key={i} onClick={()=>{setSel(null);setView("copilot");setCopIn(a.p)}} style={{display:"flex",alignItems:"center",gap:5,width:"100%",padding:"6px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,.05)",background:"rgba(255,255,255,.02)",color:"#cbd5e1",fontSize:10,fontWeight:500,cursor:"pointer",marginBottom:3,textAlign:"left"}}><I n="send" s={10} c="#7c3aed"/>{a.l}</button>)}
    </div>
    <div style={{display:"flex",gap:5}}>
      <button onClick={()=>{setSel(null);setEditCl(sel);setModalOpen(true)}} style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",background:"linear-gradient(135deg,#7c3aed,#2563eb)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}><I n="edit" s={12} c="#fff"/> Edit</button>
      <button onClick={async()=>{if(dbConnected)await dbDeleteClient(sel.id);setClients(p=>p.filter(c=>c.id!==sel.id));setSel(null)}} style={{padding:"8px 14px",borderRadius:8,border:"1px solid rgba(220,38,38,.2)",background:"rgba(220,38,38,.06)",color:"#ef4444",fontSize:11,fontWeight:600,cursor:"pointer"}}><I n="trash" s={12} c="#ef4444"/></button>
    </div>
  </div>
</div>}

{/* ═══ ADD/EDIT MODAL ═══ */}
<Modal open={modalOpen} onClose={()=>{setModalOpen(false);setEditCl(null)}} title={editCl?.id?"Edit Client":"New Client"} ch={
  <CForm initial={editCl||{name:"",phone:"",email:"",stage:"Lead",product:"",premium:0,tag:"",notes:"",nextFollowUp:"",closeProb:15}} onSave={handleSave} onCancel={()=>{setModalOpen(false);setEditCl(null)}} inp={inp}/>
}/>
</div>;
}

function CForm({initial,onSave,onCancel,inp}){
const[f,sF]=useState(initial);const u=(k,v)=>sF(p=>({...p,[k]:v}));
const L=({l,ch})=><div style={{marginBottom:12}}><label style={{display:"block",fontSize:9,fontWeight:700,color:"#475569",marginBottom:3,textTransform:"uppercase",letterSpacing:".06em"}}>{l}</label>{ch}</div>;
return <div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
<L l="Name" ch={<input value={f.name} onChange={e=>u("name",e.target.value)} placeholder="Maria Santos" style={inp}/>}/>
<L l="Phone" ch={<input value={f.phone} onChange={e=>u("phone",e.target.value)} placeholder="+63 9XX XXX XXXX" style={inp}/>}/>
</div>
<L l="Email" ch={<input value={f.email} onChange={e=>u("email",e.target.value)} placeholder="email@example.com" style={inp}/>}/>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
<L l="Stage" ch={<select value={f.stage} onChange={e=>u("stage",e.target.value)} style={{...inp,cursor:"pointer"}}>{STAGES.map(s=><option key={s}>{s}</option>)}</select>}/>
<L l="Tag" ch={<select value={f.tag} onChange={e=>u("tag",e.target.value)} style={{...inp,cursor:"pointer"}}><option value="">Select...</option>{TAGS.map(t=><option key={t}>{t}</option>)}</select>}/>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
<L l="Product" ch={<select value={f.product} onChange={e=>u("product",e.target.value)} style={{...inp,cursor:"pointer"}}><option value="">Select...</option>{PRODUCTS.map(p=><option key={p}>{p}</option>)}</select>}/>
<L l="Premium ₱/mo" ch={<input type="number" value={f.premium} onChange={e=>u("premium",+e.target.value)} style={inp}/>}/>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
<L l="Follow-Up" ch={<input type="date" value={f.nextFollowUp} onChange={e=>u("nextFollowUp",e.target.value)} style={inp}/>}/>
<L l="Close %" ch={<input type="number" min={0} max={100} value={f.closeProb} onChange={e=>u("closeProb",Math.min(100,Math.max(0,+e.target.value)))} style={inp}/>}/>
</div>
<L l="Notes" ch={<textarea value={f.notes} onChange={e=>u("notes",e.target.value)} rows={3} placeholder="Details..." style={{...inp,resize:"vertical"}}/>}/>
<div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:4}}>
<button onClick={onCancel} style={{padding:"8px 16px",borderRadius:8,border:"1px solid rgba(255,255,255,.06)",background:"transparent",color:"#94a3b8",fontSize:11,fontWeight:600,cursor:"pointer"}}>Cancel</button>
<button onClick={()=>onSave(f)} disabled={!f.name} style={{padding:"8px 20px",borderRadius:8,border:"none",background:f.name?"linear-gradient(135deg,#7c3aed,#2563eb)":"rgba(255,255,255,.06)",color:f.name?"#fff":"#475569",fontSize:11,fontWeight:700,cursor:f.name?"pointer":"default"}}>Save</button>
</div>
</div>;
}
