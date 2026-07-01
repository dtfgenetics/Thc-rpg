"use client";

import type { BattleState, CombatantState, MoveTemplateView, TimingGrade } from "@thc/shared";
import { useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type PlayerSummary = {
  id: string;
  handle: string;
  kushCoin: number;
  reputation: number;
};

type PendingMove = {
  move: MoveTemplateView;
  startedAt: number;
};

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown API error" }));
    throw new Error(error.error || "API request failed");
  }

  return response.json() as Promise<T>;
}

function firstAlive(team: CombatantState[]): CombatantState | undefined {
  return team.find((combatant) => combatant.currentHp > 0);
}

function hpPercent(combatant: CombatantState): number {
  return Math.max(0, Math.min(100, Math.round((combatant.currentHp / combatant.maxHp) * 100)));
}

function timingFromElapsed(elapsedMs: number, patternLength: number): { grade: TimingGrade; hitCount: number } {
  const target = 900;
  const diff = Math.abs(elapsedMs - target);

  if (diff <= 110) return { grade: "PERFECT", hitCount: patternLength };
  if (diff <= 260) return { grade: "GOOD", hitCount: Math.max(1, patternLength - 1) };
  return { grade: "MISS", hitCount: Math.max(0, Math.floor(patternLength / 2)) };
}

