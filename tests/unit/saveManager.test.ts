import { describe, expect, it } from 'vitest';

import {
  loadProgress,
  SAVE_KEY,
  saveProgress,
} from '../../src/game/save/saveManager';

describe('saveManager', () => {
  it('round-trips the safe power checkpoint', () => {
    localStorage.clear();
    saveProgress(localStorage);
    expect(loadProgress(localStorage).status).toBe('valid');
  });

  it('protects a corrupt save instead of throwing', () => {
    localStorage.setItem(SAVE_KEY, '{bad json');
    expect(loadProgress(localStorage)).toEqual({ status: 'corrupt' });
    expect(localStorage.getItem(SAVE_KEY)).toBe('{bad json');
  });
});
