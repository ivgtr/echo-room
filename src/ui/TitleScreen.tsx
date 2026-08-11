import { useState } from 'react';

type Props = {
  onStart: () => void;
  onContinue?: () => void;
  saveStatus: 'empty' | 'valid' | 'corrupt';
  onDeleteSave: () => boolean;
};

export function TitleScreen({
  onStart,
  onContinue,
  saveStatus,
  onDeleteSave,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  const deleteSave = () => {
    if (onDeleteSave()) {
      setConfirmDelete(false);
      setDeleteFailed(false);
    } else {
      setDeleteFailed(true);
    }
  };

  return (
    <main className="title-screen">
      <div className="title-vignette" />
      <section className="title-content" aria-labelledby="game-title">
        <p className="eyebrow">ECHO BUFFER / FACILITY E-01</p>
        <h1 id="game-title">ECHO ROOM</h1>
        <p className="jp-title">残響室</p>
        <div className="title-actions">
          <button type="button" className="primary-action" onClick={onStart}>
            ゲーム開始
          </button>
          {onContinue && (
            <button type="button" onClick={onContinue}>
              続きから
            </button>
          )}
          {saveStatus !== 'empty' && !confirmDelete && (
            <button type="button" onClick={() => setConfirmDelete(true)}>
              保存データを消去
            </button>
          )}
          {confirmDelete && (
            <div
              className="save-delete-confirm"
              role="group"
              aria-label="保存データ消去の確認"
            >
              <p>進行データを消去します。字幕・音量設定は保持されます。</p>
              <button type="button" onClick={deleteSave}>
                消去する
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}>
                キャンセル
              </button>
            </div>
          )}
        </div>
        {saveStatus === 'corrupt' && (
          <p role="alert">
            保存データを読み込めません。新規開始はできますが、破損データを消去するまで進行は保存されません。
          </p>
        )}
        {deleteFailed && <p role="alert">保存データを消去できませんでした。</p>}
        <p className="start-note">
          音声が利用できない場合も字幕でプレイできます
        </p>
      </section>
    </main>
  );
}
