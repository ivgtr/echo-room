import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

import {
  isPuzzleAnswerCorrect,
  PUZZLE_DEVICE_COPY,
  type PuzzleId,
} from '../../game/puzzles/storyPuzzles';
import { ContextBackButton } from '../common/ContextBackButton';
import { SignalInvestigationDevice } from './SignalInvestigationDevice';
import { PacketRailDevice } from './PacketRailDevice';
import { VoiceprintDevice } from './VoiceprintDevice';
import { TransmissionPatchDevice } from './TransmissionPatchDevice';

type Props = {
  puzzleId: PuzzleId;
  failures: number;
  embedded?: boolean;
  active?: boolean;
  onSubmit: (puzzleId: PuzzleId, answer: string[]) => void;
  onClose: () => void;
};

type DeviceProps = {
  active: boolean;
  failures: number;
  submit: (answer: string[]) => void;
};

export function PuzzleDevice({
  puzzleId,
  failures,
  embedded = false,
  active = true,
  onSubmit,
  onClose,
}: Props) {
  const submit = useCallback(
    (answer: string[]) => {
      if (active) onSubmit(puzzleId, answer);
    },
    [active, onSubmit, puzzleId],
  );
  const Device = deviceComponents[puzzleId];
  const [diagnosticPuzzleId, setDiagnosticPuzzleId] = useState<PuzzleId | null>(
    null,
  );
  const diagnosticAvailable = diagnosticPuzzleId === puzzleId;
  const inactivityTimerRef = useRef<number | null>(null);
  const restartInactivityTimer = () => {
    if (!active || diagnosticAvailable) return;
    if (inactivityTimerRef.current !== null)
      window.clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = window.setTimeout(
      () => setDiagnosticPuzzleId(puzzleId),
      60_000,
    );
  };
  useEffect(() => {
    if (!active) return;
    inactivityTimerRef.current = window.setTimeout(
      () => setDiagnosticPuzzleId(puzzleId),
      60_000,
    );
    const sessionTimer = window.setTimeout(
      () => setDiagnosticPuzzleId(puzzleId),
      90_000,
    );
    return () => {
      if (inactivityTimerRef.current !== null)
        window.clearTimeout(inactivityTimerRef.current);
      window.clearTimeout(sessionTimer);
    };
  }, [active, puzzleId]);

  return (
    <DeviceFrame
      puzzleId={puzzleId}
      embedded={embedded}
      onClose={onClose}
      diagnosticAvailable={diagnosticAvailable}
      onActivity={restartInactivityTimer}
    >
      <Device active={active} failures={failures} submit={submit} />
    </DeviceFrame>
  );
}

const deviceComponents: Record<PuzzleId, ComponentType<DeviceProps>> = {
  puzzle_power_route: PowerRouteDevice,
  puzzle_carrier_sync: CarrierSyncDevice,
  puzzle_maintenance_lock: MaintenanceLockDevice,
  puzzle_signal_investigation: SignalInvestigationDevice,
  puzzle_packet_repair: PacketRailDevice,
  puzzle_voiceprint_calibration: VoiceprintDevice,
  puzzle_transmission_window: TransmissionPatchDevice,
};

const closeupImages: Partial<Record<PuzzleId, string>> = {
  puzzle_maintenance_lock:
    'assets/images/close/gfx-close-007__symbol-reel__preview-flat.webp',
  puzzle_voiceprint_calibration:
    'assets/images/close/gfx-close-009__closed__preview-flat.webp',
};

