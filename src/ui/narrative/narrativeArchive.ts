import type { ItemId, StoryStage } from '../../game/machine/gameMachine';
import type { PuzzleId } from '../../game/puzzles/storyPuzzles';
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

export const powerRestoredEntry: NarrativeEntry = {
  id: 'system_power_restored',
  kind: 'system',
  speaker: 'FACILITY SYSTEM',
  text: '非常電源の経路が成立し、壁面端末とECHO BUFFERが起動した。',
};

const completionEntries: Partial<Record<PuzzleId, readonly NarrativeEntry[]>> =
  {
    puzzle_log_pairing: [
      {
        id: 'offset_discovered',
        kind: 'discovery',
        text: '照合した三通信は、どれも送信元が受信より正確に20分後だ。',
      },
      {
        id: 'offset_warning',
        kind: 'communication',
        speaker: 'UNKNOWN',
        text: 'ログは気にするな。',
      },
    ],
    puzzle_signal_route: [
      {
        id: 'no_room_question',
        kind: 'monologue',
        text: '隣の部屋なんてない。回線はこの部屋へ戻っている。',
      },
      {
        id: 'no_room_answer',
        kind: 'communication',
        speaker: 'UNKNOWN',
        text: '分かってる。まだ説明できない。',
      },
    ],
    puzzle_temporal_anomaly: [
      {
        id: 'future_packet',
        kind: 'discovery',
        text: 'PACKET 04は、まだ起きていない赤いボタンの操作を知っている。',
      },
    ],
    puzzle_voiceprint_calibration: [
      {
        id: 'identity_question',
        kind: 'monologue',
        text: 'この特徴量は……俺の職員記録と同じだ。',
      },
      {
        id: 'identity_answer',
        kind: 'communication',
        speaker: '20分後の自分',
        text: '20分後のお前だ。',
      },
    ],
  };

export const getPuzzleCompletionEntries = (puzzleId: PuzzleId) =>
  completionEntries[puzzleId] ?? [];

export function discoveryEntry(text: string): NarrativeEntry {
  return { id: `discovery_${text}`, kind: 'discovery', text };
}

const powerPlan: ArchiveDocument = {
  id: 'document_power_plan',
  title: 'EMERGENCY BYPASS PLAN',
  body: '容量7 UNIT。ドア駆動線は短絡。端末、通話器、BUFFERの順に給電する。',
};

const maintenanceSheet: ArchiveDocument = {
  id: 'document_maintenance_order',
  title: 'MAINTENANCE ORDER',
  body: '点検順：端末、通話器、ECHO BUFFER、ドア。回路銘板の記号へ変換する。',
};

const floorMap: ArchiveDocument = {
  id: 'document_floor_map',
  title: 'FACILITY / CONDUIT MAP',
  body: 'E-01の左右は設備壁。環端子の通信実線はJ-2からECHO BUFFER RETURNへ続く。',
};

export function getArchiveDocuments(
  powerRestored: boolean,
  _stage: StoryStage,
  inventory: readonly ItemId[],
) {
  const documents: ArchiveDocument[] = [];
  if (powerRestored) documents.push(powerPlan, maintenanceSheet);
  if (inventory.includes('item_floor_map')) documents.push(floorMap);
  return documents;
}

export function getRestoredNarrativeHistory(progress: SavedProgress) {
  const history: NarrativeEntry[] = [...introEntries, powerRestoredEntry];
  for (const puzzleId of progress.completedPuzzleIds)
    history.push(...getPuzzleCompletionEntries(puzzleId));
  return history;
}
