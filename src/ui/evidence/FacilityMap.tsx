import { useId } from 'react';

export function FacilityMap({
  compact = false,
  conduitLayer = false,
  revealRoute = false,
}: {
  compact?: boolean;
  conduitLayer?: boolean;
  revealRoute?: boolean;
}) {
  const titleId = useId();
  return (
    <figure
      className={`facility-map${compact ? ' is-compact' : ''}`}
      aria-labelledby={titleId}
    >
      <figcaption id={titleId}>FACILITY MAP / ROOM E-01</figcaption>
      <div className="facility-map-grid">
        <div className="map-zone map-machine-west">
          MACHINE
          <span>機械設備</span>
        </div>
        <div className="map-zone map-room-e01">
          ROOM E-01
          <span>現在地</span>
        </div>
        <div className="map-zone map-concrete-east">
          STRUCTURE
          <span>コンクリート壁</span>
        </div>
        <div className="map-corridor">CORRIDOR / 廊下</div>
        <div className="map-zone map-control">
          CONTROL ROOM
          <span>制御室</span>
        </div>
        <div className="map-zone map-machine-room">
          MACHINE ROOM
          <span>機械室</span>
        </div>
      </div>
      {conduitLayer && (
        <div className="facility-conduit-layer" aria-label="通信の配線図">
          <span>INTERCOM ○</span>
          <i
            role="img"
            aria-label={
              revealRoute
                ? '通信実線、J-2 丸端子、帰還経路確認済み'
                : '未追跡の配線候補：通信実線・J-2 丸端子、電力破線・J-3 線端子'
            }
          >
            {revealRoute ? '━━━━ ○ J-2 ━━━━' : '━━━━ ○ J-2  ┅┅┅  ┃ J-3'}
          </i>
          <strong>
            {revealRoute ? 'ECHO BUFFER RETURN ○' : 'RETURN ○ / E-02 ┃'}
          </strong>
          <small>実線：通信 / 破線：電力</small>
        </div>
      )}
      <p className="map-finding">
        {revealRoute
          ? '通信線はJ-2を通り、ECHO BUFFER RETURNへ戻る。'
          : '西側は機械設備、東側はコンクリート壁。インターホンから線をたどる。'}
      </p>
    </figure>
  );
}
