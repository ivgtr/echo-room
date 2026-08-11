export function StaffAccessCard() {
  return (
    <div
      className="staff-access-card"
      aria-label="施設E-01 職員用アクセスカード"
    >
      <header>
        <span>UNDERGROUND RESEARCH FACILITY</span>
        <strong>STAFF ACCESS</strong>
      </header>
      <div className="staff-card-body">
        <div className="staff-card-portrait" aria-hidden="true">
          ID
        </div>
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
