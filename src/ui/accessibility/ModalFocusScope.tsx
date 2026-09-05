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
  active?: boolean;
  returnFocusRef: RefObject<HTMLElement | null>;
  fallbackFocusRef: RefObject<HTMLElement | null>;
};

function focusableControls(scope: HTMLElement | null) {
  return Array.from(
    scope?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
  ).filter(
    (element) => !element.closest('[hidden], [inert], [aria-hidden="true"]'),
  );
}

const focusableSelector =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function ModalFocusScope({
  children,
  focusKey,
  active = true,
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
    if (active && !scope?.contains(document.activeElement)) {
      focusableControls(scope)[0]?.focus();
    }
  }, [active, focusKey]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;
    const controls = focusableControls(scopeRef.current);
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
      ref={scopeRef}
      className="modal-focus-scope"
      hidden={!active}
      inert={!active}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
