import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';

import type {
  ArchiveDocument,
  NarrativeEntry,
} from '../narrative/narrativeArchive';
import type {
  AudioLevels,
  SubtitleBackground,
  SubtitleSettingChange,
  SubtitleSettings,
  SubtitleSize,
  TextSpeed,
} from './uiSettings';
import { EmergencyPowerStatus } from '../status/EmergencyPowerStatus';

type View = 'main' | 'archive' | 'settings';

type Props = {
  objective: string;
  activeElapsedMs: number;
  powerRestored: boolean;
  reservePower: boolean;
  audioEnabled: boolean;
  audioLevels: AudioLevels;
  subtitleSettings: SubtitleSettings;
  visualAssist: boolean;
  inventoryAvailable: boolean;
  hintAvailable: boolean;
  hintUnlocked: boolean;
  narrativeHistory: readonly NarrativeEntry[];
  documents: readonly ArchiveDocument[];
  returnFocusRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onToggleAudio: () => void;
  onAudioLevelChange: (channel: keyof AudioLevels, value: number) => void;
  onSubtitleSettingChange: SubtitleSettingChange;
  onToggleAssist: () => void;
  onInventory: () => void;
  onHint: () => void;
  onExit: () => void;
};

const focusableSelector =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function SystemMenu(props: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>('main');

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
  }, [view]);

  useEffect(
    () => () => props.returnFocusRef.current?.focus(),
    [props.returnFocusRef],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (view === 'main') props.onClose();
      else setView('main');
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    if (controls.length === 0) return;
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <div
      ref={dialogRef}
      className="system-menu"
      role="dialog"
      aria-modal="true"
      aria-label="SYSTEM"
      onKeyDown={handleKeyDown}
    >
      <header>
        <p className="eyebrow">E-01 LOCAL CONTROL</p>
        <h2 id="system-menu-title">
          {view === 'main'
            ? 'SYSTEM'
            : view === 'archive'
              ? 'ARCHIVE'
              : 'TEXT / AUDIO'}
        </h2>
      </header>

      {view === 'main' && (
        <div className="system-main">
          <section
            className="system-objective"
            aria-labelledby="objective-title"
          >
            <h3 id="objective-title">CURRENT OBJECTIVE / 現在目的</h3>
            <p>{props.objective}</p>
          </section>
          <section className="system-power" aria-labelledby="power-title">
            <h3 id="power-title">EMERGENCY SYSTEM / 非常システム</h3>
            <EmergencyPowerStatus
              activeElapsedMs={props.activeElapsedMs}
              powerRestored={props.powerRestored}
              reservePower={props.reservePower}
              paused
            />
            <p>この画面を閉じるまで、実プレイ時間は進みません。</p>
          </section>
          <div className="system-menu-actions">
            <button type="button" onClick={() => setView('archive')}>
              ARCHIVE / 会話履歴・資料再読
            </button>
            <button type="button" onClick={() => setView('settings')}>
              TEXT &amp; AUDIO / 字幕・音量設定
            </button>
            {props.inventoryAvailable && (
              <button type="button" onClick={props.onInventory}>
                INVENTORY / 所持品
              </button>
            )}
            {props.hintAvailable && (
              <button type="button" onClick={props.onHint}>
                HINT / ヒント{props.hintUnlocked ? '（利用可能）' : ''}
              </button>
            )}
          </div>
        </div>
      )}

      {view === 'archive' && (
        <ArchiveView
          history={props.narrativeHistory}
          documents={props.documents}
        />
      )}

      {view === 'settings' && (
        <SettingsView
          audioEnabled={props.audioEnabled}
          audioLevels={props.audioLevels}
          subtitleSettings={props.subtitleSettings}
          visualAssist={props.visualAssist}
          onToggleAudio={props.onToggleAudio}
          onAudioLevelChange={props.onAudioLevelChange}
          onSubtitleSettingChange={props.onSubtitleSettingChange}
          onToggleAssist={props.onToggleAssist}
        />
      )}

      <footer>
        {view !== 'main' && (
          <button type="button" onClick={() => setView('main')}>
            BACK / SYSTEMへ戻る
          </button>
        )}
        <button type="button" className="system-resume" onClick={props.onClose}>
          RESUME / ゲームへ戻る
        </button>
        {view === 'main' && (
          <button type="button" onClick={props.onExit}>
            RETURN TO TITLE / タイトルへ戻る
          </button>
        )}
      </footer>
    </div>
  );
}