function DeviceFrame({
  puzzleId,
  embedded,
  onClose,
  diagnosticAvailable,
  onActivity,
  children,
}: {
  puzzleId: PuzzleId;
  embedded: boolean;
  onClose: () => void;
  diagnosticAvailable: boolean;
  onActivity: () => void;
  children: ReactNode;
}) {
  const copy = PUZZLE_DEVICE_COPY[puzzleId];
  const titleId = `${puzzleId}-title`;
  const closeupImage = closeupImages[puzzleId];
  const closeupStyle = closeupImage
    ? ({
        backgroundImage: `url("${import.meta.env.BASE_URL}${closeupImage}")`,
      } satisfies CSSProperties)
    : undefined;
  return (
    <section
      className={`puzzle-device device-${puzzleId}${embedded ? ' is-embedded' : ' device-closeup'}`}
      role={embedded ? 'region' : 'dialog'}
      aria-modal={embedded ? undefined : true}
      aria-labelledby={embedded ? undefined : titleId}
      aria-label={embedded ? copy.title : undefined}
      data-puzzle-id={puzzleId}
      data-diagnostic-available={diagnosticAvailable || undefined}
      style={closeupStyle}
      onPointerDownCapture={onActivity}
      onKeyDownCapture={onActivity}
    >
      {!embedded && (
        <ContextBackButton destination="部屋に戻る" onClick={onClose} />
      )}
      {!embedded && (
        <header className="device-identity">
          <p>{copy.eyebrow}</p>
          <h2 id={titleId}>{copy.title}</h2>
        </header>
      )}
      <div className="device-workarea">{children}</div>
      {diagnosticAvailable && (
        <p className="device-diagnostic" role="status">
          DIAGNOSTIC AVAILABLE / SYSTEMのヒントを確認できます
        </p>
      )}
    </section>
  );
}

