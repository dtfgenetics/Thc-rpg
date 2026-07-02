"use client";

import type { CompanionRosterView, PartyActionResult, PartyStateView } from "@thc/rpg-kernel";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type PlayerSummary = {
  id: string;
  handle: string;
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

export default function PartyPage() {
  const [player, setPlayer] = useState<PlayerSummary | null>(null);
  const [party, setParty] = useState<PartyStateView | null>(null);
  const [selectedFirst, setSelectedFirst] = useState<string>("");
  const [selectedSecond, setSelectedSecond] = useState<string>("");
  const [message, setMessage] = useState("Loading Seed Man's companion roster...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDevPlayerAndParty().catch((error) => setMessage(error instanceof Error ? error.message : "Failed to load party."));
  }, []);

  async function loadDevPlayerAndParty() {
    setLoading(true);
    try {
      const loadedPlayer = await api<PlayerSummary>("/dev/player", {
        method: "POST",
        body: JSON.stringify({ handle: "DTF Demo Grower" })
      });
      setPlayer(loadedPlayer);
      const loadedParty = await api<PartyStateView>(`/party/${loadedPlayer.id}`);
      setParty(loadedParty);
      setMessage("Roster loaded. Recruited companions can be added to Seed Man's active party here.");
    } finally {
      setLoading(false);
    }
  }

  async function performPartyAction(action: () => Promise<PartyActionResult>) {
    setLoading(true);
    try {
      const result = await action();
      setParty(result.party);
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Party action failed.");
    } finally {
      setLoading(false);
    }
  }

  function addToParty(companionId: string) {
    if (!player) return;
    void performPartyAction(() =>
      api<PartyActionResult>("/party/add", {
        method: "POST",
        body: JSON.stringify({ playerId: player.id, companionId })
      })
    );
  }

  function removeFromParty(companionId: string) {
    if (!player) return;
    void performPartyAction(() =>
      api<PartyActionResult>("/party/remove", {
        method: "POST",
        body: JSON.stringify({ playerId: player.id, companionId })
      })
    );
  }

  function swapParty() {
    if (!player || !selectedFirst || !selectedSecond) return;
    void performPartyAction(() =>
      api<PartyActionResult>("/party/swap", {
        method: "POST",
        body: JSON.stringify({
          playerId: player.id,
          firstCompanionId: selectedFirst,
          secondCompanionId: selectedSecond
        })
      })
    );
  }

  return (
    <main className="game-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Seed Man Party Management</p>
          <h1>Companion Roster</h1>
          <p>Manage the active strain-companion party Seed Man sends into battle.</p>
        </div>
        <div className="top-actions">
          <button disabled={loading} onClick={() => void loadDevPlayerAndParty()}>Refresh Roster</button>
        </div>
      </header>

      <section className="status-card">
        <strong>Status:</strong> {message}
      </section>

      {player && (
        <section className="player-card">
          <span>{player.handle}</span>
          <span>Active party size: {party?.activeParty.length ?? 0}/{party?.maxPartySize ?? 3}</span>
        </section>
      )}

      {party ? (
        <>
          <section className="party-layout">
            <aside className="party-column">
              <h2>Active Party</h2>
              {party.activeParty.length ? (
                party.activeParty.map((companion) => (
                  <CompanionCard key={companion.id} companion={companion} actionLabel="Remove" onAction={() => removeFromParty(companion.id)} />
                ))
              ) : (
                <p>No active companions.</p>
              )}
            </aside>

            <aside className="party-column">
              <h2>Full Roster</h2>
              {party.roster.map((companion) => {
                const inParty = companion.partyPosition !== null && companion.partyPosition !== undefined;
                return (
                  <CompanionCard
                    key={companion.id}
                    companion={companion}
                    actionLabel={inParty ? "In Party" : "Add"}
                    disabled={loading || inParty}
                    onAction={() => addToParty(companion.id)}
                  />
                );
              })}
            </aside>
          </section>

          <section className="party-swap-card">
            <h2>Swap Active Positions</h2>
            <p>Both companions must already be in the active party.</p>
            <div className="swap-controls">
              <select value={selectedFirst} onChange={(event) => setSelectedFirst(event.target.value)}>
                <option value="">First companion</option>
                {party.activeParty.map((companion) => (
                  <option key={companion.id} value={companion.id}>{companion.name} — Slot {companion.partyPosition}</option>
                ))}
              </select>
              <select value={selectedSecond} onChange={(event) => setSelectedSecond(event.target.value)}>
                <option value="">Second companion</option>
                {party.activeParty.map((companion) => (
                  <option key={companion.id} value={companion.id}>{companion.name} — Slot {companion.partyPosition}</option>
                ))}
              </select>
              <button disabled={loading || !selectedFirst || !selectedSecond} onClick={swapParty}>Swap</button>
            </div>
          </section>
        </>
      ) : (
        <section className="empty-card">
          <h2>No roster loaded</h2>
          <p>Refresh the roster after running the API and seed data.</p>
        </section>
      )}
    </main>
  );
}

function CompanionCard({
  companion,
  actionLabel,
  disabled,
  onAction
}: {
  companion: CompanionRosterView;
  actionLabel: string;
  disabled?: boolean;
  onAction: () => void;
}) {
  return (
    <article className="roster-card">
      <div className="roster-head">
        <div>
          <h3>{companion.nickname || companion.name}</h3>
          <p>{companion.primaryType}{companion.secondaryType ? ` / ${companion.secondaryType}` : ""} · Lv. {companion.level}</p>
        </div>
        {companion.partyPosition && <span className="slot-badge">Slot {companion.partyPosition}</span>}
      </div>
      <p>{companion.role}</p>
      <div className="stat-grid">
        <span>HP {companion.stats.hp}</span>
        <span>Potency {companion.stats.potency}</span>
        <span>Vigor {companion.stats.vigor}</span>
        <span>Speed {companion.stats.speed}</span>
        <span>Resin {companion.stats.resin}</span>
        <span>Terpenes {companion.stats.terpenes}</span>
      </div>
      <div className="move-list">
        <strong>Moves</strong>
        {companion.moves.map((move) => (
          <small key={move.slug}>{move.name} · {move.kind} · Power {move.basePower}</small>
        ))}
      </div>
      <div className="roster-actions">
        <small>Awakening: {companion.awakeningName}</small>
        <button disabled={disabled} onClick={onAction}>{actionLabel}</button>
      </div>
    </article>
  );
}
