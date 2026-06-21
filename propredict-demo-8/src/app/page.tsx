"use client";
import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const C = {
  void:"#070810", surface:"#0E1120", elevated:"#161B2E", hover:"#1E2540",
  edge:"#00E5FF", win:"#00FF88", loss:"#FF3D5A", gold:"#FFD166", neutral:"#7B8CDE",
  text:"#F0F4FF", muted:"#4A5278", dim:"#2A3050", border:"rgba(123,140,222,0.14)"
};

const s = (obj:any) => Object.entries(obj).map(([k,v])=>k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+':'+v).join(';');

const SPORTS = ['NFL','NBA','UFC','MLB','NHL','SOCCER','TENNIS'];
const SPORT_EMOJI:any = {NFL:'🏈',NBA:'🏀',UFC:'🥊',MLB:'⚾',NHL:'🏒',SOCCER:'⚽',TENNIS:'🎾'};

export default function App() {
  const [tab, setTab] = useState('DASHBOARD');
  const [data, setData] = useState<any>(null);
  const [sportData, setSportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);
  const [logBetOpen, setLogBetOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [alertNew, setAlertNew] = useState(false);

  useEffect(()=>{
    fetch('/api/data?type=dashboard').then(r=>r.json()).then(d=>{setData(d);setLoading(false);setAlertNew(true);setTimeout(()=>setAlertNew(false),3000);});
  },[]);

  useEffect(()=>{
    if (!SPORTS.includes(tab)) return;
    setSportData(null);
    fetch('/api/data?type=sport&sport='+tab).then(r=>r.json()).then(setSportData);
  },[tab]);

  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setCmdOpen(o=>!o);} if(e.key==='Escape')setCmdOpen(false); };
    window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);
  },[]);

  const st = data?.stats || {};
  const preds = data?.predictions || [];
  const alerts = data?.alerts || [];
  const bets = data?.bets || [];
  const live = data?.liveGames || [];

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:C.void}}>
      {/* SIDEBAR */}
      <aside style={{width:210,background:C.surface,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',flexShrink:0,overflowY:'auto'}}>
        {/* Logo */}
        <div style={{padding:'16px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${C.edge},${C.neutral})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,color:C.void,flexShrink:0}}>PP</div>
          <div>
            <div style={{fontWeight:700,fontSize:15}}>Pro<span style={{color:C.edge}}>Predict</span></div>
            <div style={{fontSize:9,fontFamily:'monospace',border:`1px solid ${C.edge}`,color:C.edge,padding:'1px 5px',borderRadius:3,display:'inline-block',marginTop:2}}>2.0 LIVE</div>
          </div>
        </div>
        {/* Nav */}
        <div style={{padding:10,flex:1}}>
          {['DASHBOARD','LIVE','PORTFOLIO','ANALYTICS','AI CHAT','ALERTS'].map(t=>{
            const icons:any={DASHBOARD:'⚡',LIVE:'📡',PORTFOLIO:'💼',ANALYTICS:'📊','AI CHAT':'🤖',ALERTS:'🔔'};
            return <NavItem key={t} icon={icons[t]} label={t} active={tab===t} badge={t==='ALERTS'&&alertNew?'•':undefined} onClick={()=>setTab(t)} />;
          })}
          <div style={{height:1,background:C.border,margin:'8px 4px'}}/>
          <div style={{fontSize:9,color:C.dim,fontWeight:600,letterSpacing:1,padding:'4px 8px',textTransform:'uppercase'}}>Sports</div>
          {SPORTS.map(s=><NavItem key={s} icon={SPORT_EMOJI[s]} label={s} active={tab===s} onClick={()=>setTab(s)} />)}
        </div>
        {/* Stats */}
        <div style={{padding:12,borderTop:`1px solid ${C.border}`}}>
          <div style={{background:C.elevated,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px',marginBottom:8}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,textAlign:'center'}}>
              <Stat label="Win Rate" value={st.wins+st.losses>0?`${((st.winRate||0)).toFixed(1)}%`:'—'} color={st.winRate>=55?C.win:st.winRate>=52?C.gold:C.muted} />
              <Stat label="ROI" value={st.wins+st.losses>0?`${st.roi>=0?'+':''}${(st.roi||0).toFixed(1)}%`:'—'} color={st.roi>0?C.win:st.roi<0?C.loss:C.muted} />
            </div>
            <div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${C.border}`,textAlign:'center'}}>
              <div style={{fontSize:14,fontWeight:700}}>${((st.bankroll||1000)).toFixed(0)}</div>
              <div style={{fontSize:9,color:C.dim,textTransform:'uppercase',letterSpacing:.5}}>Bankroll</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column'}}>
        {/* Signal bar */}
        <div className="signal-bar" />

        {/* Content */}
        <div style={{padding:'24px 28px',flex:1}}>
          {loading && <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:C.muted}}>Loading ProPredict 2.0…</div>}

          {!loading && tab==='DASHBOARD' && <Dashboard preds={preds} live={live} alerts={alerts} bets={bets} stats={st} onToggle={(id:string)=>setExpanded(e=>e===id?null:id)} expanded={expanded} onLogBet={()=>setLogBetOpen(true)} />}
          {!loading && SPORTS.includes(tab) && <SportView sport={tab} sportData={sportData} onToggle={(id:string)=>setExpanded(e=>e===id?null:id)} expanded={expanded} onLogBet={()=>setLogBetOpen(true)} />}
          {!loading && tab==='LIVE' && <LiveView live={live} />}
          {!loading && tab==='PORTFOLIO' && <PortfolioView bets={bets} stats={st} onLogBet={()=>setLogBetOpen(true)} />}
          {!loading && tab==='ANALYTICS' && <AnalyticsView bets={bets} preds={preds} />}
          {!loading && tab==='AI CHAT' && <AIChat />}
          {!loading && tab==='ALERTS' && <AlertsView alerts={alerts} />}
        </div>
      </main>

      {/* Log Bet Modal */}
      {logBetOpen && <LogBetModal onClose={()=>setLogBetOpen(false)} onSaved={()=>{setLogBetOpen(false);window.location.reload();}} />}

      {/* Command Palette */}
      {cmdOpen && (
        <div onClick={()=>setCmdOpen(false)} style={{position:'fixed',inset:0,background:'rgba(7,8,16,.85)',backdropFilter:'blur(8px)',zIndex:100,display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:'18vh'}}>
          <div onClick={e=>e.stopPropagation()} style={{width:480,background:C.surface,border:`1px solid ${C.edge}`,borderRadius:12,overflow:'hidden',boxShadow:'0 25px 80px rgba(0,0,0,.8)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.muted}}>🔍</span>
              <input autoFocus placeholder="Search pages, sports, predictions…" style={{flex:1,background:'none',border:'none',outline:'none',color:C.text,fontSize:13}} onKeyDown={e=>{if(e.key==='Escape')setCmdOpen(false);}} />
              <kbd style={{fontSize:9,color:C.dim,border:`1px solid ${C.border}`,borderRadius:3,padding:'1px 5px',fontFamily:'monospace'}}>ESC</kbd>
            </div>
            <div style={{padding:8}}>
              {[['DASHBOARD','⚡'],['NFL','🏈'],['NBA','🏀'],['LIVE','📡'],['PORTFOLIO','💼'],['ANALYTICS','📊'],['AI CHAT','🤖']].map(([name,icon])=>(
                <button key={name} onClick={()=>{setTab(name);setCmdOpen(false);}} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'8px 10px',border:'none',background:'none',cursor:'pointer',borderRadius:6,color:C.text,fontSize:12,textAlign:'left'}} onMouseEnter={e=>(e.currentTarget.style.background=C.elevated)} onMouseLeave={e=>(e.currentTarget.style.background='none')}>
                  <span>{icon}</span><span>{name}</span>
                </button>
              ))}
            </div>
            <div style={{padding:'6px 16px 10px',borderTop:`1px solid ${C.border}`,fontSize:9,color:C.dim,display:'flex',gap:12}}>
              <span>↑↓ navigate</span><span>↵ open</span><span>⌘K toggle</span>
            </div>
          </div>
        </div>
      )}

      {/* Cmd+K hint */}
      <div style={{position:'fixed',bottom:12,right:12,fontSize:9,color:C.dim,fontFamily:'monospace'}}>⌘K search</div>
    </div>
  );
}

function NavItem({icon,label,active,badge,onClick}:any) {
  return <button onClick={onClick} style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'6px 10px',borderRadius:7,border:'none',cursor:'pointer',background:active?C.edge:'none',color:active?C.void:C.muted,fontSize:11,fontWeight:active?600:400,marginBottom:1,transition:'all .15s'}} onMouseEnter={e=>{if(!active)e.currentTarget.style.color=C.text;}} onMouseLeave={e=>{if(!active)e.currentTarget.style.color=C.muted;}}>
    <span>{icon}</span><span style={{flex:1,textAlign:'left'}}>{label}</span>
    {badge&&<span style={{color:C.loss,fontWeight:900,fontSize:14}}>{badge}</span>}
  </button>;
}

function Stat({label,value,color}:any) {
  return <div><div style={{fontSize:13,fontWeight:700,color}}>{value}</div><div style={{fontSize:9,color:C.dim,textTransform:'uppercase',letterSpacing:.5}}>{label}</div></div>;
}

function Card({children,style}:any) {
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:18,...style}}>{children}</div>;
}

function SectionLabel({children}:any) {
  return <div style={{fontSize:9,color:C.muted,fontWeight:600,letterSpacing:1,textTransform:'uppercase',marginBottom:12}}>{children}</div>;
}

function PredCard({pred,expanded,onToggle,onLogBet}:any) {
  const exp = expanded===pred.id;
  const confColor = pred.confidence>=75?C.win:pred.confidence>=65?C.gold:C.muted;
  const isSharp = pred.steam_flag||pred.sharp_money_pct>60;
  return (
    <div style={{background:C.surface,border:`1px solid ${exp?C.edge:C.border}`,borderRadius:12,padding:16,transition:'all .2s'}}>
      <div className="signal-bar" style={{marginBottom:12,background:pred.steam_flag?`linear-gradient(90deg,transparent,${C.gold},${C.gold},transparent)`:pred.confidence>=75?`linear-gradient(90deg,transparent,${C.win},${C.edge},transparent)`:undefined}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:3,background:`rgba(0,229,255,.1)`,border:`1px solid rgba(0,229,255,.2)`,color:C.edge,fontFamily:'monospace'}}>{pred.sport}</span>
          {isSharp&&<span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:3,background:pred.steam_flag?`rgba(255,209,102,.1)`:`rgba(0,229,255,.08)`,border:`1px solid ${pred.steam_flag?C.gold:C.edge}`,color:pred.steam_flag?C.gold:C.edge,fontFamily:'monospace'}}>⚡{pred.steam_flag?'STEAM':'SHARP'}</span>}
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:13,fontWeight:700,fontFamily:'monospace',color:confColor}}>{pred.confidence}%</div>
          <div style={{fontSize:9,color:C.dim}}>confidence</div>
        </div>
      </div>
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
        <div style={{flex:1,textAlign:'center',padding:'8px',borderRadius:8,background:C.elevated}}>
          <div style={{fontSize:10,color:C.muted}}>{pred.away_city}</div>
          <div style={{fontWeight:700,fontSize:14}}>{pred.away_abbr}</div>
        </div>
        <div style={{textAlign:'center',fontSize:11,color:C.muted}}>
          <div style={{fontFamily:'monospace',fontSize:9}}>{new Date(pred.game_time).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</div>
          <div style={{fontSize:9}}>@</div>
        </div>
        <div style={{flex:1,textAlign:'center',padding:'8px',borderRadius:8,background:C.elevated}}>
          <div style={{fontSize:10,color:C.muted}}>{pred.home_city}</div>
          <div style={{fontWeight:700,fontSize:14}}>{pred.home_abbr}</div>
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 10px',background:C.elevated,borderRadius:8,marginBottom:10}}>
        <div>
          <div style={{fontSize:9,color:C.muted,textTransform:'uppercase',letterSpacing:.5}}>{pred.pick_type}</div>
          <div style={{fontWeight:700,fontSize:14}}>{pred.pick_side.toUpperCase()} <span style={{fontFamily:'monospace'}}>{pred.line>0?'+':''}{pred.line}</span></div>
        </div>
        <div style={{display:'flex',gap:14}}>
          <div style={{textAlign:'right'}}><div style={{fontSize:12,fontWeight:700,fontFamily:'monospace',color:pred.expected_value>0?C.win:C.muted}}>{pred.expected_value>0?'+':''}{(pred.expected_value||0).toFixed(1)}%</div><div style={{fontSize:9,color:C.dim}}>EV</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:12,fontWeight:700,fontFamily:'monospace',color:C.neutral}}>{(pred.kelly_pct||0).toFixed(1)}%</div><div style={{fontSize:9,color:C.dim}}>Kelly</div></div>
        </div>
      </div>
      {pred.sharp_money_pct&&<div style={{marginBottom:10}}>
        <div style={{display:'flex',height:4,borderRadius:4,overflow:'hidden',background:C.elevated}}>
          <div style={{width:`${pred.sharp_money_pct}%`,background:C.edge,transition:'width .5s'}}/>
          <div style={{flex:1,background:C.muted,opacity:.3}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:3}}>
          <span style={{fontSize:9,color:C.edge,fontFamily:'monospace'}}>{pred.sharp_money_pct}% sharp</span>
          <span style={{fontSize:9,color:C.muted,fontFamily:'monospace'}}>{pred.public_pct}% public</span>
        </div>
      </div>}
      <div style={{height:3,borderRadius:3,background:C.elevated,overflow:'hidden',marginBottom:10}}>
        <div style={{height:'100%',width:`${pred.confidence}%`,background:`linear-gradient(90deg,${confColor},${confColor}88)`,transition:'width .5s'}}/>
      </div>
      <button onClick={()=>onToggle(pred.id)} style={{width:'100%',border:'none',background:'none',cursor:'pointer',fontSize:10,color:C.muted,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0'}}>
        <span>Model reasoning</span><span>{exp?'▲':'▼'}</span>
      </button>
      {exp&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
        <p style={{fontSize:11,color:C.muted,lineHeight:1.7,marginBottom:10}}>{pred.model_reasoning}</p>
        {pred.key_factors?.length>0&&<><div style={{fontSize:9,color:C.edge,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>Key Factors</div>
        <ul style={{paddingLeft:0,listStyle:'none',marginBottom:10}}>{pred.key_factors.map((f:string,i:number)=><li key={i} style={{fontSize:10,color:C.muted,padding:'2px 0',display:'flex',gap:6}}><span style={{color:C.win}}>+</span>{f}</li>)}</ul></>}
        {pred.risk_factors?.length>0&&<><div style={{fontSize:9,color:C.loss,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>Risk Factors</div>
        <ul style={{paddingLeft:0,listStyle:'none'}}>{pred.risk_factors.map((f:string,i:number)=><li key={i} style={{fontSize:10,color:C.muted,padding:'2px 0',display:'flex',gap:6}}><span style={{color:C.loss}}>−</span>{f}</li>)}</ul></>}
      </div>}
      <button onClick={()=>onLogBet()} style={{marginTop:10,width:'100%',padding:'7px',borderRadius:8,border:`1px solid ${C.border}`,background:'none',cursor:'pointer',fontSize:10,fontWeight:600,color:C.muted}} onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.borderColor=C.edge;}} onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border;}}>
        Log this bet →
      </button>
    </div>
  );
}

function Dashboard({preds,live,alerts,bets,stats,onToggle,expanded,onLogBet}:any) {
  return <>
    {/* Stats */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
      {[
        {label:'Bankroll',value:`$${(stats.bankroll||1000).toFixed(0)}`,sub:`${(stats.roi||0)>=0?'+':''}${(stats.roi||0).toFixed(1)}% ROI`,color:C.text,subColor:stats.roi>=0?C.win:C.loss},
        {label:'Win Rate',value:stats.wins+stats.losses>0?`${(stats.winRate||0).toFixed(1)}%`:'—',sub:`${stats.wins||0}W · ${stats.losses||0}L`,color:stats.winRate>=55?C.win:stats.winRate>=52?C.gold:C.muted,subColor:C.muted},
        {label:'ROI (30d)',value:stats.wins+stats.losses>0?`${stats.roi>=0?'+':''}${(stats.roi||0).toFixed(1)}%`:'—',sub:`${stats.totalProfit>=0?'+':''}$${Math.abs(stats.totalProfit||0).toFixed(2)}`,color:stats.roi>0?C.win:stats.roi<0?C.loss:C.muted,subColor:stats.totalProfit>=0?C.win:C.loss},
        {label:'Avg CLV',value:stats.wins+stats.losses>0?`${stats.avgCLV>=0?'+':''}${(stats.avgCLV||0).toFixed(2)}`:'—',sub:stats.avgCLV>0?'Beating closing line':'Below closing line',color:stats.avgCLV>0?C.win:C.loss,subColor:C.muted},
      ].map(s=><Card key={s.label} style={{padding:14}}><div style={{fontSize:9,color:C.muted,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>{s.label}</div><div style={{fontSize:20,fontWeight:700,color:s.color,lineHeight:1,marginBottom:4}}>{s.value}</div><div style={{fontSize:10,color:s.subColor,fontFamily:'monospace'}}>{s.sub}</div></Card>)}
    </div>

    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20}}>
      <div>
        <SectionLabel>Today's Top Picks</SectionLabel>
        {preds.length===0?<Card><div style={{textAlign:'center',padding:32,color:C.muted}}><div style={{fontSize:24,marginBottom:8}}>🎯</div><div>AI generates picks at 6 AM daily</div></div></Card>
        :<div style={{display:'grid',gap:12}}>{preds.slice(0,4).map((p:any)=><PredCard key={p.id} pred={p} expanded={expanded} onToggle={onToggle} onLogBet={onLogBet}/>)}</div>}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        {live.length>0&&<>
          <SectionLabel><span className="pulse-live"/>Live Now</SectionLabel>
          {live.map((g:any)=><Card key={g.id} style={{padding:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12,fontWeight:700}}>{g.away_abbr}</span>
                <span style={{fontSize:18,fontWeight:800,fontFamily:'monospace',color:C.loss}}>{g.away_score||0}</span>
                <span style={{fontSize:10,color:C.dim}}>@</span>
                <span style={{fontSize:18,fontWeight:800,fontFamily:'monospace',color:C.win}}>{g.home_score||0}</span>
                <span style={{fontSize:12,fontWeight:700}}>{g.home_abbr}</span>
              </div>
              <span style={{fontSize:9,color:C.win,fontWeight:700}}>{g.quarter} {g.venue}</span>
            </div>
          </Card>)}
        </>}
        <SectionLabel>Sharp Alerts</SectionLabel>
        {alerts.length===0?<Card><div style={{textAlign:'center',padding:20,color:C.muted,fontSize:11}}>No alerts yet</div></Card>
        :alerts.slice(0,5).map((a:any)=><div key={a.id} style={{background:a.alert_type==='STEAM_MOVE'?`rgba(255,209,102,.06)`:`rgba(0,229,255,.05)`,border:`1px solid ${a.alert_type==='STEAM_MOVE'?`rgba(255,209,102,.2)`:`rgba(0,229,255,.18)`}`,borderRadius:8,padding:'9px 11px'}}>
          <div style={{fontSize:9,color:a.alert_type==='STEAM_MOVE'?C.gold:C.edge,fontWeight:700,marginBottom:3,fontFamily:'monospace'}}>⚡ {a.alert_type==='STEAM_MOVE'?'STEAM':'RLM'} — {a.away_abbr}@{a.home_abbr}</div>
          <div style={{fontSize:10,color:C.muted}}>{a.side.toUpperCase()} {a.from_line}→<span style={{fontWeight:700,color:a.alert_type==='STEAM_MOVE'?C.gold:C.edge}}>{a.to_line}</span></div>
        </div>)}
        <SectionLabel>Quick Access</SectionLabel>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
          {SPORTS.map(sp=><button key={sp} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'8px 4px',borderRadius:8,border:`1px solid ${C.border}`,background:C.elevated,cursor:'pointer',fontSize:9,color:C.muted,fontWeight:600}} onClick={()=>{}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.edge;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}>
            <span style={{fontSize:16}}>{SPORT_EMOJI[sp]}</span>{sp}
          </button>)}
        </div>
      </div>
    </div>
  </>;
}

function SportView({sport,sportData,onToggle,expanded,onLogBet}:any) {
  const [sportTab, setSportTab] = useState('PREDICTIONS');
  if (!sportData) return <div style={{color:C.muted,padding:32,textAlign:'center'}}>Loading {sport}…</div>;
  const {predictions,teams,alerts} = sportData;
  const settled = predictions.filter((p:any)=>p.result);
  const wins = settled.filter((p:any)=>p.result==='WIN').length;
  const losses = settled.filter((p:any)=>p.result==='LOSS').length;

  return <>
    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
      <span style={{fontSize:28}}>{SPORT_EMOJI[sport]}</span>
      <div>
        <h1 style={{fontWeight:700,fontSize:20}}>{sport}</h1>
        {settled.length>0?<div style={{fontSize:11,color:C.muted}}>ATS: <span style={{color:wins/(wins+losses)>=.55?C.win:C.gold,fontFamily:'monospace',fontWeight:700}}>{wins}-{losses} ({wins+losses>0?((wins/(wins+losses))*100).toFixed(1):0}%)</span></div>
        :<div style={{fontSize:11,color:C.muted}}>{predictions.length} prediction{predictions.length!==1?'s':''}</div>}
      </div>
    </div>
    <div style={{display:'flex',gap:4,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:4,width:'fit-content',marginBottom:20}}>
      {['PREDICTIONS','STANDINGS','ALERTS'].map(t=><button key={t} onClick={()=>setSportTab(t)} style={{padding:'6px 16px',borderRadius:7,border:'none',cursor:'pointer',fontSize:11,fontWeight:500,background:sportTab===t?C.edge:'none',color:sportTab===t?C.void:C.muted}}>{t}</button>)}
    </div>
    {sportTab==='PREDICTIONS'&&<>{predictions.length===0?<Card><div style={{textAlign:'center',padding:32,color:C.muted}}>No {sport} predictions yet. AI generates picks at 6 AM.</div></Card>
    :<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>{predictions.map((p:any)=><PredCard key={p.id} pred={p} expanded={expanded} onToggle={onToggle} onLogBet={onLogBet}/>)}</div>}</>}
    {sportTab==='STANDINGS'&&<Card><table style={{width:'100%',borderCollapse:'collapse'}}>
      <thead><tr style={{fontSize:9,color:C.dim,textTransform:'uppercase',borderBottom:`1px solid ${C.border}`}}>{['#','Team','Win%','ATS','ELO','Form'].map(h=><th key={h} style={{padding:'6px 8px',textAlign:h==='#'||h==='ELO'||h==='Win%'||h==='ATS'?'center':'left',fontWeight:600}}>{h}</th>)}</tr></thead>
      <tbody>{(teams||[]).map((t:any,i:number)=><tr key={t.id} style={{borderBottom:`1px solid rgba(255,255,255,.03)`,fontSize:11}}>
        <td style={{padding:'7px 8px',textAlign:'center',color:C.dim,fontFamily:'monospace'}}>{i+1}</td>
        <td style={{padding:'7px 8px',fontWeight:600}}>{t.abbreviation} <span style={{color:C.muted,fontWeight:400}}>{t.city}</span></td>
        <td style={{padding:'7px 8px',textAlign:'center',fontFamily:'monospace',color:t.win_pct>=.6?C.win:t.win_pct>=.5?C.gold:C.loss}}>{(t.win_pct*100).toFixed(0)}%</td>
        <td style={{padding:'7px 8px',textAlign:'center',fontFamily:'monospace',color:t.ats_wins/(t.ats_wins+t.ats_losses||1)>=.55?C.win:C.muted}}>{t.ats_wins}-{t.ats_losses}</td>
        <td style={{padding:'7px 8px',textAlign:'center',fontFamily:'monospace',color:C.neutral}}>{t.elo_rating}</td>
        <td style={{padding:'7px 8px',fontFamily:'monospace',letterSpacing:2}}>{(t.recent_form||'?????').split('').map((c:string,j:number)=><span key={j} style={{color:c==='W'?C.win:c==='L'?C.loss:C.dim}}>{c}</span>)}</td>
      </tr>)}</tbody>
    </table></Card>}
    {sportTab==='ALERTS'&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
      {(alerts||[]).length===0?<Card><div style={{textAlign:'center',padding:24,color:C.muted}}>No sharp alerts for {sport} yet.</div></Card>
      :(alerts||[]).map((a:any)=><div key={a.id} style={{background:`rgba(0,229,255,.05)`,border:`1px solid rgba(0,229,255,.18)`,borderRadius:10,padding:12}}>
        <div style={{fontSize:11,fontWeight:700,color:C.edge,marginBottom:4}}>⚡ {a.alert_type} — {a.away_abbr} @ {a.home_abbr}</div>
        <div style={{fontSize:11,color:C.muted}}>{a.reasoning}</div>
      </div>)}
    </div>}
  </>;
}

function LiveView({live}:any) {
  return <>
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
      <span style={{fontSize:20}}>📡</span>
      <h1 style={{fontWeight:700,fontSize:20}}>Live Tracker</h1>
      {live.length>0&&<><span className="pulse-live"/><span style={{fontSize:11,color:C.win,fontWeight:600}}>{live.length} live</span></>}
    </div>
    {live.length===0?<Card><div style={{textAlign:'center',padding:64}}>
      <div style={{fontSize:32,marginBottom:12}}>📡</div>
      <div style={{fontWeight:600,fontSize:15,marginBottom:6}}>No live games right now</div>
      <div style={{color:C.muted,fontSize:12}}>Live scores and probability updates appear here automatically.</div>
    </div></Card>
    :<div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
      {live.map((g:any)=><Card key={g.id}>
        <div className="signal-bar" style={{marginBottom:12}}/>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span className="pulse-live"/><span style={{fontSize:10,fontWeight:700,color:C.win}}>LIVE</span>
            <span style={{fontSize:10,color:C.muted,fontFamily:'monospace'}}>{g.quarter}</span>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-around',marginBottom:12}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{g.away_abbr}</div>
            <div style={{fontSize:36,fontWeight:800,fontFamily:'monospace'}}>{g.away_score||0}</div>
          </div>
          <div style={{color:C.dim,fontWeight:600}}>@</div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{g.home_abbr}</div>
            <div style={{fontSize:36,fontWeight:800,fontFamily:'monospace'}}>{g.home_score||0}</div>
          </div>
        </div>
      </Card>)}
    </div>}
  </>;
}

function PortfolioView({bets,stats,onLogBet}:any) {
  const settled = bets.filter((b:any)=>b.result!=='PENDING');
  const bankrollHistory = [1000,...settled.map((_:any,i:number)=>{
    const sub = settled.slice(0,i+1);
    return 1000+sub.reduce((s:number,b:any)=>s+(b.profit_loss||0),0);
  })].map((v,i)=>({day:i,value:v}));

  return <>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
      <div><h1 style={{fontWeight:700,fontSize:20}}>Portfolio</h1><div style={{fontSize:11,color:C.muted,marginTop:2}}>{settled.length} settled · {bets.filter((b:any)=>b.result==='PENDING').length} pending</div></div>
      <button onClick={onLogBet} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:10,background:C.edge,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,color:C.void}}>+ Log Bet</button>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
      {[
        {l:'Bankroll',v:`$${(stats.bankroll||1000).toFixed(0)}`,s:`${stats.totalProfit>=0?'+':''}$${Math.abs(stats.totalProfit||0).toFixed(2)}`,c:C.text,sc:stats.totalProfit>=0?C.win:C.loss},
        {l:'Record',v:`${stats.wins||0}W-${stats.losses||0}L`,s:stats.wins+stats.losses>0?`${(stats.winRate||0).toFixed(1)}% win rate`:'No settled bets',c:C.text,sc:C.muted},
        {l:'ROI',v:stats.wins+stats.losses>0?`${stats.roi>=0?'+':''}${(stats.roi||0).toFixed(1)}%`:'—',s:'Return on investment',c:stats.roi>0?C.win:stats.roi<0?C.loss:C.muted,sc:C.muted},
        {l:'Avg CLV',v:stats.wins+stats.losses>0?`${stats.avgCLV>=0?'+':''}${(stats.avgCLV||0).toFixed(2)}`:'—',s:stats.avgCLV>0?'Beating closing line ✓':'Below closing line',c:stats.avgCLV>0?C.win:stats.avgCLV<0?C.loss:C.muted,sc:C.muted},
      ].map(s=><Card key={s.l} style={{padding:14}}><div style={{fontSize:9,color:C.muted,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>{s.l}</div><div style={{fontSize:20,fontWeight:700,color:s.c,lineHeight:1,marginBottom:4}}>{s.v}</div><div style={{fontSize:10,color:s.sc}}>{s.s}</div></Card>)}
    </div>
    {/* CLV Tracker */}
    <Card style={{marginBottom:16,border:`1px solid ${C.edge}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div><div style={{fontWeight:600,fontSize:13}}>Closing Line Value</div><div style={{fontSize:10,color:C.muted}}>The single most important metric in sports betting</div></div>
        {stats.avgCLV>0.5&&<span style={{fontSize:9,padding:'2px 8px',borderRadius:4,border:`1px solid ${C.edge}`,color:C.edge,fontFamily:'monospace',fontWeight:700}}>⚡ SHARP BETTOR</span>}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:14}}>
        <div style={{textAlign:'center'}}><div style={{fontSize:24,fontWeight:700,color:stats.avgCLV>0?C.win:C.loss}}>{stats.avgCLV>0?'+':''}{(stats.avgCLV||0).toFixed(2)}</div><div style={{fontSize:9,color:C.muted,textTransform:'uppercase'}}>Avg CLV</div></div>
        <div style={{textAlign:'center'}}><div style={{fontSize:24,fontWeight:700,color:stats.clvPositivePct>55?C.win:C.gold}}>{(stats.clvPositivePct||0).toFixed(0)}%</div><div style={{fontSize:9,color:C.muted,textTransform:'uppercase'}}>Beat closing line</div></div>
        <div style={{textAlign:'center'}}><div style={{fontSize:24,fontWeight:700,color:C.neutral}}>{settled.filter((b:any)=>b.clv!==null).length}</div><div style={{fontSize:9,color:C.muted,textTransform:'uppercase'}}>CLV tracked</div></div>
      </div>
      <div style={{height:4,borderRadius:4,background:C.elevated,position:'relative'}}>
        <div style={{position:'absolute',left:'50%',top:0,bottom:0,width:1,background:C.dim}}/>
        <div style={{position:'absolute',top:4,width:12,height:12,borderRadius:'50%',background:stats.avgCLV>0?C.win:C.loss,boxShadow:`0 0 8px ${stats.avgCLV>0?C.win:C.loss}`,left:`calc(50% + ${Math.max(-44,Math.min(44,(stats.avgCLV||0)*8))}% - 6px)`,transform:'translateY(-4px)',transition:'left .7s'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:C.muted,fontFamily:'monospace',marginTop:6}}><span>-3 (below market)</span><span>+3 (beating market)</span></div>
    </Card>
    {/* Bankroll chart */}
    {bankrollHistory.length>1&&<Card style={{marginBottom:16}}>
      <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>Bankroll History</div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={bankrollHistory}>
          <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={stats.totalProfit>=0?C.win:C.loss} stopOpacity={.15}/><stop offset="95%" stopColor={stats.totalProfit>=0?C.win:C.loss} stopOpacity={0}/></linearGradient></defs>
          <XAxis dataKey="day" hide/>
          <YAxis hide domain={['auto','auto']}/>
          <Tooltip contentStyle={{background:C.elevated,border:`1px solid ${C.border}`,borderRadius:8,fontSize:10}} formatter={(v:any)=>[`$${Number(v).toFixed(2)}`,'Bankroll']}/>
          <Area type="monotone" dataKey="value" stroke={stats.totalProfit>=0?C.win:C.loss} fill="url(#bg)" strokeWidth={2}/>
        </AreaChart>
      </ResponsiveContainer>
    </Card>}
    {/* Bet history */}
    <Card>
      <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>Bet History</div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead><tr style={{fontSize:9,color:C.dim,textTransform:'uppercase',borderBottom:`1px solid ${C.border}`}}>
            {['Sport','Pick','Line @ Bet','Close','CLV','Odds','Stake','P/L','Result'].map(h=><th key={h} style={{padding:'5px 8px',textAlign:'center',fontWeight:600}}>{h}</th>)}
          </tr></thead>
          <tbody>{bets.map((b:any)=><tr key={b.id} style={{borderBottom:`1px solid rgba(255,255,255,.03)`,transition:'background .1s'}} onMouseEnter={e=>(e.currentTarget.style.background=C.elevated)} onMouseLeave={e=>(e.currentTarget.style.background='none')}>
            <td style={{padding:'7px 8px',textAlign:'center'}}><span style={{fontSize:9,padding:'2px 5px',borderRadius:3,background:'rgba(0,229,255,.08)',color:C.edge,fontFamily:'monospace'}}>{b.sport}</span></td>
            <td style={{padding:'7px 8px',fontFamily:'monospace',fontWeight:500}}>{b.side}</td>
            <td style={{padding:'7px 8px',textAlign:'center',fontFamily:'monospace'}}>{b.line_at_bet}</td>
            <td style={{padding:'7px 8px',textAlign:'center',fontFamily:'monospace',color:C.muted}}>{b.closing_line??'—'}</td>
            <td style={{padding:'7px 8px',textAlign:'center',fontFamily:'monospace',color:b.clv>0?C.win:b.clv<0?C.loss:C.muted}}>{b.clv!=null?`${b.clv>0?'+':''}${b.clv.toFixed(1)}`:'—'}</td>
            <td style={{padding:'7px 8px',textAlign:'center',fontFamily:'monospace',color:C.muted}}>{b.odds>0?`+${b.odds}`:b.odds}</td>
            <td style={{padding:'7px 8px',textAlign:'center',fontFamily:'monospace'}}>${b.stake}</td>
            <td style={{padding:'7px 8px',textAlign:'center',fontFamily:'monospace',fontWeight:700,color:b.profit_loss>0?C.win:b.profit_loss<0?C.loss:C.muted}}>{b.profit_loss!=null?`${b.profit_loss>0?'+':''}$${Math.abs(b.profit_loss).toFixed(0)}`:'—'}</td>
            <td style={{padding:'7px 8px',textAlign:'center'}}><span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:3,background:b.result==='WIN'?'rgba(0,255,136,.12)':b.result==='LOSS'?'rgba(255,61,90,.12)':'rgba(255,255,255,.05)',color:b.result==='WIN'?C.win:b.result==='LOSS'?C.loss:C.muted}}>{b.result}</span></td>
          </tr>)}</tbody>
        </table>
      </div>
    </Card>
  </>;
}

function AnalyticsView({bets,preds}:any) {
  const settled = bets.filter((b:any)=>b.result!=='PENDING');
  const bySport = ['NFL','NBA','UFC','MLB'].map(sport=>{
    const sb = settled.filter((b:any)=>b.sport===sport);
    const w = sb.filter((b:any)=>b.result==='WIN').length;
    const l = sb.filter((b:any)=>b.result==='LOSS').length;
    return {sport,winRate:w+l>0?Math.round((w/(w+l))*100):0,total:w+l};
  }).filter(s=>s.total>0);

  const calibration = [60,65,70,75].map(band=>{
    const bp = preds.filter((p:any)=>p.confidence>=band&&p.confidence<band+5);
    const w = bp.filter((p:any)=>p.result==='WIN').length;
    const t = bp.filter((p:any)=>['WIN','LOSS'].includes(p.result)).length;
    return {band:`${band}%`,actual:t>0?Math.round((w/t)*100):null,n:t,predicted:band+2};
  });

  return <>
    <h1 style={{fontWeight:700,fontSize:20,marginBottom:6}}>Analytics</h1>
    <p style={{color:C.muted,fontSize:12,marginBottom:20}}>Model performance · CLV calibration · Portfolio breakdown</p>
    {settled.length<3?<Card><div style={{textAlign:'center',padding:48,color:C.muted}}><div style={{fontSize:32,marginBottom:8}}>📊</div><div>Log 5+ settled bets to see analytics</div></div></Card>:<>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
      {bySport.length>0&&<Card>
        <div style={{fontWeight:600,fontSize:13,marginBottom:12}}>Win Rate by Sport</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={bySport}>
            <XAxis dataKey="sport" tick={{fill:C.muted,fontSize:10}}/>
            <YAxis domain={[45,75]} tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>`${v}%`}/>
            <Tooltip contentStyle={{background:C.elevated,border:`1px solid ${C.border}`,borderRadius:8,fontSize:10}} formatter={(v:any)=>[`${v}%`,'Win Rate']}/>
            <Bar dataKey="winRate" radius={[4,4,0,0]}>{bySport.map((s,i)=><Cell key={i} fill={s.winRate>=55?C.win:s.winRate>=52?C.gold:C.loss}/>)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>}
      <Card>
        <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>Calibration</div>
        <div style={{fontSize:10,color:C.muted,marginBottom:12}}>Does 70% confidence actually win 70% of the time?</div>
        {calibration.filter(c=>c.n>0).map(c=><div key={c.band} style={{marginBottom:10}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:4}}>
            <span style={{color:C.muted,fontFamily:'monospace'}}>{c.band}</span>
            <span style={{color:c.actual&&c.actual>=55?C.win:C.gold}}>{c.actual!=null?`${c.actual}% actual`:'—'} ({c.n} bets)</span>
          </div>
          <div style={{height:4,borderRadius:4,background:C.elevated,overflow:'hidden'}}><div style={{height:'100%',width:`${c.actual||0}%`,background:c.actual&&c.actual>=55?C.win:C.gold,transition:'width .5s'}}/></div>
        </div>)}
      </Card>
    </div>
    </>}
  </>;
}

