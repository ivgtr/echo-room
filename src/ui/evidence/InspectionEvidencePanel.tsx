import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type TransitionEvent,
} from 'react';

import type { PuzzleId } from '../../game/puzzles/storyPuzzles';
import {
  deskEvidence,
  getDeskInterpretation,
  type DeskEvidence as DeskEvidenceItem,
  type DeskEvidenceId,
} from './deskEvidence';

type Props =
  | { kind: 'clock'; onClose: () => void }
  | {
      kind: 'desk';
      onClose: () => void;
      powerRestored: boolean;
      completedPuzzleIds: readonly PuzzleId[];
    };

const deskPhoto = `${import.meta.env.BASE_URL}assets/images/documents/gfx-doc-005__desk-photo__runtime__1024x768.webp`;

export function InspectionEvidencePanel(props: Props) {
  const clock = props.kind === 'clock';
  return (
    <section
      className={`puzzle-modal artwork-modal evidence-modal ${clock ? 'clock-evidence-modal' : 'desk-evidence-modal'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-title"
    >
      {clock ? (
        <ClockEvidence />
      ) : (
        <DeskEvidence
          powerRestored={props.powerRestored}
          completedPuzzleIds={props.completedPuzzleIds}
        />
      )}
      <button type="button" className="evidence-close" onClick={props.onClose}>
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

function DeskEvidence({
  powerRestored,
  completedPuzzleIds,
}: {
  powerRestored: boolean;
  completedPuzzleIds: readonly PuzzleId[];
}) {
  const [selectedId, setSelectedId] = useState<DeskEvidenceId | null>(null);
  const [lifted, setLifted] = useState(false);
  const selected = deskEvidence.find(({ id }) => id === selectedId) ?? null;
  const selectedIndex = selected
    ? deskEvidence.findIndex(({ id }) => id === selected.id)
    : -1;
  const selectedButtonIdRef = useRef<DeskEvidenceId | null>(null);
  const itemButtonRefs = useRef<
    Partial<Record<DeskEvidenceId, HTMLButtonElement>>
  >({});
  const backRef = useRef<HTMLButtonElement>(null);
  const liftedPropRef = useRef<HTMLDivElement>(null);
  const returnTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (selected) backRef.current?.focus();
  }, [selected]);

  useLayoutEffect(() => {
    if (!selected) return;
    const source = itemButtonRefs.current[selected.id];
    const target = liftedPropRef.current;
    if (!source || !target) return;

    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetWidth = targetRect.width || 1;
    const targetHeight = targetRect.height || 1;
    target.style.setProperty(
      '--desk-lift-x',
      `${sourceRect.left - targetRect.left}px`,
    );
    target.style.setProperty(
      '--desk-lift-y',
      `${sourceRect.top - targetRect.top}px`,
    );
    target.style.setProperty(
      '--desk-lift-scale-x',
      `${sourceRect.width / targetWidth || 1}`,
    );
    target.style.setProperty(
      '--desk-lift-scale-y',
      `${sourceRect.height / targetHeight || 1}`,
    );

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setLifted(true));
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [selected]);

  useEffect(
    () => () => {
      if (returnTimerRef.current !== null) {
        window.clearTimeout(returnTimerRef.current);
      }
    },
    [],
  );

  function finishReturnToDesk() {
    if (returnTimerRef.current !== null) {
      window.clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }
    const buttonId = selectedButtonIdRef.current;
    setSelectedId(null);
    window.requestAnimationFrame(() => {
      if (buttonId) itemButtonRefs.current[buttonId]?.focus();
    });
  }

  function returnToDesk() {
    if (!selected || returnTimerRef.current !== null) return;
    setLifted(false);
    returnTimerRef.current = window.setTimeout(finishReturnToDesk, 320);
  }

  function handleLiftTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (
      !lifted &&
      event.target === event.currentTarget &&
      event.propertyName === 'transform'
    ) {
      finishReturnToDesk();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape' || !selected) return;
    event.preventDefault();
    event.stopPropagation();
    returnToDesk();
  }

  return (
    <div
      className={`desk-evidence${selected ? ' is-reading' : ''}`}
      onKeyDown={handleKeyDown}
    >
      <header className="desk-evidence-heading">
        <p className="eyebrow">DESK</p>
        <h2 id="evidence-title">机の上</h2>
      </header>
      <div className="desk-paper-field" aria-label="机の上にある物">
        <div className="desk-reading-shade" aria-hidden="true" />
        {deskEvidence.map((evidence, index) => {
          const isSelected = evidence.id === selectedId;
          return (
            <div
              className={`desk-prop desk-prop-${index + 1} is-${evidence.format}${isSelected ? ' is-source' : ''}${selected && !isSelected ? ' is-set-aside' : ''}`}
              key={evidence.id}
              aria-hidden={selected ? true : undefined}
            >
              <button
                type="button"
                className="desk-prop-trigger"
                aria-label={`${evidence.label}を調べる`}
                aria-expanded={isSelected}
                tabIndex={selected ? -1 : 0}
                ref={(element) => {
                  if (element) itemButtonRefs.current[evidence.id] = element;
                }}
                onClick={() => {
                  selectedButtonIdRef.current = evidence.id;
                  setLifted(false);
                  setSelectedId(evidence.id);
                }}
              />
              <DeskPropFace evidence={evidence} expanded={false} />
            </div>
          );
        })}
        {selected ? (
          <>
            <div
              ref={liftedPropRef}
              className={`desk-lifted-prop desk-lifted-prop-${selectedIndex + 1} is-${selected.format}${lifted ? ' is-lifted' : ''}`}
              style={
                {
                  '--desk-lift-rotation': `${getDeskRotation(selectedIndex)}deg`,
                } as CSSProperties
              }
              onTransitionEnd={handleLiftTransitionEnd}
            >
              <DeskPropFace evidence={selected} expanded />
            </div>
            <div className={`desk-reading-ui${lifted ? ' is-visible' : ''}`}>
              <button ref={backRef} type="button" onClick={returnToDesk}>
                DESK / 机に戻る
              </button>
              <p className="desk-interpretation" role="status">
                {getDeskInterpretation(
                  selected.id,
                  completedPuzzleIds,
                  powerRestored,
                )}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

const deskRotations = [-6, 3, 7, 4, -5, 5] as const;

function getDeskRotation(index: number) {
  return deskRotations[index] ?? 0;
}

function DeskPropFace({
  evidence,
  expanded,
}: {
  evidence: DeskEvidenceItem;
  expanded: boolean;
}) {
  if (evidence.format === 'photo') {
    return (
      <figure className="desk-prop-face desk-photo-face">
        <img
          src={deskPhoto}
          alt={expanded ? '端末に向かう、後ろ姿の作業員' : ''}
        />
        {expanded ? (
          <figcaption className="desk-prop-full">
            <h3>{evidence.title}</h3>
            <p>{evidence.body}</p>
          </figcaption>
        ) : null}
      </figure>
    );
  }

  return (
    <article className="desk-prop-face">
      <DeskPaperPreview evidence={evidence} />
      {expanded &&
      evidence.format !== 'checklist' &&
      evidence.format !== 'torn' ? (
        <div className="desk-prop-full">
          <p>{evidence.body}</p>
        </div>
      ) : null}
    </article>
  );
}

function DeskPaperPreview({ evidence }: { evidence: DeskEvidenceItem }) {
  if (evidence.format === 'handover') {
    return (
      <>
        <p className="paper-form-label">夜間勤務 / 引継事項</p>
        <h3>{evidence.title}</h3>
        <span className="paper-rule" aria-hidden="true" />
        {evidence.previewLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </>
    );
  }
  if (evidence.format === 'graph') {
    return (
      <>
        <h3>{evidence.title}</h3>
        <div className="paper-wave" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        {evidence.previewLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </>
    );
  }
  if (evidence.format === 'checklist') {
    return (
      <>
        <p className="paper-form-label">夜勤終了チェック</p>
        <h3>{evidence.title}</h3>
        <ul>
          {evidence.previewLines.map((line) => (
            <li key={line}>
              <span aria-hidden="true">✓</span>
              {line}
            </li>
          ))}
        </ul>
      </>
    );
  }
  return (
    <>
      <h3>{evidence.title}</h3>
      {evidence.format === 'torn' ? (
        <ul>
          {evidence.previewLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        evidence.previewLines.map((line) => <p key={line}>{line}</p>)
      )}
    </>
  );
}