function ArchiveView({
  history,
  documents,
}: {
  history: readonly NarrativeEntry[];
  documents: readonly ArchiveDocument[];
}) {
  return (
    <div className="system-scroll system-archive">
      <section aria-labelledby="conversation-history-title">
        <h3 id="conversation-history-title">CONVERSATION / 会話履歴</h3>
        {history.length === 0 ? (
          <p>まだ記録された会話はない。</p>
        ) : (
          <ol className="archive-list">
            {history.map((entry) => (
              <li key={entry.id} data-kind={entry.kind}>
                <span>{entry.speaker ?? kindLabel(entry.kind)}</span>
                <p>{entry.text}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
      <section aria-labelledby="document-archive-title">
        <h3 id="document-archive-title">DOCUMENT / 資料再読</h3>
        {documents.length === 0 ? (
          <p>まだ確認できる資料はない。</p>
        ) : (
          <ul className="archive-list document-list">
            {documents.map((document) => (
              <li key={document.id}>
                <span>{document.title}</span>
                <p>{document.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SettingsView(
  props: Pick<
    Props,
    | 'audioEnabled'
    | 'audioLevels'
    | 'subtitleSettings'
    | 'visualAssist'
    | 'onToggleAudio'
    | 'onAudioLevelChange'
    | 'onSubtitleSettingChange'
    | 'onToggleAssist'
  >,
) {
  return (
    <div className="system-scroll system-settings">
      <fieldset>
        <legend>SUBTITLE / 字幕</legend>
        <SettingButtons<SubtitleSize>
          label="文字サイズ"
          value={props.subtitleSettings.size}
          options={[
            ['small', '小'],
            ['medium', '標準'],
            ['large', '大'],
          ]}
          onChange={(value) => props.onSubtitleSettingChange('size', value)}
        />
        <SettingButtons<SubtitleBackground>
          label="字幕背景"
          value={props.subtitleSettings.background}
          options={[
            ['soft', '半透明'],
            ['solid', '高コントラスト'],
          ]}
          onChange={(value) =>
            props.onSubtitleSettingChange('background', value)
          }
        />
        <SettingButtons<TextSpeed>
          label="表示速度"
          value={props.subtitleSettings.speed}
          options={[
            ['slow', 'ゆっくり'],
            ['normal', '標準'],
            ['fast', '速い'],
          ]}
          onChange={(value) => props.onSubtitleSettingChange('speed', value)}
        />
      </fieldset>
      <fieldset>
        <legend>AUDIO / 音量</legend>
        <button
          type="button"
          aria-pressed={props.audioEnabled}
          onClick={props.onToggleAudio}
        >
          MASTER / 音声 {props.audioEnabled ? 'ON' : 'OFF'}
        </button>
        {(
          [
            ['voice', 'VOICE / 会話'],
            ['effects', 'EFFECTS / 効果音'],
            ['environment', 'ENVIRONMENT / 環境音'],
          ] as const
        ).map(([channel, label]) => (
          <label className="volume-setting" key={channel}>
            <span>
              {label} {props.audioLevels[channel]}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={props.audioLevels[channel]}
              onChange={(event) =>
                props.onAudioLevelChange(channel, Number(event.target.value))
              }
            />
          </label>
        ))}
        <button
          type="button"
          aria-pressed={props.visualAssist}
          onClick={props.onToggleAssist}
        >
          VISUAL ASSIST / 視覚補助 {props.visualAssist ? 'ON' : 'OFF'}
        </button>
      </fieldset>
    </div>
  );
}

function SettingButtons<Value extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: Value;
  options: readonly (readonly [Value, string])[];
  onChange: (value: Value) => void;
}) {
  return (
    <div className="setting-buttons" role="group" aria-label={label}>
      <span>{label}</span>
      <div>
        {options.map(([option, text]) => (
          <button
            type="button"
            key={option}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function kindLabel(kind: NarrativeEntry['kind']) {
  if (kind === 'system') return 'FACILITY SYSTEM';
  if (kind === 'discovery') return 'DISCOVERY';
  return '主人公';
}
