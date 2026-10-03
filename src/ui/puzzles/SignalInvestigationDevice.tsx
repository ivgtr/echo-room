import { useEffect, useRef, useState, type CSSProperties } from 'react';

import {
  matchedRecords,
  receiveRecords,
  sourceRecords,
} from '../../game/puzzles/signalRecords';
import { FacilityMap, type FacilityTraceNode } from '../evidence/FacilityMap';

type Props = {
  active: boolean;
  failures: number;
  submit: (answer: string[]) => void;
};
const traceRoute: FacilityTraceNode[] = [
  'intercom',
  'signal',
  'ring-relay',
  'echo-buffer',
];
const deltaTarget = 20;

export function SignalInvestigationDevice({ active, failures, submit }: Props) {
  const [activeReceive, setActiveReceive] = useState<number | null>(null);
  const [patches, setPatches] = useState<(string | null)[]>([null, null, null]);
  const [delta, setDelta] = useState(0);
  const [adjusted, setAdjusted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  const running = active && visible;
  const [locked, setLocked] = useState(false);
  const [visited, setVisited] = useState<FacilityTraceNode[]>([]);
  const [lost, setLost] = useState<FacilityTraceNode | null>(null);
  const [attempt, setAttempt] = useState(0);
  const submittedRef = useRef(false);
  const transferFocusRef = useRef(false);
  const rulerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{
    id: number;
    x: number;
    delta: number;
    width: number;
  } | null>(null);
  const pairingComplete = patches.every(
    (source, index) => source === matchedRecords[index]?.source.id,
  );
  const returned = visited.includes('echo-buffer');
  const pairStatus = patches.some(
    (source, index) =>
      source !== null && source !== matchedRecords[index]?.source.id,
  );

  useEffect(() => {
    const onVisibility = () => {
      setVisible(!document.hidden);
      pointerRef.current = null;
      setDragging(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (
      !running ||
      !pairingComplete ||
      dragging ||
      delta !== deltaTarget ||
      locked
    )
      return;
    const timer = window.setTimeout(() => {
      if (document.hidden) return;
      transferFocusRef.current = document.activeElement === rulerRef.current;
      setLocked(true);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [running, pairingComplete, dragging, delta, locked]);

  useEffect(() => {
    if (!active || !pairingComplete || locked) return;
    if (document.activeElement === document.body) rulerRef.current?.focus();
  }, [active, pairingComplete, locked]);

  useEffect(() => {
    if (!active) return;
    return () => {
      pointerRef.current = null;
      setDragging(false);
    };
  }, [active]);

  useEffect(() => {
    if (!active || !locked || !transferFocusRef.current) return;
    transferFocusRef.current = false;
    rootRef.current
      ?.querySelector<HTMLButtonElement>('[data-trace-node="intercom"]')
      ?.focus();
  }, [active, locked]);

  useEffect(() => {
    if (!running || !returned || submittedRef.current) return;
    // Let the return terminal illuminate before the narrative takes the screen.
    // Hidden terminal modes cancel this delay and keep the route intact.
    const timer = window.setTimeout(() => {
      if (document.hidden || submittedRef.current) return;
      submittedRef.current = true;
      submit([
        ...patches.filter((source): source is string => source !== null),
        'signal',
        'ring-relay',
        'echo-buffer',
      ]);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [running, returned, patches, submit]);

  function adjustDelta(value: number) {
    if (!running || locked) return;
    setAdjusted(true);
    setDelta(Math.max(0, Math.min(30, Math.round(value))));
  }

  function visit(node: FacilityTraceNode) {
    if (!running || !locked || returned) return;
    if (visited.includes(node)) {
      setLost(null);
      return;
    }
    if (node === traceRoute[visited.length]) {
      setVisited((current) => [...current, node]);
      setLost(null);
    } else {
      setLost(node);
      setAttempt((current) => current + 1);
    }
  }

  return (
    <div
      ref={rootRef}
      className={`signal-investigation-device signal-instrument${locked ? ' is-time-locked' : ''}${returned ? ' is-returned' : ''}`}
      data-failures={failures}
    >
      {!pairingComplete && (
        <div className="signal-patching">
          <div className="signal-section-heading">
            <span>RECORD PATCH</span>
            <small>PACKET FINGERPRINT</small>
          </div>
          <div className="log-columns">
            <div className="jack-column">
              <h3>RECEIVE / RX</h3>
              {receiveRecords.map((record, index) => (
                <button
                  type="button"
                  key={record.id}
                  className={`jack${activeReceive === index ? ' is-armed' : ''}${patches[index] === matchedRecords[index]?.source.id ? ' is-patched' : ''}`}
                  aria-label={`${record.id.toUpperCase()}受信端子`}
                  aria-description={`波形 ${record.signature}`}
                  aria-pressed={activeReceive === index}
                  disabled={!active}
                  onClick={() => setActiveReceive(index)}
                >
                  <i aria-hidden="true" />
                  <span>{record.id.toUpperCase()}</span>
                  <Fingerprint value={record.signature} />
                </button>
              ))}
            </div>
            <div className="signal-patch-cords" aria-label="接続状態">
              {patches.map((source, index) => (
                <span
                  className={
                    source
                      ? source === matchedRecords[index]?.source.id
                        ? 'is-connected'
                        : 'is-mismatch'
                      : ''
                  }
                  key={index}
                >
                  <i aria-hidden="true" />
                  <small>{source?.toUpperCase() ?? 'OPEN'}</small>
                  <span className="signal-sr-only">{`R${index + 1} ${source ? `と${source.toUpperCase()}を接続` : '未接続'}`}</span>
                </span>
              ))}
            </div>
            <div className="jack-column">
              <h3>SOURCE / TX</h3>
              {sourceRecords.map((record) => (
                <button
                  type="button"
                  key={record.id}
                  className="jack"
                  aria-label={`${record.id.toUpperCase()}送信端子`}
                  aria-description={`波形 ${record.signature}`}
                  disabled={!active}
                  onClick={() => {
                    if (activeReceive === null) return;
                    setPatches((current) =>
                      current.map((value, index) =>
                        index === activeReceive
                          ? record.id
                          : value === record.id
                            ? null
                            : value,
                      ),
                    );
                    setActiveReceive(null);
                  }}
                >
                  <i aria-hidden="true" />
                  <span>{record.id.toUpperCase()}</span>
                  <Fingerprint value={record.signature} />
                </button>
              ))}
            </div>
          </div>
          <p className="signal-operation-note" role="status">
            {pairStatus
              ? '× FINGERPRINT MISMATCH'
              : activeReceive !== null
                ? `R${activeReceive + 1} / 接続先を選ぶ`
                : '受信端子から送信端子へ接続'}
          </p>
        </div>
      )}
      {pairingComplete && (
        <section
          className={`signal-time-comparator${locked ? ' is-locked' : ''}`}
          aria-label="受信・送信時刻の比較"
        >
          <div className="signal-section-heading">
            <span>{locked ? 'TEMPORAL COHERENCE' : 'RX / TX COMPARATOR'}</span>
            <output role="status">
              {locked
                ? '+20:00 / LOCKED'
                : adjusted
                  ? `ΔT +${String(delta).padStart(2, '0')}:00`
                  : 'ΔT ?'}
            </output>
          </div>
          {!locked && (
            <>
              <div className="signal-matched-records">
                {matchedRecords.map(({ receive, source }) => (
                  <div key={receive.id}>
                    <span>
                      {receive.id.toUpperCase()} <b>{receive.time}</b>
                    </span>
                    <i aria-hidden="true">↔</i>
                    <span>
                      {source.id.toUpperCase()} <b>{source.time}</b>
                    </span>
                  </div>
                ))}
              </div>
              <div
                ref={rulerRef}
                className={`signal-time-ruler${delta === deltaTarget ? ' is-aligned' : ''}${dragging ? ' is-dragging' : ''}`}
                role="slider"
                tabIndex={active ? 0 : -1}
                aria-label="送信時刻ルーラー"
                aria-description="送信側の目盛りを左右に動かし、三組の時刻の印を重ねる。左右キーで1分、PageUp・PageDownで5分動かせます。"
                aria-valuemin={0}
                aria-valuemax={30}
                aria-valuenow={delta}
                aria-valuetext={`送信と受信の比較位置 ${delta}分。${delta === deltaTarget ? '三組の印が一致' : '三組の印が離れている'}`}
                aria-disabled={!active}
                onPointerDown={(event) => {
                  if (!active || event.button !== 0) return;
                  event.preventDefault();
                  event.currentTarget.focus();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  pointerRef.current = {
                    id: event.pointerId,
                    x: event.clientX,
                    delta,
                    width: event.currentTarget.getBoundingClientRect().width,
                  };
                  setDragging(true);
                }}
                onPointerMove={(event) => {
                  const pointer = pointerRef.current;
                  if (
                    !pointer ||
                    event.pointerId !== pointer.id ||
                    pointer.width <= 0
                  )
                    return;
                  adjustDelta(
                    pointer.delta +
                      (pointer.x - event.clientX) / (pointer.width * 0.018),
                  );
                }}
                onPointerUp={(event) => {
                  if (pointerRef.current?.id !== event.pointerId) return;
                  pointerRef.current = null;
                  if (event.currentTarget.hasPointerCapture(event.pointerId))
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  setDragging(false);
                }}
                onLostPointerCapture={() => {
                  pointerRef.current = null;
                  setDragging(false);
                }}
                onPointerCancel={() => {
                  pointerRef.current = null;
                  setDragging(false);
                }}
                onKeyDown={(event) => {
                  const move: Record<string, number> = {
                    ArrowLeft: 1,
                    ArrowRight: -1,
                    ArrowUp: 1,
                    ArrowDown: -1,
                    PageUp: 5,
                    PageDown: -5,
                  };
                  if (
                    event.key === 'Home' ||
                    event.key === 'End' ||
                    move[event.key] !== undefined
                  ) {
                    event.preventDefault();
                    adjustDelta(
                      event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? 30
                          : delta + move[event.key]!,
                    );
                  }
                }}
              >
                <div className="signal-ruler-face" aria-hidden="true">
                  <span>RX / FIXED</span>
                  <span>TX / SLIDE</span>
                </div>
                <div className="signal-timeline" aria-hidden="true">
                  {matchedRecords.map(({ receive }, index) => {
                    const marker = 24 + index * 11;
                    return (
                      <div
                        className="signal-timeline-row"
                        key={receive.id}
                        style={
                          {
                            '--rx-position': `${marker}%`,
                            '--tx-position': `${marker + (deltaTarget - delta) * 1.8}%`,
                          } as CSSProperties
                        }
                      >
                        <small>{receive.id.toUpperCase()}</small>
                        <i className="signal-rx-mark" />
                        <i className="signal-tx-mark" />
                        <b>{delta === deltaTarget ? '≡' : '·'}</b>
                      </div>
                    );
                  })}
                  <div
                    className="signal-ruler-grip"
                    style={{ left: `${55 + (deltaTarget - delta) * 1.8}%` }}
                  >
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
              <p className="signal-operation-note">
                TXの目盛りを左右へスライド / ← →
              </p>
            </>
          )}
          {locked && (
            <div
              className="signal-coherence-lamps"
              aria-label="3組の時刻の印が一致"
            >
              <i />
              <i />
              <i />
              <span>RX ≡ TX</span>
            </div>
          )}
        </section>
      )}
      {locked && (
        <FacilityMap
          conduitLayer
          trace={{ active: running, visited, lost, attempt, onVisit: visit }}
        />
      )}
    </div>
  );
}

function Fingerprint({ value }: { value: string }) {
  return (
    <small className="signal-fingerprint" aria-hidden="true">
      {value.split('・').map((pulse, index) => (
        <i key={index} className={pulse === '長' ? 'is-long' : ''} />
      ))}
    </small>
  );
}
