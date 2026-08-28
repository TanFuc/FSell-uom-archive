# Production Fix Prompt for Qwen (repo-specific, code patch mode)

Bạn đang làm việc trực tiếp trong repo FSell-uom-archive. Nhiệm vụ của bạn là sửa code trong repo theo hướng production-safe, tối thiểu thay đổi, giữ nguyên kiến trúc hiện có, và ưu tiên giải quyết các rủi ro thực tế trước khi deploy.

## Mục tiêu chính
Hãy patch repo để đảm bảo các vấn đề sau được xử lý đúng logic:
- DB có thể chạy với PostgreSQL hiện tại và có tùy chọn MariaDB mà không phá app hiện tại
- Redis có thể chuyển qua lại giữa local Redis và Upstash mà không crash
- Upload ảnh và hiển thị ảnh phải dùng subdomain riêng, đồng bộ FE/BE
- Env FE/BE phải thống nhất và production-safe
- SEO FE phải review kỹ và sửa các lỗi canonical/site URL/locale/sitemap
- Runtime phải tối ưu để tránh tạo nhiều PID / worker / process không cần thiết
- Không làm rewrite lớn, không phá flow hiện tại

## Repo cần sửa
- backend/
- frontend/
- scripts/ nếu cần cho runtime hoặc deploy
- ecosystem.config.js nếu có liên quan
- Docker / deployment config nếu cần low-footprint runtime

## Các file target thật cần ưu tiên
Dựa trên repo hiện tại, hãy ưu tiên kiểm tra và sửa các file sau (không chỉ đọc sơ qua):

### Backend
- backend/src/app.module.ts
- backend/src/redis/redis.service.ts
- backend/src/upload/upload.service.ts
- backend/prisma/schema.prisma
- backend/.env
- backend/.env.example
- backend/package.json

### Frontend
- frontend/next.config.js
- frontend/lib/utils.ts
- frontend/components/FileUpload.tsx
- frontend/lib/api-client.ts
- frontend/lib/api.ts
- frontend/lib/seo.ts
- frontend/lib/sitemap-data.ts
- frontend/app/robots.ts
- frontend/app/sitemap.xml/route.ts
- frontend/app/[locale]/page.tsx
- frontend/app/[locale]/shop/[slug]/page.tsx
- frontend/app/[locale]/journal/page.tsx
- frontend/app/[locale]/journal/[slug]/page.tsx
- frontend/.env
- frontend/.env.example

## Yêu cầu kỹ thuật bắt buộc

### 1) Database compatibility
- Hãy review ngay Prisma schema hiện tại đang hardcode PostgreSQL.
- Thêm support cho MariaDB như một tùy chọn bằng cách không phá PostgreSQL đang chạy.
- Nếu Prisma schema phải khác theo môi trường, hãy dùng giải pháp tối thiểu, không rewrite toàn bộ app.
- Nếu cần, tạo biến env như `DB_CLIENT`, `DATABASE_URL`, `DATABASE_PROVIDER`, hoặc `DB_DRIVER` và chọn provider tương ứng.
- Không ép mọi môi trường đều dùng MariaDB hoặc PostgreSQL.
- Mục tiêu là “chia sẻ config, không chia sẻ logic”, có thể chuyển qua lại bằng env.
- Nếu database URL dùng MySQL/MariaDB, Prisma phải dùng provider phù hợp; nếu dùng PostgreSQL, giữ nguyên.

### 2) Redis compatibility
- Review logic `backend/src/redis/redis.service.ts` và sửa để hỗ trợ cả local Redis lẫn Upstash bằng config theo env.
- Logic nên là:
  - nếu `UPSTASH_REDIS_URL` + `UPSTASH_REDIS_TOKEN` có giá trị, dùng Upstash
  - nếu không, fallback về `REDIS_URL` / `REDIS_PASSWORD`
  - nếu cả hai không có, fallback an toàn hoặc log warning và không crash app
- Bảo đảm TLS đúng chuẩn cho Upstash, và không parse sai token/URL.
- Không để hết service chết khi biến redis không có sẵn.

### 3) Upload ảnh và subdomain
- Review `backend/src/upload/upload.service.ts` và frontend upload flow.
- Thêm/chuẩn hóa env cho ảnh public URL: `NEXT_PUBLIC_IMAGE_BASE_URL`, `IMAGE_BASE_URL`, `R2_PUBLIC_BASE_URL`, `NEXT_PUBLIC_R2_PUBLIC_URL`.
- FE không nên lấy ảnh từ API base URL khi đã có subdomain ảnh riêng.
- Logic cần dùng base image domain riêng để render hình ảnh, render preview, và load từ CDN/public bucket.
- Nếu upload lên R2, FE phải dùng `R2_PUBLIC_URL` / image base domain tương ứng, không dùng `NEXT_PUBLIC_API_URL` như base ảnh.
- Cần normalize URL, strip trailing slash, handle `https://.../bucket/` vs `https://...` đúng cách.

