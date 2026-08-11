import { useCallback, useState } from 'react';

import { NarrativeText } from '../narrative/NarrativeText';
import { introEntries } from '../narrative/narrativeArchive';
import type { TextSpeed } from '../system/uiSettings';

const lines = [
  'PACKET 01 SENT / PACKET 02 SENT / PACKET 03 SENT / PACKET 04 SENT',
  `20分前の自分「${introEntries[0].text}${introEntries[2].text}」`,
  `現在の自分「${introEntries[3].text}」`,
  `現在の自分「${introEntries[4].text}」`,
  `20分前の自分「${introEntries[5].text}」`,
  `現在の自分「${introEntries[6].text}」`,
];

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
  const text = lines[lineIndex] ?? '';
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
          <button type="button" onClick={handleAdvance} autoFocus>
            {lineIndex === lines.length - 1 ? '通信を終える' : '続ける'}
          </button>
        </>
      )}
    </section>
  );
}
