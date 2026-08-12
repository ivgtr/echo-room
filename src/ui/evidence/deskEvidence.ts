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
  kind: 'document' | 'note' | 'photo';
  body: string;
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
    kind: 'document',
    body: '焦げ臭い回路は無理に戻さない。切ったまま印を付ける。停電後の立ち上げは、上の配線を根元から順に。',
  },
  {
    id: 'desk_wave_scribble',
    archiveId: 'document_synchronization_note',
    title: '波を見るとき',
    label: '波形の走り書き',
    kind: 'note',
    body: '先走った波は右へ待たせる。遅れた波は左へ急がせる。基準の山と重なるまで、少しずつ。',
  },
  {
    id: 'desk_night_routine',
    archiveId: 'document_maintenance_order',
    title: '戸締まり前',
    label: '夜勤の覚え書き',
    kind: 'document',
    body: '夜勤の終わりはいつも同じ。端末の記録を閉じ、インターホンを戻す。転送装置の残りを確認して、最後にドアを見る。',
  },
  {
    id: 'desk_shift_message',
    title: '交代の人へ',
    label: '交代勤務の伝言',
    kind: 'note',
    body: '空調がまた鳴る。朝番には伝えてある。工具箱の留め金は少し固い。',
  },
  {
    id: 'desk_shopping_list',
    title: '買い足すもの',
    label: '小さな買い物メモ',
    kind: 'note',
    body: 'コーヒー豆、紙コップ、油性ペン、眠気覚まし。',
  },
  {
    id: 'desk_work_photo',
    title: '作業中の写真',
    label: '伏せかけの作業写真',
    kind: 'photo',
    body: '端末へ向かう作業員が、背中だけ写っている。顔は見えない。',
  },
] as const;

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
