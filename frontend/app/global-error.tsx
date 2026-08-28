'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{
          margin: 0,
          background: '#fff',
          color: '#000',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <main
          style={{
            boxSizing: 'border-box',
            display: 'grid',
            minHeight: '100vh',
            placeItems: 'center',
            padding: '32px 20px',
          }}
        >
          <section style={{ width: 'min(680px, 100%)' }}>
            <p style={{ margin: '0 0 24px', fontSize: 12, letterSpacing: '0.28em' }}>
              ƯƠM. ARCHIVE — ERROR
            </p>
            <h1
              style={{
                margin: 0,
                fontFamily: 'Georgia, Times New Roman, serif',
                fontSize: 'clamp(46px, 9vw, 104px)',
                fontWeight: 400,
                letterSpacing: '-0.04em',
                lineHeight: 0.95,
              }}
            >
              Có lỗi xảy ra
            </h1>
            <p style={{ margin: '28px 0 36px', maxWidth: 520, lineHeight: 1.8, opacity: 0.62 }}>
              Trang chưa thể hiển thị vào lúc này. Hãy thử tải lại hoặc quay về trang chủ.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  border: '1px solid #000',
                  background: '#000',
                  padding: '14px 22px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  letterSpacing: '0.2em',
                }}
              >
                THỬ LẠI
              </button>
              <a
                href="/vi"
                style={{
                  border: '1px solid #000',
                  padding: '14px 22px',
                  color: '#000',
                  fontSize: 12,
                  letterSpacing: '0.2em',
                  textDecoration: 'none',
                }}
              >
                VỀ TRANG CHỦ
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
