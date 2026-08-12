export function StaffAccessCard() {
  return (
    <div className="staff-access-card" aria-label="施設E-01の職員証">
      <header>
        <span>UNDERGROUND RESEARCH FACILITY</span>
        <strong>STAFF ACCESS</strong>
      </header>
      <div className="staff-card-body">
        <img
          className="staff-card-portrait"
          src={`${import.meta.env.BASE_URL}assets/images/items/gfx-item-003__approved__badge-crop__512x640.webp`}
          alt="E-01職員証に登録された男性職員の写真"
        />
        <dl>
          <div>
            <dt>FACILITY</dt>
            <dd>E-01</dd>
          </div>
          <div>
            <dt>AUTHORIZATION</dt>
            <dd>SECURITY TERMINAL</dd>
          </div>
        </dl>
      </div>
      <p>PERSONNEL DATA / ENCRYPTED</p>
    </div>
  );
}
