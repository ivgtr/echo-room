import { expect, test } from '@playwright/test';
import { restorePower, startNewGame } from './gameplay';

test('an earned checkpoint resumes after reload with the next device playable', async ({
  page,
}) => {
  await startNewGame(page);
  await restorePower(page);
  await page.reload();
  await page.getByRole('button', { name: '続きから' }).press('Enter');
  await expect(
    page.getByText('MAIN POWER ONLINE', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '端末を調べる' }).press('Enter');
  const channel = page.getByRole('slider', { name: 'CHANNEL A' });
  await expect(channel).toHaveAttribute('aria-valuenow', '-2');
  await channel.press('ArrowRight');
  await expect(channel).toHaveAttribute('aria-valuenow', '-1');
});
