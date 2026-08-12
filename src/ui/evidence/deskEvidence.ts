import type { PuzzleId } from '../../game/puzzles/storyPuzzles';

export type DeskEvidenceId =
  | 'desk_power_handover'
  | 'desk_wave_scribble'
  | 'desk_night_routine'
  | 'desk_shift_message'
  | 'desk_shopping_list'
  | 'desk_work_photo';

export type DeskEvidence = {
  id: DeskEvidenceId;
  title: string;
  label: string;
  format: 'handover' | 'graph' | 'checklist' | 'sticky' | 'torn' | 'photo';
  body: string;
  previewLines: readonly string[];
  archiveId?:
    | 'document_power_plan'
    | 'document_synchronization_note'
    | 'document_maintenance_order';
};

export const deskEvidence: readonly DeskEvidence[] = [
  {
    id: 'desk_power_handover',
    archiveId: 'document_power_plan',
    title: '朝番への引き継ぎ',
    label: '折り目のついた引き継ぎメモ',
    format: 'handover',
    previewLines: ['端末、また調子が悪い。', '最初に確認しておいて。'],
    body: '焦げ臭い回路は無理に戻さない。切ったまま印を付ける。停電後の立ち上げは、上の配線を根元から順に。',
  },
  {
    id: 'desk_wave_scribble',
    archiveId: 'document_synchronization_note',
    title: '波を見るとき',
    label: '方眼紙に書かれた波形の走り書き',
    format: 'graph',
    previewLines: ['先走ったら、少し待たせる。', '遅れたら、少し急がせる。'],
    body: '先走った波は右へ待たせる。遅れた波は左へ急がせる。基準の山と重なるまで、少しずつ。',
  },
  {
    id: 'desk_night_routine',
    archiveId: 'document_maintenance_order',
    title: '戸締まり前',
    label: '書き込みのある夜勤チェック表',
    format: 'checklist',
    previewLines: ['端末の記録', 'インターホン', '転送装置', 'ドア'],
    body: '夜勤の終わりはいつも同じ。端末の記録を閉じ、インターホンを戻す。転送装置の残りを確認して、最後にドアを見る。',
  },
  {
    id: 'desk_shift_message',
    title: '交代の人へ',
    label: '交代勤務の小さな付箋',
    format: 'sticky',
    previewLines: ['空調、また鳴る。', '工具箱の留め金は固め。'],
    body: '空調がまた鳴る。朝番には伝えてある。工具箱の留め金は少し固い。',
  },
  {
    id: 'desk_shopping_list',
    title: '買い足すもの',
    label: '端が破れた買い物メモ',
    format: 'torn',
    previewLines: ['コーヒー豆', '紙コップ', '油性ペン', '眠気覚まし'],
    body: 'コーヒー豆、紙コップ、油性ペン、眠気覚まし。',
  },
  {
    id: 'desk_work_photo',
    title: '作業中の写真',
    label: 'メモの下からのぞく作業写真',
    format: 'photo',
    previewLines: [],
    body: '端末へ向かう作業員が、背中だけ写っている。顔は見えない。',
  },
] as const;

export function getDeskInterpretation(
  id: DeskEvidenceId,
  completedPuzzleIds: readonly PuzzleId[],
  powerRestored: boolean,
) {
  switch (id) {
    case 'desk_power_handover':
      return powerRestored
        ? '……さっきのブレーカーと、上に通っていた配線のことだ。'
        : 'ブレーカーを触る前に、状態と上の配線を見た方がよさそうだ。';
    case 'desk_wave_scribble':
      return completedPuzzleIds.includes('puzzle_carrier_sync')
        ? '端末に出ていた波形を合わせるための走り書きだった。'
        : powerRestored
          ? '……端末の波形の開始位置を言っているのか。'
          : '波とは何のことだろう。今はまだ分からない。';
    case 'desk_night_routine':
      return completedPuzzleIds.includes('puzzle_maintenance_lock')
        ? 'この部屋で毎晩たどっていた順番だ。ロッカーにも同じ順が使われていた。'
        : completedPuzzleIds.includes('puzzle_carrier_sync')
          ? '端末からドアまで。この順番で、部屋の機器を確かめてみよう。'
          : 'ただの戸締まりの順番に見える。';
    case 'desk_shift_message':
      return '誰かが、次の勤務の人へ残した伝言だ。';
    case 'desk_shopping_list':
      return '仕事とは関係のない、ありふれた買い物メモだ。';
    case 'desk_work_photo':
      return completedPuzzleIds.includes('puzzle_voiceprint_calibration')
        ? '……この作業着。写っているのは、俺だ。'
        : '顔は見えない。ただ、この部屋で働いていた人らしい。';
  }
}

export const archivedDeskDocuments = deskEvidence.flatMap((evidence) =>
  evidence.archiveId
    ? [
        {
          id: evidence.archiveId,
          title: evidence.title,
          body: evidence.body,
        },
      ]
    : [],
);
