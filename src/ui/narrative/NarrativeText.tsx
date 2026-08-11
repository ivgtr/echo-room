import { useEffect, useMemo, useRef, useState } from 'react';

import type { TextSpeed } from '../system/uiSettings';
import {
  CHARACTER_INTERVAL_MS,
  getCharacterDelay,
  shouldPlayTextBlip,
} from './narrativeTiming';

type Props = {
  text: string;
  speed: TextSpeed;
  motionReduced: boolean;
  forceComplete: boolean;
  onBlip: () => void;
  onComplete: () => void;
};

export function NarrativeText({
  text,
  speed,
  motionReduced,
  forceComplete,
  onBlip,
  onComplete,
}: Props) {
  const characters = useMemo(() => Array.from(text), [text]);
  const onBlipRef = useRef(onBlip);
  const onCompleteRef = useRef(onComplete);
  const [reveal, setReveal] = useState({ text, count: 0 });
  const count = reveal.text === text ? reveal.count : 0;
  const complete = motionReduced || forceComplete || count >= characters.length;
  const visibleText = complete ? text : characters.slice(0, count).join('');

  useEffect(() => {
    onBlipRef.current = onBlip;
    onCompleteRef.current = onComplete;
  }, [onBlip, onComplete]);

  useEffect(() => {
    if (motionReduced || forceComplete || characters.length === 0) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) onCompleteRef.current();
      });
      return () => {
        cancelled = true;
      };
    }

    const revealTimes: number[] = [];
    let elapsedMs = CHARACTER_INTERVAL_MS[speed];
    for (const character of characters) {
      revealTimes.push(elapsedMs);
      elapsedMs += getCharacterDelay(speed, character);
    }
    const startedAt = performance.now();
    let previousCount = 0;
    let animationFrame = 0;
    const revealNext = (now: number) => {
      const sinceStart = now - startedAt;
      let nextCount = previousCount;
      while (
        nextCount < revealTimes.length &&
        (revealTimes[nextCount] ?? Number.POSITIVE_INFINITY) <= sinceStart
      )
        nextCount += 1;
      if (nextCount > previousCount) {
        const revealedCharacters = characters.slice(previousCount, nextCount);
        setReveal({ text, count: nextCount });
        if (
          revealedCharacters.some((character, index) =>
            shouldPlayTextBlip(character, previousCount + index + 1),
          )
        )
          onBlipRef.current();
        previousCount = nextCount;
      }
      if (nextCount >= characters.length) {
        onCompleteRef.current();
        return;
      }
      animationFrame = requestAnimationFrame(revealNext);
    };
    animationFrame = requestAnimationFrame(revealNext);
    return () => cancelAnimationFrame(animationFrame);
  }, [characters, forceComplete, motionReduced, speed, text]);

  return (
    <>
      <span
        className="narrative-measure"
        data-full-text={text}
        aria-hidden="true"
      />
      <span className="narrative-reveal" aria-hidden="true">
        {visibleText}
      </span>
    </>
  );
}
