type Props = { onStart: () => void };

export function TitleScreen({ onStart }: Props) {
  return (
    <main className="title-screen">
      <div className="title-vignette" />
      <section className="title-content" aria-labelledby="game-title">
        <p className="eyebrow">ECHO BUFFER / FACILITY E-01</p>
        <h1 id="game-title">ECHO ROOM</h1>
        <p className="jp-title">残響室</p>
        <button type="button" className="primary-action" onClick={onStart}>
          ゲーム開始
        </button>
        <p className="start-note">
          音声が利用できない場合も字幕でプレイできます
        </p>
      </section>
    </main>
  );
}
