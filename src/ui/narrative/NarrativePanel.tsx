import { useCallback, useState } from 'react';

import type { TextSpeed } from '../system/uiSettings';
import type { NarrativeKind } from './narrativeArchive';
import { NarrativeText } from './NarrativeText';

type Props = {
  kind: NarrativeKind;
  speaker?: string;
  text: string;
  actionLabel: string;
  onAdvance: () => void;
  secondaryAction?: { label: string; onSelect: () => void };
  autoFocus?: boolean;
  textSpeed: TextSpeed;
  motionReduced: boolean;
  onTextBlip: () => void;
};

export function NarrativePanel({
  kind,
  speaker,
  text,
  actionLabel,
  onAdvance,
  secondaryAction,
  autoFocus = false,
  textSpeed,
  motionReduced,
  onTextBlip,
}: Props) {
  const communication = kind === 'communication';
  const [completedText, setCompletedText] = useState<string | null>(null);
  const [forceCompleteText, setForceCompleteText] = useState<string | null>(
    null,
  );
  const textComplete =
    motionReduced || completedText === text || forceCompleteText === text;
  const handleTextComplete = useCallback(() => setCompletedText(text), [text]);
  const handleAdvance = () => {
    if (!textComplete) {
      setForceCompleteText(text);
      return;
    }
    onAdvance();
  };
  return (
    <section
      className={`narrative-panel is-${kind}`}
      data-narrative-kind={kind}
      role="dialog"
      aria-modal="true"
      aria-label={communication ? '通信' : 'メッセージ'}
      aria-live="polite"
      aria-atomic="true"
      aria-busy={!textComplete}
    >
      {communication && (
        <p className="narrative-signal" aria-label="通信状態、受信中">
          SIGNAL // ACTIVE
        </p>
      )}
      {speaker && <span className="speaker">{speaker}</span>}
      <p
        className="narrative-text"
        data-text-complete={textComplete}
        aria-label={text}
      >
        <NarrativeText
          text={text}
          speed={textSpeed}
          motionReduced={motionReduced}
          forceComplete={forceCompleteText === text}
          onBlip={onTextBlip}
          onComplete={handleTextComplete}
        />
      </p>
      <div className="narrative-actions">
        {secondaryAction && (
          <button type="button" onClick={secondaryAction.onSelect}>
            {secondaryAction.label}
          </button>
        )}
        <button type="button" onClick={handleAdvance} autoFocus={autoFocus}>
          {actionLabel}
        </button>
      </div>
    </section>
  );
}
