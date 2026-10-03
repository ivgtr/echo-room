import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

import { matchedRecords } from '../../game/puzzles/signalRecords';
import {
  isPuzzleAnswerCorrect,
  packetTexts,
} from '../../game/puzzles/storyPuzzles';

type Props = {
  active: boolean;
  failures: number;
  submit: (answer: string[]) => void;
};

type PacketId = `packet-0${1 | 2 | 3 | 4}`;
type RouteId = 'control' | 'echo-return' | 'adjacent';
type TestResult = { packets: boolean; time: boolean; route: boolean };

const scenes = [
  { id: 'intercom', label: 'インターホン', plate: 'INTERCOM' },
  { id: 'power', label: '非常電源', plate: 'POWER' },
  { id: 'log', label: '通信記録', plate: 'LOG' },
  { id: 'transmit', label: '赤い送信ボタン', plate: 'TRANSMIT' },
] as const;
const routes: { id: RouteId; label: string }[] = [
  { id: 'control', label: 'CONTROL ROOM' },
  { id: 'echo-return', label: 'ECHO BUFFER RETURN' },
  { id: 'adjacent', label: 'E-02' },
];
const packetIds: PacketId[] = [
  'packet-01',
  'packet-02',
  'packet-03',
  'packet-04',
];
const trayOrder = [2, 0, 3, 1];
const delaySteps = [-20, -10, 0, 10, 20] as const;

function delayText(minutes: number) {
  return `${minutes < 0 ? '-' : minutes > 0 ? '+' : ''}00:${String(Math.abs(minutes)).padStart(2, '0')}:00`;
}

