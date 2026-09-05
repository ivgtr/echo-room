import { useRef, useState } from 'react';

import type {
  StoryStage,
  TerminalMenuId,
} from '../../game/machine/gameMachine';
import { matchedRecords } from '../../game/puzzles/signalRecords';
import {
  packetTexts,
  PUZZLE_DEVICE_COPY,
  type PuzzleId,
} from '../../game/puzzles/storyPuzzles';
import { ContextBackButton } from '../common/ContextBackButton';
import { FacilityMap } from '../evidence/FacilityMap';
import { PuzzleDevice } from '../puzzles/PuzzleDevice';
import { getTerminalTelemetry, terminalModes } from './terminalTelemetry';

type Props = {
  menuId: TerminalMenuId;
  stage: StoryStage;
  completedPuzzleIds: readonly PuzzleId[];
  puzzleFailures: Record<PuzzleId, number>;
  onSelect: (menuId: TerminalMenuId) => void;
  onClose: () => void;
  onPuzzleSubmit: (puzzleId: PuzzleId, answer: string[]) => void;
  onTransmit: () => void;
};

type Telemetry = ReturnType<typeof getTerminalTelemetry>;

export function TerminalPanel(props: Props) {
  const telemetry = getTerminalTelemetry(props.stage, props.completedPuzzleIds);
  const { puzzleId, puzzleMode, transmissionReady } = telemetry;
  const puzzleVisible = puzzleId !== undefined && puzzleMode === props.menuId;
  const mode = terminalModes.find(({ id }) => id === props.menuId)!;
  const [switchSequence, setSwitchSequence] = useState(0);
  const transmissionSent = useRef(false);
  const screenTitle =
    puzzleVisible && puzzleId
      ? PUZZLE_DEVICE_COPY[puzzleId].title
      : transmissionReady && props.menuId === 'system'
        ? 'ECHO TRANSMISSION READY'
        : mode.caption;

  function selectMode(id: TerminalMenuId) {
    if (id === props.menuId) return;
    setSwitchSequence((value) => value + 1);
    props.onSelect(id);
  }

  return (
    <section
      className="terminal-instrument"
      role="dialog"
      aria-modal="true"
      aria-label="端末"
      data-transmission-ready={transmissionReady}
    >
      <div className="terminal-machine">
        <div className="terminal-viewer">
          <img
            className="terminal-chassis"
            src={`${import.meta.env.BASE_URL}assets/images/close/gfx-close-008__off__preview-flat.webp`}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
          <div className="terminal-glass">
            <header className="terminal-readout-header">
              <span>ECHO BUFFER / {mode.label}</span>
              <h2>{screenTitle}</h2>
            </header>
            <div
              className="terminal-observation"
              role="region"
              aria-label="端末表示器"
              tabIndex={0}
            >
              {/* Switching the display must not unplug an unfinished device. */}
              {puzzleId && (
                <div
                  className="terminal-draft"
                  hidden={!puzzleVisible}
                  inert={!puzzleVisible}
                >
                  <PuzzleDevice
                    key={puzzleId}
                    embedded
                    active={puzzleVisible}
                    puzzleId={puzzleId}
                    failures={props.puzzleFailures[puzzleId]}
                    onSubmit={props.onPuzzleSubmit}
                    onClose={props.onClose}
                  />
                </div>
              )}
              {!puzzleVisible && (
                <TerminalReadout menuId={props.menuId} telemetry={telemetry} />
              )}
            </div>
            <span
              key={switchSequence}
              className={
                switchSequence > 0
                  ? 'terminal-scan is-switching'
                  : 'terminal-scan'
              }
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="terminal-console">
          <div className="terminal-nameplate">
            <span>ECHO BUFFER</span>
            <strong>TERMINAL ║</strong>
          </div>
          <div
            className="terminal-function-keys"
            role="group"
            aria-label="端末の表示切替"
          >
            {terminalModes.map(({ id, label, caption }) => (
              <button
                className="terminal-function-key"
                type="button"
                key={id}
                aria-label={label}
                aria-description={caption}
                aria-pressed={props.menuId === id}
                onClick={() => selectMode(id)}
              >
                <i aria-hidden="true" />
                <span>{label}</span>
                <small aria-hidden="true">{caption}</small>
              </button>
            ))}
          </div>
          <div className="terminal-transmit-control">
            <button
              type="button"
              className="terminal-transmit-button"
              disabled={!transmissionReady}
              aria-label="赤い送信ボタンを押す"
              aria-describedby="terminal-interlock"
              onClick={() => {
                if (!transmissionReady || transmissionSent.current) return;
                transmissionSent.current = true;
                props.onTransmit();
              }}
            >
              <span aria-hidden="true">TX</span>
            </button>
            <span className="terminal-safety-cover" aria-hidden="true" />
            <small id="terminal-interlock" role="status">
              {transmissionReady ? 'READY / 送信可' : 'LOCKED / 送信不可'}
            </small>
          </div>
        </div>
      </div>
      <ContextBackButton destination="部屋に戻る" onClick={props.onClose} />
    </section>
  );
}