### 4) Env FE/BE đồng bộ
- Hãy unify các biến sau trong repo:
  - `NEXT_PUBLIC_API_BASE_URL` và `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_IMAGE_BASE_URL` và `NEXT_PUBLIC_R2_PUBLIC_URL`
  - `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` / `APP_BASE_URL` / `BASE_URL`
  - `REVALIDATE_SECRET` / `SITEMAP_REVALIDATE_SECRET`
- Không để FE build runtime dùng localhost trong production.
- Không để conflict giữa API URL và image URL.
- Sửa `.env.example` và `.env` sao cho production-safe nhưng vẫn chạy local được nếu cần.

### 5) SEO FE – sửa thật
- Review ngay `frontend/next.config.js`, `frontend/lib/seo.ts`, `frontend/lib/sitemap-data.ts`, `frontend/app/robots.ts`, `frontend/app/sitemap.xml/route.ts`.
- Hãy đảm bảo canonical URL lấy từ env / domain chuẩn, không hardcode `uomarchive.com` hoặc `www.uomarchive.com` nếu site chạy với domain khác.
- Kiểm tra redirect `/` → `/vi` và `/shop/:slug` → `/vi/shop/:slug*` có đúng không, và canonical URL có nhất quán không.
- fix các path locale và sitemap để không có duplicate/invalid URL.
- Nếu có revalidate route và ping SEO, ensure `secret` và domain đúng.
- mục tiêu: public site SEO sạch cho production.

### 6) Runtime / low-PID / production-safe
- Review config backend/frontend để tránh tạo nhiều PID/worker không cần thiết.
- Đảm bảo các biến dưới đây được dùng đúng cách nếu cần trên prod:
  - `UV_THREADPOOL_SIZE=1`
  - `NODE_OPTIONS=--v8-pool-size=1`
  - `NEXT_LOW_RESOURCE_MODE=true`
  - `RUNTIME_GOMAXPROCS=1`
  - `APP_INSTANCE_LOCK_PATH=.bizmall-api.lock`
- Nếu có `ecosystem.config.js` hoặc server scripts, hãy chỉnh để không spawn quá nhiều process.
- Không để application chạy multi-instance mà không cần thiết.

### 7) Minimal change principle
- Không rewrite toàn bộ app.
- Giữ nguyên patterns hiện có, chỉ patch những phần cần fix.
- Đừng tạo abstraction quá lớn nếu chưa cần.
- Nếu có phải đổi tên biến env, hãy làm theo cách backward-compatible: ưu tiên support cũ + mới trong cùng lúc.
- Kết quả trả về phải là patch thực tế, không chỉ đề xuất.

## Output yêu cầu từ bạn
Sau khi sửa code, hãy trả về theo format sau:

1. What changed
2. Files modified
3. Why this fixes production issues
4. Any assumptions / caveats
5. Validation commands to run
6. Remaining risk / recommended next step

## Constraints
- Không giả định secret đã có; chỉ kiểm tra cấu trúc và cách code dùng env.
- Nếu cần, có thể bổ sung env fallback để giữ backward compatibility.
- Không hỏi thêm thông tin nếu có thể giải quyết bằng việc đọc repo hiện tại.
- Hãy làm patch dựa trên repo thật, không chỉ theo snippet chung chung.
- Chú ý dữ liệu thực trong repo: `backend/src/redis/redis.service.ts` hiện đã có Upstash support, `frontend/lib/utils.ts` đang có logic chuyển đổi R2, `frontend/components/FileUpload.tsx` đang dùng `NEXT_PUBLIC_API_URL`, `backend/prisma/schema.prisma` đang hardcode Postgres, và `frontend/next.config.js` đang dùng hardcoded canonical domain. Hãy sửa các điểm này theo hướng production-safe và minimal patch.

## Most important implementation rule
Hãy tiến hành đúng kiểu “fix trong repo”, không chỉ review. Không trả lời kiểu “nên làm như thế”. Hãy làm patch kỹ lưỡng trên code thật, giữ tối thiểu thay đổi, và ưu tiên thứ tự sau:
1. env standardization
2. Redis compatibility
3. image/public URL consistency
4. Prisma DB compatibility
5. SEO canonical + locale + sitemap
6. low-resource runtime config
7. final validation

## Final instruction
Hãy đọc repo hiện tại, phát hiện các vấn đề thật, sửa chúng bằng patch tối thiểu nhưng production-safe, đồng thời nêu rõ những điểm còn cần xác nhận nếu có. Không tạo quá nhiều thay đổi ngoài phạm vi cần thiết.
