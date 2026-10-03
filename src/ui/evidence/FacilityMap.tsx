import { useId, useRef, useState, type CSSProperties } from 'react';

export type FacilityTraceNode =
  | 'intercom'
  | 'signal'
  | 'power'
  | 'ring-relay'
  | 'bar-relay'
  | 'echo-buffer'
  | 'open-end';

type Trace = {
  active: boolean;
  visited: FacilityTraceNode[];
  lost: FacilityTraceNode | null;
  attempt: number;
  onVisit: (node: FacilityTraceNode) => void;
};

const nodes: {
  id: FacilityTraceNode;
  x: number;
  y: number;
  label: string;
  description: string;
  shape: 'ring' | 'bar';
}[] = [
  {
    id: 'intercom',
    x: 44,
    y: 27,
    label: 'INTERCOM',
    shape: 'ring',
    description: 'インターホンの環端子。左の実線はJ-1、右の破線はP-1へ続く。',
  },
  {
    id: 'signal',
    x: 24,
    y: 47,
    label: 'J-1',
    shape: 'ring',
    description:
      'J-1接続点。上の実線はINTERCOM、下から右の実線はJ-2、左の破線はJ-3へ続く。',
  },
  {
    id: 'power',
    x: 65,
    y: 27,
    label: 'P-1',
    shape: 'bar',
    description: 'P-1線端子。INTERCOMから右へ分かれた破線の終端。',
  },
  {
    id: 'ring-relay',
    x: 44,
    y: 73,
    label: 'J-2',
    shape: 'ring',
    description:
      'J-2環端子。左の実線はJ-1、右から上の実線はBUFFER、右の破線は壁内の開放端へ続く。',
  },
  {
    id: 'bar-relay',
    x: 12,
    y: 68,
    label: 'J-3',
    shape: 'bar',
    description: 'J-3線端子。J-1から左へ分かれた破線の終端。',
  },
  {
    id: 'echo-buffer',
    x: 60,
    y: 51,
    label: 'BUFFER',
    shape: 'ring',
    description: 'E-01内のBUFFER環端子。下の実線は廊下のJ-2へ続く。',
  },
  {
    id: 'open-end',
    x: 85,
    y: 58,
    label: 'OPEN',
    shape: 'bar',
    description: 'コンクリート壁内の開放端。J-2から右へ分かれた破線の終端。',
  },
];

type Point = readonly [number, number];
const wires: {
  id: FacilityTraceNode;
  points: readonly Point[];
  power?: boolean;
}[] = [
  {
    id: 'signal',
    points: [
      [44, 27],
      [24, 27],
      [24, 47],
    ],
  },
  {
    id: 'power',
    points: [
      [44, 27],
      [65, 27],
    ],
    power: true,
  },
  {
    id: 'ring-relay',
    points: [
      [24, 47],
      [24, 73],
      [44, 73],
    ],
  },
  {
    id: 'bar-relay',
    points: [
      [24, 47],
      [12, 47],
      [12, 68],
    ],
    power: true,
  },
  {
    id: 'echo-buffer',
    points: [
      [44, 73],
      [60, 73],
      [60, 51],
    ],
  },
  {
    id: 'open-end',
    points: [
      [44, 73],
      [85, 73],
      [85, 58],
    ],
    power: true,
  },
];

// Move along drawn branches rather than jumping to an unrelated nearby point.
const neighbours: Record<
  FacilityTraceNode,
  Partial<Record<string, FacilityTraceNode>>
> = {
  intercom: { ArrowLeft: 'signal', ArrowRight: 'power' },
  signal: {
    ArrowUp: 'intercom',
    ArrowDown: 'ring-relay',
    ArrowLeft: 'bar-relay',
  },
  power: { ArrowLeft: 'intercom' },
  'ring-relay': {
    ArrowLeft: 'signal',
    ArrowUp: 'echo-buffer',
    ArrowRight: 'open-end',
  },
  'bar-relay': { ArrowUp: 'signal', ArrowRight: 'signal' },
  'echo-buffer': { ArrowDown: 'ring-relay' },
  'open-end': { ArrowDown: 'ring-relay', ArrowLeft: 'ring-relay' },
};