function TerminalReadout({
  menuId,
  telemetry,
}: {
  menuId: TerminalMenuId;
  telemetry: Telemetry;
}) {
  if (menuId === 'system') {
    const readings = telemetry.transmissionReady
      ? telemetry.readings.filter(
          ({ label }) => label === 'NEGATIVE DELAY' || label === 'RETURN BUS',
        )
      : telemetry.readings;
    return (
      <div className="terminal-readings">
        {telemetry.transmissionReady && <PacketReadout transmission />}
        <dl>
          {readings.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="terminal-equipment-status">{telemetry.status}</p>
      </div>
    );
  }

  if (menuId === 'security')
    return telemetry.recordsAvailable ? (
      <div className="terminal-route-record">
        <FacilityMap conduitLayer revealRoute={telemetry.investigated} />
        <p className="terminal-equipment-status">
          {telemetry.investigated
            ? 'RETURN BUS / TRACE VERIFIED'
            : 'ROUTE / NOT TRACED — 経路未確認'}
        </p>
      </div>
    ) : (
      <Unavailable
        code="ACCESS / STAFF CARD REQUIRED"
        text="施設図の参照には職員証が必要です。"
      />
    );

  if (menuId === 'log')
    return telemetry.investigated ? (
      <div className="terminal-log-record">
        <table>
          <caption>RECEIVE / SOURCE — 照合済みの通信記録</caption>
          <thead>
            <tr>
              <th scope="col">RECEIVE</th>
              <th scope="col">SOURCE</th>
              <th scope="col">波形</th>
            </tr>
          </thead>
          <tbody>
            {matchedRecords.map(({ receive, source }) => (
              <tr key={receive.id}>
                <td>
                  {receive.id.toUpperCase()} / {receive.time}
                </td>
                <td>
                  {source.id.toUpperCase()} / {source.time}
                </td>
                <td>{receive.signature}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="terminal-equipment-status">+20:00 / OFFSET CONFIRMED</p>
      </div>
    ) : (
      <Unavailable
        code="LOG / ACCESS PENDING"
        text="通信記録は保守アクセス後に参照できます。"
      />
    );

  return telemetry.frameRestored ? (
    <div className="terminal-signal-record">
      <PacketReadout />
      <p className="terminal-equipment-status">FRAME / RESTORED</p>
      <p>
        {telemetry.voiceMatched
          ? 'VOICEPRINT / MATCH / E-01 OCCUPANT'
          : 'VOICEPRINT / AWAITING CALIBRATION — 端末横のパネルで校正できます。'}
      </p>
    </div>
  ) : (
    <Unavailable
      code={
        telemetry.investigated ? 'FRAME / DAMAGED' : 'SIGNAL / NO DECODED FRAME'
      }
      text="本文を表示できるデータフレームがありません。"
    />
  );
}

function PacketReadout({ transmission = false }: { transmission?: boolean }) {
  return (
    <ol
      className="terminal-packet-record"
      aria-label={transmission ? '送信パケット4枠' : '復元済みパケット'}
    >
      {packetTexts.map((text, index) => (
        <li key={text}>
          <span>{transmission ? `W${index + 1}` : `PACKET 0${index + 1}`}</span>
          {text}
        </li>
      ))}
    </ol>
  );
}

function Unavailable({ code, text }: { code: string; text: string }) {
  return (
    <div className="terminal-unavailable">
      <p>{code}</p>
      <p>{text}</p>
    </div>
  );
}
