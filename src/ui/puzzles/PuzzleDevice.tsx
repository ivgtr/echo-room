import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
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
  const submit = (answer: string[]) => onSubmit(puzzleId, answer);
  const Device = deviceComponents[puzzleId];

  return (
    <DeviceFrame
      puzzleId={puzzleId}
      failures={failures}
      embedded={embedded}
      onClose={onClose}
    >
      <Device
        key={`${puzzleId}-${failures}`}
        failures={failures}
        submit={submit}
      />
    </DeviceFrame>
  );
}

const deviceComponents: Record<PuzzleId, ComponentType<DeviceProps>> = {
  puzzle_power_route: PowerRouteDevice,
  puzzle_carrier_sync: CarrierSyncDevice,
  puzzle_maintenance_lock: MaintenanceLockDevice,
  puzzle_log_pairing: LogPatchDevice,
  puzzle_signal_route: SignalTraceDevice,
  puzzle_packet_repair: PacketRailDevice,
  puzzle_temporal_anomaly: EventScannerDevice,
  puzzle_voiceprint_calibration: VoiceprintDevice,
  puzzle_causal_script: ScriptRailDevice,
  puzzle_transmission_window: TransmissionPatchDevice,
};

const closeupImages: Partial<Record<PuzzleId, string>> = {
  puzzle_power_route:
    'assets/images/close/gfx-close-005__all-off__preview-flat.webp',
  puzzle_maintenance_lock:
    'assets/images/close/gfx-close-007__locked__preview-flat.webp',
  puzzle_voiceprint_calibration:
    'assets/images/close/gfx-close-009__closed__preview-flat.webp',
};

function DeviceFrame({
  puzzleId,
  failures,
  embedded,
  onClose,
  children,
}: {
  puzzleId: PuzzleId;
  failures: number;
  embedded: boolean;
  onClose: () => void;
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
      aria-labelledby={titleId}
      data-puzzle-id={puzzleId}
      style={closeupStyle}
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
      <p
        className={`device-feedback${failures > 0 ? ' is-error' : ''}`}
        aria-live="assertive"
      >
        {failures > 0 ? copy.incorrectFeedback : 'STATUS / STANDBY'}
      </p>
    </section>
  );
}

