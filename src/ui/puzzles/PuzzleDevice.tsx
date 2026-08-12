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
  packetTexts,
  PUZZLE_DEVICE_COPY,
  type PuzzleId,
} from '../../game/puzzles/storyPuzzles';
import { FacilityMap } from '../evidence/FacilityMap';

type Props = {
  puzzleId: PuzzleId;
  failures: number;
  embedded?: boolean;
  onSubmit: (puzzleId: PuzzleId, answer: string[]) => void;
  onClose: () => void;
};

type DeviceProps = {
  failures: number;
  submit: (answer: string[]) => void;
};

export function PuzzleDevice({
  puzzleId,
  failures,
  embedded = false,
  onSubmit,
  onClose,
}: Props) {
  const submit = useCallback(
    (answer: string[]) => onSubmit(puzzleId, answer),
    [onSubmit, puzzleId],
  );
  const Device = deviceComponents[puzzleId];
  const [diagnosticPuzzleId, setDiagnosticPuzzleId] = useState<PuzzleId | null>(
    null,
  );
  const diagnosticAvailable = diagnosticPuzzleId === puzzleId;
  const inactivityTimerRef = useRef<number | null>(null);
  const restartInactivityTimer = () => {
    if (diagnosticAvailable) return;
    if (inactivityTimerRef.current !== null)
      window.clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = window.setTimeout(
      () => setDiagnosticPuzzleId(puzzleId),
      60_000,
    );
  };
  useEffect(() => {
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
  }, [puzzleId]);

  return (
    <DeviceFrame
      puzzleId={puzzleId}
      failures={failures}
      embedded={embedded}
      onClose={onClose}
      diagnosticAvailable={diagnosticAvailable}
      onActivity={restartInactivityTimer}
    >
      <Device failures={failures} submit={submit} />
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
  failures,
  embedded,
  onClose,
  diagnosticAvailable,
  onActivity,
  children,
}: {
  puzzleId: PuzzleId;
  failures: number;
  embedded: boolean;
  onClose: () => void;
  diagnosticAvailable: boolean;
  onActivity: () => void;
  children: ReactNode;
}) {
  const copy = PUZZLE_DEVICE_COPY[puzzleId];
  const titleId = `${puzzleId}-title`;
  const closeupImage = closeupImages[puzzleId];
  const errorCode: Partial<Record<PuzzleId, string>> = {
    puzzle_maintenance_lock: 'LOCK / JAMMED',
    puzzle_packet_repair: 'CONTINUITY / BROKEN',
  };
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
      aria-labelledby={titleId}
      data-puzzle-id={puzzleId}
      data-diagnostic-available={diagnosticAvailable || undefined}
      style={closeupStyle}
      onPointerDownCapture={onActivity}
      onKeyDownCapture={onActivity}
    >
      {!embedded && (
        <button
          type="button"
          className="device-back"
          aria-label="装置から離れる"
          onClick={onClose}
        >
          &lt; BACK
        </button>
      )}
      <header className="device-identity">
        <p>{copy.eyebrow}</p>
        <h2 id={titleId}>{copy.title}</h2>
      </header>
      <div className="device-workarea">{children}</div>
      {puzzleId !== 'puzzle_power_route' && (
        <p
          className={`device-feedback${failures > 0 ? ' is-error' : ''}`}
          aria-live="assertive"
        >
          {failures > 0
            ? (errorCode[puzzleId] ?? copy.incorrectFeedback)
            : 'STATUS / STANDBY'}
        </p>
      )}
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

  return (
    <div
      className={`power-device${rejectedCircuit ? ' is-rejecting' : ''}${isComplete ? ' is-online' : ''}`}
    >
      <div className="power-stage">
        <img
          className="power-panel-base"
          src={`${import.meta.env.BASE_URL}assets/images/close/gfx-close-005__empty-panel__preview-flat.webp`}
          alt=""
          aria-hidden="true"
        />
        <p className="power-readout">AUXILIARY POWER BUS</p>
        <p className="power-protection" role="status" aria-live="assertive">
          {status}
        </p>
        <div className="power-signal-vfx" aria-hidden="true">
          <i className={startedCount >= 1 ? 'is-powered' : ''} />
          <i className={startedCount >= 2 ? 'is-powered' : ''} />
        </div>
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

function CarrierSyncDevice({ failures, submit }: DeviceProps) {
  const [positions, setPositions] = useState([-2, 0, 1]);
  useAutoAnswer(
    positions.every((position) => position === 0)
      ? ['right-2', 'none', 'left-1']
      : null,
    submit,
  );
  return (
    <div className={`carrier-device${failures > 0 ? ' is-error' : ''}`}>
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

function MaintenanceLockDevice({ failures, submit }: DeviceProps) {
  const [dials, setDials] = useState(['ring', 'triangle', 'node', 'double']);
  return (
    <div className="locker-device">
      <div className={`lock-plate${failures > 0 ? ' is-jammed' : ''}`}>
        <span>LAST INSPECTION</span>
        <div className="symbol-dials" aria-label="四連記号錠">
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
                onClick={() =>
                  setDials((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? symbols[(symbolIndex + 1) % symbols.length]![0]
                        : item,
                    ),
                  )
                }
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')
                    return;
                  event.preventDefault();
                  const delta = event.key === 'ArrowDown' ? 1 : -1;
                  setDials((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index
                        ? symbols[
                            (symbolIndex + delta + symbols.length) %
                              symbols.length
                          ]![0]
                        : item,
                    ),
                  );
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
          aria-label="LOCK HANDLE"
          onClick={() => submit(dials)}
        >
          <i aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

const signatures = {
  r1: '短・長・短',
  r2: '長・短・短',
  r3: '短・短・長',
  's-a': '短・短・長',
  's-b': '短・長・短',
  's-c': '長・短・短',
} as const;

function WaveSignature({
  value,
}: {
  value: (typeof signatures)[keyof typeof signatures];
}) {
  return (
    <small className="wave-signature" aria-label={`波形 ${value}`}>
      {value.split('・').map((pulse, index) => (
        <i
          aria-hidden="true"
          className={pulse === '長' ? 'is-long' : 'is-short'}
          key={`${pulse}-${index}`}
        />
      ))}
    </small>
  );
}

function SignalInvestigationDevice({ failures, submit }: DeviceProps) {
  const [activeReceive, setActiveReceive] = useState<number | null>(null);
  const [patches, setPatches] = useState<(string | null)[]>([null, null, null]);
  const [trace, setTrace] = useState<string[]>([]);
  const pairingComplete = patches.every((source, index) => {
    const receiveId = `r${index + 1}` as keyof typeof signatures;
    return (
      source &&
      signatures[receiveId] === signatures[source as keyof typeof signatures]
    );
  });
  useAutoAnswer(
    pairingComplete && trace.length === 3
      ? [...patches.filter(isString), ...trace]
      : null,
    submit,
  );
  const traceSegments = [
    ['signal', '通信実線'],
    ['power', '電力破線'],
    ['ring-relay', 'J-2 丸端子'],
    ['bar-relay', 'J-3 線端子'],
    ['echo-buffer', 'ECHO BUFFER RETURN'],
    ['adjacent-room', 'E-02'],
  ] as const;
  const allowedAtStep = [
    ['signal', 'power'],
    ['ring-relay', 'bar-relay'],
    ['echo-buffer', 'adjacent-room'],
  ] as const;
  return (
    <div
      className={`signal-investigation-device${failures > 0 ? ' is-trace-error' : ''}`}
    >
      <div className="patch-device">
        <div className="log-columns">
          <div className="jack-column">
            <h3>RECEIVE</h3>
            {(['r1', 'r2', 'r3'] as const).map((id, index) => (
              <button
                type="button"
                className={activeReceive === index ? 'jack is-armed' : 'jack'}
                aria-pressed={activeReceive === index}
                aria-label={`${id.toUpperCase()}受信端子`}
                key={id}
                onClick={() => setActiveReceive(index)}
              >
                <i aria-hidden="true" />
                <span>{id.toUpperCase()}</span>
                <WaveSignature value={signatures[id]} />
              </button>
            ))}
          </div>
          <div className="patch-cords" aria-label="接続状態">
            {patches.map((source, index) => (
              <span
                key={index}
              >{`R${index + 1} ─ ${source?.toUpperCase() ?? 'OPEN'}`}</span>
            ))}
          </div>
          <div className="jack-column">
            <h3>SOURCE</h3>
            {(['s-a', 's-b', 's-c'] as const).map((id) => (
              <button
                type="button"
                className="jack"
                aria-label={`${id.toUpperCase()}送信端子`}
                key={id}
                onClick={() => {
                  if (activeReceive === null) return;
                  setPatches((current) =>
                    current.map((value, index) =>
                      index === activeReceive ? id : value,
                    ),
                  );
                  setActiveReceive(null);
                }}
              >
                <i aria-hidden="true" />
                <span>{id.toUpperCase()}</span>
                <WaveSignature value={signatures[id]} />
              </button>
            ))}
          </div>
        </div>
        {pairingComplete && (
          <div
            className="offset-reveal"
            role="status"
            aria-label="3組すべて送信は受信の20分後"
          >
            <span>02:11:04 ─ 02:31:04</span>
            <span>02:14:32 ─ 02:34:32</span>
            <span>02:17:18 ─ 02:37:18</span>
            <strong>+20:00 / OFFSET CONFIRMED</strong>
          </div>
        )}
      </div>
      {pairingComplete && (
        <div className="trace-device">
          <FacilityMap conduitLayer revealRoute={false} />
          <div className="trace-path" aria-label="INTERCOMから配線を順に追う">
            <span>INTERCOM</span>
            {traceSegments.map(([id, label]) => {
              const step = trace.length;
              const enabled =
                step < allowedAtStep.length &&
                allowedAtStep[step]!.includes(id as never);
              const selected = trace.includes(id);
              return (
                <button
                  type="button"
                  key={id}
                  disabled={!enabled || selected}
                  aria-pressed={selected}
                  onClick={() => setTrace((current) => [...current, id])}
                >
                  {label}
                </button>
              );
            })}
            <button
              type="button"
              className="device-eject"
              onClick={() => setTrace([])}
            >
              TRACE RESET
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const fragments = [
  { id: 'a', label: 'A', left: 'diamond', right: 'voice' },
  { id: 'b', label: 'B', left: 'voice', right: 'check' },
  { id: 'c', label: 'C', left: 'header', right: 'triangle' },
  { id: 'd', label: 'D', left: 'triangle', right: 'diamond' },
] as const;

function PacketRailDevice({ submit }: DeviceProps) {
  const [rail, setRail] = useState<(string | null)[]>([null, null, null]);
  const [selected, setSelected] = useState<string | null>(null);
  const complete = rail.every(isString);
  const submittedSignatureRef = useRef('');

  const placedFragments = [
    fragments.find(({ id }) => id === 'c')!,
    ...rail.map((id) => fragments.find((fragment) => fragment.id === id)),
  ];
  const joints = placedFragments.slice(0, -1).map((fragment, index) => {
    const next = placedFragments[index + 1];
    return Boolean(fragment && next && fragment.right === next.left);
  });
  const answerSignature = complete
    ? ['c', ...rail.filter(isString)].join('|')
    : '';
  const jointSignature = joints.map(Number).join('');
  const restored = complete && jointSignature === '111';
  useEffect(() => {
    if (!complete || restored) return;
    const answer = answerSignature.split('|');
    if (submittedSignatureRef.current === answerSignature) return;
    submittedSignatureRef.current = answerSignature;
    submit(answer);
  }, [answerSignature, complete, restored, submit]);

  function placeFragment(slot: number, fragmentId: string) {
    setRail((current) =>
      current.map((value, index) => {
        if (index === slot) return fragmentId;
        return value === fragmentId ? null : value;
      }),
    );
    setSelected(null);
  }

  return (
    <div className="frame-device">
      {!restored && (
        <>
          <div className="frame-rail" aria-label="PACKET断片レール">
            {[0, 1, 2, 3].map((slot) => {
              const fixed = slot === 0;
              const fragment = fixed
                ? fragments.find(({ id }) => id === 'c')
                : fragments.find(({ id }) => id === rail[slot - 1]);
              return (
                <div
                  className={`data-fragment-slot${fixed ? ' is-fixed' : ''}`}
                  key={slot}
                >
                  <small>{fixed ? 'HEADER / FIXED' : `RAIL ${slot + 1}`}</small>
                  <button
                    type="button"
                    data-frame-slot={fixed ? undefined : slot - 1}
                    disabled={fixed}
                    aria-label={
                      fixed
                        ? '固定されたHEADER断片C'
                        : fragment
                          ? `レール${slot + 1}の断片${fragment.label}を持ち上げる`
                          : `レール${slot + 1}へ${selected ? `断片${selected.toUpperCase()}を` : ''}置く`
                    }
                    onClick={() => {
                      if (fixed) return;
                      if (selected) placeFragment(slot - 1, selected);
                      else if (fragment) {
                        setSelected(fragment.id);
                        setRail((current) =>
                          current.map((value, index) =>
                            index === slot - 1 ? null : value,
                          ),
                        );
                      }
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const fragmentId =
                        event.dataTransfer.getData('text/plain');
                      if (fragmentId) placeFragment(slot - 1, fragmentId);
                    }}
                  >
                    {fragment ? (
                      <DataFragmentGraphic fragment={fragment} />
                    ) : (
                      <span className="empty-fragment" aria-hidden="true" />
                    )}
                  </button>
                  {slot < 3 && (
                    <i
                      className={`fragment-joint${joints[slot] ? ' is-connected' : complete ? ' is-broken' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="fragment-tray" aria-label="壊れたデータ片">
            {fragments
              .filter(({ id }) => id !== 'c')
              .map((fragment) => (
                <button
                  type="button"
                  key={fragment.id}
                  draggable
                  disabled={rail.includes(fragment.id)}
                  aria-pressed={selected === fragment.id}
                  aria-label={`断片${fragment.label}を持つ`}
                  onClick={() => setSelected(fragment.id)}
                  onDragStart={(event) => {
                    setSelected(fragment.id);
                    event.dataTransfer.setData('text/plain', fragment.id);
                  }}
                >
                  <DataFragmentGraphic fragment={fragment} />
                </button>
              ))}
            <button
              type="button"
              className="device-eject"
              onClick={() => {
                setRail([null, null, null]);
                setSelected(null);
              }}
            >
              EJECT / 取り出す
            </button>
          </div>
          <div className="frame-continuity" aria-live="polite">
            {joints.map((connected, index) => (
              <span
                className={
                  connected ? 'is-connected' : complete ? 'is-broken' : ''
                }
                key={index}
              >
                {connected ? '●' : complete ? '×' : '○'}
              </span>
            ))}
            <small>
              {complete && joints.some((joint) => !joint)
                ? 'SIGNAL BREAK'
                : 'CONTINUITY'}
            </small>
          </div>
        </>
      )}
      {restored && (
        <div
          className="packet-restored-sequence"
          role="status"
          aria-live="assertive"
        >
          <strong>FRAME RESTORED</strong>
          {packetTexts.map((text, index) => (
            <span className={index === 3 ? 'is-future-packet' : ''} key={text}>
              PACKET 0{index + 1} / {text}
            </span>
          ))}
          <button
            type="button"
            className="packet-confirm"
            onClick={() => submit(['c', ...rail.filter(isString)])}
          >
            ACCEPT FRAME / 復元内容を確認する
          </button>
        </div>
      )}
    </div>
  );
}

type FragmentDefinition = (typeof fragments)[number];

function DataFragmentGraphic({ fragment }: { fragment: FragmentDefinition }) {
  return (
    <span className="data-fragment" data-fragment-id={fragment.id}>
      <i className={`fragment-edge edge-${fragment.left}`} aria-hidden="true" />
      <b aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </b>
      <i
        className={`fragment-edge edge-${fragment.right}`}
        aria-hidden="true"
      />
      <strong>DATA {fragment.label}</strong>
    </span>
  );
}

function VoiceprintDevice({ failures, submit }: DeviceProps) {
  const [spacing, setSpacing] = useState(0);
  const [inverted, setInverted] = useState(false);
  const [phase, setPhase] = useState(0);
  const [matchProgress, setMatchProgress] = useState<number | null>(null);
  const matchStartedRef = useRef(false);
  const calibrated = spacing === 1 && inverted && phase === -2;
  useEffect(() => {
    if (!calibrated || matchStartedRef.current) return;
    matchStartedRef.current = true;
    const steps = [24, 51, 76, 93, 99.8, 100];
    const reduced = document.documentElement.dataset.reducedMotion === 'true';
    const timers = steps.map((value, index) =>
      window.setTimeout(
        () => setMatchProgress(value),
        index * (reduced ? 60 : 420),
      ),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [calibrated, submit]);
  const spacingLabels = ['1×', '1/2×', '2×'];
  return (
    <div className={`voiceprint-device${failures > 0 ? ' is-error' : ''}`}>
      <div className="voiceprint-screen" aria-label="声紋特徴量比較">
        <span>STAFF RECORD</span>
        <WaveBars values={[2, 4, 2, 2, 4, 2]} />
        <output>間隔 1-2-1 / 上-下-上 / 開始 0</output>
        <span>RECEIVED / CALIBRATED</span>
        <WaveBars
          values={inverted ? [2, 5, 2, 2, 5, 2] : [5, 1, 5, 5, 1, 5]}
          offset={phase}
          compressed={spacing === 1}
        />
        <output>
          倍率 {spacingLabels[spacing]} / {inverted ? '上下反転' : '原形'} /
          開始 {signed(phase)}
        </output>
      </div>
      <div className="calibration-controls">
        <button
          type="button"
          role="spinbutton"
          aria-label="波の間隔ダイヤル"
          aria-valuemin={0}
          aria-valuemax={2}
          aria-valuenow={spacing}
          aria-valuetext={spacingLabels[spacing]}
          className="rotary-control"
          onClick={() => setSpacing((value) => (value + 1) % 3)}
        >
          <i style={{ transform: `rotate(${spacing * 105 - 105}deg)` }} />
          <span>SPACING</span>
          <output>{spacingLabels[spacing]}</output>
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={inverted}
          className="toggle-control"
          onClick={() => setInverted((value) => !value)}
        >
          <i />
          <span>ENVELOPE</span>
          <output>{inverted ? 'INVERT' : 'NORMAL'}</output>
        </button>
        <label className="phase-control">
          <span>PHASE</span>
          <input
            type="range"
            min={-2}
            max={2}
            step={1}
            value={phase}
            aria-label="波の開始位置"
            aria-valuetext={signed(phase)}
            onChange={(event) => setPhase(Number(event.currentTarget.value))}
          />
          <output>{signed(phase)}</output>
        </label>
      </div>
      {matchProgress !== null && (
        <div
          className={`voice-match-sequence${matchProgress === 100 ? ' is-match' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span>VOICE MATCH</span>
          <strong>
            {matchProgress.toFixed(matchProgress >= 99.8 ? 1 : 0)}%
          </strong>
          {matchProgress >= 99.8 && (
            <figure>
              <img
                src={`${import.meta.env.BASE_URL}assets/images/items/gfx-item-003__approved__badge-crop__512x640.webp`}
                alt="職員カードと一致したE-01担当者の写真"
              />
              <figcaption>
                {matchProgress === 100
                  ? '100.0% / MATCH / E-01 OCCUPANT'
                  : 'IDENTITY QUERY...'}
              </figcaption>
            </figure>
          )}
          {matchProgress === 100 && (
            <button
              type="button"
              className="voice-match-confirm"
              onClick={() => submit(['compress-half', 'invert', 'left-2'])}
            >
              MATCH CONFIRM / 本人一致を確認する
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function WaveBars({
  values,
  offset = 0,
  compressed = false,
}: {
  values: readonly number[];
  offset?: number;
  compressed?: boolean;
}) {
  return (
    <div
      className={`feature-wave${compressed ? ' is-compressed' : ''}`}
      style={{ transform: `translateX(${offset * 4}%)` }}
      aria-hidden="true"
    >
      {values.map((height, index) => (
        <i key={index} style={{ height: `${height * 15}%` }} />
      ))}
    </div>
  );
}

function TransmissionPatchDevice({ failures, submit }: DeviceProps) {
  const [armedPacket, setArmedPacket] = useState<string | null>(null);
  const [windows, setWindows] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const delayOptions = ['minus-10', 'minus-20', 'plus-20'] as const;
  const routeOptions = ['control', 'echo-return', 'adjacent'] as const;
  const [delayIndex, setDelayIndex] = useState(0);
  const [routeIndex, setRouteIndex] = useState(0);
  const packetReady = windows.every(
    (packet, index) => packet === `packet-0${index + 1}`,
  );
  const delayReady = delayOptions[delayIndex] === 'minus-20';
  const routeReady = routeOptions[routeIndex] === 'echo-return';
  const showValidation = failures > 0;
  return (
    <div className="transmission-device">
      <div
        className={`transmission-packet-region${showValidation && !packetReady ? ' is-region-error' : ''}`}
      >
        <div className="transmission-windows" aria-label="四つの受信窓">
          {[
            '返事をする前',
            '電源を調べる前',
            'LOGを開いた直後',
            '最後の操作の前',
          ].map((label, index) => (
            <button
              type="button"
              key={label}
              aria-label={`W${index + 1} ${label}`}
              onClick={() => {
                if (!armedPacket) return;
                setWindows((current) =>
                  current.map((value, itemIndex) =>
                    itemIndex === index ? armedPacket : value,
                  ),
                );
                setArmedPacket(null);
              }}
            >
              <small>
                W{index + 1} / {label}
              </small>
              <strong>{windows[index]?.toUpperCase() ?? 'OPEN'}</strong>
            </button>
          ))}
        </div>
        {showValidation && (
          <p className="transmission-validation" role="status">
            PACKET MAP / {packetReady ? 'LOCKED' : 'RECHECK'}
          </p>
        )}
      </div>
      <div className="packet-plugs">
        {packetTexts.map((text, index) => {
          const id = `packet-0${index + 1}`;
          return (
            <button
              type="button"
              key={id}
              aria-label={`送信断片「${text}」`}
              aria-pressed={armedPacket === id}
              onClick={() => setArmedPacket(id)}
            >
              <span>TX STRIP</span>
              <small>{text}</small>
            </button>
          );
        })}
      </div>
      <div className="transmission-controls">
        <div
          className={`transmission-control-region${showValidation && !delayReady ? ' is-region-error' : ''}`}
        >
          <button
            type="button"
            role="spinbutton"
            aria-label="送信遅延ダイヤル"
            aria-valuemin={0}
            aria-valuemax={delayOptions.length - 1}
            aria-valuenow={delayIndex}
            aria-valuetext={['-00:10:00', '-00:20:00', '+00:20:00'][delayIndex]}
            className="rotary-control"
            onClick={() =>
              setDelayIndex((value) => (value + 1) % delayOptions.length)
            }
          >
            <i style={{ transform: `rotate(${delayIndex * 105 - 105}deg)` }} />
            <span>DELAY</span>
            <output>
              {['-00:10:00', '-00:20:00', '+00:20:00'][delayIndex]}
            </output>
          </button>
          {showValidation && (
            <small className="transmission-validation">
              DELAY / {delayReady ? 'LOCKED' : 'RECHECK'}
            </small>
          )}
        </div>
        <div
          className={`transmission-control-region${showValidation && !routeReady ? ' is-region-error' : ''}`}
        >
          <button
            type="button"
            role="spinbutton"
            aria-label="送信終端ダイヤル"
            aria-valuemin={0}
            aria-valuemax={routeOptions.length - 1}
            aria-valuenow={routeIndex}
            aria-valuetext={
              ['CONTROL ROOM', 'ECHO BUFFER RETURN', 'E-02'][routeIndex]
            }
            className="rotary-control"
            onClick={() =>
              setRouteIndex((value) => (value + 1) % routeOptions.length)
            }
          >
            <i style={{ transform: `rotate(${routeIndex * 105 - 105}deg)` }} />
            <span>TERMINATION</span>
            <output>
              {['CONTROL ROOM', 'ECHO BUFFER RETURN', 'E-02'][routeIndex]}
            </output>
          </button>
          {showValidation && (
            <small className="transmission-validation">
              ROUTE / {routeReady ? 'LOCKED' : 'RECHECK'}
            </small>
          )}
        </div>
        <button
          type="button"
          className="test-pulse-lever"
          onClick={() =>
            submit([
              ...windows.filter(isString),
              delayOptions[delayIndex]!,
              routeOptions[routeIndex]!,
            ])
          }
        >
          <i aria-hidden="true" />
          <span>TEST PULSE</span>
        </button>
      </div>
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

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function isString(value: string | null): value is string {
  return value !== null;
}