export default function PhenoQuestPage() {
  const [player, setPlayer] = useState<PlayerSummary | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [message, setMessage] = useState("Load a dev player to begin the vertical slice.");
  const [loading, setLoading] = useState(false);

  const playerActor = useMemo(() => (battle ? firstAlive(battle.playerTeam) : undefined), [battle]);
  const enemyTarget = useMemo(() => (battle ? firstAlive(battle.enemyTeam) : undefined), [battle]);

  async function loadDevPlayer() {
    setLoading(true);
    try {
      const loadedPlayer = await api<PlayerSummary>("/dev/player", {
        method: "POST",
        body: JSON.stringify({ handle: "DTF Demo Grower" })
      });
      setPlayer(loadedPlayer);
      setMessage(`Loaded ${loadedPlayer.handle}. Start the rival battle.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load player.");
    } finally {
      setLoading(false);
    }
  }

  async function startRivalBattle() {
    if (!player) return;
    setLoading(true);
    try {
      const newBattle = await api<BattleState>("/battles/start", {
        method: "POST",
        body: JSON.stringify({ playerId: player.id, npcSlug: "rival-grower-ashtray" })
      });
      setBattle(newBattle);
      setPendingMove(null);
      setMessage("Battle started. Choose a move, then hit the timing button close to the target.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to start battle.");
    } finally {
      setLoading(false);
    }
  }

  function beginMove(move: MoveTemplateView) {
    if (!battle || battle.status !== "ACTIVE") return;
    setPendingMove({ move, startedAt: performance.now() });
    setMessage(`Timing started for ${move.name}. Tap Resolve near 900ms for PERFECT.`);
  }

  async function resolvePendingMove() {
    if (!battle || !player || !playerActor || !enemyTarget || !pendingMove) return;
    setLoading(true);
    try {
      const elapsed = performance.now() - pendingMove.startedAt;
      const timing = timingFromElapsed(elapsed, pendingMove.move.timingPattern.length);
      const updatedBattle = await api<BattleState>(`/battles/${battle.id}/turn`, {
        method: "POST",
        body: JSON.stringify({
          playerId: player.id,
          actorId: playerActor.id,
          targetId: enemyTarget.id,
          moveSlug: pendingMove.move.slug,
          timing
        })
      });
      setBattle(updatedBattle);
      setPendingMove(null);
      setMessage(`${pendingMove.move.name}: ${timing.grade} timing.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to resolve turn.");
    } finally {
      setLoading(false);
    }
  }

  async function awaken() {
    if (!battle || !player || !playerActor) return;
    setLoading(true);
    try {
      const updatedBattle = await api<BattleState>(`/battles/${battle.id}/awaken`, {
        method: "POST",
        body: JSON.stringify({ playerId: player.id, actorId: playerActor.id })
      });
      setBattle(updatedBattle);
      setMessage(`${playerActor.name} awakened.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to awaken.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="game-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Vertical Playable Slice 1</p>
          <h1>THC: Pheno Quest</h1>
        </div>
        <div className="top-actions">
          <button disabled={loading} onClick={loadDevPlayer}>Load Dev Player</button>
          <button disabled={!player || loading} onClick={startRivalBattle}>Start Rival Battle</button>
        </div>
      </header>

      <section className="status-card">
        <strong>Status:</strong> {message}
      </section>

      {player && (
        <section className="player-card">
          <span>{player.handle}</span>
          <span>Kush Coin: {player.kushCoin}</span>
          <span>Reputation: {player.reputation}</span>
        </section>
      )}

      {battle ? (
        <section className="battle-grid">
          <TeamPanel title="Your Party" team={battle.playerTeam} />
          <BattleCenter
            battle={battle}
            playerActor={playerActor}
            enemyTarget={enemyTarget}
            pendingMove={pendingMove}
            loading={loading}
            onBeginMove={beginMove}
            onResolveMove={resolvePendingMove}
            onAwaken={awaken}
          />
          <TeamPanel title="Enemy Party" team={battle.enemyTeam} />
        </section>
      ) : (
        <section className="empty-card">
          <h2>No battle loaded</h2>
          <p>Load the dev player and start the rival battle to test the first combat loop.</p>
        </section>
      )}
    </main>
  );
}

function TeamPanel({ title, team }: { title: string; team: CombatantState[] }) {
  return (
    <aside className="team-panel">
      <h2>{title}</h2>
      {team.map((combatant) => (
        <article className="combatant-card" key={combatant.id}>
          <div className="combatant-head">
            <strong>{combatant.name}</strong>
            <span>Lv. {combatant.level}</span>
          </div>
          <p>{combatant.primaryType}{combatant.secondaryType ? ` / ${combatant.secondaryType}` : ""}</p>
          <div className="hp-track">
            <div className="hp-fill" style={{ width: `${hpPercent(combatant)}%` }} />
          </div>
          <small>{combatant.currentHp} / {combatant.maxHp} HP</small>
          <small>Awakening: {combatant.awakeningMeter}/100</small>
          {combatant.awakenedTurnsRemaining > 0 && <em>{combatant.awakeningName}: {combatant.awakenedTurnsRemaining} turns</em>}
          {combatant.statusEffects.length > 0 && <small>Status: {combatant.statusEffects.join(", ")}</small>}
        </article>
      ))}
    </aside>
  );
}

function BattleCenter({
  battle,
  playerActor,
  enemyTarget,
  pendingMove,
  loading,
  onBeginMove,
  onResolveMove,
  onAwaken
}: {
  battle: BattleState;
  playerActor?: CombatantState;
  enemyTarget?: CombatantState;
  pendingMove: PendingMove | null;
  loading: boolean;
  onBeginMove: (move: MoveTemplateView) => void;
  onResolveMove: () => void;
  onAwaken: () => void;
}) {
  return (
    <section className="battle-center">
      <div className="battle-title">
        <span>Turn {battle.turnNumber}</span>
        <strong>{battle.status}</strong>
      </div>

      {battle.status === "ACTIVE" && playerActor && enemyTarget ? (
        <>
          <div className="versus-card">
            <strong>{playerActor.name}</strong>
            <span>vs</span>
            <strong>{enemyTarget.name}</strong>
          </div>

          <div className="move-grid">
            {playerActor.moves.map((move) => (
              <button key={move.slug} disabled={loading || Boolean(pendingMove)} onClick={() => onBeginMove(move)}>
                <strong>{move.name}</strong>
                <small>{move.kind} · {move.type} · Power {move.basePower}</small>
              </button>
            ))}
          </div>

          <div className="timing-card">
            <h3>Strain Addition Timing</h3>
            {pendingMove ? (
              <>
                <p>Target: tap resolve around <strong>900ms</strong>.</p>
                <button className="primary-button" disabled={loading} onClick={onResolveMove}>Resolve Timing</button>
              </>
            ) : (
              <p>Select a move to start the timing window.</p>
            )}
          </div>

          <button
            className="awakening-button"
            disabled={loading || playerActor.awakeningMeter < 100 || playerActor.awakenedTurnsRemaining > 0}
            onClick={onAwaken}
          >
            Activate {playerActor.awakeningName}
          </button>
        </>
      ) : (
        <ResultCard battle={battle} />
      )}

      <div className="battle-log">
        <h3>Battle Log</h3>
        {[...battle.log].reverse().slice(0, 8).map((entry, index) => (
          <p key={`${entry.turn}-${index}`}>
            <strong>{entry.side}</strong>: {entry.message}
          </p>
        ))}
      </div>
    </section>
  );
}

function ResultCard({ battle }: { battle: BattleState }) {
  return (
    <div className="result-card">
      <h2>{battle.status === "WON" ? "Victory" : "Defeat"}</h2>
      {battle.rewards ? (
        <p>
          Rewards: {battle.rewards.xp} XP · {battle.rewards.kushCoin} Kush Coin · {battle.rewards.reputation} Reputation
        </p>
      ) : (
        <p>Recover, adjust the party, and try again.</p>
      )}
    </div>
  );
}
