import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TitleScreen } from '../../src/ui/TitleScreen';

describe('TitleScreen', () => {
  it('starts from an explicit user gesture', () => {
    const onStart = vi.fn();
    render(
      <TitleScreen
        onStart={onStart}
        saveStatus="empty"
        onDeleteSave={() => true}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'ゲーム開始' }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('requires confirmation before deleting progress', () => {
    const onDeleteSave = vi.fn(() => true);
    render(
      <TitleScreen
        onStart={vi.fn()}
        onContinue={vi.fn()}
        saveStatus="valid"
        onDeleteSave={onDeleteSave}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '保存データを消去' }));
    expect(onDeleteSave).not.toHaveBeenCalled();
    expect(
      screen.getByRole('group', { name: '保存データ消去の確認' }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '消去する' }));
    expect(onDeleteSave).toHaveBeenCalledOnce();
  });

  it('warns that corrupt progress is preserved until explicit deletion', () => {
    render(
      <TitleScreen
        onStart={vi.fn()}
        saveStatus="corrupt"
        onDeleteSave={() => true}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      '破損データを消去するまで進行は保存されません',
    );
  });
});
