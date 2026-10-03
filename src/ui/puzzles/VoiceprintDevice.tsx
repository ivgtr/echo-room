import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

type Props = {
  active: boolean;
  failures: number;
  submit: (answer: string[]) => void;
};

const timeScales = [1, 2, 4] as const;
const timeLabels = ['1/2×', '1×', '2×'] as const;
const matchSteps = [24, 51, 76, 93, 99.8, 100] as const;
type Gesture = {
  id: number;
  x: number;
  y: number;
  value: number;
  step: number;
};

export function VoiceprintDevice({ active, failures, submit }: Props) {
  const [timebase, setTimebase] = useState(1);
  const [inverted, setInverted] = useState(false);
  const [phase, setPhase] = useState(0);
  const [scanStep, setScanStep] = useState(-1);
  const [visible, setVisible] = useState(() => !document.hidden);
  const [accepted, setAccepted] = useState(false);
  const deviceRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLButtonElement>(null);
  const phaseGestureRef = useRef<Gesture | null>(null);
  const dialGestureRef = useRef<Gesture | null>(null);
  const acceptedRef = useRef(false);
  const running = active && visible;
  const calibrated = timebase === 0 && inverted && phase === -2;
  const locked = scanStep >= 0;
  const matchProgress = locked ? (matchSteps[scanStep] ?? 100) : null;
  const canAdjust = running && !locked;
  const difference =
    (timebase === 0 ? 0 : timebase === 1 ? 1 : 2) +
    (inverted ? 0 : 1) +
    Math.abs(phase + 2) / 2;
  const scopeStatus = locked
    ? 'LOCK'
    : calibrated
      ? 'SYNC / HOLD'
      : 'SYNC / SEARCH';

  useEffect(() => {
    const updateVisibility = () => {
      setVisible(!document.hidden);
      phaseGestureRef.current = null;
      dialGestureRef.current = null;
    };
    document.addEventListener('visibilitychange', updateVisibility);
    return () =>
      document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (!running || !calibrated || scanStep === matchSteps.length - 1) return;
    const reduced = document.documentElement.dataset.reducedMotion === 'true';
    // One visible step at a time preserves the current scan when the panel is
    // hidden, rather than completing it offscreen or losing a batch of timers.
    const timer = window.setTimeout(
      () => {
        if (!document.hidden) setScanStep((step) => step + 1);
      },
      reduced ? 60 : scanStep < 0 ? 520 : 420,
    );
    return () => window.clearTimeout(timer);
  }, [calibrated, running, scanStep]);

  useEffect(() => {
    if (
      running &&
      matchProgress === 100 &&
      (document.activeElement === document.body ||
        deviceRef.current?.contains(document.activeElement))
    ) {
      confirmationRef.current?.focus();
    }
  }, [running, matchProgress]);

  function adjustKey(
    event: KeyboardEvent<HTMLElement>,
    current: number,
    min: number,
    max: number,
    update: (value: number) => void,
  ) {
    if (!canAdjust || document.hidden) return;
    const next =
      event.key === 'Home'
        ? min
        : event.key === 'End'
          ? max
          : ['ArrowLeft', 'ArrowDown'].includes(event.key)
            ? current - 1
            : ['ArrowRight', 'ArrowUp'].includes(event.key)
              ? current + 1
              : null;
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    update(Math.max(min, Math.min(max, next)));
  }

  function beginGesture(
    event: PointerEvent<HTMLElement>,
    type: 'phase' | 'dial',
  ) {
    if (!canAdjust || document.hidden || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    const gesture = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      value: type === 'phase' ? phase : timebase,
      step:
        type === 'phase'
          ? event.currentTarget.getBoundingClientRect().width * 0.07
          : 30,
    };
    if (type === 'phase') phaseGestureRef.current = gesture;
    else dialGestureRef.current = gesture;
  }

  function moveGesture(
    event: PointerEvent<HTMLElement>,
    type: 'phase' | 'dial',
  ) {
    const gesture =
      type === 'phase' ? phaseGestureRef.current : dialGestureRef.current;
    if (
      !canAdjust ||
      document.hidden ||
      !gesture ||
      gesture.id !== event.pointerId
    )
      return;
    const distance =
      event.clientX -
      gesture.x -
      (type === 'dial' ? event.clientY - gesture.y : 0);
    const value =
      gesture.value + Math.round(distance / Math.max(1, gesture.step));
    if (type === 'phase') setPhase(Math.max(-2, Math.min(2, value)));
    else setTimebase(Math.max(0, Math.min(2, value)));
  }

  function endGesture(
    event: PointerEvent<HTMLElement>,
    type: 'phase' | 'dial',
  ) {
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (type === 'phase') phaseGestureRef.current = null;
    else dialGestureRef.current = null;
  }

  return (
    <div
      className={`voiceprint-instrument${locked ? ' is-locked' : ''}${matchProgress === 100 ? ' is-matched' : ''}`}
      ref={deviceRef}
      data-active={running}
      data-failures={failures}
    >
      <div className="voiceprint-shared-scope">
        <header className="voiceprint-scope-heading">
          <div className="voiceprint-legend">
            <span>
              STAFF RECORD <i />
            </span>
            <span>
              RECEIVED <i />
            </span>
          </div>
          <strong className={calibrated ? 'is-synchronized' : ''}>
            <i aria-hidden="true" />
            {scopeStatus}
          </strong>
        </header>
        <div
          className="voiceprint-phase-surface"
          role="slider"
          tabIndex={canAdjust ? 0 : -1}
          aria-label="波の開始位置"
          aria-valuemin={-2}
          aria-valuemax={2}
          aria-valuenow={phase}
          aria-valuetext={`${phase > 0 ? '+' : ''}${phase}。記録との開始位置の差 ${phase + 2}`}
          aria-disabled={!canAdjust}
          aria-describedby="voiceprint-phase-help voiceprint-comparison"
          onKeyDown={(event) => adjustKey(event, phase, -2, 2, setPhase)}
          onPointerDown={(event) => beginGesture(event, 'phase')}
          onPointerMove={(event) => moveGesture(event, 'phase')}
          onPointerUp={(event) => endGesture(event, 'phase')}
          onPointerCancel={(event) => endGesture(event, 'phase')}
          onLostPointerCapture={() => {
            phaseGestureRef.current = null;
          }}
        >
          <ScopeWaveform
            timebase={timebase}
            inverted={inverted}
            phase={phase}
            calibrated={calibrated}
          />
          <span
            className="voiceprint-phase-grip"
            style={
              {
                '--phase-position': `${50 + (phase + 2) * 7}%`,
              } as CSSProperties
            }
            aria-hidden="true"
          >
            <i />↔ PHASE
          </span>
          {locked && (
            <span className="voiceprint-scan-line" aria-hidden="true" />
          )}
        </div>
        <div className="voiceprint-observations" id="voiceprint-comparison">
          <span>
            記録 <small>1–2–1 / 上・下・上</small>
          </span>
          <span>
            受信{' '}
            <small>
              {timebase === 0 ? '1–2–1' : timebase === 1 ? '2–4–2' : '4–8–4'} /{' '}
              {inverted ? '上・下・上' : '下・上・下'}
            </small>
          </span>
          <span className="voiceprint-difference" aria-live="polite">
            {calibrated ? '重なり安定' : `開始差 ${phase + 2}`}
            <i
              style={
                { '--difference': Math.min(1, difference / 4) } as CSSProperties
              }
              aria-hidden="true"
            />
          </span>
        </div>
        {matchProgress !== null && (
          <div
            className={`voiceprint-identity-readout${matchProgress === 100 ? ' is-match' : ''}`}
            role="status"
            aria-live="polite"
          >
            <div>
              <span>VOICE MATCH</span>
              <strong>
                {matchProgress.toFixed(matchProgress >= 99.8 ? 1 : 0)}%
              </strong>
            </div>
            {matchProgress >= 99.8 ? (
              <figure>
                <img
                  src={`${import.meta.env.BASE_URL}assets/images/items/gfx-item-003__approved__badge-crop__512x640.webp`}
                  alt="職員証と一致したE-01担当者の写真"
                />
                <figcaption>
                  {matchProgress === 100
                    ? '100.0% / MATCH / E-01 OCCUPANT'
                    : 'IDENTITY QUERY...'}
                </figcaption>
              </figure>
            ) : (
              <span className="voiceprint-scan-status">
                FEATURE SCAN / 記録を照合中
              </span>
            )}
          </div>
        )}
      </div>
      <div className="voiceprint-mechanical-controls">
        <div className="voiceprint-timebase-control">
          <div
            className="voiceprint-timebase-knob"
            role="slider"
            tabIndex={canAdjust ? 0 : -1}
            aria-label="波の間隔ダイヤル"
            aria-valuemin={0}
            aria-valuemax={2}
            aria-valuenow={timebase}
            aria-valuetext={timeLabels[timebase]}
            aria-disabled={!canAdjust}
            aria-describedby="voiceprint-time-help"
            onKeyDown={(event) => adjustKey(event, timebase, 0, 2, setTimebase)}
            onPointerDown={(event) => beginGesture(event, 'dial')}
            onPointerMove={(event) => moveGesture(event, 'dial')}
            onPointerUp={(event) => endGesture(event, 'dial')}
            onPointerCancel={(event) => endGesture(event, 'dial')}
            onLostPointerCapture={() => {
              dialGestureRef.current = null;
            }}
          >
            <i className="voiceprint-dial-ticks" aria-hidden="true" />
            <i
              className="voiceprint-dial-cap"
              style={{ transform: `rotate(${(timebase - 1) * 75}deg)` }}
              aria-hidden="true"
            />
          </div>
          <div>
            <strong>TIME / DIV</strong>
            <small id="voiceprint-time-help">
              間隔 · ノブを回す / 矢印キー
            </small>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-label="波の上下反転"
          aria-checked={inverted}
          disabled={!canAdjust}
          className="voiceprint-polarity-switch"
          onClick={() => {
            if (canAdjust && !document.hidden) setInverted((value) => !value);
          }}
        >
          <i aria-hidden="true" />
          <span>
            POLARITY<small>{inverted ? '− / 反転' : '+ / 正相'}</small>
          </span>
        </button>
        <p className="voiceprint-phase-help" id="voiceprint-phase-help">
          ↔ PHASE
          <small>
            受信波を左右へ動かす
            <br />
            ドラッグ / 矢印キー
          </small>
        </p>
      </div>
      {matchProgress === 100 && (
        <button
          type="button"
          className="voice-match-confirm"
          ref={confirmationRef}
          disabled={!running || accepted}
          onClick={() => {
            if (!running || document.hidden || acceptedRef.current) return;
            acceptedRef.current = true;
            setAccepted(true);
            submit(['compress-half', 'invert', 'left-2']);
          }}
        >
          MATCH CONFIRM / 本人一致を確認する
        </button>
      )}
    </div>
  );
}

