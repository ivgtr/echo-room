import { useCallback, useState } from 'react';

import { NarrativeText } from '../narrative/NarrativeText';
import { endingEntries } from '../narrative/narrativeArchive';
import type { TextSpeed } from '../system/uiSettings';

export function EndingPanel({
  lineIndex,
  completed,
  onAdvance,
  textSpeed,
  motionReduced,
  onTextBlip,
}: {
  lineIndex: number;
  completed: boolean;
  onAdvance: () => void;
  textSpeed: TextSpeed;
  motionReduced: boolean;
  onTextBlip: () => void;
}) {
  const entry = endingEntries[lineIndex];
  const text = entry
    ? entry.speaker
      ? `${entry.speaker}「${entry.text}」`
      : entry.text
    : '';
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
      className={completed ? 'ending-panel is-complete' : 'ending-panel'}
      role="dialog"
      aria-modal="true"
      aria-label={completed ? 'TRANSMISSION COMPLETE' : '最終通信'}
      aria-live="polite"
      aria-atomic="true"
    >
      {completed ? (
        <>
          <h1>ECHO ROOM</h1>
          <p>TRANSMISSION COMPLETE</p>
        </>
      ) : (
        <>
          <p
            className="ending-text"
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
          <button
            type="button"
            className="ending-advance-surface"
            aria-label={
              textComplete
                ? lineIndex === endingEntries.length - 1
                  ? '通信を終える'
                  : '次の文章へ'
                : '文章をすべて表示'
            }
            onClick={handleAdvance}
            autoFocus
          />
          <span className="ending-advance-mark" aria-hidden="true">
            {textComplete ? '▼' : '…'}
          </span>
        </>
      )}
    </section>
  );
}
