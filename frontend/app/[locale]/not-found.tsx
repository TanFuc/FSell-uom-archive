import Link from 'next/link'

export default function LocaleNotFound() {
  return (
    <main className="grid min-h-[calc(100svh-5rem)] place-items-center bg-background px-5 py-16 text-foreground">
      <section className="w-full max-w-3xl">
        <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.32em] text-muted-foreground sm:text-xs">
          ƯƠM. Archive — 404
        </p>
        <h1 className="font-playfair text-[clamp(3rem,10vw,7rem)] font-normal leading-[0.92] tracking-[-0.04em]">
          Không tìm thấy trang
        </h1>
        <p className="mt-8 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
          Nội dung này không tồn tại hoặc đã được chuyển sang địa chỉ khác.
        </p>
        <Link
          href="/vi"
          className="mt-10 inline-flex min-h-12 items-center justify-center border border-foreground px-7 text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-foreground hover:text-background"
        >
          Về trang chủ
        </Link>
      </section>
    </main>
  )
}
