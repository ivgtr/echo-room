import { useState } from 'react';

import type {
  StoryStage,
  TerminalMenuId,
} from '../../game/machine/gameMachine';
import {
  FINAL_PACKET_ORDER,
  type PacketId,
} from '../../game/puzzles/storyPuzzles';

const packetText: Record<PacketId, string> = {
  audio_packet_01: '……聞こえるか？',
  audio_packet_02: 'まず電源を戻せ。',
  audio_packet_03: 'ログは気にするな。',
  audio_packet_04: '最後に、赤いボタンを押せ。',
};

type Props = {
  menuId: TerminalMenuId;
  stage: StoryStage;
  finalReady: boolean;
  onSelect: (menuId: TerminalMenuId) => void;
  onClose: () => void;
  onLogsConfirmed: () => void;
  onMapInspected: () => void;
  onPacketPlayed: (packetId: PacketId) => void;
  onFinalSubmit: (ids: string[]) => void;
  onTransmit: () => void;
};

export function TerminalPanel(props: Props) {
  const [order, setOrder] = useState<string[]>([]);
  const audioUnlocked = [
    'inspect_audio',
    'analyze_voice',
    'transmit_packets',
    'ending',
    'completed',
  ].includes(props.stage);
  const securityUnlocked = [
    'reveal_no_adjacent_room',
    'inspect_audio',
    'analyze_voice',
    'transmit_packets',
    'ending',
    'completed',
  ].includes(props.stage);
  const final = props.stage === 'transmit_packets';
  const choosePacket = (id: string) =>
    setOrder((current) =>
      current.includes(id) ? current : [...current, id].slice(0, 4),
    );
  return (
    <section
      className="terminal-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terminal-title"
    >
      <header>
        <p className="eyebrow">ECHO BUFFER / ONLINE</p>
        <h2 id="terminal-title">壁面端末</h2>
      </header>
      {!final && (
        <nav aria-label="端末メニュー">
          {(['system', 'log', 'audio', 'security'] as const).map((id) => {
            const locked =
              (id === 'audio' && !audioUnlocked) ||
              (id === 'security' && !securityUnlocked);
            return (
              <button
                type="button"
                key={id}
                disabled={locked}
                aria-current={props.menuId === id ? 'page' : undefined}
                onClick={() => props.onSelect(id)}
              >
                {id.toUpperCase()} {locked && '— LOCKED'}
              </button>
            );
          })}
        </nav>
      )}
      <div className="terminal-display">
        {final && (
          <div>
            <h3>FINAL TRANSMISSION</h3>
            <p>送信先 -00:20:00</p>
            <ol>
              {order.map((id) => (
                <li key={id}>{packetText[id as PacketId]}</li>
              ))}
            </ol>
            <div className="packet-options">
              {FINAL_PACKET_ORDER.map((id) => (
                <button
                  type="button"
                  key={id}
                  disabled={order.includes(id)}
                  onClick={() => choosePacket(id)}
                >
                  {packetText[id]}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setOrder([])}>
              並べ直す
            </button>
            <button type="button" onClick={() => props.onFinalSubmit(order)}>
              4枠を設定
            </button>
            <button
              type="button"
              className="transmit-button"
              disabled={!props.finalReady}
              onClick={props.onTransmit}
            >
              赤い送信ボタンを押す
            </button>
            {order.length === 4 && !props.finalReady && (
              <p>順番を確認してください。</p>
            )}
          </div>
        )}
        {!final && props.menuId === 'system' && (
          <dl>
            <div>
              <dt>NEGATIVE DELAY</dt>
              <dd>-00:20:00</dd>
            </div>
            <div>
              <dt>LAST RECEIVE</dt>
              <dd>02:17</dd>
            </div>
            <div>
              <dt>SOURCE</dt>
              <dd>02:37</dd>
            </div>
          </dl>
        )}
        {!final && props.menuId === 'log' && (
          <>
            <table>
              <caption>受信ログと送信元時刻</caption>
              <thead>
                <tr>
                  <th>RECEIVE</th>
                  <th>SOURCE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>02:11:04</td>
                  <td>02:31:04</td>
                </tr>
                <tr>
                  <td>02:14:32</td>
                  <td>02:34:32</td>
                </tr>
                <tr>
                  <td>02:17:18</td>
                  <td>02:37:18</td>
                </tr>
              </tbody>
            </table>
            {props.stage === 'inspect_logs' && (
              <button type="button" onClick={props.onLogsConfirmed}>
                20分の差を確認した
              </button>
            )}
          </>
        )}
        {!final && props.menuId === 'security' && (
          <>
            <h3>FACILITY MAP / ROOM E-01</h3>
            <p>
              E-01の左右は巨大な機械設備とコンクリート壁。隣室は存在しない。
            </p>
            <button type="button" onClick={props.onMapInspected}>
              職員用カードを使用して図面を確認
            </button>
          </>
        )}
        {!final && props.menuId === 'audio' && (
          <>
            <h3>ECHO AUDIO BUFFER</h3>
            {FINAL_PACKET_ORDER.map((id) => (
              <div className="packet-row" key={id}>
                <span>{id.replace('audio_', '').toUpperCase()}</span>
                <button type="button" onClick={() => props.onPacketPlayed(id)}>
                  字幕付きで再生
                </button>
                <p>{packetText[id]}</p>
              </div>
            ))}
          </>
        )}
      </div>
      <button type="button" onClick={props.onClose}>
        端末を閉じる
      </button>
    </section>
  );
}
