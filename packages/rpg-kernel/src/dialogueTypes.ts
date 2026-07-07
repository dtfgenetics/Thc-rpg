export type DialogueSpeakerKind = "SEED_MAN" | "NPC" | "COMPANION" | "SYSTEM";

export interface DialogueChoice {
  label: string;
  nextNodeId?: string;
  actionSlug?: string;
}

export interface DialogueNode {
  id: string;
  speakerName: string;
  speakerKind: DialogueSpeakerKind;
  text: string;
  choices?: DialogueChoice[];
}

export interface DialogueTemplateView {
  slug: string;
  title: string;
  speakerName: string;
  regionSlug?: string | null;
  nodes: DialogueNode[];
}
