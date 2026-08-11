import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  type Texture,
} from 'pixi.js';
import { useEffect, useRef, useState, type RefObject } from 'react';

import type { HotspotId, LocationId } from '../../game/domain/ids';
import {
  getAllWorldImages,
  getWorldImage,
  worldViewAssets,
} from '../assets/worldAssets';
import { getWorldTransition } from './worldTransition';

const LOGICAL_WIDTH = 1920;
const LOGICAL_HEIGHT = 1080;
const CAMERA_OVERSCAN = 1.012;

type Props = {
  locationId: LocationId;
  powerRestored: boolean;
  onHotspotSelected: (hotspotId: HotspotId) => void;
};

type Scene = {
  key: string;
  locationId: LocationId;
  powerRestored: boolean;
  container: Container;
};

export function WorldCanvas({
  locationId,
  powerRestored,
  onHotspotSelected,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const cameraRef = useRef<Container | null>(null);
  const transitionShadeRef = useRef<Graphics | null>(null);
  const currentSceneRef = useRef<Scene | null>(null);
  const outgoingSceneRef = useRef<Scene | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sceneRequestRef = useRef(0);
  const hotspotHandlerRef = useRef(onHotspotSelected);
  const reduceMotionRef = useRef(false);
  const [rendererReady, setRendererReady] = useState(false);
  const [assetState, setAssetState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    hotspotHandlerRef.current = onHotspotSelected;
  }, [onHotspotSelected]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();
    let disposed = false;
    let initialized = false;

    void app
      .init({
        width: LOGICAL_WIDTH,
        height: LOGICAL_HEIGHT,
        background: '#080b0c',
        antialias: true,
        preference: 'webgl',
      })
      .then(() => {
        initialized = true;
        if (disposed) return app.destroy(true);

        appRef.current = app;
        host.append(app.canvas);
        reduceMotionRef.current = window.matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches;

        const camera = new Container({ label: 'world-camera' });
        camera.scale.set(CAMERA_OVERSCAN);
        const baseX = (-LOGICAL_WIDTH * (CAMERA_OVERSCAN - 1)) / 2;
        const baseY = (-LOGICAL_HEIGHT * (CAMERA_OVERSCAN - 1)) / 2;
        camera.position.set(baseX, baseY);
        app.stage.addChild(camera);
        cameraRef.current = camera;

        const transitionShade = new Graphics()
          .rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)
          .fill('#020405');
        transitionShade.alpha = 0;
        transitionShade.eventMode = 'none';
        app.stage.addChild(transitionShade);
        transitionShadeRef.current = transitionShade;

        if (!reduceMotionRef.current) {
          const onPointerMove = (event: PointerEvent) => {
            const bounds = app.canvas.getBoundingClientRect();
            const xRatio = (event.clientX - bounds.left) / bounds.width - 0.5;
            const yRatio = (event.clientY - bounds.top) / bounds.height - 0.5;
            camera.position.set(baseX - xRatio * 8, baseY - yRatio * 5);
          };
          const onPointerLeave = () => camera.position.set(baseX, baseY);
          app.canvas.addEventListener('pointermove', onPointerMove);
          app.canvas.addEventListener('pointerleave', onPointerLeave);
        }

        setRendererReady(true);
        void warmWorldImageCache(() => disposed);
      })
      .catch(() => {
        if (!disposed) setAssetState('error');
      });

    return () => {
      disposed = true;
      sceneRequestRef.current += 1;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      appRef.current = null;
      cameraRef.current = null;
      transitionShadeRef.current = null;
      currentSceneRef.current = null;
      outgoingSceneRef.current = null;
      if (initialized) app.destroy(true);
    };
  }, []);

  useEffect(() => {
    const app = appRef.current;
    const camera = cameraRef.current;
    if (!rendererReady || !app || !camera) return;

    const requestId = ++sceneRequestRef.current;
    const imageUrl = getWorldImage(locationId, powerRestored);
    const sceneKey = `${locationId}:${powerRestored ? 'powered' : 'emergency'}`;
    const hasVisibleScene = currentSceneRef.current !== null;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      if (outgoingSceneRef.current) {
        camera.removeChild(outgoingSceneRef.current.container);
        outgoingSceneRef.current.container.destroy({ children: true });
        outgoingSceneRef.current = null;
      }
      if (currentSceneRef.current) {
        currentSceneRef.current.container.alpha = 1;
        currentSceneRef.current.container.x = 0;
        currentSceneRef.current.container.eventMode = 'auto';
      }
      if (transitionShadeRef.current) transitionShadeRef.current.alpha = 0;
      queueMicrotask(() => {
        if (requestId === sceneRequestRef.current) setTransitioning(false);
      });
    }

    if (!hasVisibleScene) {
      queueMicrotask(() => {
        if (requestId === sceneRequestRef.current) setAssetState('loading');
      });
    }

    void Assets.load<Texture>(imageUrl)
      .then((texture) => {
        if (requestId !== sceneRequestRef.current || !cameraRef.current) return;

        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (transitionShadeRef.current) transitionShadeRef.current.alpha = 0;
        if (outgoingSceneRef.current) {
          camera.removeChild(outgoingSceneRef.current.container);
          outgoingSceneRef.current.container.destroy({ children: true });
          outgoingSceneRef.current = null;
        }

        const previous = currentSceneRef.current;
        if (previous?.key === sceneKey) {
          previous.container.alpha = 1;
          previous.container.x = 0;
          previous.container.eventMode = 'auto';
          setAssetState('ready');
          setTransitioning(false);
          return;
        }

        if (previous) {
          previous.container.alpha = 1;
          previous.container.x = 0;
          previous.container.eventMode = 'none';
        }

        const next = buildScene(
          texture,
          locationId,
          powerRestored,
          hotspotHandlerRef,
        );
        camera.addChild(next.container);
        currentSceneRef.current = next;
        app.canvas.setAttribute(
          'aria-label',
          `実験室E-01 ${worldViewAssets[locationId].label}`,
        );
        setAssetState('ready');

        if (!previous) {
          next.container.alpha = 1;
          next.container.eventMode = 'auto';
          setTransitioning(false);
          return;
        }

        outgoingSceneRef.current = previous;
        const transition = getWorldTransition(
          previous.locationId,
          locationId,
          previous.powerRestored !== powerRestored,
          reduceMotionRef.current,
        );
        const shade = transitionShadeRef.current;
        next.container.alpha = 0;
        next.container.x = transition.offsetX;
        next.container.eventMode = 'none';
        setTransitioning(true);
        const startedAt = performance.now();

        const animate = (now: number) => {
          if (requestId !== sceneRequestRef.current) return;
          const progress = Math.min((now - startedAt) / transition.duration, 1);
          const eased = easeInOut(progress);
          previous.container.alpha = 1 - eased;
          previous.container.x = -transition.offsetX * eased;
          next.container.alpha = eased;
          next.container.x = transition.offsetX * (1 - eased);
          if (shade) {
            shade.alpha = Math.sin(Math.PI * progress) * transition.midpointDim;
          }

          if (progress < 1) {
            animationFrameRef.current = requestAnimationFrame(animate);
            return;
          }

          camera.removeChild(previous.container);
          previous.container.destroy({ children: true });
          outgoingSceneRef.current = null;
          animationFrameRef.current = null;
          next.container.alpha = 1;
          next.container.x = 0;
          next.container.eventMode = 'auto';
          if (shade) shade.alpha = 0;
          setTransitioning(false);
        };

        animationFrameRef.current = requestAnimationFrame(animate);
      })
      .catch(() => {
        if (requestId !== sceneRequestRef.current) return;
        setAssetState('error');
        setTransitioning(false);
      });
  }, [locationId, powerRestored, rendererReady]);

  return (
    <div
      className="canvas-host"
      ref={hostRef}
      data-testid="world-canvas"
      data-asset-state={assetState}
      data-transition-state={transitioning ? 'animating' : 'idle'}
    >
      {assetState !== 'ready' && (
        <span className="canvas-asset-status" role="status">
          {assetState === 'error'
            ? '背景素材を読み込めませんでした。現在の表示を維持します。'
            : '背景素材を読み込んでいます…'}
        </span>
      )}
    </div>
  );
}

