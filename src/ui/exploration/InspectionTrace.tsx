import { useEffect, useRef } from 'react';

import {
  getHotspotBounds,
  type WorldHotspot,
} from '../../world/assets/worldAssets';
import {
  getOppositeCornerPaths,
  type InspectionTracePoint,
} from './inspectionTraceGeometry';

const TRACE_DURATION_MS = 110;
const DIAMOND_APPEAR_MS = 70;
const DIAMOND_FADE_MS = 40;

type Point = InspectionTracePoint;

type Props = {
  hotspot: WorldHotspot;
  motionReduced: boolean;
};

export function InspectionTrace({ hotspot, motionReduced }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const bounds = getHotspotBounds(hotspot);
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
    canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const outlinePoints = getOutlinePoints(hotspot);
    const points = outlinePoints.map(([x, y]) => {
      const inset = 1;
      return [
        inset + ((x - bounds.x) / bounds.width) * (cssWidth - inset * 2),
        inset + ((y - bounds.y) / bounds.height) * (cssHeight - inset * 2),
      ] as Point;
    });

    const draw = (traceProgress: number, diamondOpacity: number) => {
      context.clearRect(0, 0, cssWidth, cssHeight);
      context.save();
      context.lineCap = 'square';
      context.lineJoin = 'miter';
      context.lineWidth = 1;
      context.strokeStyle = 'rgba(111, 231, 226, 0.78)';
      context.shadowBlur = 4;
      context.shadowColor = 'rgba(111, 231, 226, 0.42)';
      traceOutlineFromOppositeCorners(context, points, traceProgress);
      context.restore();

      if (diamondOpacity <= 0) return;
      const centerX = cssWidth / 2;
      const centerY = cssHeight / 2;
      const radius = Math.max(
        3,
        Math.min(5, Math.min(cssWidth, cssHeight) * 0.035),
      );
      context.save();
      context.globalAlpha = diamondOpacity;
      context.lineWidth = 1;
      context.strokeStyle = 'rgb(223, 248, 245)';
      context.shadowBlur = 5;
      context.shadowColor = 'rgba(111, 231, 226, 0.72)';
      context.beginPath();
      context.moveTo(centerX, centerY - radius);
      context.lineTo(centerX + radius, centerY);
      context.lineTo(centerX, centerY + radius);
      context.lineTo(centerX - radius, centerY);
      context.closePath();
      context.stroke();
      context.restore();
    };

    if (motionReduced) {
      draw(1, 1);
      return;
    }

    let animationFrame = 0;
    const startedAt = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startedAt;
      const traceProgress = Math.min(1, elapsed / TRACE_DURATION_MS);
      const diamondOpacity = Math.max(
        0,
        Math.min(1, (elapsed - DIAMOND_APPEAR_MS) / DIAMOND_FADE_MS),
      );
      draw(traceProgress, diamondOpacity);
      if (traceProgress < 1 || diamondOpacity < 1)
        animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [hotspot, motionReduced]);

  return (
    <canvas
      ref={canvasRef}
      className="inspection-transition-marker"
      data-trace-duration={motionReduced ? 0 : TRACE_DURATION_MS}
      aria-hidden="true"
    />
  );
}

function getOutlinePoints(hotspot: WorldHotspot): readonly Point[] {
  const outline = hotspot.inspectionOutline;
  if (outline.kind === 'polygon') return outline.points;

  const [left, top, right, bottom] = outline.bounds;
  if (outline.kind === 'rectangle') {
    return [
      [left, top],
      [right, top],
      [right, bottom],
      [left, bottom],
    ];
  }

  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const radiusX = (right - left) / 2;
  const radiusY = (bottom - top) / 2;
  return Array.from({ length: 48 }, (_, index) => {
    const angle = -Math.PI / 2 + (index / 48) * Math.PI * 2;
    return [
      centerX + Math.cos(angle) * radiusX,
      centerY + Math.sin(angle) * radiusY,
    ] as Point;
  });
}

function traceOutlineFromOppositeCorners(
  context: CanvasRenderingContext2D,
  points: readonly Point[],
  progress: number,
) {
  if (points.length < 2 || progress <= 0) return;

  const [topLeftPath, bottomRightPath] = getOppositeCornerPaths(points);
  tracePath(context, topLeftPath, progress);
  tracePath(context, bottomRightPath, progress);
}

function tracePath(
  context: CanvasRenderingContext2D,
  points: readonly Point[],
  progress: number,
) {
  const firstPoint = points[0];
  if (!firstPoint || points.length < 2) return;

  const segments = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1] ?? point;
    return {
      from: point,
      to: next,
      length: Math.hypot(next[0] - point[0], next[1] - point[1]),
    };
  });
  const totalLength = segments.reduce(
    (sum, segment) => sum + segment.length,
    0,
  );
  let remainingLength = totalLength * Math.min(1, progress);

  context.beginPath();
  context.moveTo(firstPoint[0], firstPoint[1]);
  for (const segment of segments) {
    if (remainingLength <= 0) break;
    if (remainingLength >= segment.length) {
      context.lineTo(segment.to[0], segment.to[1]);
      remainingLength -= segment.length;
      continue;
    }
    const segmentProgress = remainingLength / segment.length;
    context.lineTo(
      segment.from[0] + (segment.to[0] - segment.from[0]) * segmentProgress,
      segment.from[1] + (segment.to[1] - segment.from[1]) * segmentProgress,
    );
    break;
  }
  context.stroke();
}
