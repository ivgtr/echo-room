import { useState } from 'react';

type Props = {
  failures: number;
  onSubmit: (answer: string) => void;
  onClose: () => void;
};

export function LockerPanel({ failures, onSubmit, onClose }: Props) {
  const [answer, setAnswer] = useState('');
  return (
    <section
      className="puzzle-modal compact-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="locker-title"
    >
      <p className="eyebrow">LOCKER / gfx-close-007</p>
      <h2 id="locker-title">4桁電子錠</h2>
      <p>緊急時は「送信側の時刻」を使用する。</p>
      <label>
        解錠コード
        <input
          aria-label="解錠コード"
          inputMode="numeric"
          maxLength={4}
          value={answer}
          onChange={(event) => setAnswer(event.target.value.replace(/\D/g, ''))}
        />
      </label>
      {failures > 0 && <p role="alert">コードが違う。ロックは解除されない。</p>}
      <footer>
        <button type="button" onClick={() => onSubmit(answer)}>
          入力する
        </button>
        <button type="button" onClick={onClose}>
          戻る
        </button>
      </footer>
    </section>
  );
}
