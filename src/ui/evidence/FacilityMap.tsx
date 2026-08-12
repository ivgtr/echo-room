export function FacilityMap({
  compact = false,
  conduitLayer = false,
  revealRoute = true,
}: {
  compact?: boolean;
  conduitLayer?: boolean;
  revealRoute?: boolean;
}) {
  return (
    <figure
      className={`facility-map${compact ? ' is-compact' : ''}`}
      aria-labelledby="facility-map-title"
    >
      <figcaption id="facility-map-title">FACILITY MAP / ROOM E-01</figcaption>
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
          <i aria-hidden="true">
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
          ? 'E-01の左右に部屋はない。通信線は設備壁の中へ続いている。'
          : 'E-01の左右は設備壁だ。通話器から接続した線をたどる。'}
      </p>
    </figure>
  );
}
