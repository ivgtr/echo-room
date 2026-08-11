export function UnsupportedScreen() {
  return (
    <main className="system-screen" role="alert">
      <p className="eyebrow">UNSUPPORTED ENVIRONMENT</p>
      <h1>この環境では描画機能を利用できません</h1>
      <p>
        WebGL 2に対応した最新のChrome、Edge、Firefox、Safariで開いてください。
      </p>
    </main>
  );
}
