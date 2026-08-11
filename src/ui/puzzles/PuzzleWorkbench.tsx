import { useState } from 'react';

import {
  PUZZLE_DEFINITIONS,
  type PuzzleId,
} from '../../game/puzzles/storyPuzzles';

type Props = {
  puzzleId: PuzzleId;
  failures: number;
  embedded?: boolean;
  onSubmit: (puzzleId: PuzzleId, answer: string[]) => void;
  onClose: () => void;
};

const waveformPatterns: Partial<Record<PuzzleId, readonly number[][]>> = {
  puzzle_carrier_sync: [
    [1, 1, 4, 4, 1, 1, 4, 4],
    [4, 4, 1, 1, 4, 4, 1, 1],
    [1, 4, 4, 1, 1, 4, 4, 1],
  ],
  puzzle_log_pairing: [
    [2, 5, 2, 1, 1, 1, 2, 5, 2],
    [5, 2, 2, 1, 1, 1, 5, 2, 2],
    [2, 2, 5, 1, 1, 1, 2, 2, 5],
  ],
  puzzle_packet_repair: [
    [1, 4, 2, 5, 3, 1, 4, 2, 5, 3, 1, 4],
    [4, 2, 5, 3, 1, 4, 2, 5, 3, 1, 4, 2],
  ],
  puzzle_voiceprint_calibration: [
    [2, 4, 2, 2, 4, 2, 2, 4, 2],
    [5, 1, 5, 5, 1, 5, 5, 1, 5],
    [1, 1, 3, 5, 3, 1, 1, 3, 5],
  ],
};

export function PuzzleWorkbench({
  puzzleId,
  failures,
  embedded = false,
  onSubmit,
  onClose,
}: Props) {
  const definition = PUZZLE_DEFINITIONS[puzzleId];
  const [answers, setAnswers] = useState<(string | null)[]>(() =>
    definition.tasks.map(() => null),
  );

  const complete = answers.every((answer) => answer !== null);
  const patterns = waveformPatterns[puzzleId];

  return (
    <section
      className={`${embedded ? 'embedded-puzzle' : 'puzzle-modal artwork-modal'} reasoning-puzzle`}
      role={embedded ? 'region' : 'dialog'}
      aria-modal={embedded ? undefined : true}
      aria-labelledby="reasoning-puzzle-title"
      data-puzzle-id={puzzleId}
    >
      <header className="reasoning-puzzle-header">
        <p className="eyebrow">
          PUZZLE {String(definition.number).padStart(2, '0')} /{' '}
          {definition.eyebrow}
        </p>
        <h2 id="reasoning-puzzle-title">{definition.title}</h2>
        <p>{definition.instruction}</p>
      </header>

      <div className="reasoning-layout">
        <aside className="puzzle-evidence" aria-label="見つけた手掛かり">
          <h3>EVIDENCE / 手掛かり</h3>
          <ul>
            {definition.evidence.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {patterns && <WaveformBoard patterns={patterns} />}
        </aside>

        <div className="puzzle-decisions">
          {definition.tasks.map((task, taskIndex) => (
            <fieldset key={task.id}>
              <legend>{task.prompt}</legend>
              <div className="puzzle-choice-grid">
                {task.options.map((choice) => {
                  const selected = answers[taskIndex] === choice.id;
                  return (
                    <button
                      type="button"
                      key={choice.id}
                      className={selected ? 'is-selected' : ''}
                      aria-pressed={selected}
                      onClick={() =>
                        setAnswers((current) =>
                          current.map((value, index) =>
                            index === taskIndex ? choice.id : value,
                          ),
                        )
                      }
                    >
                      <strong>{choice.label}</strong>
                      {choice.detail && <small>{choice.detail}</small>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <p className="puzzle-feedback" aria-live="assertive">
        {failures > 0
          ? definition.incorrectFeedback
          : `選択済み ${answers.filter(Boolean).length} / ${answers.length}`}
      </p>
      <footer>
        <button
          type="button"
          className="primary-action"
          disabled={!complete}
          onClick={() => onSubmit(puzzleId, answers.filter(isString))}
        >
          この答えで確認する
        </button>
        {!embedded && (
          <button type="button" onClick={onClose}>
            探索へ戻る
          </button>
        )}
      </footer>
    </section>
  );
}

function WaveformBoard({ patterns }: { patterns: readonly number[][] }) {
  return (
    <figure className="waveform-board" aria-label="波形の比較">
      {patterns.map((pattern, row) => (
        <div className="waveform-row" key={pattern.join('-')}>
          <span>CH-{row + 1}</span>
          <div aria-hidden="true">
            {pattern.map((height, index) => (
              <i
                key={`${height}-${index}`}
                style={{ height: `${height * 13}%` }}
              />
            ))}
          </div>
          <output>{pattern.join('-')}</output>
        </div>
      ))}
      <figcaption>線の高さと数字は、同じ波の形を表している。</figcaption>
    </figure>
  );
}

function isString(value: string | null): value is string {
  return value !== null;
}