export function FacilityMap({
  compact = false,
  conduitLayer = false,
  revealRoute = false,
  trace,
}: {
  compact?: boolean;
  conduitLayer?: boolean;
  revealRoute?: boolean;
  trace?: Trace;
}) {
  const titleId = useId();
  const helpId = useId();
  const nodeRefs = useRef<
    Partial<Record<FacilityTraceNode, HTMLButtonElement>>
  >({});
  const [focusNode, setFocusNode] = useState<FacilityTraceNode>('intercom');
  const returned =
    revealRoute || Boolean(trace?.visited.includes('echo-buffer'));

  return (
    <figure
      className={`facility-map facility-map-spatial${compact ? ' is-compact' : ''}${returned ? ' is-returned' : ''}${trace ? ' is-traceable' : ''}`}
      aria-labelledby={titleId}
      data-trace-attempt={trace?.attempt}
    >
      <figcaption id={titleId}>
        <span>FACILITY / E-01</span>
        <small>{returned ? 'RETURN BUS / VERIFIED' : 'CONDUIT OVERLAY'}</small>
      </figcaption>
      <div className="facility-plan">
        <div className="facility-zone facility-west">
          <b>MACHINE</b>
          <span>機械設備</span>
        </div>
        <div className="facility-zone facility-current">
          <b>ROOM E-01</b>
          <span>現在地</span>
        </div>
        <div className="facility-zone facility-east">
          <b>STRUCTURE</b>
          <span>コンクリート壁</span>
        </div>
        <div className="facility-hall">CORRIDOR / 廊下</div>
        <div className="facility-lower facility-control">
          CONTROL ROOM / 制御室
        </div>
        <div className="facility-lower facility-machine">
          MACHINE ROOM / 機械室
        </div>
        {conduitLayer && (
          <>
            <div className="facility-wires" aria-hidden="true">
              {wires.map((wire) => (
                <div
                  key={`${wire.id}-${trace?.lost === wire.id ? trace.attempt : 0}`}
                  className={`facility-wire${wire.power ? ' is-power' : ''}${(revealRoute && !wire.power) || trace?.visited.includes(wire.id) ? ' is-lit' : ''}${trace?.lost === wire.id ? ' is-lost' : ''}`}
                >
                  {wire.points.slice(1).map((to, index) => {
                    const from = wire.points[index]!;
                    const vertical = from[0] === to[0];
                    return (
                      <i
                        key={index}
                        className={vertical ? 'is-vertical' : 'is-horizontal'}
                        style={{
                          left: `${Math.min(from[0], to[0])}%`,
                          top: `${Math.min(from[1], to[1])}%`,
                          width: vertical
                            ? undefined
                            : `${Math.abs(to[0] - from[0])}%`,
                          height: vertical
                            ? `${Math.abs(to[1] - from[1])}%`
                            : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            {nodes.map((node) => {
              const visited = revealRoute
                ? !['power', 'bar-relay', 'open-end'].includes(node.id)
                : trace?.visited.includes(node.id);
              const label =
                node.id === 'echo-buffer' && returned
                  ? 'ECHO BUFFER RETURN'
                  : node.label;
              const style = {
                left: `${node.x}%`,
                top: `${node.y}%`,
              } satisfies CSSProperties;
              const content = (
                <>
                  <i
                    className={`facility-terminal is-${node.shape}`}
                    aria-hidden="true"
                  />
                  <span className="facility-node-label" aria-hidden="true">
                    {label}
                  </span>
                  {trace?.lost === node.id && (
                    <strong className="facility-node-loss" aria-hidden="true">
                      ×
                    </strong>
                  )}
                </>
              );
              const className = `facility-node node-${node.id}${visited ? ' is-visited' : ''}${trace?.lost === node.id ? ' is-lost' : ''}`;
              return trace ? (
                <button
                  key={node.id}
                  ref={(element) => {
                    if (element) nodeRefs.current[node.id] = element;
                  }}
                  type="button"
                  className={className}
                  style={style}
                  data-trace-node={node.id}
                  aria-label={`${label}端子${visited ? '・追跡済み' : ''}`}
                  aria-description={node.description}
                  aria-describedby={helpId}
                  aria-pressed={Boolean(visited)}
                  aria-disabled={!trace.active || returned}
                  tabIndex={focusNode === node.id ? 0 : -1}
                  onFocus={() => setFocusNode(node.id)}
                  onClick={() => {
                    if (trace.active && !returned) trace.onVisit(node.id);
                  }}
                  onKeyDown={(event) => {
                    if (!trace.active || !event.key.startsWith('Arrow')) return;
                    const next = neighbours[node.id][event.key];
                    event.preventDefault();
                    if (next) nodeRefs.current[next]?.focus();
                  }}
                >
                  {content}
                </button>
              ) : (
                <span
                  key={node.id}
                  className={className}
                  style={style}
                  role="img"
                  aria-label={`${label}端子。${node.description}`}
                >
                  {content}
                </span>
              );
            })}
          </>
        )}
      </div>
      {conduitLayer && (
        <div className="facility-map-key">
          <span>
            <i />
            通信
          </span>
          <span>
            <i className="is-power" />
            電力
          </span>
          <span>○ 環端子 / ┃ 線端子</span>
        </div>
      )}
      {trace && (
        <div className="facility-trace-footer">
          <p id={helpId}>端子を順にタップ / 矢印で移動・Enterで追跡</p>
          <output role="status" className={trace.lost ? 'is-lost' : ''}>
            {returned
              ? 'RETURN / E-01'
              : trace.lost
                ? '× SIGNAL LOST'
                : trace.visited.length
                  ? '● SIGNAL PRESENT'
                  : 'PROBE / INTERCOM'}
          </output>
        </div>
      )}
      {!trace && (
        <p className="map-finding">
          {returned
            ? '通信線はJ-2を通り、E-01内のECHO BUFFERへ戻る。'
            : '西側は機械設備、東側はコンクリート壁。'}
        </p>
      )}
    </figure>
  );
}
