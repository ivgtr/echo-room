import { NarrativePanel } from '../narrative/NarrativePanel';
import { introEntries } from '../narrative/narrativeArchive';
import type { TextSpeed } from '../system/uiSettings';

type Props = {
  lineIndex: number;
  canSkip: boolean;
  onAdvance: () => void;
  onSkip: () => void;
  textSpeed: TextSpeed;
  motionReduced: boolean;
  onTextBlip: () => void;
};

export function IntroDialogue({
  lineIndex,
  canSkip,
  onAdvance,
  onSkip,
  textSpeed,
  motionReduced,
  onTextBlip,
}: Props) {
  const line =
    introEntries[Math.min(lineIndex, introEntries.length - 1)] ??
    introEntries[0];
  const speaker = 'speaker' in line ? line.speaker : undefined;
  return (
    <NarrativePanel
      kind={line.kind}
      {...(speaker ? { speaker } : {})}
      text={line.text}
      actionLabel={
        lineIndex >= introEntries.length - 1 ? '探索を始める' : '次へ'
      }
      onAdvance={onAdvance}
      textSpeed={textSpeed}
      motionReduced={motionReduced}
      onTextBlip={onTextBlip}
      {...(canSkip
        ? {
            secondaryAction: {
              label: '既読会話をスキップ',
              onSelect: onSkip,
            },
          }
        : {})}
      autoFocus
    />
  );
}
