export default function AdminNotFound() {
  return (
    <div style={{ maxWidth: 520, margin: "10vh auto", padding: 24, background: "#fff", border: "1px solid #e3e3de", borderRadius: 12, font: "15px/1.5 system-ui, sans-serif", color: "#17171a" }}>
      <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>Такой страницы нет</h1>
      <a href="/admin" style={{ display: "block", padding: "12px 16px", borderRadius: 10, background: "#ffb700", color: "#1a1400", textDecoration: "none", textAlign: "center", font: "600 15px system-ui" }}>В админку</a>
    </div>
  );
}
