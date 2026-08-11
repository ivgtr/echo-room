import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';

type Props = {
  objective: string;
  audioEnabled: boolean;
  visualAssist: boolean;
  inventoryAvailable: boolean;
  hintAvailable: boolean;
  hintUnlocked: boolean;
  returnFocusRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onToggleAudio: () => void;
  onToggleAssist: () => void;
  onInventory: () => void;
  onHint: () => void;
  onExit: () => void;
};

export function SystemMenu(props: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current
      ?.querySelector<HTMLElement>('button, [href], input, select, textarea')
      ?.focus();
    return () => props.returnFocusRef.current?.focus();
  }, [props.returnFocusRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      props.onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
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
      aria-labelledby="system-menu-title"
      onKeyDown={handleKeyDown}
    >
      <header>
        <p className="eyebrow">E-01 LOCAL CONTROL</p>
        <h2 id="system-menu-title">SYSTEM</h2>
      </header>
      <section className="system-objective" aria-labelledby="objective-title">
        <h3 id="objective-title">CURRENT OBJECTIVE / 現在目的</h3>
        <p>{props.objective}</p>
      </section>
      <div className="system-menu-actions">
        <button
          type="button"
          aria-pressed={props.audioEnabled}
          onClick={props.onToggleAudio}
        >
          AUDIO / 音声 {props.audioEnabled ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          aria-pressed={props.visualAssist}
          onClick={props.onToggleAssist}
        >
          VISUAL ASSIST / 視覚補助 {props.visualAssist ? 'ON' : 'OFF'}
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
      <footer>
        <button type="button" className="system-resume" onClick={props.onClose}>
          RESUME / ゲームへ戻る
        </button>
        <button type="button" onClick={props.onExit}>
          RETURN TO TITLE / タイトルへ戻る
        </button>
      </footer>
    </div>
  );
}
