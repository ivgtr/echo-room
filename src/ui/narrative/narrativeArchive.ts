import type { ItemId, StoryStage } from '../../game/machine/gameMachine';
import type { PacketId } from '../../game/puzzles/storyPuzzles';
import type { SavedProgress } from '../../game/save/saveManager';

export type NarrativeKind =
  'monologue' | 'communication' | 'discovery' | 'system';

export type NarrativeEntry = {
  id: string;
  kind: NarrativeKind;
  speaker?: string;
  text: string;
};

export type ArchiveDocument = {
  id: string;
  title: string;
  body: string;
};

export const introEntries = [
  { id: 'intro_01', kind: 'monologue', text: '……何だ、ここ……。' },
  {
    id: 'intro_02',
    kind: 'communication',
    speaker: 'UNKNOWN',
    text: '……聞こえるか？',
  },
  { id: 'intro_03', kind: 'monologue', text: '誰だ？' },
  {
    id: 'intro_04',
    kind: 'communication',
    speaker: 'UNKNOWN',
    text: '隣の実験室にいる。こっちも閉じ込められてる。',
  },
  {
    id: 'intro_05',
    kind: 'communication',
    speaker: 'UNKNOWN',
    text: 'でも――そっちの部屋なら出口を開けられる。',
  },
  { id: 'intro_06', kind: 'monologue', text: 'どうして分かる？' },
  {
    id: 'intro_07',
    kind: 'communication',
    speaker: 'UNKNOWN',
    text: '説明してる時間がない。まず電源を戻せ。',
  },
] as const satisfies readonly NarrativeEntry[];

export const packetEntries: Record<PacketId, NarrativeEntry> = {
  audio_packet_01: {
    id: 'packet_01',
    kind: 'communication',
    speaker: 'UNKNOWN / PACKET 01',
    text: '……聞こえるか？',
  },
  audio_packet_02: {
    id: 'packet_02',
    kind: 'communication',
    speaker: 'UNKNOWN / PACKET 02',
    text: 'まず電源を戻せ。',
  },
  audio_packet_03: {
    id: 'packet_03',
    kind: 'communication',
    speaker: 'UNKNOWN / PACKET 03',
    text: 'ログは気にするな。',
  },
  audio_packet_04: {
    id: 'packet_04',
    kind: 'communication',
    speaker: 'UNKNOWN / PACKET 04',
    text: '最後に、赤いボタンを押せ。',
  },
};

export const powerRestoredEntry: NarrativeEntry = {
  id: 'system_power_restored',
  kind: 'system',
  speaker: 'FACILITY SYSTEM',
  text: '主電源が復旧し、壁面端末が起動した。',
};

export const noAdjacentRoomEntries: readonly NarrativeEntry[] = [
  {
    id: 'no_room_question',
    kind: 'monologue',
    text: '隣の部屋なんてないぞ。',
  },
  {
    id: 'no_room_answer',
    kind: 'communication',
    speaker: 'UNKNOWN',
    text: '分かってる。まだ説明できない。',
  },
];

export const identityEntries: readonly NarrativeEntry[] = [
  { id: 'identity_question', kind: 'monologue', text: 'お前は……。' },
  {
    id: 'identity_answer',
    kind: 'communication',
    speaker: '20分後の自分',
    text: '20分後のお前だ。',
  },
];

export function discoveryEntry(text: string): NarrativeEntry {
  return {
    id: `discovery_${text}`,
    kind: 'discovery',
    text,
  };
}

const powerTest: ArchiveDocument = {
  id: 'document_power_test',
  title: 'EMERGENCY POWER TEST',
  body: '起動順序：周波数の低い回路から接続すること。',
};

const emergencyNote: ArchiveDocument = {
  id: 'document_emergency_note',
  title: '緊急時メモ',
  body: '緊急時は「送信側の時刻」を使用する。',
};

const floorMap: ArchiveDocument = {
  id: 'document_floor_map',
  title: 'FACILITY MAP',
  body: 'E-01の左右は機械設備とコンクリート壁。隣室は存在しない。',
};

const stageOrder: StoryStage[] = [
  'inspect_logs',
  'unlock_locker',
  'reveal_no_adjacent_room',
  'inspect_audio',
  'analyze_voice',
  'transmit_packets',
  'ending',
  'completed',
];

export function getArchiveDocuments(
  powerRestored: boolean,
  stage: StoryStage,
  inventory: readonly ItemId[],
) {
  const documents: ArchiveDocument[] = [];
  if (powerRestored) documents.push(powerTest);
  if (stageOrder.indexOf(stage) >= stageOrder.indexOf('unlock_locker'))
    documents.push(emergencyNote);
  if (inventory.includes('item_floor_map')) documents.push(floorMap);
  return documents;
}

export function getRestoredNarrativeHistory(progress: SavedProgress) {
  const history: NarrativeEntry[] = [...introEntries, powerRestoredEntry];
  const noRoomRevealed =
    stageOrder.indexOf(progress.storyStage) >=
    stageOrder.indexOf('inspect_audio');
  if (noRoomRevealed) history.push(...noAdjacentRoomEntries);
  for (const packetId of progress.heardPackets)
    history.push(packetEntries[packetId]);
  const identityRevealed =
    stageOrder.indexOf(progress.storyStage) >=
    stageOrder.indexOf('transmit_packets');
  if (identityRevealed) history.push(...identityEntries);
  return history;
}
