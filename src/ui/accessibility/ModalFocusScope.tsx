import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';

type Props = {
  children: ReactNode;
  focusKey: string;
  returnFocusRef: RefObject<HTMLElement | null>;
  fallbackFocusRef: RefObject<HTMLElement | null>;
};

const focusableSelector =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function ModalFocusScope({
  children,
  focusKey,
  returnFocusRef,
  fallbackFocusRef,
}: Props) {
  const scopeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const returnTarget = returnFocusRef.current;
    const fallbackTarget = fallbackFocusRef.current;
    return () => {
      if (returnTarget?.isConnected) returnTarget.focus();
      else fallbackTarget?.focus();
    };
  }, [fallbackFocusRef, returnFocusRef]);

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope?.contains(document.activeElement)) {
      scope?.querySelector<HTMLElement>(focusableSelector)?.focus();
    }
  }, [focusKey]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;
    const controls = Array.from(
      scopeRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
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
    <div ref={scopeRef} className="modal-focus-scope" onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}
