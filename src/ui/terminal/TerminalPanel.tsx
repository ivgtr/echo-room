import type {
  StoryStage,
  TerminalMenuId,
} from '../../game/machine/gameMachine';
import { stagePuzzle } from '../../game/machine/gameMachine';
import type { PuzzleId } from '../../game/puzzles/storyPuzzles';
import { FacilityMap } from '../evidence/FacilityMap';
import { PuzzleDevice } from '../puzzles/PuzzleDevice';

const menuLabels: Record<TerminalMenuId, string> = {
  system: 'SYSTEM',
  log: 'LOG',
  audio: 'SIGNAL',
  security: 'SECURITY',
};

const puzzleMenu: Partial<Record<PuzzleId, TerminalMenuId>> = {
  puzzle_carrier_sync: 'system',
  puzzle_signal_investigation: 'log',
  puzzle_packet_repair: 'audio',
  puzzle_transmission_window: 'system',
};

const terminalStatus: Partial<Record<StoryStage, string>> = {
  puzzle_maintenance_lock: 'WEST MAINTENANCE LOCK / LOCAL CONTROL',
  puzzle_signal_investigation: 'LOG / 3 RECORDS / CONDUIT TRACE',
  puzzle_packet_repair: 'SIGNAL / DAMAGED FRAME DETECTED',
  puzzle_voiceprint_calibration: 'VOICEPRINT DATA / EXTERNAL PANEL',
};

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

export function TerminalPanel(props: Props) {
  const currentPuzzleId = stagePuzzle[props.stage];
  const currentPuzzleMenu = currentPuzzleId
    ? puzzleMenu[currentPuzzleId]
    : undefined;
  const puzzleVisible =
    currentPuzzleId !== undefined && currentPuzzleMenu === props.menuId;
  const transmissionReady = props.stage === 'transmission_ready';

  return (
    <section
      className="puzzle-modal terminal-panel artwork-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terminal-title"
      style={{
        backgroundImage: `url("${import.meta.env.BASE_URL}assets/images/close/gfx-close-010__on__preview-flat.webp")`,
      }}
    >
      <header>
        <p className="eyebrow">ECHO BUFFER / OPERATIONS TERMINAL</p>
        <h2 id="terminal-title">壁面端末</h2>
      </header>
      <nav className="terminal-menu" aria-label="端末メニュー">
        {(Object.keys(menuLabels) as TerminalMenuId[]).map((id) => (
          <button
            type="button"
            key={id}
            aria-pressed={props.menuId === id}
            onClick={() => props.onSelect(id)}
          >
            {menuLabels[id]}
          </button>
        ))}
      </nav>

      <div className="terminal-content">
        {puzzleVisible && currentPuzzleId ? (
          <PuzzleDevice
            embedded
            puzzleId={currentPuzzleId}
            failures={props.puzzleFailures[currentPuzzleId]}
            onSubmit={props.onPuzzleSubmit}
            onClose={props.onClose}
          />
        ) : transmissionReady && props.menuId === 'system' ? (
          <TransmissionReady onTransmit={props.onTransmit} />
        ) : (
          <TerminalMenuContent
            menuId={props.menuId}
            stage={props.stage}
            completedPuzzleIds={props.completedPuzzleIds}
          />
        )}
      </div>
      <button
        type="button"
        className="terminal-back"
        aria-label="装置から離れる"
        onClick={props.onClose}
      >
        &lt; BACK
      </button>
    </section>
  );
}

function TerminalMenuContent({
  menuId,
  stage,
  completedPuzzleIds,
}: {
  menuId: TerminalMenuId;
  stage: StoryStage;
  completedPuzzleIds: readonly PuzzleId[];
}) {
  if (menuId === 'system')
    return (
      <div className="terminal-system-grid">
        {stage === 'puzzle_maintenance_lock' && (
          <div>
            <span>DEVICE NAMEPLATE</span>
            <strong>TERMINAL ║</strong>
          </div>
        )}
        <div>
          <span>NEGATIVE DELAY</span>
          <strong>
            {completedPuzzleIds.includes('puzzle_signal_investigation')
              ? '-00:20:00'
              : '--:--:-- / CALIBRATION ERROR'}
          </strong>
        </div>
        <div>
          <span>LOCAL CLOCK</span>
          <strong>02:17 / STOPPED</strong>
        </div>
        <div>
          <span>PUZZLES VERIFIED</span>
          <strong>{completedPuzzleIds.length} / 7</strong>
        </div>
        <p>{terminalStatus[stage] ?? 'TRANSMISSION BUS / STANDBY'}</p>
      </div>
    );

  if (menuId === 'log')
    return (
      <div className="terminal-placeholder">
        <h3>RECEIVE / SOURCE LOG</h3>
        <p>受信と送信は別々に記録されている。表示の順番も違う。</p>
        <p>
          {completedPuzzleIds.includes('puzzle_signal_investigation')
            ? '確認済み：3つとも20分差。通信線はECHO BUFFER RETURNへ戻る。'
            : '3つの波の並びを比べ、同じ通信を探す。'}
        </p>
      </div>
    );

  if (menuId === 'security')
    return (
      <div className="terminal-placeholder">
        <FacilityMap conduitLayer />
        <p>
          {completedPuzzleIds.includes('puzzle_signal_investigation')
            ? '確認済み：E-01の通信線は、隣室ではなくECHO BUFFER RETURNへ戻る。'
            : '職員カードを使えば、部屋の図と配線図を重ねて見られる。'}
        </p>
      </div>
    );

  return (
    <div className="terminal-placeholder signal-summary">
      <h3>ECHO SIGNAL BUFFER</h3>
      <p>届いた文章と、通信を見分ける波形、声紋データを確認できる。</p>
      {['01', '02', '03', '04'].map((id) => (
        <span key={id}>PACKET {id} / DATA FRAME</span>
      ))}
    </div>
  );
}

function TransmissionReady({ onTransmit }: { onTransmit: () => void }) {
  return (
    <section
      className="transmission-ready"
      aria-labelledby="transmission-title"
    >
      <p className="eyebrow">TEST TRANSMISSION / ALL CONDITIONS PASSED</p>
      <h3 id="transmission-title">ECHO TRANSMISSION READY</h3>
      <p>確認完了：7 / 7</p>
      <ol aria-label="送信パケット4枠">
        <li>W1 / ……聞こえるか？</li>
        <li>W2 / まず電源を戻せ。</li>
        <li>W3 / ログは気にするな。</li>
        <li>W4 / 最後に、赤いボタンを押せ。</li>
      </ol>
      <dl>
        <div>
          <dt>DELAY</dt>
          <dd>-00:20:00</dd>
        </div>
        <div>
          <dt>ROUTE</dt>
          <dd>ECHO BUFFER RETURN</dd>
        </div>
      </dl>
      <button type="button" className="transmit-button" onClick={onTransmit}>
        赤い送信ボタンを押す
      </button>
    </section>
  );
}
