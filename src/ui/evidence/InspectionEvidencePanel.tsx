import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';

import {
  deskEvidence,
  type DeskEvidence as DeskEvidenceItem,
  type DeskEvidenceId,
} from './deskEvidence';

type Props = {
  kind: 'clock' | 'desk';
  onClose: () => void;
};

export function InspectionEvidencePanel({ kind, onClose }: Props) {
  const clock = kind === 'clock';
  return (
    <section
      className={`puzzle-modal artwork-modal evidence-modal ${clock ? 'clock-evidence-modal' : 'desk-evidence-modal'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-title"
    >
      {clock ? <ClockEvidence /> : <DeskEvidence />}
      <button type="button" className="evidence-close" onClick={onClose}>
        BACK / 戻る
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

function DeskEvidence() {
  const [selectedId, setSelectedId] = useState<DeskEvidenceId | null>(null);
  const selected = deskEvidence.find(({ id }) => id === selectedId) ?? null;
  const selectedButtonIdRef = useRef<DeskEvidenceId | null>(null);
  const itemButtonRefs = useRef<
    Partial<Record<DeskEvidenceId, HTMLButtonElement>>
  >({});
  const detailBackRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selected) detailBackRef.current?.focus();
  }, [selected]);

  function returnToDesk() {
    const buttonId = selectedButtonIdRef.current;
    setSelectedId(null);
    window.requestAnimationFrame(() => {
      if (buttonId) itemButtonRefs.current[buttonId]?.focus();
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape' || !selected) return;
    event.preventDefault();
    event.stopPropagation();
    returnToDesk();
  }

  return (
    <div className="desk-evidence" onKeyDown={handleKeyDown}>
      {selected ? (
        <DeskEvidenceDetail
          evidence={selected}
          backRef={detailBackRef}
          onBack={returnToDesk}
        />
      ) : (
        <>
          <header className="desk-evidence-heading">
            <p className="eyebrow">DESK / PERSONAL NOTES</p>
            <h2 id="evidence-title">机の上</h2>
            <p>仕事のメモや私物が、片づけられないまま残っている。</p>
          </header>
          <div className="desk-paper-field" aria-label="机の上にある物">
            {deskEvidence.map((evidence, index) => (
              <button
                type="button"
                className={`desk-paper desk-paper-${index + 1} is-${evidence.kind}`}
                key={evidence.id}
                aria-label={`${evidence.label}を読む`}
                ref={(element) => {
                  if (element) itemButtonRefs.current[evidence.id] = element;
                }}
                onClick={() => {
                  selectedButtonIdRef.current = evidence.id;
                  setSelectedId(evidence.id);
                }}
              >
                {evidence.kind === 'photo' ? (
                  <img
                    src={`${import.meta.env.BASE_URL}assets/images/documents/gfx-doc-005__desk-photo__runtime__1024x768.webp`}
                    alt=""
                  />
                ) : (
                  <>
                    <span>{evidence.title}</span>
                    <i aria-hidden="true">読む</i>
                  </>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DeskEvidenceDetail({
  evidence,
  backRef,
  onBack,
}: {
  evidence: DeskEvidenceItem;
  backRef: RefObject<HTMLButtonElement | null>;
  onBack: () => void;
}) {
  return (
    <div className={`desk-evidence-detail is-${evidence.kind}`}>
      <button ref={backRef} type="button" onClick={onBack}>
        DESK / 机に戻る
      </button>
      {evidence.kind === 'photo' ? (
        <figure className="desk-photo-detail">
          <img
            src={`${import.meta.env.BASE_URL}assets/images/documents/gfx-doc-005__desk-photo__runtime__1024x768.webp`}
            alt="端末に向かう、後ろ姿の作業員"
          />
          <figcaption>
            <h2 id="evidence-title">{evidence.title}</h2>
            <p>{evidence.body}</p>
          </figcaption>
        </figure>
      ) : (
        <article className="document-sheet" aria-labelledby="evidence-title">
          <p>{evidence.kind === 'note' ? 'PERSONAL NOTE' : 'SHIFT RECORD'}</p>
          <h2 id="evidence-title">{evidence.title}</h2>
          <div className="document-rule" aria-hidden="true" />
          <p className="document-instruction">{evidence.body}</p>
        </article>
      )}
    </div>
  );
}
