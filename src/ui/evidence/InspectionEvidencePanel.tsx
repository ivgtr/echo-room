import type { StoryStage } from '../../game/machine/gameMachine';

type Props = {
  kind: 'clock' | 'desk';
  powerRestored?: boolean;
  stage?: StoryStage;
  onClose: () => void;
};

export function InspectionEvidencePanel({
  kind,
  powerRestored = false,
  stage = 'puzzle_carrier_sync',
  onClose,
}: Props) {
  const clock = kind === 'clock';
  return (
    <section
      className={`puzzle-modal artwork-modal evidence-modal ${clock ? 'clock-evidence-modal' : 'power-test-evidence-modal'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-title"
    >
      {clock ? (
        <ClockEvidence />
      ) : (
        <DeskEvidence powerRestored={powerRestored} stage={stage} />
      )}
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
      <h2 id="evidence-title">止まった時計</h2>
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
      <p>秒針は止まっている。バッテリーの残り時間を示す時計ではない。</p>
    </div>
  );
}

function DeskEvidence({
  powerRestored,
  stage,
}: {
  powerRestored: boolean;
  stage: StoryStage;
}) {
  if (powerRestored && stage === 'puzzle_carrier_sync')
    return <SynchronizationNote />;
  if (powerRestored) return <MaintenanceOrder />;
  return <PowerPlan />;
}

function PowerPlan() {
  return (
    <div className="document-evidence">
      <p className="eyebrow">FACILITY E-01 / MAINTENANCE DOCUMENT</p>
      <article className="document-sheet" aria-labelledby="evidence-title">
        <p>EMERGENCY SYSTEM / RECOVERY NOTE</p>
        <h2 id="evidence-title">停電時の復旧手順</h2>
        <div className="document-rule" aria-hidden="true" />
        <p className="document-instruction">異常が出ている回路を切る。</p>
        <p className="document-annotation">
          CONTROL BUS: SOURCE — RELAY — TERMINATOR
          <br />
          RESTORE FROM UPSTREAM TO DOWNSTREAM
        </p>
      </article>
    </div>
  );
}

function SynchronizationNote() {
  return (
    <div className="document-evidence">
      <p className="eyebrow">ECHO BUFFER / SERVICE NOTE</p>
      <article className="document-sheet" aria-labelledby="evidence-title">
        <p>CARRIER START POSITION</p>
        <h2 id="evidence-title">波形調整メモ</h2>
        <div className="document-rule" aria-hidden="true" />
        <p className="document-instruction">
          基準より先に出る波：<strong>DELAY / 右へ</strong>
          <br />
          基準より後に出る波：<strong>ADVANCE / 左へ</strong>
        </p>
        <p className="document-annotation">波が出る位置を0に合わせること。</p>
      </article>
    </div>
  );
}

function MaintenanceOrder() {
  return (
    <div className="document-evidence">
      <p className="eyebrow">NIGHT SHIFT / PERSONAL NOTE</p>
      <article className="document-sheet" aria-labelledby="evidence-title">
        <p>BEFORE LEAVING</p>
        <h2 id="evidence-title">夜勤の覚え書き</h2>
        <div className="document-rule" aria-hidden="true" />
        <p className="document-instruction">
          夜勤の終わりはいつも同じ。
          <br />
          端末の記録を閉じ、インターホンを戻す。
          <br />
          転送装置の残りを確認して、最後にドアを見る。
        </p>
        <p className="document-annotation">今日も忘れないように。</p>
      </article>
    </div>
  );
}
