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
import {
  getPuzzleCompletionEntries,
  introEntries,
} from '../narrative/narrativeArchive';

type Props = {
  active: boolean;
  failures: number;
  submit: (answer: string[]) => void;
};

type PacketId = `packet-0${1 | 2 | 3 | 4}`;
type RouteId = 'control' | 'echo-return' | 'adjacent';
// Keep the established answer positions; only the physical display order changes.
// Each observation was available before this instrument unlocked.
const scenes = [
  { label: '受信後の返事', observation: `「${introEntries[2].text}」` },
  {
    label: '指示に従った結果',
    observation: '暗かった端末と転送装置が起動した。',
  },
  {
    label: 'この直後に受信',
    observation: `「${getPuzzleCompletionEntries('puzzle_signal_investigation')[0]!.text}」`,
  },
  {
    label: '復元した文への反応',
    observation: `「${getPuzzleCompletionEntries('puzzle_packet_repair')[0]!.text}」`,
  },
] as const;
const sceneOrder = [1, 3, 0, 2];
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
  const [testResult, setTestResult] = useState<boolean | null>(null);
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
  const assemblyReady =
    windows.every((packet) => packet !== null) && route !== null;
  const contact =
    testResult === null ? undefined : testResult ? 'closed' : 'open';

  useEffect(() => {
    function interrupt() {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      busyRef.current = false;
      dragRef.current = null;
      setPulse(false);
      // A test interrupted before submission must be deliberately run again.
      if (!completedRef.current)
        setTestResult((result) => (result === true ? null : result));
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
    if (!canOperate() || !assemblyReady) return;
    busyRef.current = true;
    const answer = [
      ...windows.map((packet) => packet ?? 'open'),
      delay < 0 ? `minus-${Math.abs(delay)}` : `plus-${delay}`,
      route ?? 'disconnected',
    ];
    const valid = isPuzzleAnswerCorrect('puzzle_transmission_window', answer);
    setTestResult(valid);
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
      className={`causal-transmission${pulse ? ' is-pulsing' : ''}${testResult === true ? ' is-continuous' : ''}`}
      data-pulse={pulseCount}
      aria-busy={pulse}
    >
      <div className="causal-time-deck" data-contact={contact}>
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
            {testResult === true ? 'TIME BASE / LOCKED' : 'TIME BASE / ADJUST'}
          </span>
        </div>
      </div>

      <div className="causal-memory-bus" data-contact={contact}>
        <div className="causal-bus-caption">
          <span>RECEIVE / E-01</span>
          <small>記憶に残った反応と変化</small>
          <i aria-hidden="true" />
        </div>
        <div className="causal-scene-sockets" aria-label="受信前後の四つの記憶">
          {sceneOrder.map((index) => {
            const scene = scenes[index]!;
            const packet = windows[index];
            const text = packet ? packetTexts[packetIds.indexOf(packet)] : null;
            return (
              <button
                type="button"
                className={`causal-scene-socket${packet ? ' is-patched' : ''}${heldPacket ? ' can-receive' : ''}`}
                key={scene.label}
                disabled={disabled}
                aria-label={`${scene.label}、${scene.observation}、受信端子${text ? `、${text}、押すと取り外す` : heldPacket ? 'へ選んだ文を接続する' : '、未接続'}`}
                onClick={() => operateSocket(index)}
                onDragOver={(event) => {
                  if (canOperate()) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  placePacket(index, event.dataTransfer.getData('text/plain'));
                }}
              >
                <span className="causal-scene-label">{scene.label}</span>
                <span className="causal-observation">{scene.observation}</span>
                <span className="causal-scene-jack" aria-hidden="true">
                  <i />
                </span>
                <span className="causal-packet-tab">
                  {packet ? (
                    <>
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

      <div className="causal-return-deck" data-contact={contact}>
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
          aria-describedby="transmission-test-status"
          disabled={disabled || !assemblyReady}
          onClick={testPulse}
        >
          <span className="causal-lever-well" aria-hidden="true">
            <i />
          </span>
          <span>TEST PULSE</span>
        </button>
      </div>
      <p
        id="transmission-test-status"
        className="causal-test-status"
        role="status"
        aria-live="polite"
      >
        {testResult !== null
          ? testResult
            ? 'RETURN RECEIVED / 記録と一致'
            : 'RECORD MISMATCH / 文と前後の出来事、LOGの時刻と配線を再確認'
          : heldPacket
            ? '文を、その前後の出来事が合う端子へ接続'
            : heldCable
              ? 'ケーブルを端子へ接続'
              : !assemblyReady
                ? '試験待機 / 四つの受信端子と送信ケーブルを接続'
                : failures > 0
                  ? 'TEST BUS / 再試験待機'
                  : 'TEST BUS / STANDBY'}
      </p>
    </div>
  );
}
