type Props = {
  onStart: () => void;
  onContinue?: () => void;
  saveCorrupt: boolean;
};

export function TitleScreen({ onStart, onContinue, saveCorrupt }: Props) {
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
        </div>
        {saveCorrupt && (
          <p role="alert">
            保存データを読み込めません。新規開始は安全に行えます。
          </p>
        )}
        <p className="start-note">
          音声が利用できない場合も字幕でプレイできます
        </p>
      </section>
    </main>
  );
}
