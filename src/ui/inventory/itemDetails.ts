import type { ItemId } from '../../game/machine/gameMachine';

export const itemDetails: Record<
  ItemId,
  { label: string; code: string; description: string }
> = {
  item_screwdriver: {
    label: 'ドライバー',
    code: 'DRIVER',
    description: '細いネジに合う。端末横のパネルを開けられそうだ。',
  },
  item_staff_card: {
    label: '職員証',
    code: 'ACCESS CARD',
    description: '施設の職員証。端末のSECURITYを開けられる。',
  },
  item_floor_map: {
    label: '施設図',
    code: 'CONDUIT MAP',
    description: 'E-01の見取り図に、通信の配線を重ねたもの。',
  },
};
