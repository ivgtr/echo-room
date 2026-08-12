export type InspectionTracePoint = readonly [number, number];

export function getOppositeCornerPaths(
  points: readonly InspectionTracePoint[],
) {
  const topLeftIndex = findCornerIndex(points, (point) => point[0] + point[1]);
  const bottomRightIndex = findCornerIndex(
    points,
    (point) => -(point[0] + point[1]),
  );
  return [
    collectPath(points, topLeftIndex, bottomRightIndex),
    collectPath(points, bottomRightIndex, topLeftIndex),
  ] as const;
}

function findCornerIndex(
  points: readonly InspectionTracePoint[],
  score: (point: InspectionTracePoint) => number,
) {
  let bestIndex = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  points.forEach((point, index) => {
    const nextScore = score(point);
    if (nextScore < bestScore) {
      bestIndex = index;
      bestScore = nextScore;
    }
  });
  return bestIndex;
}

function collectPath(
  points: readonly InspectionTracePoint[],
  startIndex: number,
  endIndex: number,
) {
  const path: InspectionTracePoint[] = [];
  let index = startIndex;
  for (let step = 0; step <= points.length; step += 1) {
    const point = points[index];
    if (point) path.push(point);
    if (index === endIndex) break;
    index = (index + 1) % points.length;
  }
  return path;
}
