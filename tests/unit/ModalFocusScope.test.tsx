import { createRef } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import { ModalFocusScope } from '../../src/ui/accessibility/ModalFocusScope';

afterEach(cleanup);

it('traps focus in visible controls and returns it to the opener on close', () => {
  const opener = createRef<HTMLButtonElement>();
  const scope = render(
    <>
      <button ref={opener}>Inspect terminal</button>
      <ModalFocusScope
        focusKey="terminal"
        returnFocusRef={opener}
        fallbackFocusRef={opener}
      >
        <div hidden>
          <button>Hidden draft</button>
        </div>
        <button>LOG</button>
        <button>BACK</button>
      </ModalFocusScope>
    </>,
  );
  const first = screen.getByRole('button', { name: 'LOG' });
  const last = screen.getByRole('button', { name: 'BACK' });
  expect(first).toHaveFocus();
  fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
  expect(last).toHaveFocus();
  fireEvent.keyDown(last, { key: 'Tab' });
  expect(first).toHaveFocus();
  scope.rerender(<button ref={opener}>Inspect terminal</button>);
  expect(
    screen.getByRole('button', { name: 'Inspect terminal' }),
  ).toHaveFocus();
});
