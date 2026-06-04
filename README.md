# EduSmart v1.1 — Hệ thống Quản lý Học sinh tích hợp AI Chatbot Widget

> Dự án tiểu luận tốt nghiệp — Khoa Công nghệ Thông tin
> Phạm vi: 1 sinh viên / 3 tháng (12 tuần)

EduSmart là nền tảng web quản lý học sinh phục vụ 5 nhóm người dùng: **Admin / GVCN / GVBM / Phụ huynh / Học sinh**, tích hợp **AI Chatbot Widget** (floating bubble) cho cả 5 persona. GVCN = giáo viên `role=subject` được gán `classes.homeroom_teacher_id` (xem [PERMISSIONS.md](docs/PERMISSIONS.md), [FLOWS.md](docs/FLOWS.md)).

---

## Tính năng chính

- **Phân quyền 5 vai trò** kết hợp RBAC + Assignment-Based (bảng `teacher_assignments`)
- **Quản lý hồ sơ học sinh, điểm số, học bạ điện tử** (xếp loại Giỏi/Khá/TB/Yếu theo công thức SRS)
- **Phân công GVBM** linh hoạt theo môn × lớp × năm học
- **Lịch học, điểm danh** + cảnh báo email khi vắng không phép
- **AI Chatbot Widget**: Floating bubble, popup 320×480, Quick Chips gợi ý, kết quả render ngay trong bubble (bảng điểm + nút Tải PDF inline)
- **AI module-first**: Rules NLU → Tool dispatcher → DB tools; LLM chỉ `general_chat` / `ai_advice` (xem [AI_ARCHITECTURE.md](docs/AI_ARCHITECTURE.md))
- **Xuất PDF** học bạ, bảng điểm, báo cáo lớp
- **Thông báo + email** Nodemailer SMTP

---

## Tech Stack

| Tầng | Công nghệ |
| --- | --- |
| Frontend | React 18 + Vite + Tailwind (teal/slate design system) + Zustand + React Router + lucide-react |
| Backend | Node.js + Express + Sequelize ORM |
| Database | PostgreSQL (Supabase free tier) |
| AI | Claude Haiku / Gemini Flash (cấu hình qua `.env`) |
| PDF | pdfkit / Puppeteer |
| Email | Nodemailer + SMTP Gmail |
| Auth | JWT (access 1h + refresh 7 ngày) + bcrypt |

---

## Cài đặt nhanh (≤10 bước)

### 1. Clone & cài dependencies
```bash
git clone <repo>
cd edusmart
cd backend && npm install
cd ../frontend && npm install
```

### 2. Cấu hình biến môi trường
```bash
# Backend
cd backend
cp .env.example .env
# Mở .env và điền: DATABASE_URL, JWT_SECRET, (tuỳ chọn) ANTHROPIC_API_KEY hoặc GEMINI_API_KEY, SMTP_*
# Chi tiết AI: docs/AI_SETUP.md · Module: docs/AI_CHAT_MODULE.md

# Frontend
cd ../frontend
cp .env.example .env
```

### 3. Tạo schema + seed dữ liệu mẫu
```bash
cd backend
npm run db:migrate
npm run db:seed
```
> Seed gồm: 3 lớp (10A1, 10A2, 11A1), 90 học sinh, điểm 2 học kỳ, tài khoản mẫu cho 5 vai trò.

### 4. Chạy backend
```bash
cd backend
npm run dev   # http://localhost:3001
```

### 5. Chạy frontend
```bash
cd frontend
npm run dev   # http://localhost:5173
```

### 6. Đăng nhập tài khoản mẫu
Mật khẩu chung sau seed: **`edusmart123`** — chi tiết: [ACCOUNTS.md](docs/ACCOUNTS.md)

| Vai trò | Email |
| --- | --- |
| Admin | `admin@edusmart.local` |
| GVCN 10A1 | `gvcn.10a1@edusmart.local` |
| GVBM Toán | `gv.toan@edusmart.local` |
| PH | `ph.10a1.01@edusmart.local` |
| HS | `hs.10a1.01@edusmart.local` |

---

