import { createRef } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ModalFocusScope } from '../../src/ui/accessibility/ModalFocusScope';

afterEach(cleanup);

describe('ModalFocusScope', () => {
  it('retains input while suspended and restores focus when the message closes', () => {
    const returnFocusRef = createRef<HTMLButtonElement>();
    const fallbackFocusRef = createRef<HTMLButtonElement>();
    function Scope({ active }: { active: boolean }) {
      return (
        <ModalFocusScope
          active={active}
          focusKey="terminal"
          returnFocusRef={returnFocusRef}
          fallbackFocusRef={fallbackFocusRef}
        >
          <input aria-label="Adjustment" defaultValue="0" />
        </ModalFocusScope>
      );
    }
    const view = render(<Scope active />);
    const input = screen.getByRole('textbox', { name: 'Adjustment' });
    fireEvent.change(input, { target: { value: '3' } });
    view.rerender(<Scope active={false} />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(input.closest('[hidden][inert]')).not.toBeNull();
    view.rerender(<Scope active />);
    expect(input).toHaveValue('3');
    expect(input).toHaveFocus();
  });

  it('excludes retained hidden and inert controls from initial focus and wraparound', () => {
    render(
      <ModalFocusScope
        focusKey="terminal"
        returnFocusRef={createRef()}
        fallbackFocusRef={createRef()}
      >
        <div hidden>
          <button type="button">Hidden draft</button>
        </div>
        <button type="button">First key</button>
        <button type="button">BACK</button>
        <div inert>
          <button type="button">Inert key</button>
        </div>
        <div aria-hidden="true">
          <button type="button">Decorative key</button>
        </div>
      </ModalFocusScope>,
    );
    const first = screen.getByRole('button', { name: 'First key' });
    const last = screen.getByRole('button', { name: 'BACK' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();
  });

  it('restores focus to the original connected control on close', () => {
    const returnFocusRef = createRef<HTMLButtonElement>();
    const fallbackFocusRef = createRef<HTMLButtonElement>();
    const view = render(
      <>
        <button ref={returnFocusRef} type="button">
          Inspect terminal
        </button>
        <button ref={fallbackFocusRef} type="button">
          SYSTEM
        </button>
        <ModalFocusScope
          focusKey="terminal"
          returnFocusRef={returnFocusRef}
          fallbackFocusRef={fallbackFocusRef}
        >
          <button type="button">LOG</button>
        </ModalFocusScope>
      </>,
    );
    expect(screen.getByRole('button', { name: 'LOG' })).toHaveFocus();
    view.rerender(
      <>
        <button ref={returnFocusRef} type="button">
          Inspect terminal
        </button>
        <button ref={fallbackFocusRef} type="button">
          SYSTEM
        </button>
      </>,
    );
    expect(
      screen.getByRole('button', { name: 'Inspect terminal' }),
    ).toHaveFocus();
  });
});
