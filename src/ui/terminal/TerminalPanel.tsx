import type { TerminalMenuId } from '../../game/machine/gameMachine';

const menus: { id: TerminalMenuId; label: string; locked: boolean }[] = [
  { id: 'system', label: 'SYSTEM', locked: false },
  { id: 'log', label: 'LOG', locked: false },
  { id: 'audio', label: 'AUDIO', locked: true },
  { id: 'security', label: 'SECURITY', locked: true },
];

type Props = {
  menuId: TerminalMenuId;
  onSelect: (menuId: TerminalMenuId) => void;
  onClose: () => void;
};

export function TerminalPanel({ menuId, onSelect, onClose }: Props) {
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
      <nav aria-label="端末メニュー">
        {menus.map((menu) => (
          <button
            type="button"
            key={menu.id}
            disabled={menu.locked}
            aria-current={menuId === menu.id ? 'page' : undefined}
            onClick={() => onSelect(menu.id)}
          >
            {menu.label} {menu.locked && '— LOCKED'}
          </button>
        ))}
      </nav>
      <div className="terminal-display">
        {menuId === 'system' && (
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
        {menuId === 'log' && (
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
        )}
      </div>
      <button type="button" onClick={onClose}>
        端末を閉じる
      </button>
    </section>
  );
}
