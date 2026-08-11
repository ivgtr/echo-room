import type { ItemId } from '../../game/machine/gameMachine';

export const itemDetails: Record<
  ItemId,
  { label: string; code: string; description: string }
> = {
  item_screwdriver: {
    label: 'ドライバー',
    code: 'DRIVER',
    description: '細い固定ネジに合う。端末周辺のパネルを開けられそうだ。',
  },
  item_staff_card: {
    label: '職員用カード',
    code: 'ACCESS CARD',
    description: '実験棟の職員用カード。壁面端末のSECURITY認証に使用できる。',
  },
  item_floor_map: {
    label: '簡易フロア図',
    code: 'FACILITY MAP',
    description: 'E-01周辺の設備配置を記した紙の図面。',
  },
};
