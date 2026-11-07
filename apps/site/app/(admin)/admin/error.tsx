"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ maxWidth: 520, margin: "10vh auto", padding: 24, background: "#fff", border: "1px solid #e3e3de", borderRadius: 12, font: "15px/1.5 system-ui, sans-serif", color: "#17171a" }}>
      <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>Страница не открылась</h1>
      <p style={{ margin: "0 0 16px" }}>Что-то пошло не так. Нажмите «Обновить». Если не помогает — вернитесь на главную админки.</p>
      {error.digest && <p style={{ color: "#6b6b70", fontSize: 13 }}>Код ошибки: {error.digest}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={() => reset()} style={{ flex: 1, padding: "12px 16px", border: 0, borderRadius: 10, background: "#ffb700", color: "#1a1400", font: "600 15px system-ui", cursor: "pointer", textAlign: "center" }}>Обновить</button>
        <a href="/admin/login" style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "1px solid #e3e3de", color: "#17171a", textDecoration: "none", textAlign: "center", font: "600 15px system-ui" }}>Войти заново</a>
      </div>
    </div>
  );
}