function AIChat() {
  const [msgs, setMsgs] = useState([{role:'assistant',content:"Hey — I'm your ProPredict AI. I have full context on your betting history and today's sharp signals. Ask me anything: CLV breakdown, worst bet types, value picks, model reasoning."}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async(text:string) => {
    if(!text.trim()||loading)return;
    setMsgs(m=>[...m,{role:'user',content:text}]);
    setInput('');setLoading(true);
    try {
      const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text,history:msgs})});
      const d = await res.json();
      setMsgs(m=>[...m,{role:'assistant',content:d.response||'Error getting response.'}]);
    } catch { setMsgs(m=>[...m,{role:'assistant',content:'Connect your Anthropic API key in .env.local to enable AI chat.'}]); }
    setLoading(false);
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 120px)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <span style={{fontSize:20}}>🤖</span>
        <h1 style={{fontWeight:700,fontSize:20}}>AI Chat</h1>
        <span style={{fontSize:9,padding:'2px 7px',borderRadius:3,border:`1px solid ${C.edge}`,color:C.edge,fontFamily:'monospace'}}>CLAUDE SONNET 4.6</span>
      </div>
      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:12,marginBottom:16}}>
        {msgs.map((m,i)=><div key={i} style={{display:'flex',gap:10,flexDirection:m.role==='user'?'row-reverse':'row'}}>
          <div style={{width:28,height:28,borderRadius:8,background:m.role==='user'?C.neutral:`linear-gradient(135deg,${C.edge},${C.neutral})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:C.void,flexShrink:0}}>{m.role==='user'?'U':'AI'}</div>
          <div style={{maxWidth:'75%',padding:'10px 14px',borderRadius:12,background:m.role==='user'?C.neutral:C.elevated,border:m.role==='assistant'?`1px solid ${C.border}`:'none',color:m.role==='user'?C.void:C.text,fontSize:12,lineHeight:1.7}}>{m.content}</div>
        </div>)}
        {loading&&<div style={{display:'flex',gap:10}}><div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${C.edge},${C.neutral})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:C.void}}>AI</div><div style={{padding:'10px 14px',borderRadius:12,background:C.elevated,border:`1px solid ${C.border}`,display:'flex',gap:4,alignItems:'center'}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:C.muted,animation:`pulse ${0.6+i*0.2}s ease-in-out infinite`}}/>)}</div></div>}
      </div>
      {msgs.length===1&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
        {["What's my worst bet type?","Show me CLV breakdown","Best picks this week","Any sharp signals today?"].map(q=><button key={q} onClick={()=>send(q)} style={{padding:10,borderRadius:8,border:`1px solid ${C.border}`,background:C.elevated,cursor:'pointer',fontSize:11,color:C.muted,textAlign:'left'}} onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.borderColor=C.edge;}} onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.borderColor=C.border;}}>{q}</button>)}
      </div>}
      <div style={{display:'flex',gap:10,borderTop:`1px solid ${C.border}`,paddingTop:12}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send(input)} placeholder="Ask about your portfolio, picks, sharp signals…" style={{flex:1,background:C.elevated,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px',fontSize:12,color:C.text,outline:'none'}} onFocus={e=>e.target.style.borderColor=C.edge} onBlur={e=>e.target.style.borderColor=C.border} disabled={loading}/>
        <button onClick={()=>send(input)} disabled={!input.trim()||loading} style={{width:40,height:40,borderRadius:10,background:C.edge,border:'none',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,opacity:!input.trim()||loading?.4:1}}>→</button>
      </div>
    </div>
  );
}

function AlertsView({alerts}:any) {
  return <>
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
      <span style={{fontSize:20}}>🔔</span>
      <h1 style={{fontWeight:700,fontSize:20}}>Alerts</h1>
      {alerts.length>0&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:12,background:'rgba(255,61,90,.15)',color:C.loss,border:`1px solid rgba(255,61,90,.25)`,fontWeight:700}}>{alerts.length} active</span>}
    </div>
    {alerts.length===0?<Card><div style={{textAlign:'center',padding:48,color:C.muted}}><div style={{fontSize:32,marginBottom:8}}>🔔</div><div>Sharp signals, steam moves, and settled bets appear here.</div></div></Card>
    :<div style={{display:'flex',flexDirection:'column',gap:8}}>
      {alerts.map((a:any)=><div key={a.id} style={{background:a.alert_type==='STEAM_MOVE'?'rgba(255,209,102,.06)':'rgba(0,229,255,.05)',border:`1px solid ${a.alert_type==='STEAM_MOVE'?'rgba(255,209,102,.2)':'rgba(0,229,255,.18)'}`,borderRadius:10,padding:14,display:'flex',gap:12,alignItems:'flex-start'}}>
        <span style={{fontSize:18}}>{a.alert_type==='STEAM_MOVE'?'⚡':'↩'}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:600,color:a.alert_type==='STEAM_MOVE'?C.gold:C.edge,marginBottom:4}}>{a.alert_type==='STEAM_MOVE'?'Steam Move':'Reverse Line Movement'} — {a.sport} {a.away_abbr}@{a.home_abbr}</div>
          <div style={{fontSize:11,color:C.muted}}>{a.reasoning}</div>
          <div style={{fontSize:10,color:C.dim,fontFamily:'monospace',marginTop:4}}>{new Date(a.triggered_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</div>
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          <div style={{fontSize:13,fontWeight:700,fontFamily:'monospace',color:a.alert_type==='STEAM_MOVE'?C.gold:C.edge}}>{a.from_line} → {a.to_line}</div>
          <div style={{fontSize:9,color:C.muted,textTransform:'uppercase'}}>{a.side}</div>
        </div>
      </div>)}
    </div>}
  </>;
}

function LogBetModal({onClose,onSaved}:any) {
  const [form, setForm] = useState({sport:'NFL',side:'',line_at_bet:'',odds:'-110',stake:'',book:'DraftKings',notes:''});
  const [saving, setSaving] = useState(false);
  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));

  const save = async() => {
    if(!form.side||!form.stake||!form.line_at_bet)return;
    setSaving(true);
    await fetch('/api/data?action=logbet',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,line_at_bet:parseFloat(form.line_at_bet),odds:parseInt(form.odds),stake:parseFloat(form.stake)})});
    setSaving(false);onSaved();
  };

  const potWin = parseFloat(form.stake)>0&&parseInt(form.odds) ? parseInt(form.odds)>0 ? parseFloat(form.stake)*(parseInt(form.odds)/100) : parseFloat(form.stake)*(100/Math.abs(parseInt(form.odds))) : 0;

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(7,8,16,.85)',backdropFilter:'blur(8px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:440,background:C.surface,border:`1px solid ${C.edge}`,borderRadius:16,padding:24,boxShadow:'0 25px 80px rgba(0,0,0,.8)'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:16}}>Log a Bet</div>
          <button onClick={onClose} style={{background:C.elevated,border:'none',borderRadius:6,width:26,height:26,cursor:'pointer',color:C.muted,fontSize:14}}>✕</button>
        </div>
        <div style={{display:'grid',gap:12}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <Label label="Sport"><select value={form.sport} onChange={e=>set('sport',e.target.value)} style={inputStyle}>{['NFL','NBA','UFC','MLB','NHL'].map(s=><option key={s}>{s}</option>)}</select></Label>
            <Label label="Side / Pick"><input value={form.side} onChange={e=>set('side',e.target.value)} placeholder="KC -3.5" style={inputStyle}/></Label>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
            <Label label="Line at Bet"><input value={form.line_at_bet} onChange={e=>set('line_at_bet',e.target.value)} type="number" step=".5" placeholder="-3.5" style={inputStyle}/></Label>
            <Label label="Odds"><input value={form.odds} onChange={e=>set('odds',e.target.value)} type="number" placeholder="-110" style={inputStyle}/></Label>
            <Label label="Stake ($)"><input value={form.stake} onChange={e=>set('stake',e.target.value)} type="number" step=".01" placeholder="100" style={inputStyle}/></Label>
          </div>
          {potWin>0&&<div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'rgba(0,255,136,.06)',border:'1px solid rgba(0,255,136,.15)',borderRadius:8}}>
            <span style={{color:C.win}}>↑</span><span style={{fontSize:11,color:C.muted}}>Win:</span><span style={{fontWeight:700,color:C.win,fontFamily:'monospace'}}>${potWin.toFixed(2)}</span>
          </div>}
          <Label label="Book"><select value={form.book} onChange={e=>set('book',e.target.value)} style={inputStyle}>
            {['DraftKings','FanDuel','BetMGM','Caesars','BetRivers','PointsBet','Other'].map(b=><option key={b}>{b}</option>)}
          </select></Label>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <button onClick={onClose} style={{flex:1,padding:'10px',borderRadius:10,border:`1px solid ${C.border}`,background:'none',cursor:'pointer',fontSize:12,color:C.muted}}>Cancel</button>
            <button onClick={save} disabled={!form.side||!form.stake||!form.line_at_bet||saving} style={{flex:1,padding:'10px',borderRadius:10,border:'none',background:C.edge,cursor:'pointer',fontSize:12,fontWeight:700,color:C.void,opacity:!form.side||!form.stake||!form.line_at_bet?.4:1}}>{saving?'Saving…':'Log Bet'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle:any = {width:'100%',background:'#161B2E',border:'1px solid rgba(123,140,222,.14)',borderRadius:8,padding:'8px 10px',fontSize:12,color:'#F0F4FF',outline:'none',fontFamily:'inherit'};
function Label({label,children}:any){return <div><div style={{fontSize:9,color:'#4A5278',fontWeight:600,letterSpacing:.5,textTransform:'uppercase',marginBottom:5}}>{label}</div>{children}</div>;}
