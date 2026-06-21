const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const uid = () => crypto.randomUUID().slice(0,8);

const db = new Database(path.join(process.cwd(), 'propredict.db'));
db.pragma('journal_mode = WAL');

// Init schema
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, sport TEXT, name TEXT, abbreviation TEXT, city TEXT, conference TEXT, division TEXT, elo_rating INTEGER DEFAULT 1500, win_pct REAL DEFAULT 0.5, ats_wins INTEGER DEFAULT 0, ats_losses INTEGER DEFAULT 0, recent_form TEXT DEFAULT '?????', primary_color TEXT DEFAULT '#000000');
  CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY, sport TEXT, home_team_id TEXT, away_team_id TEXT, game_time TEXT, status TEXT DEFAULT 'SCHEDULED', home_score INTEGER, away_score INTEGER, quarter TEXT, venue TEXT);
  CREATE TABLE IF NOT EXISTS predictions (id TEXT PRIMARY KEY, game_id TEXT, sport TEXT, pick_type TEXT, pick_side TEXT, line REAL, confidence INTEGER, expected_value REAL DEFAULT 0, kelly_pct REAL DEFAULT 0, sharp_money_pct INTEGER, public_pct INTEGER, steam_flag INTEGER DEFAULT 0, key_factors TEXT DEFAULT '[]', risk_factors TEXT DEFAULT '[]', model_reasoning TEXT DEFAULT '', contrarian_case TEXT DEFAULT '', result TEXT, clv REAL, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS betting_records (id TEXT PRIMARY KEY, game_id TEXT, sport TEXT, bet_type TEXT, side TEXT, line_at_bet REAL, closing_line REAL, clv REAL, odds INTEGER, stake REAL, units REAL DEFAULT 1, result TEXT DEFAULT 'PENDING', profit_loss REAL, book TEXT, notes TEXT, placed_at TEXT DEFAULT (datetime('now')), settled_at TEXT);
  CREATE TABLE IF NOT EXISTS sharp_alerts (id TEXT PRIMARY KEY, game_id TEXT, alert_type TEXT, side TEXT, movement_pts REAL, from_line REAL, to_line REAL, public_pct INTEGER, reasoning TEXT, triggered_at TEXT DEFAULT (datetime('now')));
`);

const now = new Date();

// ── TEAMS
const NFL = [
  ['KC','Chiefs','Kansas City','AFC','West',1680,0.75,11,5,'WWLWW','#E31837'],
  ['SF','49ers','San Francisco','NFC','West',1650,0.72,10,6,'WWWLW','#AA0000'],
  ['BAL','Ravens','Baltimore','AFC','North',1640,0.69,9,7,'WLWWW','#241773'],
  ['DAL','Cowboys','Dallas','NFC','East',1600,0.65,8,8,'LWWLW','#003594'],
  ['PHI','Eagles','Philadelphia','NFC','East',1590,0.63,9,7,'WLWWL','#004C54'],
  ['BUF','Bills','Buffalo','AFC','East',1530,0.54,7,9,'LWLWW','#00338D'],
  ['MIA','Dolphins','Miami','AFC','East',1580,0.62,8,8,'WWLLW','#008E97'],
  ['DET','Lions','Detroit','NFC','North',1560,0.59,10,6,'WWWWL','#0076B6'],
  ['GB','Packers','Green Bay','NFC','North',1540,0.55,7,9,'WLLWW','#203731'],
  ['LAR','Rams','Los Angeles','NFC','West',1500,0.50,6,10,'LLLWW','#003594'],
  ['CIN','Bengals','Cincinnati','AFC','North',1510,0.50,8,8,'LWWLL','#FB4F14'],
  ['SEA','Seahawks','Seattle','NFC','West',1490,0.47,6,10,'LLLLL','#002244'],
];

const NBA = [
  ['BOS','Celtics','Boston','Eastern','Atlantic',1680,0.79,28,18,'WWWWW','#007A33'],
  ['OKC','Thunder','Oklahoma City','Western','Northwest',1640,0.73,25,21,'WWLWW','#007AC1'],
  ['DEN','Nuggets','Denver','Western','Northwest',1620,0.70,24,22,'WLWWL','#0E2240'],
  ['CLE','Cavaliers','Cleveland','Eastern','Central',1600,0.68,27,19,'WWWLW','#860038'],
  ['MIL','Bucks','Milwaukee','Eastern','Central',1580,0.62,22,24,'LWWWL','#00471B'],
  ['MIN','Timberwolves','Minnesota','Western','Northwest',1560,0.59,23,23,'WLLWW','#0C2340'],
  ['NYK','Knicks','New York','Eastern','Atlantic',1540,0.55,20,26,'LWWLL','#006BB6'],
  ['GSW','Warriors','San Francisco','Western','Pacific',1520,0.52,21,25,'WLLWL','#1D428A'],
  ['LAL','Lakers','Los Angeles','Western','Pacific',1500,0.50,19,27,'LLWLW','#552583'],
  ['DAL','Mavericks','Dallas','Western','Southwest',1480,0.47,18,28,'LLLWL','#00538C'],
];

const tStmt = db.prepare('INSERT OR REPLACE INTO teams VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
const teamIds = {};

NFL.forEach(t => { const id=uid(); tStmt.run(id,'NFL',t[1],t[0],t[2],t[3],t[4],t[5],t[6],t[7],t[8],t[9],t[10]); teamIds['NFL_'+t[0]]=id; });
NBA.forEach(t => { const id=uid(); tStmt.run(id,'NBA',t[1],t[0],t[2],t[3],t[4],t[5],t[6],t[7],t[8],t[9],t[10]); teamIds['NBA_'+t[0]]=id; });
console.log('  ✓ Teams: NFL(12) NBA(10)');

// ── GAMES + PREDICTIONS
const gStmt = db.prepare('INSERT OR REPLACE INTO games VALUES (?,?,?,?,?,?,?,?,?,?)');
const pStmt = db.prepare('INSERT OR REPLACE INTO predictions VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
const aStmt = db.prepare('INSERT OR REPLACE INTO sharp_alerts VALUES (?,?,?,?,?,?,?,?,?,?)');

const GAMES = [
  // NFL
  { sport:'NFL', home:'KC', away:'BAL', hrs:2, spread:-3.5, total:47.5, conf:72, ev:4.2, kelly:1.8, sharp:65, pub:38, steam:1, pick:'home', type:'SPREAD', factors:['Home field advantage + 7 days rest','BAL on back-to-back road games','RLM: -2.5 open → -3.5 current vs 38% public','4 steam moves across DraftKings, FanDuel, Caesars, BetMGM'], risks:['BAL elite rush offense (2nd in NFL)','Wind 18mph could affect passing game'], reason:'Strongest sharp signal of the week. Steam move + reverse line movement combo — 65% sharp money on KC with only 38% public.' },
  { sport:'NFL', home:'PHI', away:'DAL', hrs:6, spread:-2.5, total:44.5, conf:68, ev:3.1, kelly:1.4, sharp:58, pub:44, steam:0, pick:'home', type:'SPREAD', factors:['PHI 9-1 ATS at home vs NFC East','DAL WR1 ruled out — 18% fewer completions without him','Line moved from -1.5 to -2.5 on sharp action','PHI defense top-3 in red zone stops'], risks:['DAL secondary significantly improved last 3 weeks','NFC East divisional game — historically tight spreads'], reason:'Home ATS edge is a statistically significant outlier (71% cover rate in exact spot). Sharp books moved line 1pt with no public catalyst.' },
  { sport:'NFL', home:'DET', away:'GB',  hrs:10, spread:1.5, total:48.5, conf:65, ev:2.8, kelly:1.2, sharp:55, pub:51, steam:0, pick:'over', type:'TOTAL', factors:['Both teams pace > 30 plays/game','Dome game — no weather factor','GB missing both starting CBs','DET averaging 34 PPG at home last 5'], risks:['GB can slow game with 22 min ball control','Total moved from 47.0 — buying high'], reason:'Secondary injuries on both sides make this a shootout setup. Dome + fast pace + CB injuries = over edge.' },
  { sport:'NFL', home:'SF',  away:'SEA', hrs:14, spread:-7.5, total:42.5, conf:78, ev:5.8, kelly:2.6, sharp:71, pub:33, steam:1, pick:'home', type:'SPREAD', factors:['71% sharp money on SF (-7.5) vs 33% public','RLM: opened -6.0, now -7.5 — 1.5pt movement','Steam move 4 books simultaneously 90min ago','SEA 2-8 ATS as road dog > 7 this season','SF 6-1 ATS after bye week'], risks:['Large spread on divisional game','SEA Geno Smith has covered 60% vs SF in career'], reason:'Highest-confidence sharp play this week. Steam + RLM combo with 71% sharp money is a rare convergence signal. Play this immediately.' },
  { sport:'NFL', home:'MIA', away:'BUF', hrs:20, spread:3.5, total:50.5, conf:61, ev:1.9, kelly:0.9, sharp:52, pub:49, steam:0, pick:'away', type:'SPREAD', factors:['BUF 8-2 ATS on road this season (elite outlier)','MIA 1-5 ATS as home favorite in AFC East','Josh Allen 102.3 passer rating at MIA (career)'], risks:['MIA improved defensive line','Divisional games compress spreads'], reason:'BUF road ATS record is a genuine statistical edge. MIA home favorite ATS record in this spot is one of the worst in the league.' },
  // LIVE NFL
  { sport:'NFL', home:'SF', away:'KC', hrs:-1, spread:-1.5, total:49.5, conf:0, ev:0, kelly:0, sharp:0, pub:0, steam:0, pick:'home', type:'SPREAD', factors:[], risks:[], reason:'', status:'LIVE', homeScore:17, awayScore:14, q:'Q3', time:'6:42' },
  // NBA
  { sport:'NBA', home:'BOS', away:'NYK', hrs:3, spread:-8.5, total:225.5, conf:75, ev:4.9, kelly:2.2, sharp:68, pub:35, steam:1, pick:'home', type:'SPREAD', factors:['BOS 22-8 ATS at home this season','NYK 2-8 ATS vs top-5 defensive teams','RLM: -7.0 → -8.5 vs 65% public on NYK','Tatum averaging 32 PPG in last 8 home games','Steam move: 4 books, 8 min window'], risks:['BOS on back-to-back (played in NYC last night)','NYK Brunson revenge game narrative'], reason:'Steam + RLM with 68% sharp money is strongest NBA signal this week. BOS back-to-back is only concern — sharps have priced it in.' },
  { sport:'NBA', home:'DEN', away:'LAL', hrs:5, spread:-5.5, total:232.5, conf:70, ev:3.8, kelly:1.7, sharp:62, pub:42, steam:0, pick:'home', type:'SPREAD', factors:['Jokic 29/17/8 average vs LAL last 4 meetings','LAL AD listed as questionable — removes interior deterrent','DEN altitude home edge (historically 2.5 pts)','DEN 11-2 ATS vs Western Conference this year'], risks:['LeBron motivated revenge game (eliminated by DEN last year)','Large spread for Western Conference divisional'], reason:'AD injury report dramatically tilts this. Without him LAL has no answer for Jokic. Line will move further if AD ruled out.' },
  { sport:'NBA', home:'MIN', away:'OKC', hrs:7, spread:3.5, total:218.5, conf:67, ev:3.2, kelly:1.4, sharp:59, pub:47, steam:0, pick:'over', type:'TOTAL', factors:['Both teams > 100 possessions/game (top-8 pace)','OKC 14-4 O/U away games this season','Total movement: 215.0 open → 218.5 current — sharp action','MIN interior defense depleted post trade deadline'], risks:['MIN can physicalize and slow pace','OKC Holmgren disrupts MIN transition opportunities'], reason:'Total moving up 3.5 points on sharp action when public is split is a clear buy signal. Both pace metrics support over.' },
  // LIVE NBA
  { sport:'NBA', home:'CLE', away:'MIL', hrs:-2, spread:-3.0, total:221.0, conf:0, ev:0, kelly:0, sharp:0, pub:0, steam:0, pick:'home', type:'SPREAD', factors:[], risks:[], reason:'', status:'LIVE', homeScore:68, awayScore:71, q:'Q3', time:'4:18' },
];

let gameCount=0, predCount=0, alertCount=0;
GAMES.forEach(g => {
  const gid = uid();
  const gameTime = new Date(now.getTime() + g.hrs*3600000).toISOString();
  const status = g.status || (g.hrs < 0 ? 'LIVE' : 'SCHEDULED');
  
  gStmt.run(gid, g.sport, teamIds[g.sport+'_'+g.home], teamIds[g.sport+'_'+g.away],
    gameTime, status, g.homeScore||null, g.awayScore||null, g.q||null, 'TBD');
  gameCount++;

  if (g.conf > 0) {
    pStmt.run(uid(), gid, g.sport, g.type, g.pick, g.spread, g.conf, g.ev, g.kelly,
      g.sharp, g.pub, g.steam?1:0,
      JSON.stringify(g.factors), JSON.stringify(g.risks), g.reason,
      `The case for the other side: line value may exist given public sentiment.`, null, null);
    predCount++;

    if (g.steam || g.sharp > 60) {
      aStmt.run(uid(), gid, g.steam?'STEAM_MOVE':'REVERSE_LINE_MOVEMENT',
        g.pick, Math.abs(g.spread)*0.3+0.5, g.spread-1.0, g.spread, g.pub,
        g.steam?`Steam move detected: ${g.spread} line crossed 4+ books within 45 min window`
               :`Reverse line movement: ${g.pub}% public on opposite side, line moved ${Math.abs(g.spread-1.0).toFixed(1)} pts toward sharp side`,
        new Date(now.getTime() - Math.random()*5400000).toISOString());
      alertCount++;
    }
  }
});
console.log(`  ✓ Games: ${gameCount} | Predictions: ${predCount} | Sharp Alerts: ${alertCount}`);

// ── BETTING HISTORY
const rStmt = db.prepare('INSERT OR REPLACE INTO betting_records VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
const fgid = db.prepare('SELECT id FROM games LIMIT 1').get()?.id || uid();
const BET_HISTORY = [
  ['NFL','KC -3.5',-3.5,-5.5,-110,110,'WIN',100,2.0,'DraftKings',3],
  ['NFL','SF -7.0',-7.0,-8.5,-110,110,'WIN',100,1.5,'FanDuel',6],
  ['NBA','BOS -8.0',-8.0,-9.5,-110,220,'WIN',200,1.5,'DraftKings',8],
  ['NFL','DET +2.0', 2.0, 1.0,-110,110,'WIN',100,-1.0,'Caesars',10],
  ['NBA','DEN -5.0',-5.0,-6.5,-110,165,'WIN',150,1.5,'BetMGM',12],
  ['NFL','PHI -2.0',-2.0,-3.0,-110,110,'WIN',100,1.0,'DraftKings',14],
  ['NBA','Over 224', 224,225.5,-110,110,'WIN',100,-1.5,'FanDuel',17],
  ['NFL','MIA +4.0', 4.0, 3.5,-110,110,'WIN',100,0.5,'Caesars',19],
  ['NFL','DAL -3.0',-3.0,-1.5,-110,110,'LOSS',-110,1.5,'DraftKings',22],
  ['NBA','LAL +6.0', 6.0, 5.5,-110,110,'LOSS',-110,0.5,'FanDuel',24],
  ['NFL','GB +1.0',  1.0, 2.5,-110,110,'LOSS',-110,-1.5,'BetMGM',26],
  ['NBA','MIL -4.0',-4.0,-4.5,-110,110,'LOSS',-110,0.5,'Caesars',28],
  ['NFL','KC -3.5', -3.5,null,-110,110,'PENDING',null,null,'DraftKings',0],
  ['NFL','SF -7.5', -7.5,null,-110,165,'PENDING',null,null,'FanDuel',0],
  ['NBA','BOS -8.5',-8.5,null,-110,220,'PENDING',null,null,'DraftKings',0],
];

BET_HISTORY.forEach(r => {
  const daysAgo = r[10];
  const placedAt = new Date(now.getTime() - daysAgo*86400000).toISOString();
  const settledAt = r[6] !== 'PENDING' ? new Date(now.getTime() - (daysAgo-1)*86400000).toISOString() : null;
  rStmt.run(uid(), fgid, r[0], 'SPREAD', r[1], r[2], r[3], r[8], r[4], r[5], r[5]/100, r[6], r[7], r[9], null, placedAt, settledAt);
});
console.log(`  ✓ Betting history: ${BET_HISTORY.length} records`);

console.log('\n  ✅ ProPredict database seeded!\n');
db.close();
