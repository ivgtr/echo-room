import type { NarrativeKind } from './narrativeArchive';

type Props = {
  kind: NarrativeKind;
  speaker?: string;
  text: string;
  actionLabel: string;
  onAdvance: () => void;
  secondaryAction?: { label: string; onSelect: () => void };
  autoFocus?: boolean;
};

export function NarrativePanel({
  kind,
  speaker,
  text,
  actionLabel,
  onAdvance,
  secondaryAction,
  autoFocus = false,
}: Props) {
  const communication = kind === 'communication';
  return (
    <section
      className={`narrative-panel is-${kind}`}
      data-narrative-kind={kind}
      role="dialog"
      aria-modal="true"
      aria-label={communication ? '通信' : 'メッセージ'}
      aria-live="polite"
      aria-atomic="true"
    >
      {communication && (
        <p className="narrative-signal" aria-label="通信状態、受信中">
          SIGNAL // ACTIVE
        </p>
      )}
      {speaker && <span className="speaker">{speaker}</span>}
      <p className="narrative-text">{text}</p>
      <div className="narrative-actions">
        {secondaryAction && (
          <button type="button" onClick={secondaryAction.onSelect}>
            {secondaryAction.label}
          </button>
        )}
        <button type="button" onClick={onAdvance} autoFocus={autoFocus}>
          {actionLabel}
        </button>
      </div>
    </section>
  );
}
