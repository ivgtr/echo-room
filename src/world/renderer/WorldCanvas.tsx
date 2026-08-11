import { AccessibilitySystem, Application, Container, Graphics } from 'pixi.js';
import 'pixi.js/accessibility';
import { useEffect, useRef } from 'react';

import type { HotspotId, LocationId } from '../../game/domain/ids';

const LOGICAL_WIDTH = 1920;
const LOGICAL_HEIGHT = 1080;

const viewNames: Record<LocationId, string> = {
  location_north_wall: '北壁 / ドア・時計・インターホン',
  location_east_wall: '東壁 / 壁面端末・解析パネル',
  location_south_wall: '南壁 / デスク',
  location_west_wall: '西壁 / ブレーカー・ロッカー',
};

type Props = {
  locationId: LocationId;
  powerRestored: boolean;
  selectedHotspotId: HotspotId | null;
  onHotspotSelected: (hotspotId: HotspotId) => void;
};

export function WorldCanvas({
  locationId,
  powerRestored,
  selectedHotspotId,
  onHotspotSelected,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

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
        if (disposed) return app.destroy(true);
        app.canvas.setAttribute(
          'aria-label',
          `実験室E-01 ${viewNames[locationId]}`,
        );
        host.append(app.canvas);
        const room = new Container({ label: locationId });
        const wall = new Graphics()
          .rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
          .fill(powerRestored ? '#303a3b' : '#171f22');
        const floor = new Graphics()
          .poly([0, 790, LOGICAL_WIDTH, 790, LOGICAL_WIDTH, 1080, 0, 1080])
          .fill('#252d30');
        const glow = new Graphics().circle(960, 180, 620).fill({
          color: powerRestored ? '#c9d5d5' : '#9a1f24',
          alpha: powerRestored ? 0.2 : 0.16,
        });
        room.addChild(wall, glow, floor);

        const addProp = (
          id: HotspotId,
          x: number,
          y: number,
          w: number,
          h: number,
          color: string,
          title: string,
        ) => {
          const prop = new Graphics({
            label: id,
            accessible: true,
            accessibleTitle: title,
            tabIndex: 0,
            eventMode: 'static',
            cursor: 'pointer',
          })
            .roundRect(x, y, w, h, 8)
            .fill(color)
            .stroke({ color: '#71807d', width: 6 });
          prop.on('pointertap', () => onHotspotSelected(id));
          room.addChild(prop);
        };
        if (locationId === 'location_north_wall') {
          addProp(
            'hotspot_door',
            685,
            180,
            550,
            680,
            '#273133',
            '鉄製ドアを調べる',
          );
          addProp(
            'hotspot_intercom',
            1350,
            340,
            180,
            260,
            '#323c3c',
            'インターホンを調べる',
          );
        }
        if (locationId === 'location_east_wall')
          addProp(
            'hotspot_terminal',
            610,
            210,
            700,
            500,
            powerRestored ? '#28504e' : '#182123',
            '壁面端末を調べる',
          );
        if (locationId === 'location_south_wall')
          addProp(
            'hotspot_desk',
            410,
            500,
            1100,
            250,
            '#48534f',
            'デスクの紙を調べる',
          );
        if (locationId === 'location_west_wall') {
          addProp(
            'hotspot_breaker',
            380,
            240,
            430,
            500,
            '#3f4947',
            'ブレーカーパネルを調べる',
          );
          addProp(
            'hotspot_locker',
            1110,
            160,
            390,
            700,
            '#48534f',
            'ロッカーを調べる',
          );
        }
        app.stage.addChild(room);
      });
    return () => {
      disposed = true;
      if (initialized) app.destroy(true);
    };
  }, [locationId, onHotspotSelected, powerRestored]);

  return (
    <div
      className={
        selectedHotspotId ? 'canvas-host is-inspecting' : 'canvas-host'
      }
      ref={hostRef}
      data-testid="world-canvas"
    >
      <span className="canvas-placeholder-label" aria-hidden="true">
        {viewNames[locationId]}
        <br />
        PLACEHOLDER 1920×1080
      </span>
    </div>
  );
}
