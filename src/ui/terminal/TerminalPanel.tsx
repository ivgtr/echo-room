import type {
  StoryStage,
  TerminalMenuId,
} from '../../game/machine/gameMachine';
import { stagePuzzle } from '../../game/machine/gameMachine';
import type { PuzzleId } from '../../game/puzzles/storyPuzzles';
import { FacilityMap } from '../evidence/FacilityMap';
import { PuzzleWorkbench } from '../puzzles/PuzzleWorkbench';

const menuLabels: Record<TerminalMenuId, string> = {
  system: 'SYSTEM',
  log: 'LOG',
  audio: 'SIGNAL',
  security: 'SECURITY',
};

const puzzleMenu: Partial<Record<PuzzleId, TerminalMenuId>> = {
  puzzle_carrier_sync: 'system',
  puzzle_log_pairing: 'log',
  puzzle_signal_route: 'security',
  puzzle_packet_repair: 'audio',
  puzzle_temporal_anomaly: 'audio',
  puzzle_causal_script: 'system',
  puzzle_transmission_window: 'system',
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
    >
      <header>
        <p className="eyebrow">ECHO BUFFER / gfx-close-010</p>
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
          <PuzzleWorkbench
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
            currentPuzzleMenu={currentPuzzleMenu}
          />
        )}
      </div>
      <button type="button" onClick={props.onClose}>
        端末を閉じる
      </button>
    </section>
  );
}

function TerminalMenuContent({
  menuId,
  stage,
  completedPuzzleIds,
  currentPuzzleMenu,
}: {
  menuId: TerminalMenuId;
  stage: StoryStage;
  completedPuzzleIds: readonly PuzzleId[];
  currentPuzzleMenu: TerminalMenuId | undefined;
}) {
  if (menuId === 'system')
    return (
      <div className="terminal-system-grid">
        <div>
          <span>NEGATIVE DELAY</span>
          <strong>-00:20:00</strong>
        </div>
        <div>
          <span>LOCAL CLOCK</span>
          <strong>02:17 / STOPPED</strong>
        </div>
        <div>
          <span>PUZZLES VERIFIED</span>
          <strong>{completedPuzzleIds.length} / 10</strong>
        </div>
        <p>
          {currentPuzzleMenu
            ? `現在の検証は ${menuLabels[currentPuzzleMenu]} で行う。`
            : stage === 'puzzle_voiceprint_calibration'
              ? 'PACKET特徴量は端末横の解析パネルで校正する。'
              : stage === 'puzzle_maintenance_lock'
                ? '保守用品は西壁ロッカーに格納されている。'
                : '送信系統を確認中。'}
        </p>
      </div>
    );

  if (menuId === 'log')
    return (
      <div className="terminal-placeholder">
        <h3>RECEIVE / SOURCE LOG</h3>
        <p>受信側と送信側は別時計で記録され、行順は一致しない。</p>
        <p>
          {completedPuzzleIds.includes('puzzle_log_pairing')
            ? '照合済み：全3組のSOURCEはRECEIVEの正確に20分後。'
            : '波形指紋の照合が必要。'}
        </p>
      </div>
    );

  if (menuId === 'security')
    return (
      <div className="terminal-placeholder">
        <FacilityMap conduitLayer />
        <p>
          {completedPuzzleIds.includes('puzzle_signal_route')
            ? '確認済み：E-01の通信線は隣室ではなくECHO BUFFER RETURNへ接続。'
            : '職員カード取得後、室内図と通信配線層を照合できる。'}
        </p>
      </div>
    );

  return (
    <div className="terminal-placeholder signal-summary">
      <h3>ECHO SIGNAL BUFFER</h3>
      <p>発話音声は使用しない。本文、波形指紋、声紋特徴量を表示する。</p>
      {['01', '02', '03', '04'].map((id) => (
        <span key={id}>PACKET {id} / DATA FRAME</span>
      ))}
      {currentPuzzleMenu && currentPuzzleMenu !== menuId && (
        <p>現在の検証は {menuLabels[currentPuzzleMenu]} で行う。</p>
      )}
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
      <p>PUZZLES VERIFIED: 10 / 10</p>
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