function PowerRouteDevice({ submit }: DeviceProps) {
  type CircuitId = 'terminal' | 'intercom' | 'buffer' | 'door';
  const startupOrder: CircuitId[] = ['terminal', 'intercom', 'buffer'];
  const [activeCircuits, setActiveCircuits] = useState<CircuitId[]>(['door']);
  const [rejectedCircuit, setRejectedCircuit] = useState<CircuitId | null>(
    null,
  );
  const [isComplete, setIsComplete] = useState(false);
  const rejectionTimerRef = useRef<number | null>(null);
  const completionTimerRef = useRef<number | null>(null);
  const lines = [
    ['terminal', 'TERMINAL', 489],
    ['intercom', 'INTERCOM', 665],
    ['buffer', 'ECHO BUFFER', 842],
    ['door', 'DOOR', 1021],
  ] as const;
  const startedCount = startupOrder.filter((id) =>
    activeCircuits.includes(id),
  ).length;

  useEffect(() => {
    return () => {
      if (rejectionTimerRef.current !== null)
        window.clearTimeout(rejectionTimerRef.current);
      if (completionTimerRef.current !== null)
        window.clearTimeout(completionTimerRef.current);
    };
  }, []);

  function rejectCircuit(id: CircuitId, answer: string[]) {
    if (rejectionTimerRef.current !== null)
      window.clearTimeout(rejectionTimerRef.current);
    setRejectedCircuit(id);
    submit(answer);
    rejectionTimerRef.current = window.setTimeout(
      () => setRejectedCircuit(null),
      520,
    );
  }

  function toggleCircuit(id: CircuitId) {
    if (isComplete) return;
    if (id !== 'door' && activeCircuits.includes('door')) {
      rejectCircuit(id, ['short-circuit', id]);
      return;
    }
    setRejectedCircuit(null);

    if (id === 'door') {
      setActiveCircuits((current) =>
        current.includes('door')
          ? current.filter((circuit) => circuit !== 'door')
          : [...current, 'door'],
      );
      return;
    }

    if (activeCircuits.includes(id)) {
      const selectedIndex = startupOrder.indexOf(id);
      setActiveCircuits((current) =>
        current.filter(
          (circuit) =>
            circuit === 'door' || startupOrder.indexOf(circuit) < selectedIndex,
        ),
      );
      return;
    }

    const expectedCircuit = startupOrder[startedCount];
    if (id !== expectedCircuit) {
      rejectCircuit(id, ['control-signal-missing', id]);
      return;
    }

    const nextCircuits = [...activeCircuits, id];
    setActiveCircuits(nextCircuits);
    if (startedCount === startupOrder.length - 1) {
      setIsComplete(true);
      const reduced = document.documentElement.dataset.reducedMotion === 'true';
      completionTimerRef.current = window.setTimeout(
        () => submit(startupOrder),
        reduced ? 60 : 420,
      );
    }
  }

  const status = rejectedCircuit
    ? activeCircuits.includes('door')
      ? 'PROTECTION TRIPPED'
      : 'CONTROL SIGNAL MISSING'
    : activeCircuits.includes('door')
      ? 'PROTECTION TRIPPED'
      : isComplete
        ? 'ONLINE'
        : startedCount > 0
          ? `BOOT SEQUENCE / ${startedCount} / 3`
          : 'BOOT SEQUENCE READY';
  const panelStateImage =
    startedCount >= 2
      ? 'gfx-close-005__intercom-powered__preview-flat.webp'
      : startedCount >= 1
        ? 'gfx-close-005__terminal-powered__preview-flat.webp'
        : 'gfx-close-005__empty-panel__preview-flat.webp';

  return (
    <div
      className={`power-device${rejectedCircuit ? ' is-rejecting' : ''}${isComplete ? ' is-online' : ''}`}
    >
      <div className="power-stage">
        <img
          className="power-panel-base"
          src={`${import.meta.env.BASE_URL}assets/images/close/${panelStateImage}`}
          alt=""
          aria-hidden="true"
        />
        <p className="power-readout">AUXILIARY POWER BUS</p>
        <p className="power-protection" role="status" aria-live="assertive">
          {status}
        </p>
        <div className="breaker-bank" aria-label="非常電源の四回路">
          {lines.map(([id, label, bayX]) => {
            const active = activeCircuits.includes(id);
            const rejected = rejectedCircuit === id;
            return (
              <button
                type="button"
                className={`physical-breaker${active ? ' is-on' : ''}${id === 'door' ? ' is-short' : ''}${rejected ? ' is-rejected' : ''}`}
                style={{ '--bay-x': bayX } as CSSProperties}
                aria-pressed={active}
                aria-label={`${label}回路、${active ? 'ON' : 'OFF'}`}
                disabled={isComplete}
                key={id}
                onClick={() => toggleCircuit(id)}
              >
                <span className="circuit-name">{label}</span>
                <img
                  className="breaker-lever-sprite"
                  src={`${import.meta.env.BASE_URL}assets/images/close/gfx-close-005__lever-sprite.webp`}
                  alt=""
                  aria-hidden="true"
                />
                <span className="circuit-status-label" aria-hidden="true">
                  STATUS
                </span>
                <span className="breaker-sockets" aria-hidden="true">
                  <span className="breaker-socket">
                    <img
                      src={`${import.meta.env.BASE_URL}assets/images/close/gfx-close-005__socket-sprite.webp`}
                      alt=""
                    />
                    {(active || rejected) && <i />}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CarrierSyncDevice({ active, failures, submit }: DeviceProps) {
  const [positions, setPositions] = useState([-2, 0, 1]);
  useAutoAnswer(
    active && positions.every((position) => position === 0)
      ? ['right-2', 'none', 'left-1']
      : null,
    submit,
  );
  return (
    <div className={`carrier-device${failures > 0 ? ' is-error' : ''}`}>
      <div className="carrier-contact-bank" aria-hidden="true">
        {positions.map((value, index) => (
          <i key={index} className={value === 0 ? 'is-closed' : ''}>
            <b />
          </i>
        ))}
      </div>
      <div className="carrier-readout">
        <span>REFERENCE</span>
        <strong>SYNC POINT / 0</strong>
        <span>LOCK</span>
        <strong>{positions.filter((value) => value === 0).length} CH</strong>
      </div>
      <WaveRail label="REFERENCE" position={0} reference />
      {(['CHANNEL A', 'CHANNEL B', 'CHANNEL C'] as const).map(
        (label, index) => (
          <WaveRail
            key={label}
            label={label}
            position={positions[index] ?? 0}
            onChange={(value) =>
              setPositions((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index ? value : item,
                ),
              )
            }
          />
        ),
      )}
    </div>
  );
}

function WaveRail({
  label,
  position,
  reference = false,
  onChange,
}: {
  label: string;
  position: number;
  reference?: boolean;
  onChange?: (value: number) => void;
}) {
  const overlap = Math.max(42, 100 - Math.abs(position) * 29);

  function setFromPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / bounds.width;
    onChange?.(Math.max(-2, Math.min(2, Math.round((ratio - 0.5) * 4))));
  }

  return (
    <div className={`wave-rail${position === 0 ? ' is-locked' : ''}`}>
      <span>{label}</span>
      <div
        className={`wave-track${reference ? ' is-reference' : ' is-draggable'}`}
        {...(!reference && {
          role: 'slider',
          tabIndex: 0,
          'aria-label': label,
          'aria-valuemin': -2,
          'aria-valuemax': 2,
          'aria-valuenow': position,
          'aria-valuetext': `${overlap}%一致、${position === 0 ? '位相固定' : '未同期'}`,
          onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setFromPointer(event);
          },
          onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              setFromPointer(event);
          },
          onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId))
              event.currentTarget.releasePointerCapture(event.pointerId);
          },
          onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            onChange?.(
              Math.max(
                -2,
                Math.min(2, position + (event.key === 'ArrowRight' ? 1 : -1)),
              ),
            );
          },
        })}
      >
        {!reference && <em aria-hidden="true" />}
        <i
          aria-hidden="true"
          style={{ transform: `translateX(${position * 12}%)` }}
        />
        <b />
      </div>
      {reference ? (
        <output>REFERENCE</output>
      ) : (
        <output>
          {position === 0 ? '● PHASE LOCK' : `OVERLAP ${overlap}%`}
        </output>
      )}
    </div>
  );
}

