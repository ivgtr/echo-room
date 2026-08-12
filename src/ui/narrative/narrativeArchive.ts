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
  text: '非常電源がつながった。壁面端末と転送装置が起動する。',
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
    puzzle_signal_investigation: [
      {
        id: 'offset_discovered',
        kind: 'monologue',
        text: '3つとも、送信時刻が受信時刻のちょうど20分後だ。隣の部屋なんてない。回線はこの部屋へ戻っている。',
      },
      {
        id: 'offset_warning',
        kind: 'communication',
        speaker: 'UNKNOWN',
        text: 'ログは気にするな。',
      },
      {
        id: 'damaged_packet_cue',
        kind: 'system',
        speaker: 'FACILITY SYSTEM',
        text: '端末のSIGNALに、破損した通信データが残っている。',
      },
    ],
    puzzle_packet_repair: [
      {
        id: 'packet_question',
        kind: 'monologue',
        text: '……赤いボタン？ そんなものは、まだ見ていない。',
      },
      {
        id: 'voiceprint_cue',
        kind: 'system',
        speaker: 'FACILITY SYSTEM',
        text: '4番目の通信データに、照合できる声紋が残っている。',
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
        text: 'お前が受け取った4つの文を、20分前へ戻せ。',
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
  return {
    id: `discovery_${text}`,
    kind: 'discovery',
    text,
  };
}

const powerPlan: ArchiveDocument = {
  id: 'document_power_plan',
  title: 'AUXILIARY BUS RECOVERY',
  body: '保護回路が作動した場合は異常回線を隔離する。補助制御は信号源から中継器、終端の順に復帰させる。',
};

const maintenanceSheet: ArchiveDocument = {
  id: 'document_maintenance_order',
  title: 'NIGHT SHIFT NOTE',
  body: '夜勤の終わりはいつも同じ。端末の記録を閉じ、通話器を戻す。転送装置の残りを確認して、最後にドアを見る。',
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
