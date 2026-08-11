import {
  AccessibilitySystem,
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  type Texture,
} from 'pixi.js';
import 'pixi.js/accessibility';
import { useEffect, useRef, useState } from 'react';

import type { HotspotId, LocationId } from '../../game/domain/ids';
import { getWorldImage, worldViewAssets } from '../assets/worldAssets';

const LOGICAL_WIDTH = 1920;
const LOGICAL_HEIGHT = 1080;
const CAMERA_OVERSCAN = 1.012;

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
  const [assetState, setAssetState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    AccessibilitySystem.defaultOptions.enabledByDefault = true;
    const app = new Application();
    const asset = worldViewAssets[locationId];
    const imageUrl = getWorldImage(locationId, powerRestored);
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    let disposed = false;
    let initialized = false;
    queueMicrotask(() => {
      if (!disposed) setAssetState('loading');
    });

    void app
      .init({
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        background: '#080b0c',
        antialias: true,
        preference: 'webgl',
      })
      .then(async () => {
        initialized = true;
        if (disposed) return app.destroy(true);

        app.canvas.setAttribute('aria-label', `実験室E-01 ${asset.label}`);
        host.append(app.canvas);

        const room = new Container({ label: locationId });
        room.scale.set(CAMERA_OVERSCAN);
        room.position.set(
          (-LOGICAL_WIDTH * (CAMERA_OVERSCAN - 1)) / 2,
          (-LOGICAL_HEIGHT * (CAMERA_OVERSCAN - 1)) / 2,
        );
        app.stage.addChild(room);

        try {
          const texture = await Assets.load<Texture>(imageUrl);
          if (disposed) return;
          const background = new Sprite(texture);
          background.width = LOGICAL_WIDTH;
          background.height = LOGICAL_HEIGHT;
          room.addChild(background);
          setAssetState('ready');
        } catch {
          if (disposed) return;
          const fallback = new Graphics()
            .rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
            .fill(powerRestored ? '#303a3b' : '#171f22');
          room.addChild(fallback);
          setAssetState('error');
        }

        for (const hotspot of asset.hotspots) {
          const { x, y, width, height } = hotspot.rect;
          const selected = selectedHotspotId === hotspot.id;
          const target = new Graphics({
            label: hotspot.id,
            eventMode: 'static',
            cursor: 'pointer',
          })
            .rect(x, y, width, height)
            .fill({ color: '#ffffff', alpha: 0.001 });
          if (selected) {
            target.stroke({ color: '#80d5ce', alpha: 0.7, width: 3 });
          }
          target.on('pointertap', () => onHotspotSelected(hotspot.id));
          room.addChild(target);
        }

        if (!reduceMotion) {
          const onPointerMove = (event: PointerEvent) => {
            const bounds = app.canvas.getBoundingClientRect();
            const xRatio = (event.clientX - bounds.left) / bounds.width - 0.5;
            const yRatio = (event.clientY - bounds.top) / bounds.height - 0.5;
            room.position.set(
              (-LOGICAL_WIDTH * (CAMERA_OVERSCAN - 1)) / 2 - xRatio * 8,
              (-LOGICAL_HEIGHT * (CAMERA_OVERSCAN - 1)) / 2 - yRatio * 5,
            );
          };
          app.canvas.addEventListener('pointermove', onPointerMove);
        }
      })
      .catch(() => {
        if (!disposed) setAssetState('error');
      });

    return () => {
      disposed = true;
      if (initialized) app.destroy(true);
    };
  }, [locationId, onHotspotSelected, powerRestored, selectedHotspotId]);

  return (
    <div
      className={
        selectedHotspotId ? 'canvas-host is-inspecting' : 'canvas-host'
      }
      ref={hostRef}
      data-testid="world-canvas"
      data-asset-state={assetState}
    >
      {assetState !== 'ready' && (
        <span className="canvas-asset-status" role="status">
          {assetState === 'error'
            ? '背景素材を読み込めませんでした。簡易表示で続行します。'
            : '背景素材を読み込んでいます…'}
        </span>
      )}
    </div>
  );
}
