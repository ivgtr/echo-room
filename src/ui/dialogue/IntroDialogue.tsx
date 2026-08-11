import { NarrativePanel } from '../narrative/NarrativePanel';
import { introEntries } from '../narrative/narrativeArchive';

type Props = { lineIndex: number; onAdvance: () => void };

export function IntroDialogue({ lineIndex, onAdvance }: Props) {
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
      autoFocus
    />
  );
}
