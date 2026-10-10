export function AuthCard({ title, sub, flash, children }: { title: string; sub?: string; flash?: { e?: string; ok?: string }; children?: React.ReactNode }) {
  return (
    <div className="au">
      <div className="au-card">
        <p className="au-brand"><b>Car City</b> админка</p>
        <h1>{title}</h1>
        {sub && <p className="au-sub">{sub}</p>}
        {flash?.e && <p className="ad-msg ad-err" role="alert">{flash.e}</p>}
        {flash?.ok && <p className="ad-msg ad-ok" role="status">{flash.ok}</p>}
        {children}
      </div>
    </div>
  );
}