export function TransmissionPatchDevice({ active, failures, submit }: Props) {
  const [heldPacket, setHeldPacket] = useState<PacketId | null>(null);
  const [windows, setWindows] = useState<(PacketId | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [delayStep, setDelayStep] = useState(1);
  const [heldCable, setHeldCable] = useState(false);
  const [route, setRoute] = useState<RouteId | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [pulse, setPulse] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const timerRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const completedRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    step: number;
    width: number;
  } | null>(null);
  const delay = delaySteps[delayStep]!;
  const allLocked = Boolean(
    testResult?.packets && testResult.time && testResult.route,
  );

  useEffect(() => {
    function interrupt() {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      busyRef.current = false;
      dragRef.current = null;
      setPulse(false);
      // A test interrupted before submission must be deliberately run again.
      if (!completedRef.current) setTestResult(null);
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') interrupt();
    }
    if (!active) interrupt();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      busyRef.current = false;
      dragRef.current = null;
    };
  }, [active]);

  function canOperate() {
    return (
      active &&
      document.visibilityState !== 'hidden' &&
      !busyRef.current &&
      !completedRef.current
    );
  }

  function changeSetting() {
    setTestResult(null);
  }

  function placePacket(index: number, packet: string) {
    if (!canOperate() || !packetIds.includes(packet as PacketId)) return;
    changeSetting();
    setWindows((current) =>
      current.map((value, slot) =>
        slot === index ? (packet as PacketId) : value === packet ? null : value,
      ),
    );
    setHeldPacket(null);
  }

  function operateSocket(index: number) {
    if (!canOperate()) return;
    if (heldPacket) placePacket(index, heldPacket);
    else if (windows[index]) {
      changeSetting();
      setHeldPacket(windows[index]!);
      setWindows((current) =>
        current.map((value, slot) => (slot === index ? null : value)),
      );
    }
  }

  function moveRail(step: number) {
    if (!canOperate()) return;
    changeSetting();
    setDelayStep(Math.max(0, Math.min(delaySteps.length - 1, step)));
  }

  function startRailDrag(event: PointerEvent<HTMLDivElement>) {
    if (!canOperate() || (event.pointerType === 'mouse' && event.button !== 0))
      return;
    const width = event.currentTarget.getBoundingClientRect().width;
    if (!width) return;
    event.currentTarget.focus();
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      step: delayStep,
      width,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function dragRail(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    moveRail(
      drag.step + Math.round((event.clientX - drag.x) / (drag.width * 0.09)),
    );
  }

  function keyRail(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = {
      ArrowLeft: delayStep - 1,
      ArrowDown: delayStep - 1,
      ArrowRight: delayStep + 1,
      ArrowUp: delayStep + 1,
      Home: 0,
      End: delaySteps.length - 1,
    };
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    moveRail(step);
  }

  function testPulse() {
    if (!canOperate()) return;
    busyRef.current = true;
    const answer = [
      ...windows.map((packet) => packet ?? 'open'),
      delay < 0 ? `minus-${Math.abs(delay)}` : `plus-${delay}`,
      route ?? 'disconnected',
    ];
    const result = {
      packets: windows.every((packet, index) => packet === packetIds[index]),
      time: delay === -20,
      route: route === 'echo-return',
    };
    const valid = isPuzzleAnswerCorrect('puzzle_transmission_window', answer);
    setTestResult(result);
    setPulse(true);
    setPulseCount((count) => count + 1);
    const reduced = document.documentElement.dataset.reducedMotion === 'true';
    if (!valid) submit(answer);
    timerRef.current = window.setTimeout(
      () => {
        timerRef.current = null;
        busyRef.current = false;
        setPulse(false);
        if (valid && document.visibilityState !== 'hidden') {
          completedRef.current = true;
          setCompleted(true);
          submit(answer);
        }
      },
      reduced ? 80 : valid ? 680 : 380,
    );
  }

  const disabled = !active || pulse || completed;
  const railStyle = { '--causal-shift': `${delayStep * 8}%` } as CSSProperties;
  const routePosition = routes.findIndex((candidate) => candidate.id === route);
  const patchStyle = {
    '--causal-cable-span': `${(routePosition + 1) * 25}%`,
  } as CSSProperties;

  return (
    <div
      className={`causal-transmission${pulse ? ' is-pulsing' : ''}${allLocked ? ' is-continuous' : ''}`}
      data-pulse={pulseCount}
      aria-busy={pulse}
    >
      <div
        className="causal-time-deck"
        data-contact={
          testResult ? (testResult.time ? 'closed' : 'open') : undefined
        }
      >
        <div className="causal-deck-caption">
          <span>ECHO BUFFER / TIME BASE</span>
          <output aria-live="polite">
            {delayText(delay)}{' '}
            <small>
              {delay < 0 ? '過去へ' : delay > 0 ? '未来へ' : '同時刻'}
            </small>
          </output>
        </div>
        <div className="causal-time-window" style={railStyle}>
          <div className="causal-reference-rail">
            <span className="causal-rail-label">
              RECEIVE <small>過去側</small>
            </span>
            <div className="causal-ticks">
              {matchedRecords.map(({ receive }) => (
                <span key={receive.id}>
                  <time>{receive.time}</time>
                  <i />
                </span>
              ))}
            </div>
          </div>
          <div className="causal-alignment-pins" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div
            className="causal-source-rail"
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label="送信側の時間軸"
            aria-valuemin={-20}
            aria-valuemax={20}
            aria-valuenow={delay}
            aria-valuetext={`${delayText(delay)}、${delay < 0 ? '過去へ送る' : delay > 0 ? '未来へ送る' : '同時刻'}。左右キーで時間軸を動かす`}
            aria-disabled={disabled}
            onKeyDown={keyRail}
            onPointerDown={startRailDrag}
            onPointerMove={dragRail}
            onPointerUp={(event) => {
              if (dragRef.current?.pointerId === event.pointerId)
                dragRef.current = null;
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
            onLostPointerCapture={() => {
              dragRef.current = null;
            }}
          >
            <span className="causal-rail-label">
              SOURCE <small>送信側</small>
            </span>
            <div className="causal-moving-rail">
              <div className="causal-ticks">
                {matchedRecords.map(({ source }) => (
                  <span key={source.id}>
                    <i />
                    <time>{source.time}</time>
                  </span>
                ))}
              </div>
              <span className="causal-rail-grip" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        </div>
        <div className="causal-time-foot">
          <span>
            ← <small>時間軸を動かす</small> →
          </span>
          <span>
            {testResult
              ? testResult.time
                ? 'TIME BASE / LOCKED'
                : 'TIME BASE / CONTACT OPEN'
              : 'TIME BASE / ADJUST'}
          </span>
        </div>
      </div>

      <div
        className="causal-memory-bus"
        data-contact={
          testResult ? (testResult.packets ? 'closed' : 'open') : undefined
        }
      >
        <div className="causal-bus-caption">
          <span>RECEIVE / E-01</span>
          <small>受け取った場面</small>
          <i aria-hidden="true" />
        </div>
        <div
          className="causal-scene-sockets"
          aria-label="過去側の四つの受信場面"
        >
          {scenes.map((scene, index) => {
            const packet = windows[index];
            const text = packet ? packetTexts[packetIds.indexOf(packet)] : null;
            return (
              <button
                type="button"
                className={`causal-scene-socket${packet ? ' is-patched' : ''}${heldPacket ? ' can-receive' : ''}`}
                key={scene.id}
                data-scene={scene.id}
                disabled={disabled}
                aria-label={`${scene.label}の受信端子${text ? `、${text}、押すと取り外す` : heldPacket ? 'へ選んだPACKETを接続する' : '、未接続'}`}
                onClick={() => operateSocket(index)}
                onDragOver={(event) => {
                  if (canOperate()) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  placePacket(index, event.dataTransfer.getData('text/plain'));
                }}
              >
                <span
                  className="causal-scene-icon"
                  data-icon={scene.id}
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                </span>
                <span className="causal-scene-label">{scene.plate}</span>
                <span className="causal-scene-jack" aria-hidden="true">
                  <i />
                </span>
                <span className="causal-packet-tab">
                  {packet ? (
                    <>
                      <b>{packet.replace('packet-', 'P')}</b>
                      <small>{text}</small>
                    </>
                  ) : (
                    <>
                      <b>○</b>
                      <small>OPEN</small>
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="causal-packet-tray" aria-label="送信する四つの通信">
          {trayOrder.map((index) => {
            const id = packetIds[index]!;
            const patched = windows.includes(id);
            return (
              <button
                type="button"
                className="causal-packet-strip"
                key={id}
                draggable={!disabled && !patched}
                disabled={disabled || patched}
                aria-label={`送信する文「${packetTexts[index]}」`}
                aria-pressed={heldPacket === id}
                onClick={() => {
                  if (canOperate())
                    setHeldPacket((held) => (held === id ? null : id));
                }}
                onDragStart={(event) => {
                  if (!canOperate() || patched) {
                    event.preventDefault();
                    return;
                  }
                  setHeldPacket(id);
                  event.dataTransfer.setData('text/plain', id);
                  event.dataTransfer.effectAllowed = 'move';
                }}
              >
                <i className="causal-strip-pins" aria-hidden="true" />
                <span>{packetTexts[index]}</span>
                <small>
                  {patched
                    ? 'PATCHED'
                    : heldPacket === id
                      ? 'HELD'
                      : 'TX STRIP'}
                </small>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="causal-return-deck"
        data-contact={
          testResult ? (testResult.route ? 'closed' : 'open') : undefined
        }
      >
        <div
          className={`causal-return-patch${heldCable ? ' is-held' : ''}${route ? ' is-patched' : ''}`}
          style={patchStyle}
        >
          <span className="causal-return-cord" aria-hidden="true">
            <i />
          </span>
          <button
            type="button"
            className="causal-cable-source"
            disabled={disabled}
            aria-label={route ? '送信ケーブルを抜く' : '送信ケーブルを持つ'}
            aria-pressed={heldCable}
            onClick={() => {
              if (!canOperate()) return;
              changeSetting();
              if (route) {
                setRoute(null);
                setHeldCable(true);
              } else setHeldCable((held) => !held);
            }}
          >
            <span className="causal-jack-ring" aria-hidden="true">
              <i />
            </span>
            <span>TRANSMIT BUS</span>
            <small>{heldCable ? 'HELD' : route ? 'PATCHED' : 'FREE END'}</small>
          </button>
          {routes.map((candidate) => (
            <button
              type="button"
              className={`causal-route-jack${route === candidate.id ? ' is-connected' : ''}`}
              key={candidate.id}
              disabled={disabled}
              aria-label={`${candidate.label}の端子${route === candidate.id ? '、接続済み' : ''}`}
              aria-pressed={route === candidate.id}
              onClick={() => {
                if (!canOperate()) return;
                if (route === candidate.id) {
                  changeSetting();
                  setRoute(null);
                  setHeldCable(true);
                } else if (heldCable) {
                  changeSetting();
                  setRoute(candidate.id);
                  setHeldCable(false);
                }
              }}
            >
              <span className="causal-jack-ring" aria-hidden="true">
                <i />
              </span>
              <span>{candidate.label}</span>
              <small>{route === candidate.id ? 'CONNECTED' : '○'}</small>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="causal-test-lever"
          aria-label="TEST PULSE 試験レバー"
          disabled={disabled}
          onClick={testPulse}
        >
          <span className="causal-lever-well" aria-hidden="true">
            <i />
          </span>
          <span>TEST PULSE</span>
        </button>
      </div>
      <p className="causal-test-status" role="status" aria-live="polite">
        {testResult
          ? `PACKET MAP / ${testResult.packets ? 'LOCKED' : 'CONTACT OPEN'} · TIME BASE / ${testResult.time ? 'LOCKED' : 'CONTACT OPEN'} · RETURN / ${testResult.route ? 'LOCKED' : 'CONTACT OPEN'}`
          : heldPacket
            ? 'PACKETを受信端子へ接続'
            : heldCable
              ? 'ケーブルを端子へ接続'
              : failures > 0
                ? 'TEST BUS / 再試験待機'
                : 'TEST BUS / STANDBY'}
      </p>
    </div>
  );
}
