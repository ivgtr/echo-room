import { AccessibilitySystem, Application, Container, Graphics } from 'pixi.js';
import 'pixi.js/accessibility';
import { useEffect, useRef } from 'react';

import type { HotspotId } from '../../game/domain/ids';

const LOGICAL_WIDTH = 1920;
const LOGICAL_HEIGHT = 1080;

type Props = {
  selectedHotspotId: HotspotId | null;
  onHotspotSelected: (hotspotId: HotspotId) => void;
};

export function WorldCanvas({ selectedHotspotId, onHotspotSelected }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onHotspotSelected);

  useEffect(() => {
    selectRef.current = onHotspotSelected;
  }, [onHotspotSelected]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    AccessibilitySystem.defaultOptions.enabledByDefault = true;
    const app = new Application();
    let disposed = false;
    let initialized = false;

    void app
      .init({
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        background: '#11181c',
        antialias: true,
        preference: 'webgl',
      })
      .then(() => {
        initialized = true;
        if (disposed) {
          app.destroy(true);
          return;
        }

        app.canvas.setAttribute('aria-label', '実験室E-01 北壁');
        host.append(app.canvas);

        const room = new Container({ label: 'room' });
        const concrete = new Graphics()
          .rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
          .fill('#182126');
        const floor = new Graphics()
          .poly([
            0,
            790,
            LOGICAL_WIDTH,
            790,
            LOGICAL_WIDTH,
            LOGICAL_HEIGHT,
            0,
            LOGICAL_HEIGHT,
          ])
          .fill('#252d30');
        const emergencyGlow = new Graphics()
          .circle(960, 170, 520)
          .fill({ color: '#9a1f24', alpha: 0.18 });
        const door = new Graphics()
          .roundRect(685, 170, 550, 700, 8)
          .fill('#303a3b')
          .stroke({ color: '#66716f', width: 10 });
        const doorInset = new Graphics()
          .roundRect(730, 220, 460, 600, 4)
          .fill('#20292b')
          .stroke({ color: '#48534f', width: 5 });
        const batteryHousing = new Graphics()
          .roundRect(790, 94, 340, 82, 4)
          .fill('#101719')
          .stroke({ color: '#48534f', width: 5 });

        const hotspot = new Graphics({
          label: 'hotspot_door',
          accessible: true,
          accessibleTitle: '鉄製ドアを調べる',
          accessibleHint: '非常ロックの状態を確認します',
          tabIndex: 0,
          eventMode: 'static',
          cursor: 'pointer',
        })
          .roundRect(650, 150, 620, 750, 12)
          .fill({ color: '#ffffff', alpha: 0.001 });

        hotspot.on('pointertap', () => selectRef.current('hotspot_door'));
        room.addChild(
          concrete,
          emergencyGlow,
          floor,
          door,
          doorInset,
          batteryHousing,
          hotspot,
        );
        app.stage.addChild(room);
      });

    return () => {
      disposed = true;
      if (initialized) app.destroy(true);
    };
  }, []);

  return (
    <div
      className={
        selectedHotspotId ? 'canvas-host is-inspecting' : 'canvas-host'
      }
      ref={hostRef}
      data-testid="world-canvas"
    />
  );
}
