import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { message, history } = await req.json();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.includes('placeholder')) {
    return NextResponse.json({
      response: "AI chat requires your Anthropic API key. Add ANTHROPIC_API_KEY to .env.local — get yours at console.anthropic.com. Everything else in the app works without it."
    });
  }

  try {
    const db = (await import("@/lib/db")).getDb();
    const bets = db.prepare("SELECT * FROM betting_records ORDER BY placed_at DESC LIMIT 50").all() as any[];
    const preds = db.prepare("SELECT * FROM predictions ORDER BY confidence DESC LIMIT 10").all() as any[];
    const alerts = db.prepare("SELECT * FROM sharp_alerts ORDER BY triggered_at DESC LIMIT 5").all() as any[];

    const settled = bets.filter(b => b.result !== 'PENDING');
    const wins = settled.filter(b => b.result === 'WIN').length;
    const losses = settled.filter(b => b.result === 'LOSS').length;
    const totalProfit = settled.reduce((s, b) => s + (b.profit_loss || 0), 0);
    const totalStake = settled.reduce((s, b) => s + b.stake, 0);
    const clvBets = settled.filter(b => b.clv !== null);
    const avgCLV = clvBets.length > 0 ? clvBets.reduce((s, b) => s + b.clv, 0) / clvBets.length : 0;

    const bySport = ['NFL','NBA','UFC','MLB'].map(sport => {
      const sb = settled.filter(b => b.sport === sport);
      const w = sb.filter(b => b.result === 'WIN').length;
      const l = sb.filter(b => b.result === 'LOSS').length;
      return { sport, wins: w, losses: l, roi: sb.reduce((s,b)=>s+(b.profit_loss||0),0) };
    }).filter(s => s.wins + s.losses > 0);

    const system = `You are ProPredict's AI assistant. You have full access to the user's betting data.

PORTFOLIO (last 50 bets):
Record: ${wins}W-${losses}L (${wins+losses > 0 ? ((wins/(wins+losses))*100).toFixed(1) : 'N/A'}% win rate)
ROI: ${totalStake > 0 ? ((totalProfit/totalStake)*100).toFixed(1) : 'N/A'}%
Profit: $${totalProfit.toFixed(2)}
Avg CLV: ${avgCLV.toFixed(2)} pts (${avgCLV > 0 ? 'beating the market' : 'below closing line'})

BY SPORT:
${bySport.map(s => `${s.sport}: ${s.wins}W-${s.losses}L, $${s.roi.toFixed(0)} profit`).join('\n')}

TODAY'S TOP PREDICTIONS:
${preds.slice(0,5).map(p => `- ${p.sport} ${p.pick_side.toUpperCase()} ${p.line}: ${p.confidence}% conf, +${p.expected_value?.toFixed(1)}% EV`).join('\n')}

RECENT SHARP ALERTS:
${alerts.map(a => `- ${a.sport}: ${a.alert_type} on ${a.side} (${a.from_line}→${a.to_line})`).join('\n')}

RECENT BETS:
${settled.slice(0,10).map(b => `- ${b.sport} ${b.side}: ${b.result}, P/L $${b.profit_loss?.toFixed(0)}, CLV ${b.clv?.toFixed(1) ?? 'pending'}`).join('\n')}

Be specific and data-driven. Reference actual numbers. Keep responses concise (2-3 paragraphs max).`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system,
        messages: [
          ...history.slice(-6).map((m: any) => ({ role: m.role, content: m.content })),
          { role: 'user', content: message }
        ],
      }),
    });

    const data = await response.json();
    const text = data.content?.find((c: any) => c.type === 'text')?.text || 'No response.';
    return NextResponse.json({ response: text });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ response: 'Error: ' + e.message }, { status: 500 });
  }
}
