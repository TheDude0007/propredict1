import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "dashboard";

  try {
    const db = getDb();

    if (type === "dashboard") {
      const predictions = db.prepare(`
        SELECT p.*, g.sport, g.home_team_id, g.away_team_id, g.game_time, g.status, g.home_score, g.away_score, g.quarter,
          h.abbreviation as home_abbr, h.name as home_name, h.city as home_city, h.primary_color as home_color,
          a.abbreviation as away_abbr, a.name as away_name, a.city as away_city, a.primary_color as away_color
        FROM predictions p
        JOIN games g ON p.game_id = g.id
        JOIN teams h ON g.home_team_id = h.id
        JOIN teams a ON g.away_team_id = a.id
        WHERE p.confidence > 0
        ORDER BY p.confidence DESC
      `).all();

      const bets = db.prepare(`SELECT * FROM betting_records ORDER BY placed_at DESC`).all();
      const alerts = db.prepare(`
        SELECT sa.*, g.sport,
          h.abbreviation as home_abbr, a.abbreviation as away_abbr
        FROM sharp_alerts sa
        JOIN games g ON sa.game_id = g.id
        JOIN teams h ON g.home_team_id = h.id
        JOIN teams a ON g.away_team_id = a.id
        ORDER BY triggered_at DESC
      `).all();

      const liveGames = db.prepare(`
        SELECT g.*, h.abbreviation as home_abbr, h.name as home_name, h.primary_color as home_color,
          a.abbreviation as away_abbr, a.name as away_name, a.primary_color as away_color
        FROM games g
        JOIN teams h ON g.home_team_id = h.id
        JOIN teams a ON g.away_team_id = a.id
        WHERE g.status = 'LIVE'
      `).all();

      // Compute real portfolio stats
      const settled = (bets as any[]).filter(b => b.result !== 'PENDING');
      const wins = settled.filter(b => b.result === 'WIN').length;
      const losses = settled.filter(b => b.result === 'LOSS').length;
      const totalStake = settled.reduce((s:number, b:any) => s + b.stake, 0);
      const totalProfit = settled.reduce((s:number, b:any) => s + (b.profit_loss || 0), 0);
      const clvBets = settled.filter((b:any) => b.clv !== null);
      const avgCLV = clvBets.length > 0 ? clvBets.reduce((s:number,b:any)=>s+b.clv,0)/clvBets.length : 0;

      return NextResponse.json({
        predictions: predictions.map((p:any) => ({
          ...p,
          key_factors: JSON.parse(p.key_factors || '[]'),
          risk_factors: JSON.parse(p.risk_factors || '[]'),
        })),
        liveGames,
        alerts,
        bets,
        stats: {
          wins, losses,
          winRate: wins+losses > 0 ? (wins/(wins+losses))*100 : 0,
          roi: totalStake > 0 ? (totalProfit/totalStake)*100 : 0,
          totalProfit,
          avgCLV,
          clvPositivePct: clvBets.length > 0 ? (clvBets.filter((b:any)=>b.clv>0).length/clvBets.length)*100 : 0,
          bankroll: 1000 + totalProfit,
          startingBankroll: 1000,
        }
      });
    }

    if (type === "sport") {
      const sport = (searchParams.get("sport") || "NFL").toUpperCase();
      const predictions = db.prepare(`
        SELECT p.*, g.game_time, g.status, g.home_score, g.away_score, g.quarter,
          h.abbreviation as home_abbr, h.name as home_name, h.city as home_city, h.primary_color as home_color, h.elo_rating as home_elo, h.win_pct as home_win_pct, h.ats_wins as home_ats_w, h.ats_losses as home_ats_l, h.recent_form as home_form,
          a.abbreviation as away_abbr, a.name as away_name, a.city as away_city, a.primary_color as away_color, a.elo_rating as away_elo, a.win_pct as away_win_pct, a.ats_wins as away_ats_w, a.ats_losses as away_ats_l, a.recent_form as away_form
        FROM predictions p
        JOIN games g ON p.game_id = g.id
        JOIN teams h ON g.home_team_id = h.id
        JOIN teams a ON g.away_team_id = a.id
        WHERE p.sport = ? AND p.confidence > 0
        ORDER BY p.confidence DESC
      `).all(sport);

      const teams = db.prepare(`SELECT * FROM teams WHERE sport = ? ORDER BY win_pct DESC`).all(sport);
      const alerts = db.prepare(`
        SELECT sa.*, h.abbreviation as home_abbr, a.abbreviation as away_abbr
        FROM sharp_alerts sa
        JOIN games g ON sa.game_id = g.id
        JOIN teams h ON g.home_team_id = h.id
        JOIN teams a ON g.away_team_id = a.id
        WHERE g.sport = ? ORDER BY triggered_at DESC
      `).all(sport);

      return NextResponse.json({
        predictions: predictions.map((p:any) => ({...p, key_factors: JSON.parse(p.key_factors||'[]'), risk_factors: JSON.parse(p.risk_factors||'[]')})),
        teams,
        alerts,
        sport
      });
    }

    if (type === "portfolio") {
      const bets = db.prepare(`SELECT * FROM betting_records ORDER BY placed_at DESC`).all();
      return NextResponse.json({ bets });
    }

    return NextResponse.json({ error: "unknown type" }, { status: 400 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const db = getDb();
  const body = await req.json();

  if (action === "logbet") {
    const id = require('crypto').randomUUID().slice(0,8);
    db.prepare(`INSERT INTO betting_records VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),null)`)
      .run(id, body.game_id || 'manual', body.sport || 'NFL', body.bet_type || 'SPREAD', body.side, body.line_at_bet, null, null, body.odds || -110, body.stake, body.stake/100, 'PENDING', null, body.book || 'DraftKings', body.notes || null);
    return NextResponse.json({ id });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
