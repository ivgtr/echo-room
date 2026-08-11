type Props = {
  kind: 'clock' | 'power-test';
  onClose: () => void;
};

export function InspectionEvidencePanel({ kind, onClose }: Props) {
  const clock = kind === 'clock';
  return (
    <section
      className={`puzzle-modal artwork-modal evidence-modal ${clock ? 'clock-evidence-modal' : 'power-test-evidence-modal'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-title"
    >
      {clock ? <ClockEvidence /> : <PowerTestEvidence />}
      <button type="button" onClick={onClose}>
        閉じる
      </button>
    </section>
  );
}

function ClockEvidence() {
  return (
    <div className="clock-evidence">
      <p className="eyebrow">WALL CLOCK / STOPPED</p>
      <h2 id="evidence-title">停止したアナログ時計</h2>
      <div className="clock-dial-composite" aria-hidden="true">
        <span className="clock-mark clock-mark-12">12</span>
        <span className="clock-mark clock-mark-3">3</span>
        <span className="clock-mark clock-mark-6">6</span>
        <span className="clock-mark clock-mark-9">9</span>
        <span className="clock-hand clock-hour-hand" />
        <span className="clock-hand clock-minute-hand" />
        <span className="clock-pin" />
      </div>
      <p className="clock-readout">
        STOPPED AT <time dateTime="02:17">02:17</time>
      </p>
      <p>秒針は動いていない。バッテリー残量とは別の時刻情報だ。</p>
    </div>
  );
}

function PowerTestEvidence() {
  return (
    <div className="document-evidence">
      <p className="eyebrow">FACILITY E-01 / MAINTENANCE DOCUMENT</p>
      <article className="document-sheet" aria-labelledby="evidence-title">
        <p>EMERGENCY SYSTEM</p>
        <h2 id="evidence-title">EMERGENCY POWER TEST</h2>
        <div className="document-rule" aria-hidden="true" />
        <p className="document-instruction">
          起動順序：<strong>周波数の低い回路から接続すること</strong>
        </p>
        <p className="document-annotation">FREQUENCY ORDER / LOW → HIGH</p>
      </article>
    </div>
  );
}