function buildScene(
  texture: Texture,
  locationId: LocationId,
  powerRestored: boolean,
  hotspotHandlerRef: RefObject<(hotspotId: HotspotId) => void>,
): Scene {
  const asset = worldViewAssets[locationId];
  const container = new Container({
    label: `${locationId}:${powerRestored ? 'powered' : 'emergency'}`,
  });
  const background = new Sprite(texture);
  background.width = LOGICAL_WIDTH;
  background.height = LOGICAL_HEIGHT;
  container.addChild(background);

  for (const hotspot of asset.hotspots) {
    const target = new Graphics({
      label: hotspot.id,
      eventMode: 'static',
      cursor: 'pointer',
    })
      .poly(hotspot.polygon.flat(), true)
      .fill({ color: '#ffffff', alpha: 0.001 });
    target.on('pointertap', () => hotspotHandlerRef.current(hotspot.id));
    container.addChild(target);
  }

  return {
    key: `${locationId}:${powerRestored ? 'powered' : 'emergency'}`,
    locationId,
    powerRestored,
    container,
  };
}

function easeInOut(value: number) {
  return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
}

async function warmWorldImageCache(isDisposed: () => boolean) {
  await Promise.allSettled(
    getAllWorldImages().map(async (imageUrl) => {
      if (isDisposed()) return;
      const response = await fetch(imageUrl, { cache: 'force-cache' });
      if (response.ok) await response.blob();
    }),
  );
}
