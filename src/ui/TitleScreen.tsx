import { useEffect, useRef, useState, type ReactNode } from 'react';

import { AudioUnlockRequest } from '../audio/audioSetup';
import { getWorldImage } from '../world/assets/worldAssets';
import './title/title.css';

type Props = {
  onStart: () => void;
  onContinue?: () => void;
  saveStatus: 'empty' | 'valid' | 'corrupt';
  onDeleteSave: () => boolean;
  soundEnabled: boolean;
  audioChoiceMade: boolean;
  onSoundChoice: (enabled: boolean) => void;
  onSoundUnlock: () => Promise<boolean>;
  motionReduced: boolean;
  onToggleMotion: () => void;
};

type Panel = 'audio' | 'settings' | 'erase' | 'restart' | null;
type AudioPhase = 'idle' | 'pending' | 'blocked' | 'timeout';

/** Native modal semantics keep pointer, keyboard and screen readers in one scope. */
function TitleDialog({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="title-dialog"
      aria-labelledby="title-dialog-heading"
      onCancel={(event) => {
        event.preventDefault();
        onBack();
      }}
    >
      <div className="title-dialog__content">
        <h2 id="title-dialog-heading">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}

export function TitleScreen({
  onStart,
  onContinue,
  saveStatus,
  onDeleteSave,
  soundEnabled,
  audioChoiceMade,
  onSoundChoice,
  onSoundUnlock,
  motionReduced,
  onToggleMotion,
}: Props) {
  const [panel, setPanel] = useState<Panel>(audioChoiceMade ? null : 'audio');
  const [audioPhase, setAudioPhase] = useState<AudioPhase>('idle');
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [audioRequest] = useState(() => new AudioUnlockRequest());
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const mainActionRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLButtonElement>(null);
  const audioReturnRef = useRef<Panel>(null);
  const restoreFocusRef = useRef(false);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => () => audioRequest.cancel(), [audioRequest]);
  useEffect(() => {
    if (panel === null && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      (returnFocusRef.current?.isConnected
        ? returnFocusRef.current
        : mainActionRef.current
      )?.focus();
    }
  }, [panel]);

  const changePanel = (next: Panel) => {
    if (panel === null && document.activeElement instanceof HTMLElement)
      returnFocusRef.current = document.activeElement;
    audioRequest.cancel();
    setAudioPhase('idle');
    restoreFocusRef.current = next === null;
    setPanel(next);
  };
  const chooseSound = (enabled: boolean) => {
    onSoundChoice(enabled);
    changePanel(audioReturnRef.current);
  };
  const enableSound = () => {
    setAudioPhase('pending');
    audioRequest.run(onSoundUnlock, (result) => {
      if (result === 'ready') chooseSound(true);
      else setAudioPhase(result);
    });
  };
  const backFromAudio = () => {
    // Escape on the first visit is an explicit safe, silent route, not a lockout.
    if (!audioChoiceMade) chooseSound(false);
    else changePanel(audioReturnRef.current);
  };
  const deleteSave = () => {
    if (onDeleteSave()) {
      setDeleteFailed(false);
      changePanel('settings');
    } else setDeleteFailed(true);
  };

  return (
    <main className="title-screen" data-reduced-motion={motionReduced}>
      <div className="title-scene" aria-hidden="true">
        {!backgroundFailed && (
          <img
            className="title-scene__room"
            src={getWorldImage('location_north_wall', false)}
            alt=""
            draggable={false}
            fetchPriority="high"
            onError={() => setBackgroundFailed(true)}
          />
        )}
        <div className="title-scene__shade" />
        <div className="title-scene__scanlines" />
      </div>

      <div
        className="title-composition"
        inert={panel !== null}
        aria-hidden={panel !== null}
      >
        <section className="title-identity" aria-labelledby="game-title">
          <h1 id="game-title" className="title-logo" aria-label="ECHO ROOM">
            <span>ECHO</span>
            <span>ROOM</span>
          </h1>
          <p className="title-japanese">残響室</p>
          <div
            className="title-menu"
            role="group"
            aria-label="タイトルメニュー"
          >
            {onContinue && (
              <button
                ref={mainActionRef}
                className="title-command title-command--lead"
                type="button"
                onClick={onContinue}
              >
                続きから
              </button>
            )}
            <button
              ref={onContinue ? undefined : mainActionRef}
              className={`title-command${onContinue ? '' : ' title-command--lead'}`}
              type="button"
              onClick={() => (onContinue ? changePanel('restart') : onStart())}
            >
              ゲーム開始
            </button>
            <button
              ref={settingsRef}
              className="title-command"
              type="button"
              onClick={() => {
                audioReturnRef.current = 'settings';
                changePanel('settings');
              }}
            >
              設定
            </button>
          </div>
          {saveStatus === 'corrupt' && (
            <p className="title-warning" role="alert">
              保存データを読み込めません。「ゲーム開始」は使えますが、このデータを消すまで新しい進行は保存されません。設定から消去できます。
            </p>
          )}
        </section>
        <p className="title-location" aria-hidden="true">
          E−01
        </p>
      </div>

      {panel === 'audio' && (
        <TitleDialog
          key="audio"
          title="サウンドを有効にしますか"
          onBack={backFromAudio}
        >
          <div className="title-headphones" aria-hidden="true" />
          <p>
            環境音と効果音が流れます。
            <br />
            音なしでも最後まで遊べます。
          </p>
          <div className="title-dialog__commands">
            <button
              className="title-command title-command--lead"
              type="button"
              aria-disabled={audioPhase === 'pending'}
              onClick={() => {
                if (audioPhase !== 'pending') enableSound();
              }}
            >
              {audioPhase === 'pending' ? 'サウンドを準備中…' : '音ありで進む'}
            </button>
            <button
              className="title-command"
              type="button"
              onClick={() => chooseSound(false)}
            >
              音なしで進む
            </button>
            {audioChoiceMade && (
              <button
                className="title-command"
                type="button"
                onClick={backFromAudio}
              >
                戻る
              </button>
            )}
          </div>
          {(audioPhase === 'blocked' || audioPhase === 'timeout') && (
            <p className="title-warning" role="alert">
              音を開始できませんでした。もう一度試すか、音なしで進めます。
            </p>
          )}
          <p className="title-dialog__note">
            マイク・録音は使用しません。
            <br />
            サウンドはあとから設定で変更できます。
          </p>
        </TitleDialog>
      )}
      {panel === 'settings' && (
        <TitleDialog
          key="settings"
          title="設定"
          onBack={() => changePanel(null)}
        >
          <div className="title-dialog__commands">
            <button
              className="title-command"
              type="button"
              onClick={() => {
                audioReturnRef.current = 'settings';
                changePanel('audio');
              }}
            >
              サウンド：{soundEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              className="title-command"
              type="button"
              aria-pressed={motionReduced}
              onClick={onToggleMotion}
            >
              動きを減らす：{motionReduced ? 'ON' : 'OFF'}
            </button>
            {saveStatus !== 'empty' && (
              <button
                className="title-command"
                type="button"
                onClick={() => {
                  setDeleteFailed(false);
                  changePanel('erase');
                }}
              >
                保存データを消去
              </button>
            )}
            <button
              className="title-command"
              type="button"
              onClick={() => changePanel(null)}
            >
              タイトルへ戻る
            </button>
          </div>
          <p className="title-dialog__note">
            字幕・音量の調整はゲーム中のSYSTEMから。
          </p>
        </TitleDialog>
      )}
      {panel === 'erase' && (
        <TitleDialog
          key="erase"
          title="保存データ消去の確認"
          onBack={() => changePanel('settings')}
        >
          <p>
            進行データを消去します。
            <br />
            字幕・音量設定は保持されます。
          </p>
          <div className="title-dialog__commands">
            <button
              className="title-command"
              type="button"
              onClick={() => changePanel('settings')}
            >
              キャンセル
            </button>
            <button
              className="title-command"
              type="button"
              onClick={deleteSave}
            >
              消去する
            </button>
          </div>
          {deleteFailed && (
            <p className="title-warning" role="alert">
              保存データを消去できませんでした。
            </p>
          )}
        </TitleDialog>
      )}
      {panel === 'restart' && (
        <TitleDialog
          key="restart"
          title="最初から始めますか"
          onBack={() => changePanel(null)}
        >
          <p>
            次の自動保存で、今の進行が上書きされます。
            <br />
            字幕・音量設定は保持されます。
          </p>
          <div className="title-dialog__commands">
            <button
              className="title-command"
              type="button"
              onClick={() => changePanel(null)}
            >
              キャンセル
            </button>
            <button className="title-command" type="button" onClick={onStart}>
              最初から始める
            </button>
          </div>
        </TitleDialog>
      )}
    </main>
  );
}