function PowerRouteDevice({ submit }: DeviceProps) {
  const [isolated, setIsolated] = useState<string | null>(null);
  const [sequence, setSequence] = useState<string[]>([]);
  useAutoAnswer(
    isolated && sequence.length === 3 ? [isolated, ...sequence] : null,
    submit,
  );
  const lines = [
    ['door', 'DOOR', '4 UNIT', 'SHORT'],
    ['terminal', 'TERMINAL', '2 UNIT', 'STANDBY'],
    ['intercom', 'INTERCOM', '1 UNIT', 'STANDBY'],
    ['buffer', 'ECHO BUFFER', '3 UNIT', 'STANDBY'],
  ] as const;

  return (
    <div className="power-device">
      <div className="power-meter" aria-label="配電状態">
        <span>CAPACITY</span>
        <strong>7 UNIT</strong>
        <span>LINE ERROR</span>
        <strong>DOOR / SHORT</strong>
      </div>
      <div className="cable-bank" aria-label="切り離すケーブル">
        {lines.map(([id, label, load, status]) => (
          <button
            type="button"
            className={`power-cable${isolated === id ? ' is-unplugged' : ''}`}
            aria-pressed={isolated === id}
            aria-label={`${label}ケーブルを切り離す`}
            key={id}
            onClick={() => setIsolated((value) => (value === id ? null : id))}
          >
            <i aria-hidden="true" />
            <span>{label}</span>
            <small>
              {load} / {status}
            </small>
          </button>
        ))}
      </div>
      <div className="breaker-bank" aria-label="起動ブレーカー">
        {lines.slice(1).map(([id, label]) => {
          const order = sequence.indexOf(id) + 1;
          return (
            <button
              type="button"
              className={`physical-breaker${order ? ' is-on' : ''}`}
              aria-pressed={order > 0}
              aria-label={`${label}ブレーカー`}
              key={id}
              onClick={() => {
                if (order || sequence.length >= 3) return;
                setSequence((current) => [...current, id]);
              }}
            >
              <i aria-hidden="true" />
              <span>{label}</span>
              <output aria-label={`${label}の投入順`}>{order || '—'}</output>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CarrierSyncDevice({ submit }: DeviceProps) {
  const [positions, setPositions] = useState([-2, 0, 1]);
  useAutoAnswer(
    positions.every((position) => position === 0)
      ? ['right-2', 'none', 'left-1']
      : null,
    submit,
  );
  return (
    <div className="carrier-device">
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
      <p className="device-equivalent">
        位置数値：A {signed(positions[0] ?? 0)} / B {signed(positions[1] ?? 0)}{' '}
        / C {signed(positions[2] ?? 0)}
      </p>
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
  return (
    <label className={`wave-rail${position === 0 ? ' is-locked' : ''}`}>
      <span>{label}</span>
      <div className="wave-track" aria-hidden="true">
        <i style={{ transform: `translateX(${position * 12}%)` }} />
        <b />
      </div>
      {reference ? (
        <output>0 / LOCKED</output>
      ) : (
        <input
          type="range"
          min={-2}
          max={2}
          step={1}
          value={position}
          aria-label={label}
          aria-valuetext={`${signed(position)}、${position === 0 ? '同期' : '未同期'}`}
          onChange={(event) => onChange?.(Number(event.currentTarget.value))}
        />
      )}
    </label>
  );
}

const symbols = [
  ['double', '║'],
  ['ring', '○'],
  ['triangle', '△'],
  ['node', '◆'],
] as const;

function MaintenanceLockDevice({ submit }: DeviceProps) {
  const [dials, setDials] = useState(['ring', 'triangle', 'node', 'double']);
  return (
    <div className="locker-device">
      <div className="lock-plate">
        <span>LAST INSPECTION</span>
        <strong>4 STEP</strong>
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
                <small>
                  {
                    symbols[
                      (symbolIndex - 1 + symbols.length) % symbols.length
                    ]![1]
                  }
                </small>
                <strong>{symbol}</strong>
                <small>{symbols[(symbolIndex + 1) % symbols.length]![1]}</small>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="lock-handle"
          onClick={() => submit(dials)}
        >
          <i aria-hidden="true" />
          <span>LOCK HANDLE</span>
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

function LogPatchDevice({ submit }: DeviceProps) {
  const [activeReceive, setActiveReceive] = useState<number | null>(null);
  const [patches, setPatches] = useState<(string | null)[]>([null, null, null]);
  useAutoAnswer(
    patches.every(Boolean) ? patches.filter(isString) : null,
    submit,
  );
  return (
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
              <small>{signatures[id]}</small>
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
              <small>{signatures[id]}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SignalTraceDevice({ submit }: DeviceProps) {
  const [trace, setTrace] = useState<(string | null)[]>([null, null, null]);
  useAutoAnswer(trace.every(Boolean) ? trace.filter(isString) : null, submit);
  const choose = (index: number, value: string) =>
    setTrace((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  return (
    <div className="trace-device">
      <FacilityMap conduitLayer />
      <div className="trace-overlay" aria-label="配線追跡操作">
        <div>
          <span>INTERCOM</span>
          <button
            type="button"
            aria-pressed={trace[0] === 'signal'}
            onClick={() => choose(0, 'signal')}
          >
            通信実線
          </button>
          <button
            type="button"
            aria-pressed={trace[0] === 'power'}
            onClick={() => choose(0, 'power')}
          >
            電力破線
          </button>
        </div>
        <div>
          <span>JUNCTION</span>
          <button
            type="button"
            aria-pressed={trace[1] === 'ring-relay'}
            onClick={() => choose(1, 'ring-relay')}
          >
            J-2 丸端子
          </button>
          <button
            type="button"
            aria-pressed={trace[1] === 'bar-relay'}
            onClick={() => choose(1, 'bar-relay')}
          >
            J-3 線端子
          </button>
          <button
            type="button"
            aria-pressed={trace[1] === 'node-relay'}
            onClick={() => choose(1, 'node-relay')}
          >
            J-4 ひし形端子
          </button>
        </div>
        <div>
          <span>END</span>
          <button
            type="button"
            aria-pressed={trace[2] === 'echo-buffer'}
            onClick={() => choose(2, 'echo-buffer')}
          >
            ECHO BUFFER RETURN
          </button>
          <button
            type="button"
            aria-pressed={trace[2] === 'control-room'}
            onClick={() => choose(2, 'control-room')}
          >
            CONTROL ROOM
          </button>
          <button
            type="button"
            aria-pressed={trace[2] === 'adjacent-room'}
            onClick={() => choose(2, 'adjacent-room')}
          >
            E-02
          </button>
        </div>
      </div>
    </div>
  );
}

const fragments = [
  ['a', 'A', '◇ → 三本線'],
  ['b', 'B', '三本線 → ■'],
  ['c', 'C', '｜ → 波形△'],
  ['d', 'D', '波形△ → ◇'],
] as const;

function PacketRailDevice({ submit }: DeviceProps) {
  const [rail, setRail] = useState<string[]>([]);
  useAutoAnswer(rail.length === 4 ? rail : null, submit);
  return (
    <div className="frame-device">
      <div className="frame-format">
        <span>HEADER</span>
        <i />
        <span>BODY</span>
        <i />
        <span>VOICEPRINT</span>
        <i />
        <span>CHECK</span>
      </div>
      <div className="frame-rail" aria-label="PACKET断片レール">
        {[0, 1, 2, 3].map((slot) => {
          const fragment = fragments.find(([id]) => id === rail[slot]);
          return (
            <div key={slot}>
              <small>{slot + 1}</small>
              <strong>{fragment ? `断片${fragment[1]}` : 'EMPTY'}</strong>
              <span>{fragment?.[2]}</span>
            </div>
          );
        })}
      </div>
      <div className="fragment-tray">
        {fragments.map(([id, label, edges]) => (
          <button
            type="button"
            key={id}
            disabled={rail.includes(id)}
            aria-label={`断片${label}をレールへ入れる`}
            onClick={() => setRail((current) => [...current, id])}
          >
            <strong>断片{label}</strong>
            <small>{edges}</small>
          </button>
        ))}
        <button
          type="button"
          className="device-eject"
          onClick={() => setRail([])}
        >
          EJECT / 取り出す
        </button>
      </div>
    </div>
  );
}

function EventScannerDevice({ submit }: DeviceProps) {
  const [packet, setPacket] = useState<string | null>(null);
  const [basis, setBasis] = useState<string | null>(null);
  useAutoAnswer(packet && basis ? [packet, basis] : null, submit);
  return (
    <div className="scanner-device">
      <div className="packet-cassettes" aria-label="PACKETカセット">
        {packetTexts.map((text, index) => {
          const id = `packet-0${index + 1}`;
          return (
            <button
              type="button"
              key={id}
              aria-pressed={packet === id}
              onClick={() => setPacket(id)}
            >
              <span>PACKET 0{index + 1}</span>
              <small>{text}</small>
            </button>
          );
        })}
      </div>
      <div className="scanner-bed">
        <span>EVENT COMPARATOR</span>
        <strong>{packet?.toUpperCase() ?? 'NO CASSETTE'}</strong>
        <i aria-hidden="true" />
      </div>
      <div className="event-probes" aria-label="照合する出来事">
        <button
          type="button"
          aria-pressed={basis === 'unseen-event'}
          onClick={() => setBasis('unseen-event')}
        >
          未発生の操作
        </button>
        <button
          type="button"
          aria-pressed={basis === 'different-room'}
          onClick={() => setBasis('different-room')}
        >
          別室の視点
        </button>
        <button
          type="button"
          aria-pressed={basis === 'clock-broken'}
          onClick={() => setBasis('clock-broken')}
        >
          停止した時計
        </button>
      </div>
    </div>
  );
}

function VoiceprintDevice({ submit }: DeviceProps) {
  const [spacing, setSpacing] = useState(0);
  const [inverted, setInverted] = useState(false);
  const [phase, setPhase] = useState(0);
  useAutoAnswer(
    spacing === 1 && inverted && phase === -2
      ? ['compress-half', 'invert', 'left-2']
      : null,
    submit,
  );
  const spacingLabels = ['1×', '1/2×', '2×'];
  return (
    <div className="voiceprint-device">
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

function ScriptRailDevice({ submit }: DeviceProps) {
  const [rail, setRail] = useState<string[]>([]);
  useAutoAnswer(rail.length === 4 ? rail : null, submit);
  return (
    <div className="script-device">
      <div className="response-timeline" aria-label="過去側の応答記録">
        <span>応答あり</span>
        <span>電源調査</span>
        <span>LOG OPEN</span>
        <span>最終操作前</span>
      </div>
      <ol className="script-rail">
        {[0, 1, 2, 3].map((slot) => (
          <li key={slot}>
            <small>TX {slot + 1}</small>
            {rail[slot]
              ? packetTexts[Number(rail[slot].slice(-2)) - 1]
              : '――――'}
          </li>
        ))}
      </ol>
      <div className="script-strips">
        {packetTexts.map((text, index) => {
          const id = `packet-0${index + 1}`;
          return (
            <button
              type="button"
              key={id}
              disabled={rail.includes(id)}
              onClick={() => setRail((current) => [...current, id])}
            >
              <span>{text}</span>
            </button>
          );
        })}
        <button
          type="button"
          className="device-eject"
          onClick={() => setRail([])}
        >
          REWIND / 巻き戻す
        </button>
      </div>
    </div>
  );
}

function TransmissionPatchDevice({ submit }: DeviceProps) {
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
  return (
    <div className="transmission-device">
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
      <div className="packet-plugs">
        {packetTexts.map((text, index) => {
          const id = `packet-0${index + 1}`;
          return (
            <button
              type="button"
              key={id}
              aria-pressed={armedPacket === id}
              onClick={() => setArmedPacket(id)}
            >
              <span>P{index + 1}</span>
              <small>{text}</small>
            </button>
          );
        })}
      </div>
      <div className="transmission-controls">
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
          <output>{['-00:10:00', '-00:20:00', '+00:20:00'][delayIndex]}</output>
        </button>
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
  const submitted = useRef(false);
  const signature = answer?.join('|') ?? '';
  useEffect(() => {
    if (!answer || submitted.current) return;
    submitted.current = true;
    submit(answer);
  }, [answer, signature, submit]);
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function isString(value: string | null): value is string {
  return value !== null;
}
