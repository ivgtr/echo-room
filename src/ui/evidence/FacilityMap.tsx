export function FacilityMap({ compact = false }: { compact?: boolean }) {
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
      <p className="map-finding">
        E-01の左右は機械設備とコンクリート壁。隣室は存在しない。
      </p>
    </figure>
  );
}
