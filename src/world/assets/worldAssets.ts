import type { HotspotId, LocationId } from '../../game/domain/ids';

export type WorldLightingState = 'emergency' | 'powered';

export type WorldHotspot = {
  id: HotspotId;
  label: string;
  rect: Readonly<{ x: number; y: number; width: number; height: number }>;
};

type WorldViewAsset = {
  label: string;
  images: Record<WorldLightingState, string>;
  hotspots: readonly WorldHotspot[];
};

export const worldViewAssets: Record<LocationId, WorldViewAsset> = {
  location_north_wall: {
    label: '北壁 / ドア・時計・インターホン',
    images: {
      emergency: '/assets/images/world/gfx-wide-001/emergency.webp',
      powered: '/assets/images/world/gfx-wide-001/powered.webp',
    },
    hotspots: [
      {
        id: 'hotspot_clock',
        label: 'アナログ時計を調べる',
        rect: { x: 315, y: 95, width: 210, height: 230 },
      },
      {
        id: 'hotspot_door',
        label: '鉄製ドアを調べる',
        rect: { x: 700, y: 205, width: 520, height: 730 },
      },
      {
        id: 'hotspot_intercom',
        label: 'インターホンを調べる',
        rect: { x: 1230, y: 350, width: 210, height: 290 },
      },
    ],
  },
  location_east_wall: {
    label: '東壁 / 壁面端末・解析パネル',
    images: {
      emergency: '/assets/images/world/gfx-wide-002/emergency.webp',
      powered: '/assets/images/world/gfx-wide-002/powered.webp',
    },
    hotspots: [
      {
        id: 'hotspot_terminal',
        label: '壁面端末を調べる',
        rect: { x: 700, y: 310, width: 520, height: 440 },
      },
      {
        id: 'hotspot_analysis_panel',
        label: '解析パネルを調べる',
        rect: { x: 1230, y: 370, width: 210, height: 280 },
      },
    ],
  },
  location_south_wall: {
    label: '南壁 / デスク',
    images: {
      emergency: '/assets/images/world/gfx-wide-003/emergency.webp',
      powered: '/assets/images/world/gfx-wide-003/powered.webp',
    },
    hotspots: [
      {
        id: 'hotspot_desk',
        label: 'デスクの紙を調べる',
        rect: { x: 500, y: 545, width: 830, height: 390 },
      },
    ],
  },
  location_west_wall: {
    label: '西壁 / ブレーカー・ロッカー',
    images: {
      emergency: '/assets/images/world/gfx-wide-004/emergency.webp',
      powered: '/assets/images/world/gfx-wide-004/powered.webp',
    },
    hotspots: [
      {
        id: 'hotspot_locker',
        label: 'ロッカーを調べる',
        rect: { x: 275, y: 120, width: 300, height: 790 },
      },
      {
        id: 'hotspot_breaker',
        label: 'ブレーカーパネルを調べる',
        rect: { x: 1270, y: 270, width: 380, height: 390 },
      },
    ],
  },
};

export function getWorldImage(locationId: LocationId, powerRestored: boolean) {
  return worldViewAssets[locationId].images[
    powerRestored ? 'powered' : 'emergency'
  ];
}

export function getAllWorldImages() {
  return Object.values(worldViewAssets).flatMap((asset) =>
    Object.values(asset.images),
  );
}