function ScopeWaveform({
  timebase,
  inverted,
  phase,
  calibrated,
}: {
  timebase: number;
  inverted: boolean;
  phase: number;
  calibrated: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (typeof CanvasRenderingContext2D === 'undefined') return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const width = 1000;
    const height = 300;
    context.clearRect(0, 0, width, height);
    context.lineWidth = 1;
    context.strokeStyle = '#26413e';
    context.beginPath();
    for (let x = 0; x <= width; x += 50) {
      context.moveTo(x, 0);
      context.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += 50) {
      context.moveTo(0, y);
      context.lineTo(width, y);
    }
    context.stroke();
    context.strokeStyle = '#54726c';
    context.beginPath();
    context.moveTo(0, 150);
    context.lineTo(width, 150);
    context.moveTo(500, 0);
    context.lineTo(500, height);
    context.stroke();
    const peaks = [
      [220, 83],
      [350, -91],
      [600, 83],
      [730, -44],
    ] as const;
    const sample = (x: number) =>
      peaks.reduce(
        (value, [position, amplitude]) =>
          value + amplitude * Math.exp(-(((x - position) / 25) ** 2)),
        0,
      );
    const trace = (received: boolean, ghost: number) => {
      context.beginPath();
      for (let x = 0; x <= width; x += 2) {
        const sourceX = received
          ? (x - (phase + 2) * width * 0.07 - 500) /
              (timeScales[timebase] ?? 2) +
            500
          : x;
        const y =
          150 - sample(sourceX) * (received && !inverted ? -1 : 1) + ghost;
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    };
    context.lineWidth = 3;
    context.strokeStyle = '#d9dfc8';
    context.setLineDash([]);
    trace(false, 0);
    const spread = calibrated
      ? 0
      : (timebase + (inverted ? 0 : 1) + Math.abs(phase + 2)) * 1.4;
    context.strokeStyle = '#78e4de28';
    context.lineWidth = 2;
    if (spread) {
      trace(true, spread);
      trace(true, -spread);
    }
    context.strokeStyle = calibrated ? '#9dfff0' : '#6fe7e2';
    context.lineWidth = calibrated ? 4 : 3;
    context.setLineDash(calibrated ? [] : [10, 5]);
    trace(true, 0);
    context.setLineDash([]);
  }, [calibrated, inverted, phase, timebase]);
  return (
    <canvas
      ref={canvasRef}
      className="voiceprint-waveform"
      width={1000}
      height={300}
      aria-hidden="true"
    />
  );
}
