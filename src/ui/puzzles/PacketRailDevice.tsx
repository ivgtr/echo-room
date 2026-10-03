import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { packetTexts } from '../../game/puzzles/storyPuzzles';

type Props = {
  active: boolean;
  failures: number;
  submit: (answer: string[]) => void;
};

const fragments = {
  c: {
    label: 'C',
    left: 'header',
    right: 'triangle',
    kind: 'TX HEADER',
    text: 'PACKET 04',
    heights: [50, 50, 30, 30, 35],
  },
  d: {
    label: 'D',
    left: 'triangle',
    right: 'diamond',
    kind: 'TEXT / OPEN',
    text: packetTexts[3].slice(0, 4),
    heights: [35, 35, 75, 25, 65],
  },
  a: {
    label: 'A',
    left: 'diamond',
    right: 'voice',
    kind: 'TEXT + VOICEPRINT',
    text: packetTexts[3].slice(4, 10),
    heights: [65, 65, 25, 70, 50],
  },
  b: {
    label: 'B',
    left: 'voice',
    right: 'check',
    kind: 'TEXT / CHECK',
    text: packetTexts[3].slice(10),
    heights: [50, 50, 25, 50, 50],
  },
} as const;
type FragmentId = keyof typeof fragments;
type MovableFragmentId = Exclude<FragmentId, 'c'>;
const trayOrder: MovableFragmentId[] = ['a', 'b', 'd'];
const edgeDescriptions = {
  header: '縦線',
  triangle: '三角',
  diamond: 'ひし形',
  voice: '丸',
  check: '塗りつぶした四角',
} as const;

function describeFragmentEdges(id: FragmentId) {
  const fragment = fragments[id];
  return `左端は${edgeDescriptions[fragment.left]}、右端は${edgeDescriptions[fragment.right]}`;
}

function isMovableFragment(value: string): value is MovableFragmentId {
  return trayOrder.some((id) => id === value);
}

