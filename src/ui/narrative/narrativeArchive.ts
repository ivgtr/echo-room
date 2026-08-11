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
  text: '非常電源がつながった。壁面端末とECHO BUFFERが起動する。',
};

const completionEntries: Partial<Record<PuzzleId, readonly NarrativeEntry[]>> =
  {
    puzzle_power_route: [
      {
        id: 'power_direction',
        kind: 'communication',
        speaker: 'UNKNOWN',
        text: 'よし。次は端末だ。',
      },
      {
        id: 'power_suspicion',
        kind: 'monologue',
        text: 'ずいぶん詳しいな。',
      },
      {
        id: 'power_answer',
        kind: 'communication',
        speaker: 'UNKNOWN',
        text: '……前に見たことがある。',
      },
    ],
    puzzle_carrier_sync: [
      {
        id: 'locker_cue',
        kind: 'discovery',
        text: '回線がそろった。西壁から、ロックの外れる音がした。',
      },
    ],
    puzzle_maintenance_lock: [
      {
        id: 'log_cue',
        kind: 'system',
        speaker: 'FACILITY SYSTEM',
        text: '壁面端末に、未確認の通信ログが3件ある。',
      },
    ],
    puzzle_log_pairing: [
      {
        id: 'offset_discovered',
        kind: 'discovery',
        text: '3つとも、送信時刻が受信時刻のちょうど20分後だ。',
      },
      {
        id: 'offset_warning',
        kind: 'communication',
        speaker: 'UNKNOWN',
        text: 'ログは気にするな。',
      },
      {
        id: 'security_cue',
        kind: 'monologue',
        text: '職員カードなら、SECURITYの施設図を開けるはずだ。',
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
      {
        id: 'damaged_packet_cue',
        kind: 'system',
        speaker: 'FACILITY SYSTEM',
        text: 'SIGNALに、破損したPACKETが残っている。',
      },
    ],
    puzzle_packet_repair: [
      {
        id: 'packet_question',
        kind: 'monologue',
        text: '4つ目の文だけ、聞いた覚えがない。いつ届いた？',
      },
    ],
    puzzle_temporal_anomaly: [
      {
        id: 'future_packet',
        kind: 'discovery',
        text: 'PACKET 04は、まだ見ていない赤いボタンを知っている。',
      },
      {
        id: 'voiceprint_cue',
        kind: 'system',
        speaker: 'FACILITY SYSTEM',
        text: 'PACKET 04に、照合できる声紋データが残っている。',
      },
    ],
    puzzle_voiceprint_calibration: [
      {
        id: 'identity_question',
        kind: 'monologue',
        text: 'この波の形は……俺の職員記録と同じだ。',
      },
      {
        id: 'identity_answer',
        kind: 'communication',
        speaker: '20分後の自分',
        text: '20分後のお前だ。',
      },
      {
        id: 'script_cue',
        kind: 'communication',
        speaker: '20分後の自分',
        text: 'お前が受け取った4つの文を、順番どおりに戻せ。',
      },
    ],
    puzzle_causal_script: [
      {
        id: 'transmission_cue',
        kind: 'system',
        speaker: 'FACILITY SYSTEM',
        text: '送信文を登録。送る時刻と回線は未設定。',
      },
    ],
    puzzle_transmission_window: [
      {
        id: 'transmission_ready_cue',
        kind: 'system',
        speaker: 'FACILITY SYSTEM',
        text: '送信テスト完了。赤い送信ボタンを使用できる。',
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
  body: '容量は7 UNIT。ドアの線はショートしている。端末、通話器、BUFFERの順につなぐ。',
};

const maintenanceSheet: ArchiveDocument = {
  id: 'document_maintenance_order',
  title: 'MAINTENANCE ORDER',
  body: '点検順：端末、通話器、ECHO BUFFER、ドア。それぞれを機器の記号に置き換える。',
};

const synchronizationNote: ArchiveDocument = {
  id: 'document_synchronization_note',
  title: 'CARRIER START POSITION',
  body: '基準より先に出る波は右へ、後に出る波は左へ動かし、開始位置を0に合わせる。',
};

const floorMap: ArchiveDocument = {
  id: 'document_floor_map',
  title: 'FACILITY / CONDUIT MAP',
  body: 'E-01の左右に部屋はない。通信の実線は丸端子J-2からECHO BUFFER RETURNへ続く。',
};

export function getArchiveDocuments(
  powerRestored: boolean,
  _stage: StoryStage,
  inventory: readonly ItemId[],
) {
  const documents: ArchiveDocument[] = [];
  if (powerRestored) documents.push(powerPlan, synchronizationNote);
  if (powerRestored && _stage !== 'puzzle_carrier_sync')
    documents.push(maintenanceSheet);
  if (inventory.includes('item_floor_map')) documents.push(floorMap);
  return documents;
}

export function getRestoredNarrativeHistory(progress: SavedProgress) {
  const history: NarrativeEntry[] = [...introEntries, powerRestoredEntry];
  for (const puzzleId of progress.completedPuzzleIds)
    history.push(...getPuzzleCompletionEntries(puzzleId));
  return history;
}
