import type { ItemId } from '../../game/machine/gameMachine';

export const itemDetails: Record<
  ItemId,
  { label: string; code: string; description: string }
> = {
  item_screwdriver: {
    label: 'ドライバー',
    code: 'DRIVER',
    description: '細いネジに合う。端末の横にあるパネルを開けられそうだ。',
  },
  item_staff_card: {
    label: '職員用カード',
    code: 'ACCESS CARD',
    description: '施設の職員用カード。壁面端末のSECURITYを開けられる。',
  },
  item_floor_map: {
    label: '設備・配線図',
    code: 'CONDUIT MAP',
    description: 'E-01の部屋の図と、通信の配線図を重ねたもの。',
  },
};
