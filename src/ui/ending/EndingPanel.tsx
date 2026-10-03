import { useCallback, useState } from 'react';

import { NarrativeText } from '../narrative/NarrativeText';
import { endingEntries } from '../narrative/narrativeArchive';
import { VoiceStatus } from '../narrative/VoiceStatus';
import type { VoicePlayback } from '../../audio/voiceManifest';
import type { TextSpeed } from '../system/uiSettings';

export function EndingPanel({
  lineIndex,
  completed,
  onOpenSystem,
  obscured,
  onAdvance,
  textSpeed,
  motionReduced,
  onTextBlip,
  voicePlayback,
}: {
  lineIndex: number;
  completed: boolean;
  onOpenSystem?: () => void;
  obscured?: boolean;
  onAdvance: () => void;
  textSpeed: TextSpeed;
  motionReduced: boolean;
  onTextBlip: () => void;
  voicePlayback?: VoicePlayback;
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
      inert={obscured || undefined}
      aria-hidden={obscured || undefined}
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
          <button type="button" onClick={onOpenSystem} autoFocus>
            SYSTEM / 会話履歴・設定
          </button>
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
          {voicePlayback && (
            <VoiceStatus playback={voicePlayback} entryId={entry?.id} />
          )}
          <button
            type="button"
            className="ending-advance-surface"
            data-sound="dialogue"
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
