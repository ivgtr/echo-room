import type { HotspotId, LocationId } from '../../game/domain/ids';

export type WorldLightingState = 'emergency' | 'powered';

export type WorldHotspot = {
  id: HotspotId;
  label: string;
  polygon: ReadonlyArray<readonly [number, number]>;
  inspectionOutline:
    | {
        kind: 'rectangle' | 'ellipse';
        bounds: readonly [number, number, number, number];
      }
    | {
        kind: 'polygon';
        points: ReadonlyArray<readonly [number, number]>;
      };
};

type WorldViewAsset = {
  label: string;
  images: Record<WorldLightingState, string>;
  hotspots: readonly WorldHotspot[];
};

export const worldViewAssets: Record<LocationId, WorldViewAsset> = {
  location_north_wall: {
    label: '北側 / ドア・時計・インターホン',
    images: {
      emergency: `${import.meta.env.BASE_URL}assets/images/world/gfx-wide-001/emergency.webp`,
      powered: `${import.meta.env.BASE_URL}assets/images/world/gfx-wide-001/powered.webp`,
    },
    hotspots: [
      {
        id: 'hotspot_clock',
        label: '時計を調べる',
        polygon: [
          [347, 113],
          [389, 86],
          [451, 89],
          [498, 126],
          [515, 187],
          [498, 253],
          [452, 298],
          [384, 300],
          [337, 260],
          [318, 196],
        ],
        inspectionOutline: {
          kind: 'ellipse',
          bounds: [318, 86, 515, 300],
        },
      },
      {
        id: 'hotspot_door',
        label: 'ドアを調べる',
        polygon: [
          [760, 206],
          [1148, 206],
          [1218, 274],
          [1218, 868],
          [1152, 936],
          [752, 936],
          [686, 868],
          [686, 274],
        ],
        inspectionOutline: {
          kind: 'rectangle',
          bounds: [686, 206, 1218, 936],
        },
      },
      {
        id: 'hotspot_intercom',
        label: 'インターホンを調べる',
        polygon: [
          [1264, 348],
          [1404, 348],
          [1436, 380],
          [1436, 622],
          [1400, 658],
          [1260, 658],
          [1228, 624],
          [1228, 380],
        ],
        inspectionOutline: {
          kind: 'rectangle',
          bounds: [1228, 348, 1436, 658],
        },
      },
    ],
  },
  location_east_wall: {
    label: '東側 / 端末・端末横のパネル',
    images: {
      emergency: `${import.meta.env.BASE_URL}assets/images/world/gfx-wide-002/emergency.webp`,
      powered: `${import.meta.env.BASE_URL}assets/images/world/gfx-wide-002/powered.webp`,
    },
    hotspots: [
      {
        id: 'hotspot_terminal',
        label: '端末を調べる',
        polygon: [
          [746, 302],
          [1168, 302],
          [1228, 358],
          [1228, 704],
          [1170, 762],
          [742, 762],
          [682, 704],
          [682, 358],
        ],
        inspectionOutline: {
          kind: 'rectangle',
          bounds: [682, 302, 1228, 762],
        },
      },
      {
        id: 'hotspot_analysis_panel',
        label: '端末横のパネルを調べる',
        polygon: [
          [1262, 360],
          [1415, 360],
          [1444, 388],
          [1444, 635],
          [1414, 666],
          [1260, 666],
          [1229, 635],
          [1229, 390],
        ],
        inspectionOutline: {
          kind: 'rectangle',
          bounds: [1229, 360, 1444, 666],
        },
      },
    ],
  },
  location_south_wall: {
    label: '南側 / 机',
    images: {
      emergency: `${import.meta.env.BASE_URL}assets/images/world/gfx-wide-003/emergency.webp`,
      powered: `${import.meta.env.BASE_URL}assets/images/world/gfx-wide-003/powered.webp`,
    },
    hotspots: [
      {
        id: 'hotspot_desk',
        label: '机を調べる',
        polygon: [
          [590, 527],
          [1260, 527],
          [1368, 702],
          [1308, 921],
          [542, 921],
          [484, 704],
        ],
        inspectionOutline: {
          kind: 'polygon',
          points: [
            [590, 527],
            [1260, 527],
            [1308, 921],
            [542, 921],
          ],
        },
      },
    ],
  },
  location_west_wall: {
    label: '西側 / ブレーカー・ロッカー',
    images: {
      emergency: `${import.meta.env.BASE_URL}assets/images/world/gfx-wide-004/emergency.webp`,
      powered: `${import.meta.env.BASE_URL}assets/images/world/gfx-wide-004/powered.webp`,
    },
    hotspots: [
      {
        id: 'hotspot_locker',
        label: 'ロッカーを調べる',
        polygon: [
          [316, 112],
          [552, 112],
          [584, 150],
          [584, 886],
          [550, 922],
          [314, 922],
          [278, 886],
          [278, 150],
        ],
        inspectionOutline: {
          kind: 'rectangle',
          bounds: [278, 112, 584, 922],
        },
      },
      {
        id: 'hotspot_breaker',
        label: 'ブレーカーを調べる',
        polygon: [
          [1312, 262],
          [1608, 262],
          [1654, 308],
          [1654, 618],
          [1608, 666],
          [1310, 666],
          [1264, 618],
          [1264, 308],
        ],
        inspectionOutline: {
          kind: 'rectangle',
          bounds: [1264, 262, 1654, 666],
        },
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

export function getHotspotBounds(hotspot: WorldHotspot) {
  const xs = hotspot.polygon.map(([x]) => x);
  const ys = hotspot.polygon.map(([, y]) => y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  return { x: left, y: top, width: right - left, height: bottom - top };
}
