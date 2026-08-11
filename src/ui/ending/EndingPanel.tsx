import { useCallback, useState } from 'react';

import { NarrativeText } from '../narrative/NarrativeText';
import type { TextSpeed } from '../system/uiSettings';

const lines = [
  'PACKET 01 SENT / PACKET 02 SENT / PACKET 03 SENT / PACKET 04 SENT',
  '過去の主人公「……何だ、ここ……。誰だ？」',
  '主人公「隣の実験室にいる。こっちも閉じ込められてる。」',
  '主人公「でも――そっちの部屋なら出口を開けられる。」',
  '過去の主人公「どうして分かる？」',
  '主人公「説明してる時間がない。まず電源を戻せ。」',
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
            {lineIndex === lines.length - 1 ? 'ドアを開ける' : '続ける'}
          </button>
        </>
      )}
    </section>
  );
}
