export interface CompanionRosterView {
  id: string;
  templateSlug: string;
  name: string;
  nickname?: string | null;
  primaryType: string;
  secondaryType?: string | null;
  role: string;
  level: number;
  xp: number;
  awakeningName: string;
  stats: {
    hp: number;
    potency: number;
    vigor: number;
    speed: number;
    resin: number;
    terpenes: number;
    stability: number;
  };
  moves: Array<{
    slug: string;
    name: string;
    type: string;
    kind: string;
    basePower: number;
  }>;
  partyPosition?: number | null;
}

export interface PartyStateView {
  playerId: string;
  maxPartySize: number;
  activeParty: CompanionRosterView[];
  roster: CompanionRosterView[];
}

export interface PartyActionResult {
  success: boolean;
  message: string;
  party: PartyStateView;
}