export function PacketRailDevice({ active, submit }: Props) {
  const [rail, setRail] = useState<(MovableFragmentId | null)[]>([
    null,
    null,
    null,
  ]);
  const [selected, setSelected] = useState<MovableFragmentId | null>(null);
  const [accepted, setAccepted] = useState(false);
  const submittedSignatureRef = useRef('');
  const acceptedRef = useRef(false);
  const deviceRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLButtonElement>(null);
  const placed: (FragmentId | null)[] = ['c', ...rail];
  const seams = placed.slice(0, -1).map((id, index) => {
    const next = placed[index + 1];
    return !id || !next
      ? 'open'
      : fragments[id].right === fragments[next].left
        ? 'connected'
        : 'broken';
  });
  const restored = seams.every((seam) => seam === 'connected');
  const complete = rail.every((id) => id !== null);
  const signature = complete ? placed.join('|') : '';
  const decoded = placed.map((id, index) =>
    Boolean(
      id &&
      (index === 0 ||
        seams[index - 1] === 'connected' ||
        seams[index] === 'connected'),
    ),
  );
  const earned = new Set(
    placed.filter((id, index): id is FragmentId =>
      Boolean(id !== null && decoded[index]),
    ),
  );
  const broken = seams.includes('broken');

  useEffect(() => {
    if (
      !active ||
      !complete ||
      restored ||
      document.hidden ||
      submittedSignatureRef.current === signature
    )
      return;
    submittedSignatureRef.current = signature;
    submit(signature.split('|'));
  }, [active, complete, restored, signature, submit]);

  useEffect(() => {
    if (
      active &&
      restored &&
      (document.activeElement === document.body ||
        deviceRef.current?.contains(document.activeElement))
    ) {
      confirmationRef.current?.focus();
    }
  }, [active, restored]);

  function placeFragment(slot: number, id: MovableFragmentId) {
    if (!active || restored || document.hidden || slot < 0 || slot > 2) return;
    setRail((current) =>
      current.map((value, index) =>
        index === slot ? id : value === id ? null : value,
      ),
    );
    setSelected(null);
  }

  return (
    <div
      className={`packet-instrument${restored ? ' is-restored' : ''}`}
      ref={deviceRef}
      data-active={active}
    >
      <header className="packet-instrument-heading">
        <span>
          FRAME RECOVERY <small>TEXT / VOICEPRINT</small>
        </span>
        <strong>
          {restored
            ? 'FRAME RESTORED'
            : broken
              ? 'SIGNAL BREAK'
              : 'DECODER / STANDBY'}
        </strong>
      </header>
      <div className="packet-data-rail" aria-label="壊れたデータの並べ替え">
        {placed.map((id, slot) => {
          const fragment = id ? fragments[id] : null;
          const fixed = slot === 0;
          return (
            <div
              className={`packet-rail-slot${fixed ? ' is-fixed' : ''}${decoded[slot] ? ' is-decoded' : ''}`}
              key={slot}
            >
              <small>{fixed ? 'HEADER / FIXED' : `RAIL ${slot + 1}`}</small>
              <button
                type="button"
                data-frame-slot={fixed ? undefined : slot - 1}
                disabled={fixed || !active || restored}
                aria-label={
                  fixed
                    ? '固定されたHEADER断片C'
                    : selected
                      ? `レール${slot + 1}へ断片${selected.toUpperCase()}を置く`
                      : fragment
                        ? `レール${slot + 1}の断片${fragment.label}を持ち上げる`
                        : `レール${slot + 1}へ置く`
                }
                aria-description={id ? describeFragmentEdges(id) : '未接続'}
                onClick={() => {
                  if (!active || restored || fixed || document.hidden) return;
                  if (selected) placeFragment(slot - 1, selected);
                  else if (id && isMovableFragment(id)) {
                    setSelected(id);
                    setRail((current) =>
                      current.map((value, index) =>
                        index === slot - 1 ? null : value,
                      ),
                    );
                  }
                }}
                onDragOver={(event) => {
                  if (!fixed && active && !restored) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const value = event.dataTransfer.getData('text/plain');
                  if (!fixed && isMovableFragment(value))
                    placeFragment(slot - 1, value);
                }}
              >
                {id ? (
                  <FragmentGraphic id={id} decoded={decoded[slot] ?? false} />
                ) : (
                  <span className="packet-empty-slot" aria-hidden="true">
                    <i />
                    CONTACT OPEN
                  </span>
                )}
              </button>
              {slot < 3 && (
                <span
                  className={`packet-seam is-${seams[slot]}`}
                  style={
                    {
                      '--seam-height': `${fragment ? fragment.heights[4] : 50}%`,
                    } as CSSProperties
                  }
                  aria-label={`継ぎ目${slot + 1}: ${seams[slot] === 'connected' ? '接続・復号' : seams[slot] === 'broken' ? '断線' : '未接続'}`}
                >
                  <i />
                  <b>
                    {seams[slot] === 'connected'
                      ? '●'
                      : seams[slot] === 'broken'
                        ? '×'
                        : '·'}
                  </b>
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div
        className={`packet-decoder-line${restored ? ' is-complete' : ''}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {restored ? (
          <p>PACKET 04 / {packetTexts[3]}</p>
        ) : (
          <>
            <small>PACKET 04 / DECODING</small>
            <p>
              {(['d', 'a', 'b'] as const).map((id) => (
                <span
                  className={earned.has(id) ? 'is-readable' : 'is-scrambled'}
                  key={id}
                >
                  {earned.has(id) ? (
                    fragments[id].text
                  ) : (
                    <>
                      <span aria-hidden="true">░░░</span>
                      <span className="packet-sr-only">未復号</span>
                    </>
                  )}
                </span>
              ))}
            </p>
          </>
        )}
      </div>
      {!restored ? (
        <div className="packet-fragment-tray" aria-label="壊れたデータ片">
          {trayOrder.map((id) => (
            <button
              type="button"
              key={id}
              draggable={active && !rail.includes(id)}
              disabled={!active || rail.includes(id)}
              aria-pressed={selected === id}
              aria-label={`断片${fragments[id].label}を持つ`}
              aria-description={describeFragmentEdges(id)}
              onClick={() => {
                if (active && !document.hidden)
                  setSelected(selected === id ? null : id);
              }}
              onDragStart={(event) => {
                setSelected(id);
                event.dataTransfer.setData('text/plain', id);
              }}
            >
              <FragmentGraphic id={id} decoded={false} />
            </button>
          ))}
          <button
            type="button"
            className="packet-eject"
            aria-label="EJECT / 取り出す"
            disabled={!active}
            onClick={() => {
              if (!active || document.hidden) return;
              setRail([null, null, null]);
              setSelected(null);
            }}
          >
            <i aria-hidden="true" />
            EJECT<span>取り出す</span>
          </button>
        </div>
      ) : (
        <div className="packet-decoded-archive">
          <div>
            {packetTexts.slice(0, 3).map((text, index) => (
              <p key={text}>
                PACKET 0{index + 1} / {text}
              </p>
            ))}
          </div>
          <button
            type="button"
            className="packet-confirm"
            ref={confirmationRef}
            disabled={!active || accepted}
            onClick={() => {
              if (!active || document.hidden || acceptedRef.current) return;
              acceptedRef.current = true;
              setAccepted(true);
              submit(['c', 'd', 'a', 'b']);
            }}
          >
            ACCEPT FRAME / 復元内容を確認する
          </button>
        </div>
      )}
      <p className="packet-rail-status" role="status">
        {restored
          ? 'CRC OK / 全断片固定'
          : selected
            ? `断片${selected.toUpperCase()} / 接続先を選択`
            : seams
                .map(
                  (seam, index) =>
                    `${index + 1}:${seam === 'connected' ? '接続' : seam === 'broken' ? '断線' : '開放'}`,
                )
                .join('　')}
      </p>
    </div>
  );
}

function FragmentGraphic({
  id,
  decoded,
}: {
  id: FragmentId;
  decoded: boolean;
}) {
  const fragment = fragments[id];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (typeof CanvasRenderingContext2D === 'undefined') return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, 240, 100);
    context.strokeStyle = decoded ? '#91eee0' : '#718c87';
    context.lineWidth = decoded ? 3 : 2;
    context.setLineDash(decoded ? [] : [5, 3]);
    context.beginPath();
    fragment.heights.forEach((height, index) => {
      if (index === 0) context.moveTo(0, height);
      else context.lineTo(index * 60, height);
    });
    context.stroke();
  }, [decoded, fragment]);
  return (
    <span
      className={`packet-fragment${decoded ? ' is-decoded' : ''}`}
      data-fragment-id={id}
    >
      <span className="packet-fragment-title">
        <b>{fragment.label}</b>
        <small>{fragment.kind}</small>
      </span>
      <span className="packet-fragment-signal" aria-hidden="true">
        <canvas ref={canvasRef} width={240} height={100} />
        <i
          className={`packet-edge edge-${fragment.left}`}
          style={{ top: `${fragment.heights[0]}%` }}
        />
        <i
          className={`packet-edge edge-${fragment.right}`}
          style={{ top: `${fragment.heights[4]}%` }}
        />
      </span>
      <span
        className={`packet-fragment-content${decoded ? '' : ' is-scrambled'}`}
      >
        {decoded ? fragment.text : '▒░▒ ░▒'}
      </span>
      <small className="packet-fragment-check">
        {decoded ? (id === 'b' ? 'CRC OK' : 'DECODED') : 'CRC / —'}
      </small>
    </span>
  );
}