## Cấu trúc thư mục

```
edusmart/
├── backend/         # Express + Sequelize + AI services
│   ├── src/
│   │   ├── config/        # database.js, env.js
│   │   ├── models/        # 12 bảng
│   │   ├── controllers/   # auth, user, student, score, assignment, ...
│   │   ├── services/
│   │   │   ├── ai/        # intent, context, router, advice
│   │   │   ├── pdf.service.js
│   │   │   └── email.service.js
│   │   ├── middleware/    # auth, role, assignment, rateLimit
│   │   ├── routes/
│   │   └── utils/         # gradeCalc.js, responseHelper.js
│   ├── database/          # migrations, seeders
│   └── app.js
├── frontend/        # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/         # 17 màn hình theo SRS chương 7
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── chat/      # Floating Widget — MỚI v1.1
│   │   │   ├── scores/
│   │   │   └── ui/
│   │   ├── hooks/         # useAuth, useChat, useScores
│   │   ├── api/           # axios + auth/score/chat
│   │   └── store/         # authStore, chatStore (Zustand)
│   └── index.html
└── docs/            # SRS, FLOWS.md, UI_GUIDE.md, ACCOUNTS.md
```

---

## Mô hình AI Widget

```
User message
        │
        ▼
┌────────────────┐  Rules NLU (intent.service / staff-intent)
│ intent rules   │   → intent + slots (subject, semester, …)
└────────────────┘
        │
        ▼
┌────────────────┐  Context (capabilities, class_id, student_id)
│ context inject │
└────────────────┘
        │
        ▼
┌────────────────┐  Tool dispatcher (DB, 0 token LLM)
│ router.service │   switch(intent) gọi đúng module
└────────────────┘
        │
        ▼
   ┌────────────┐
   │ Kết quả    │  - scores  → bảng điểm rút gọn + PDF button
   │ render     │  - schedule, attendance, extracurricular
   │ trong      │  - ai_advice → Lớp 4 (LLM ~380 token)
   │ bubble     │  - unknown   → fallback + 5 gợi ý
   └────────────┘
```

---

## Roadmap 12 tuần (theo SRS chương 6)

| Tuần | Nội dung |
| --- | --- |
| T1–T2 | CSDL, ERD, migration, `teacher_assignments`, seed |
| T3–T4 | Backend Auth, CRUD học sinh, điểm số, phân công API |
| T5–T6 | Lịch học, điểm danh, ngoại khóa, email, thông báo |
| T7–T8 | Frontend Dashboard 5 vai trò, bảng điểm, học bạ, responsive |
| T9 | AI Widget: FAB icon, popup, 7 intent, Function Router |
| T10 | AI Advice + Quick Chips + Fallback + PDF button inline |
| T11 | PDF export học bạ + bảng điểm + báo cáo lớp |
| T12 | Testing, fix bug, viết báo cáo, demo |

---

## Phân quyền theo vai trò

| Chức năng | Admin | GVCN | GVBM | PH | HS |
| --- | :---: | :---: | :---: | :---: | :---: |
| Quản lý tài khoản & phân công | ✅ | — | — | — | — |
| Lập thời khóa biểu | ✅ | — | — | Xem | Xem |
| Nhập / sửa điểm | Tất cả | Lớp mình* | Môn + lớp được phân công | — | — |
| Điểm danh | ✅ | Lớp CN | — | Xem con | Xem mình |
| AI Chatbot Widget | ✅ | ✅ | ✅ | ✅ | ✅ |

(*) GVCN có thể nhập điểm cho lớp chủ nhiệm nếu đồng thời được phân công dạy môn đó.

---

## Tài liệu liên quan

- [`docs/EduSmart_SRS_v1.1.docx`](./docs/EduSmart_SRS_v1.1.docx) — Đặc tả yêu cầu phần mềm v1.1
- [`docs/API_Collection.json`](./docs/API_Collection.json) — Postman collection
- [`docs/ERD.png`](./docs/ERD.png) — Sơ đồ ERD

---

## Giấy phép

MIT — Tài liệu nội bộ, chỉ dùng cho mục đích học thuật.
