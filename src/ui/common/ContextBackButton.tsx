import type { Ref } from 'react';

type Props = {
  destination: string;
  onClick: () => void;
  mode?: 'back' | 'resume';
  buttonRef?: Ref<HTMLButtonElement>;
};

export function ContextBackButton({
  destination,
  onClick,
  mode = 'back',
  buttonRef,
}: Props) {
  const command = mode === 'resume' ? 'RESUME' : 'BACK';

  return (
    <button
      ref={buttonRef}
      type="button"
      className="context-back"
      onClick={onClick}
    >
      <span aria-hidden="true">&lt;</span> {command} / {destination}
    </button>
  );
}