const symbols = [
  ['double', '║'],
  ['ring', '○'],
  ['triangle', '△'],
  ['node', '◆'],
] as const;

function MaintenanceLockDevice({ active, submit }: DeviceProps) {
  const [dials, setDials] = useState(['ring', 'triangle', 'node', 'double']);
  const [jammed, setJammed] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  const submittedRef = useRef(false);
  useEffect(() => {
    if (!active || !visible || !unlocked || submittedRef.current) return;
    const timer = window.setTimeout(() => {
      if (document.hidden || submittedRef.current) return;
      submittedRef.current = true;
      submit(dials);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [active, visible, dials, submit, unlocked]);

  function rotateDial(index: number, symbolIndex: number, delta: number) {
    if (!active || unlocked) return;
    setJammed(false);
    setDials((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? symbols[(symbolIndex + delta + symbols.length) % symbols.length]![0]
          : item,
      ),
    );
  }

  return (
    <div className="locker-device">
      <div
        className={`lock-plate${jammed ? ' is-jammed' : ''}${unlocked ? ' is-unlocked' : ''}`}
        aria-label={unlocked ? 'ラッチが外れたロッカー' : undefined}
      >
        <span>LAST INSPECTION</span>
        <div className="symbol-dials" aria-label="4つの記号ダイヤル">
          {dials.map((value, index) => {
            const symbolIndex = symbols.findIndex(([id]) => id === value);
            const symbol = symbols[symbolIndex]?.[1];
            return (
              <button
                type="button"
                role="spinbutton"
                aria-label={`ダイヤル${index + 1}`}
                aria-valuemin={0}
                aria-valuemax={symbols.length - 1}
                aria-valuenow={symbolIndex}
                aria-valuetext={symbol}
                className="symbol-dial"
                key={index}
                disabled={!active || unlocked}
                onClick={() => rotateDial(index, symbolIndex, 1)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')
                    return;
                  event.preventDefault();
                  const delta = event.key === 'ArrowDown' ? 1 : -1;
                  rotateDial(index, symbolIndex, delta);
                }}
              >
                <span className="symbol-reel-window" aria-hidden="true">
                  <small>
                    {
                      symbols[
                        (symbolIndex - 1 + symbols.length) % symbols.length
                      ]![1]
                    }
                  </small>
                  <strong key={`${index}-${value}`}>{symbol}</strong>
                  <small>
                    {symbols[(symbolIndex + 1) % symbols.length]![1]}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="lock-handle"
          aria-label="ロッカーのハンドル"
          disabled={!active || unlocked}
          onClick={() => {
            if (!active || unlocked) return;
            if (isPuzzleAnswerCorrect('puzzle_maintenance_lock', dials)) {
              setUnlocked(true);
              setJammed(false);
            } else {
              setJammed(true);
              submit(dials);
            }
          }}
        >
          <i
            aria-hidden="true"
            style={{
              backgroundImage: `url("${import.meta.env.BASE_URL}${closeupImages.puzzle_maintenance_lock}")`,
            }}
          />
        </button>
      </div>
      {jammed && (
        <p
          className="device-feedback is-error locker-handle-status"
          role="status"
        >
          LOCK / JAMMED
        </p>
      )}
    </div>
  );
}

function useAutoAnswer(
  answer: string[] | null,
  submit: (answer: string[]) => void,
) {
  const submittedSignature = useRef('');
  const signature = answer?.join('|') ?? '';
  useEffect(() => {
    if (!answer || submittedSignature.current === signature) return;
    submittedSignature.current = signature;
    submit(answer);
  }, [answer, signature, submit]);
}
