# EDUSMART NEXT-GEN — Hệ thống Quản lý Thông tin & Học tập Thế hệ Mới

**Tài liệu Định hình Chức năng và Kiến trúc Hệ thống (Global EdTech SaaS Standard)**

> Phiên bản: 2.0 — Thay thế hoàn toàn SRS cũ
> Chuẩn tham chiếu: PowerSchool, Infinite Campus, Canvas LMS, Ellucian Banner
> Triết lý: Dữ liệu tập trung — Quy trình tự động hóa — Chủ động hỗ trợ người học

---

## Mục lục

1. [Kiến trúc tổng thể & Tech Stack](#i-kiến-trúc-tổng-thể--tech-stack-tối-ưu-cấu-hình)
2. [Cơ sở dữ liệu chuẩn SaaS (24 bảng)](#ii-đồng-bộ-cơ-sở-dữ-liệu-chuẩn-saas-24-bảng-đa-chiều)
3. [Phân hệ chức năng & Luồng nghiệp vụ](#iii-tái-thiết-kế-các-phân-hệ-chức-năng--luồng-nghiệp-vụ)
4. [Đặc tả giao diện hiện đại](#iv-đặc-tả-giao-diện-hiện-đại-component-driven-uiux-spec)
5. [Kiến trúc Trợ lý AI](#v-kiến-trúc-trợ-lý-ai-điều-phối-thông-minh-orchestrator-framework)
6. [Phân quyền & Vai trò](#vi-phân-quyền--vai-trò)
7. [Tài khoản demo](#vii-tài-khoản-demo)
8. [Cài đặt & Chạy dự án](#viii-cài đặt--chạy-dự-án)
9. [Cấu trúc thư mục](#ix-cấu-trúc-thư-mục)
10. [Env variables](#x-env-variables)
11. [Đặc tả UI chi tiết](#xi-đặc-tả-ui-chi-tiết)

---

## I. Kiến trúc tổng thể & Tech Stack tối ưu cấu hình

Hệ thống được xây dựng theo mô hình **SaaS Multi-Tenant Ready**, tách biệt thành các dịch vụ độc lập nhưng đồng bộ thời gian thực qua WebSockets và Hàng đợi Thông báo.

### 1.1. Sơ đồ phân bổ tài nguyên phần cứng (Giới hạn 70% hiệu năng)

Với giới hạn **11.2GB RAM** và **5.6GB VRAM** khả dụng (MSI Bravo 15 C7V):

| Dịch vụ | Công nghệ | RAM | VRAM | Ghi chú |
|---------|-----------|-----|------|---------|
| **AI Local** | Ollama + Qwen2.5-3B-Instruct (Q4_K_M) | ~350MB | ~2.2GB | Xử lý tiếng Việt xuất sắc, chạy mượt RTX 4060 |
| **Backend Core** | Node.js + Express + Sequelize | ~800MB | — | API server + ORM |
| **Database** | PostgreSQL (dev: SQLite) | ~700MB | — | Connection pool max 10 |
| **Frontend** | React 18 + Vite | ~1.2GB | — | Dev server + HMR |
| **Tổng** | | **~3.5GB** | **~2.2GB** | An toàn trong ngưỡng 11.2GB |

### 1.2. Mô hình phân phối Trợ lý AI (Hybrid Orchestration Engine)

```
┌─────────────────────────────────────────────────────────┐
│                AI HYBRID SWITCH                          │
│                                                         │
│  ┌─────────────────┐    ┌─────────────────────────┐    │
│  │  Production Mode │    │   Local Fallback Mode   │    │
│  │  Gemini 1.5 Flash│    │   Qwen 3B (RTX 4060)   │    │
│  │  < 1.5s response │    │   Offline capable       │    │
│  │  API_KEY required│    │   AI_MODE=local          │    │
│  └─────────────────┘    └─────────────────────────┘    │
│                                                         │
│  Toggle: AI_PROVIDER=gemini | local                     │
└─────────────────────────────────────────────────────────┘
```

| Chế độ | Khi nào dùng | Model | Tài nguyên |
|--------|--------------|-------|-----------|
| **Production** (mặc định) | Có mạng, demo, chạy thường | Gemini 1.5 Flash API | 0% local |
| **Local Fallback** | Mất mạng, demo offline, proof-of-concept | Qwen2.5-3B Q4_K_M | ~2.2GB VRAM |

### 1.3. Tech Stack tổng thể

| Tầng | Công nghệ | Vai trò |
|------|-----------|---------|
| **Frontend** | React 18 + Vite 5 + Tailwind CSS 3 | SPA, responsive, component-driven |
| **State** | Zustand 4 | Lightweight state management |
| **Charts** | Chart.js 4 + react-chartjs-2 | Radar, Line, Bar charts |
| **DnD** | @dnd-kit 6 | Drag & drop scheduling |
| **Backend** | Node.js + Express 4 | REST API server |
| **ORM** | Sequelize 6 | PostgreSQL/SQLite abstraction |
| **Database** | PostgreSQL 15 (prod) / SQLite (dev) | Multi-dialect |
| **Auth** | JWT + bcrypt | Access + Refresh tokens |
| **AI** | Anthropic SDK + Google Generative AI + Ollama | Hybrid LLM orchestration |
| **PDF** | pdfkit | Gradebook export |
| **Email** | Nodemailer + SMTP | Absence alerts, notifications |
| **Push** | web-push + VAPID | Service Worker notifications |
| **Cron** | node-cron | Scheduled jobs (score lock, alerts, reminders) |
| **iCal** | Custom RFC 5545 generator | Calendar feed sync |

---

## II. Đồng bộ Cơ sở dữ liệu chuẩn SaaS (30+ bảng đa chiều — ERP Ledger-based)

Loại bỏ tư duy lưu trữ bảng phẳng cũ. Cấu trúc DB mới theo kiến trúc **ERP Giáo dục (Educational Enterprise Resource Planning)** — dữ liệu giữa các phân hệ (Học thuật, Tài chính, Cơ sở vật chất) được ràng buộc chặt chẽ thông qua **Sổ cái dữ liệu (Ledgers)** có tính vết (Audit Trail).

### 2.1. Sơ đồ quan hệ tổng thể

```
                  ┌──────────────────────┐
                  │        users         │ (Core Identity)
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
    ┌──────────────┐                  ┌──────────────┐
    │   students   │                  │   teachers   │
    └──────┬───────┘                  │  (= users    │
           │                          │   role=subj) │
           ├───────┬───────┐          └──────┬───────┘
           ▼       ▼       ▼                 │
      ┌────────┐┌────────┐┌────────┐    ┌────┴────┐
      │ scores ││attendan││ews_    │    │teacher_ │
      │        ││ce      ││alerts  │    │assignmen│
      └───┬────┘└────────┘└────────┘    │ts       │
          │                              └────┬────┘
          ▼                                   ▼
    ┌──────────────┐              ┌──────────────────┐
    │score_competen│              │class_unavailabili│
    │cy_tags       │              │ty                │
    └──────────────┘              └──────────────────┘
```

### 2.2. Danh sách 30+ bảng (ERP Architecture)

#### CORE ACADEMIC ENGINE

| # | Bảng | Vai trò | Mô tả |
|---|------|---------|-------|
| 1 | `users` | Core Identity | Tài khoản toàn hệ thống (5 role) |
| 2 | `students` | Core | Hồ sơ học sinh + mã mời liên kết |
| 3 | `parent_student` | Junction | PH ↔ HS (n-n) |
| 4 | `classes` | Core | Lớp học (10A1, 11A2…) |
| 5 | `subjects` | Core | Môn học + program_component (GDPT) |
| 6 | `course_enrollments` | Core | Đăng ký môn học tự chọn (elective) |
| 7 | `teacher_assignments` | Academic | Phân công GV → Lớp × Môn × HK |
| 8 | `scores` | Academic | Điểm số + status (draft/published) + audit log |
| 9 | `score_audit_log` | Academic | Lịch sử sửa điểm (không thể xóa) |
| 10 | `score_competency_tags` | Academic | Gắn nhãn năng lực cho đầu điểm |
| 11 | `competency_standards` | Academic | Khung năng lực cốt lõi GDPT 2018 |
| 12 | `grading_profiles` | Academic | Cấu hình trọng số theo Grading Period |

#### EXAM & GPA ENGINE

| # | Bảng | Vai trò | Mô tả |
|---|------|---------|-------|
| 13 | `exam_periods` | Exam | Kỳ thi tập trung (Giữa kỳ, Cuối kỳ) |
| 14 | `assessments` | Exam | Bài đánh giá (Formative + Summative) |
| 15 | `transcripts` | Exam | Bảng điểm tổng kết + GPA (thang 4.0) |
| 16 | `grading_scales` | Exam | Quy đổi điểm: thang 10 → chữ (A/B/C/D/F) → GPA |

#### FINANCE LEDGER (Sổ cái Tài chính)

| # | Bảng | Vai trò | Mô tả |
|---|------|---------|-------|
| 17 | `invoices` | Finance | Hóa đơn tổng theo kỳ |
| 18 | `invoice_items` | Finance | Chi tiết khoản thu (HP, BH, Lab, Quỹ lớp) |
| 19 | `payment_transactions` | Finance | Nhật ký giao dịch (số tiền, phương thức, người duyệt) |

#### TIMETABLE & RESOURCE ALLOCATION

| # | Bảng | Vai trò | Mô tả |
|---|------|---------|-------|
| 20 | `schedules` | Timetable | Tiết học + week_parity + delivery_mode |
| 21 | `timetable_configs` | Timetable | Cấu hình khung giờ, ca, ngày dạy |
| 22 | `rooms` | Timetable | Phòng học (loại, sức chứa, thiết bị) |
| 23 | `room_assets` | Facility | Trang thiết bị phòng (máy tính, máy chiếu, dụng cụ) |
| 24 | `teacher_unavailability` | Timetable | Lịch bận GV (dùng cho substitution) |

#### ATTENDANCE & EWS

| # | Bảng | Vai trò | Mô tả |
|---|------|---------|-------|
| 25 | `attendance` | Attendance | Điểm danh + status (present/late/excused/absent) |
| 26 | `pending_attendance_alerts` | Attendance | Alert chờ 15 phút (Smart Digest) |
| 27 | `ews_risk_scores` | EWS | Chỉ số rủi ro ABC theo thời gian thực |
| 28 | `ews_alerts` | EWS | Lịch sử cảnh báo rủi ro |

#### COMMUNICATION & ACTIVITY

| # | Bảng | Vai trò | Mô tả |
|---|------|---------|-------|
| 29 | `notifications` | Communication | Thông báo in-app (multi-type) |
| 30 | `push_subscriptions` | Communication | Web Push VAPID subscriptions |
| 31 | `extracurriculars` | Activity | Hoạt động ngoại khóa |
| 32 | `student_activity` | Activity | HS × Ngoại khóa (n-n) |

#### FACILITY & LIBRARY

| # | Bảng | Vai trò | Mô tả |
|---|------|---------|-------|
| 33 | `library_borrows` | Library | Mượn trả sách (AI nhắc hạn trả) |
| 34 | `chat_sessions` | AI | Lịch sử chat AI (JSON messages) |

### 2.3. Schema cải tiến then chốt

#### `competency_standards` — Khung năng lực GDPT 2018

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| code | VARCHAR(50) UNIQUE | Mã năng lực (SELF_DIRECTED, MATH_PROFICIENCY…) |
| name | VARCHAR(200) | Tên năng lực |
| category | ENUM | core / subject / cross_curricular |
| description | TEXT | Mô tả chi tiết |

#### `grading_profiles` — Trọng số tùy biến theo Grading Period

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| school_year | VARCHAR(9) | Năm học |
| semester | INT | Học kỳ |
| name | VARCHAR(100) | Tên kỳ (HK1 - Kiểm tra miệng) |
| oral_weight | DECIMAL | Hệ số điểm miệng (mặc định 1) |
| min15_weight | DECIMAL | Hệ số 15 phút (mặc định 1) |
| period_weight | DECIMAL | Hệ số 1 tiết (mặc định 2) |
| semester_weight | DECIMAL | Hệ số học kỳ (mặc định 3) |
| lock_date | TIMESTAMP | Hạn chốt sổ |
| is_locked | BOOLEAN | Auto-set khi qua lock_date |

#### `ews_risk_scores` — Chỉ số rủi ro ABC

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| student_id | FK → students | Học sinh |
| attendance_score | DECIMAL(5,2) | 0–100 (tỷ lệ đi học) |
| behavior_score | DECIMAL(5,2) | 0–100 (từ conduct_grade) |
| academic_score | DECIMAL(5,2) | 0–100 (điểm TB + xu hướng) |
| composite_index | DECIMAL(5,2) | A×0.3 + B×0.2 + C×0.5 |
| risk_level | ENUM | low / medium / high / critical |

#### `schedules` — Tiết học cải tiến

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| week_parity | ENUM | all / even / odd (tuần chẵn/lẻ) |
| delivery_mode | ENUM | offline / online |
| online_meeting_url | VARCHAR | Link Zoom/Teams |
| lesson_topic | VARCHAR | Chủ đề tiết học |
| homework_reminder | VARCHAR | Nhắc bài tập |
| room_id | FK → rooms | Phòng học (FK cứng) |

#### `invoices` + `invoice_items` + `payment_transactions` — Sổ cái Tài chính

```
invoices (1) ──< invoice_items (n)     Hóa đơn → Chi tiết khoản
invoices (1) ──< payment_transactions (n)  Hóa đơn → Nhật ký giao dịch
```

| Bảng | Cột chính | Mô tả |
|------|-----------|-------|
| `invoices` | student_id, semester, school_year, total_amount, status | Hóa đơn tổng (status tính động từ tổng đã đóng) |
| `invoice_items` | invoice_id, description, amount | Chi tiết: HP chính khóa, BH, Lab, Quỹ lớp |
| `payment_transactions` | invoice_id, amount, method, approved_by, reference_code | Nhật ký: số tiền, phương thức, người duyệt, mã GD |

**Trạng thái hóa đơn** (tính động): `paid` (tổng đóng ≥ tổng hóa đơn), `partial` (0 < tổng đóng < tổng hóa đơn), `unpaid` (tổng đóng = 0)

#### `exam_periods` + `assessments` + `transcripts` + `grading_scales` — Exam & GPA Engine

| Bảng | Cột chính | Mô tả |
|------|-----------|-------|
| `exam_periods` | name, school_year, semester, start_date, end_date | Kỳ thi (Giữa kỳ, Cuối kỳ) |
| `assessments` | student_id, subject_id, exam_period_id, score_type, raw_score | Bài đánh giá (Formative: BT/15p/1 tiết, Summative: GK/CK) |
| `transcripts` | student_id, semester, school_year, gpa_score, letter_grade | Bảng điểm tổng kết + GPA |
| `grading_scales` | min_score, max_score, letter_grade, gpa_points | Quy đổi: 8.5–10 → A → 4.0 |

#### `room_assets` — Quản lý thiết bị phòng

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| room_id | FK → rooms | Phòng học |
| asset_name | VARCHAR | Tên thiết bị (Máy chiếu, PC, Bộ dụng cụ) |
| quantity | INT | Số lượng |
| condition | ENUM | good / needs_repair / broken |

#### `score_audit_log` — Nhật ký kiểm toán điểm (không thể xóa)

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| score_id | FK → scores | Đầu điểm bị sửa |
| old_value | DECIMAL | Giá trị cũ |
| new_value | DECIMAL | Giá trị mới |
| modified_by | FK → users | Người sửa |
| modified_at | TIMESTAMP | Thời điểm sửa |
| reason | TEXT | Lý do sửa (tùy chọn) |

#### `course_enrollments` — Đăng ký môn học tự chọn

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| student_id | FK → students | Học sinh |
| subject_id | FK → subjects | Môn tự chọn |
| semester / school_year | INT / VARCHAR | Kỳ học |
| status | ENUM | registered / dropped / completed |
| registered_at | TIMESTAMP | Thời điểm đăng ký |

#### `library_borrows` — Mượn trả sách

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| student_id | FK → students | Học sinh |
| book_title | VARCHAR | Tên sách |
| borrow_date | DATE | Ngày mượn |
| due_date | DATE | Hạn trả |
| return_date | DATE | Ngày trả thực tế |
| status | ENUM | borrowed / returned / overdue |

---

## III. Tái thiết kế Các phân hệ Chức năng & Luồng Nghiệp vụ

### 3.1. Phân hệ Định danh & Khởi tạo Kết nối Tự động (Secure Identity & Pairing)

Loại bỏ việc GV/Admin nhập tay mối quan hệ PH–HS.

#### Luồng Mã mời Tuyệt mật (Secure Invite Code Workflow)

```
Admin import HS bằng CSV
  │
  ▼
Backend tự mã hóa một chiều → sinh Access Code (VD: EDU-982X-LKA7)
  │
  ▼
Mã lưu vào students.parent_invite_code (hash SHA-256, hết hạn 30 ngày)
  │
  ▼
GVCN copy mã → gửi cho PH (hoặc QR code)
  │
  ▼
PH đăng ký tài khoản → nhập Access Code
  │
  ▼
Hệ thống xác thực → kích hoạt bản ghi parent_student tự động
```

**API**:
- `POST /invite/generate` — Admin/GVCN tạo mã cho HS
- `POST /invite/redeem` — PH nhập mã để liên kết
- `GET /invite/my-code` — HS xem mã của mình

### 3.2. Bộ máy Học thuật Đánh giá theo Năng lực (Standards-Based Academic Engine)

Thay thế hoàn toàn cách tính TB môn máy móc. Học tập từ cách phân tách điểm của hệ thống K-12 Mỹ:

| Loại đánh giá | Mô tả | Ví dụ |
|--------------|-------|-------|
| **Formative** (Quá trình) | GVBM chủ động nhập | BT về nhà, dự án nhóm, phát biểu |
| **Summative** (Tổng kết) | Kỳ thi tập trung (exam_periods) | Giữa kỳ, Cuối kỳ |

**Grading Scales** — Quy đổi điểm linh hoạt:
```
Thang 10 → Thang chữ → GPA
  8.5–10.0  →  A       → 4.0
  7.0–8.4   →  B       → 3.0
  5.5–6.9   →  C       → 2.0
  4.0–5.4   →  D       → 1.0
  < 4.0     →  F       → 0.0
```

#### Gắn nhãn Tiêu chí Năng lực

```
GVBM nhập điểm → chọn competency từ dropdown
  │
  ▼
score_competency_tags: score_id + competency_id + proficiency_level
  │
  ▼
proficiency_level: beginner → developing → proficient → advanced
```

#### Trạng thái Draft/Published

```
GVBM nhập điểm → status='draft' (chỉ GV/Admin thấy)
  │
  ▼
GVBM bấm "Công bố" → status='published' → PH/HS thấy ngay
  │
  ▼
Admin thiết lập Lock Date → cron auto-lock → khóa quyền sửa
```

**API**:
- `POST /scores/bulk` — Nhập điểm (mặc định draft)
- `POST /scores/publish` — Công bố draft → published
- `GET /competencies` — Danh sách năng lực
- `GET /competencies/student/:id/profile` — Radar chart data

#### Luồng Nhập điểm & Chốt sổ tự động qua Cron Job (Academic Lock Flow)

```
Admin thiết lập Grading Window (ngày mở + ngày đóng cổng nhập điểm)
  │
  ▼
GVBM nhập điểm → status='draft'
  │
  ▼
Đúng 00:00 ngày chốt sổ → node-cron job chạy ngầm:
  ├─> Quét grading_profiles có lock_date ≤ now
  ├─> Set is_locked = true
  ├─> Chuyển tất cả draft → published
  └─> Block mọi POST/PUT/PATCH từ GVBM (Time-window Validation Middleware)
```

**Bảo mật**: Middleware kiểm tra thời gian thực — mọi cố tình ghi đè điểm sau thời gian chốt sổ bị chặn ngay từ tầng API.

#### Luồng Đăng ký Môn học Tự chọn (Course Registration Workflow)

Áp dụng mô hình GDPT 2018 và chuẩn tín chỉ quốc tế:

```
Admin công bố Elective Courses + giới hạn sĩ số (Max Capacity)
  │
  ▼
HS đăng nhập Family Portal → hiển thị cổng đăng ký thời gian thực
  │
  ▼
Backend sử dụng Database Transaction Lock:
  ├─> Kiểm tra sĩ số hiện tại < Max Capacity
  ├─> Nếu còn chỗ → INSERT INTO course_enrollments → COMMIT
  └─> Nếu đầy → ROLLBACK → trả 409 Conflict (chặn Over-enrollment)
```

**API**:
- `GET /courses/electives` — Danh sách môn tự chọn + sĩ số hiện tại
- `POST /courses/register` — Đăng ký (transaction lock)
- `POST /courses/drop` — Hủy đăng ký

### 3.3. Hệ thống Cảnh báo Sớm AI (Early Warning System — EWS)

Thay thế `promotionForecast` trả `null` bằng hệ thống At-Risk Index thời gian thực.

#### Thuật toán Quét Ma trận Rủi ro (ABC Model)

```
A - Attendance (Chuyên cần):
  Tỷ lệ nghỉ KP > 10% tổng tiết → cảnh báo

B - Behavior (Nề nếp):
  Điểm trừ vi phạm tích lũy trong tháng > ngưỡng → cảnh báo

C - Course Performance (Điểm số):
  Xu hướng điểm đi xuống HOẶC competency < developing → cảnh báo

Composite Index = A×0.3 + B×0.2 + C×0.5

Risk Level:
  ≥ 75 → low (xanh lá)
  ≥ 50 → medium (vàng)
  ≥ 25 → high (cam)
  < 25 → critical (đỏ)
```

#### Gắn Cờ Cảnh báo (Risk Flagging)

- Tự động gắn `risk_level` trên hồ sơ HS
- Gửi thông báo trực tiếp đến Dashboard GVCN
- Đẩy dữ liệu làm context cho AI Chatbot

**API**:
- `GET /ews/student/:id` — Risk scores 1 HS
- `GET /ews/class/:id` — Danh sách HS + risk level
- `GET /ews/dashboard` — Tổng hợp toàn trường
- `POST /ews/recompute` — Batch recompute

### 3.4. Hệ thống Điều phối Lịch trình & Thời khóa biểu Đa chiều (Modern Timetabling Grid)

Nâng cấp toàn diện bài toán TKB tĩnh lên mô hình điều phối động.

#### Xử lý Tuần chẵn/lẻ (`week_parity`)

```
Môn có periods_per_week lẻ (VD: Sử 1.5/tuần)
  │
  ▼
Tuần chẵn: 2 tiết  |  Tuần lẻ: 1 tiết
  │
  ▼
Lưới TKB ×2: toggle "Tuần chẵn" / "Tuần lẻ" trên UI
```

#### Điều luồng Dạy thay Tự động (Automated Substitution)

```
GV báo bận đột xuất → cập nhật teacher_unavailability
  │
  ▼
Backend tự động quét:
  1. Danh sách GV cùng tổ bộ môn
  2. Đối chiếu teacher_unavailability (trùng tiết?)
  3. Đối chiếu schedules (trùng lịch dạy?)
  4. Chấm điểm soft: ưu tiên GV trống tiết liền kề (tránh gap)
  │
  ▼
Đề xuất top 3 GV thay thế → đẩy đến màn hình Admin
```

**API**:
- `GET /schedules/:id/substitutes` — Top 3 GV thay thế

### 3.5. Phân hệ Quản lý Cơ sở vật chất & Thư viện (Asset & Facility Logistics)

TKB không chỉ xếp GV vào lớp, mà phải điều phối cả tài nguyên đi kèm.

#### `room_assets` — Quản lý thiết bị phòng

Khi Admin xếp tiết thực hành Lý vào phòng Lab, thuật toán TKB kiểm tra:
- Phòng có đủ số lượng thiết bị cho sĩ số lớp?
- Thiết bị có trạng thái `good` (không hỏng)?

#### `library_borrows` — Quản lý mượn trả sách

- AI Chatbot đọc bảng này để nhắc HS khi sắp đến hạn trả sách
- Tự động gắn `status=overdue` khi quá hạn

**API**:
- `GET /rooms/:id/assets` — Thiết bị phòng
- `GET /library/student/:id` — Sách đang mượn
- `POST /library/borrow` — Mượn sách
- `POST /library/return` — Trả sách

#### Đồng bộ hóa Quốc tế (.ics Live Feed)

```
Mỗi user có endpoint cá nhân:
  GV: GET /ical/teacher/:id
  HS: GET /ical/student/:id
  Lớp: GET /ical/class/:id

User add URL vào Google Calendar / Apple Calendar / Outlook
  → Lịch auto-sync khi có thay đổi trên EduSmart
```

**API**:
- `GET /ical/teacher/:id` — Feed .ics cho GV
- `GET /ical/student/:id` — Feed .ics cho HS
- `GET /ical/class/:id` — Feed .ics cho lớp
- `GET /ical/link` — URL feed cho user hiện tại

### 3.5. Hàng đợi Thông báo Đa kênh thông minh (Smart Communication Queue)

#### Cơ chế Trì hoãn chống quá tải (Delayed Queue Execution)

```
GVCN điểm danh HS vắng
  │
  ▼
Tạo pending_attendance_alert (status=pending)
  │
  ▼
Chờ 15 phút
  │
  ├─> Nếu GV sửa "Đi muộn" → alert cancelled → KHÔNG gửi email
  │
  └─> Nếu hết 15 phút vẫn vắng → cron gửi:
      ├── Web Push (Service Worker trên điện thoại)
      ├── HTML Email (Nodemailer SMTP)
      └── In-app Notification
```

#### Luồng Biến động Lịch trình (Schedule Mutation Workflow)

```
Admin điều chỉnh TKB
  │
  ▼
[Hệ thống validate cứng/mềm] ──(Lỗi)──> Cảnh báo Overlay UI
  │
  ├─> API chốt cập nhật Database
  │
  ├─> Kích hoạt Queue (Delayed 5 phút phòng sửa nhầm)
  │
  ├───> Web Push → GV dạy + HS lớp bị ảnh hưởng
  ├───> Email SMTP → thông báo thay đổi chi tiết
  └───> Refresh Context cho AI Chatbot Widget
```

#### Smart Cron Reminder Engine

```
Cron: "0 6,12 * * 1-6" (6:00 và 12:00 T2-T7)
  │
  ├─> Quét schedules trong ca sắp diễn ra
  ├─> Tính giờ nhắc = tiết đầu ca - 15 phút (hoặc 30 phút)
  ├─> Dedup qua wasReminderSentRecently()
  ├─> Gửi Web Push + In-app Notification
  └─> Payload: phòng, môn, GV, link online
```

---

## IV. Đặc tả Giao diện — Flat-Premium Design System

Bỏ hoàn toàn thiết kế menu ngang hành chính thô cứng. Giao diện mới theo triết lý **Flat-Premium Reset**: khoảng trắng rộng rãi, đổ bóng mịn, bo góc lớn, hiệu ứng kính mờ.

### 4.0. Design Tokens

| Token | Giá trị | Quy tắc |
|-------|---------|---------|
| Brand Primary | `#4f46e5` (Indigo) | CTA, nav active |
| Brand Secondary | `#0d9488` (Teal) | Accent, success |
| Background | `#fafafa` (Zinc-50) | Nền app |
| Text Primary | `text-zinc-800` | Tuyệt đối không dùng `#000` |
| Border | `border-zinc-100` + `shadow-sm shadow-zinc-100/40` | Thay `border-zinc-300` |
| Radius | `rounded-xl` (12px) cards, `rounded-2xl` (16px) mobile | Thay `rounded`/`rounded-md` |
| Glassmorphism | `backdrop-blur-md bg-white/80` | Toolbar, popup, drawer |
| Shadow | `shadow-sm shadow-zinc-100/40` | Tạo chiều sâu |
| Màu trạng thái | `bg-rose-500`/`bg-amber-500`/`bg-emerald-500` | Muted, không chói |
| Skeleton | `bg-zinc-200/60 animate-pulse` | Thay Spinner |

### 4.1. Management Workspace (Admin & Giáo viên)

#### Thanh tìm kiếm Toàn năng (Omni-Search Hub — `Ctrl+K`)

```
Bất kỳ trang nào → Ctrl+K (hoặc Cmd+K)
  │
  ▼
┌─────────────────────────────────────────┐
│ 🔍 Tìm học sinh, lớp, GV, môn học...   │
├─────────────────────────────────────────┤
│ 👤 Nguyễn An — HS10A101 — 10A1         │
│ 🏫 Lớp 10A1 — Khối 10 — 2024-2025     │
│ 📚 Toán học — TOAN                      │
│ 👨‍🏫 gv.toan@edusmart.local — GVBM      │
├─────────────────────────────────────────┤
│ ↑↓ Di chuyển  Enter Chọn  Esc Đóng     │
└─────────────────────────────────────────┘
```

- Search across: students, classes, teachers, subjects
- Permission-aware: HS/PH chỉ thấy dữ liệu mình
- Recent searches lưu localStorage

#### Giao diện Widget Kéo thả (Customizable Grid Dashboard)

**School Health Analytics Dashboard** — Trang chủ Admin hiển thị cụm biểu đồ phân tích sâu:

```
Admin Dashboard:
┌─────────────────────────────────────────────────────┐
│ [📊 Sĩ số] [📈 TB lớp] [⚠️ EWS] [💰 Tài chính]    │
│                                                     │
│ ┌─────────────────────┐ ┌─────────────────────────┐ │
│ │ 📊 Tỷ lệ đi học     │ │ ⚠️ Top 5 HS At-Risk     │ │
│ │ hôm nay: 94%        │ │ 🔴 HS01 — Critical (22) │ │
│ │ ████████████░░ 94%  │ │ 🔴 HS15 — Critical (28) │ │
│ │                     │ │ 🟠 HS08 — High (35)     │ │
│ └─────────────────────┘ └─────────────────────────┘ │
│                                                     │
│ ┌─────────────────────┐ ┌─────────────────────────┐ │
│ │ 📈 Xu hướng chuyên  │ │ 💰 Dòng tiền học phí    │ │
│ │ cần (Line Chart)    │ │ (Funnel Chart)          │ │
│ │ T2→CN tuần này      │ │ Hóa đơn: 180,000,000   │ │
│ │                     │ │ Đã thu:  156,000,000    │ │
│ │                     │ │ Nợ:       24,000,000    │ │
│ └─────────────────────┘ └─────────────────────────┘ │
│                                                     │
│ ┌─────────────────────┐ ┌─────────────────────────┐ │
│ │ 📈 Top môn TB thấp  │ │ 📋 Hoạt động gần đây   │ │
│ │ 1. Lý: 5.2 ⬇️       │ │ • GV Nguyễn nhập điểm   │ │
│ │ 2. Hóa: 5.8 ⬇️      │ │ • HS An vắng KP         │ │
│ │ 3. Sử: 6.1 →        │ │ • TKB lớp 10A2 đổi     │ │
│ └─────────────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- Kéo thả vị trí widget (@dnd-kit)
- Lưu layout vào localStorage per-user
- Widget types: StatCard, LineChart, FunnelChart, BarChart, AlertList, ActivityFeed
- **Line Chart**: Xu hướng chuyên cần toàn trường theo tuần (phát hiện dịch bệnh/trốn học)
- **Funnel Chart**: Dòng tiền HP (Hóa đơn → Đã thu → Nợ tồn đọng)
- **EWS Widget**: Top 5 HS có At-Risk Index cao nhất cần can thiệp ngay

#### Inline AI Assistant Side-drawer

```
┌─────────────────────────────────────────────────────┐
│ Nhập điểm — 10A1 - Toán                [🤖 Hỏi AI] │
├──────────────────────┬──────────────────────────────┤
│ Mã HS  | Họ tên     | Điểm    │                    │
│ HS01   | Nguyễn An  | [8.0]   │  ┌──────────────┐  │
│ HS02   | Trần Bình  | [6.5]   │  │ 🤖 AI Trợ lý │  │
│ HS03   | Lê Châu    | [7.0]   │  │              │  │
│ ...                  |         │  │ Phân tích    │  │
│                      |         │  │ bảng điểm...│  │
│                      |         │  │              │  │
│                      |         │  └──────────────┘  │
└──────────────────────┴──────────────────────────────┘
  Bảng điểm (2/3)              Side-drawer (1/3)
```

- Không che khuất bảng dữ liệu chính
- Context tự động: đang ở ScoreEntry → AI biết class+subject+scores
- FAB giữ nguyên cho Family Portal

### 4.2. Family Portal (Học sinh & Phụ huynh)

#### Mobile-First: Agenda Timeline View

```
Mobile (< 768px):
┌─────────────────────────┐
│ 📅 Thứ 3, 17/09/2024   │
├─────────────────────────┤
│ ⏰ Đang diễn ra         │
│ ┌─────────────────────┐ │
│ │ Tiết 2 — Toán       │ │
│ │ GV: Nguyễn Văn A    │ │
│ │ P.201 · Còn 15 phút │ │
│ └─────────────────────┘ │
│                         │
│ ⏰ Sắp tới              │
│ ┌─────────────────────┐ │
│ │ Tiết 3 — Vật lý     │ │
│ │ GV: Trần Thị B      │ │
│ │ Lab · 10:00–10:45   │ │
│ │ 🔗 [Vào lớp online] │ │  ← Dynamic Action Button
│ │ ⚠️ BT: Bài tập 3    │ │  ← Homework badge
│ └─────────────────────┘ │
│                         │
│ ⏰ Đã qua               │
│ ┌─────────────────────┐ │
│ │ Tiết 1 — Văn        │ │
│ │ GV: Lê Thị C        │ │
│ │ P.305 · 7:00–7:45   │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**Dynamic Action Buttons**:
- `delivery_mode === 'online'` → nút "Vào lớp online" (xanh dương)
- `homework_reminder` → badge cam cảnh báo bài tập
- Tiết đang diễn ra → highlight + đếm ngược thời gian

#### Bảng điều khiển Năng lực Trực quan

```
Radar Chart (Chart.js):
        Tự chủ
          ▲
          │
    Ngôn  │  Toán
    ngữ   │  học
  ◄───────┼───────►
   Xã hội │ Khoa
          │ học
          ▼
       Sáng tạo

Proficiency: ● Beginner  ● Developing  ● Proficient  ● Advanced
```

### 4.3. Multi-Perspective View (Admin Schedule)

Admin chuyển đổi linh hoạt 3 góc nhìn:

| View | Mô tả | Color-code |
|------|-------|-----------|
| **By Class** (mặc định) | Lưới TKB theo lớp | — |
| **By Teacher** | Lịch làm việc GV | Đỏ = quá dày, Xám = trống |
| **By Room** | Sử dụng phòng | Xanh = đang dùng, Xám = trống |

#### Conflict Overlay trên Drag & Drop

```
Admin kéo tiết "Toán" → ô Thứ 3 Tiết 2 (GV đã có lịch ở 10A2)
  │
  ▼
Ô lưới chuyển ĐỎ NHẤP NHÁY
  │
  ▼
Tooltip: "⚠️ GV Nguyễn Văn A đã có tiết ở lớp 10A2 lúc này"
  │
  ▼
Hủy thao tác (không gọi API)
```

### 4.4. Sliding Segmented Control (Multi-Perspective)

Khối nền trắng trượt mượt khi chuyển tab (Stripe-style):
```
[█ Theo Lớp █] [Giáo viên] [Phòng]
  ▲ bg-white rounded-lg shadow-sm transition-all duration-300
```

### 4.5. ScoreGrid — Clean Datasheet

- Không viền dọc, chỉ `border-b-zinc-100/60` siêu mảnh
- Focus: `ring-indigo-500/20 border-indigo-400`
- Điểm <5.0: `bg-rose-50/50 text-rose-600 rounded-lg`
- Audit popover: `bg-zinc-900/90 backdrop-blur-md rounded-xl`

### 4.6. Mobile Timeline — Vertical Fluid Tracker

- Trục dọc siêu mảnh `w-px bg-zinc-200/60`
- Tiết hiện tại: `shadow-md shadow-indigo-100/50 ring-1 ring-indigo-500/10`
- Nút online: `bg-gradient-to-r from-indigo-600 to-violet-600`

### 4.7. Side-drawer AI — Glassmorphism

- `bg-white/90 backdrop-blur-lg border-l border-zinc-100 shadow-2xl`
- Header: gradient icon `from-indigo-500 to-violet-500`
- Bảng dữ liệu tự động thu hẹp `transition-all duration-300`

### 4.8. Components mới đã tạo

| Component | File | Mô tả |
|-----------|------|-------|
| `Skeleton` | `ui/Skeleton.jsx` | Line, Circle, Card, Table placeholders |
| `Toggle` | `ui/Toggle.jsx` | Toggle switch cao cấp |
| `SlidingSegmentedControl` | `schedule/PerspectiveSelector.jsx` | Tab切换 Stripe-style |
| `OmniSearch Premium` | `search/OmniSearch.jsx` | Glassmorphism spotlight |
| `ConflictTooltip Premium` | `schedule/ConflictTooltip.jsx` | Soft-error overlay |
| `MobileTimeline Premium` | `schedule/MobileTimeline.jsx` | Vertical fluid tracker |
| `ScoreGrid Premium` | `scores/ScoreGrid.jsx` | Clean datasheet + audit popover |
| `SideDrawer Premium` | `chat/SideDrawer.jsx` | Glassmorphism AI drawer |

---

## V. Kiến trúc Trợ lý AI Điều phối Thông minh (Orchestrator Framework)

Trợ lý ảo EduSmart hoạt động theo mô hình **Định tuyến ngữ cảnh hai tầng (Two-Tier Context Routing)**.

### 5.1. Sơ đồ luồng xử lý

```
            Tin nhắn Tiếng Việt của Người dùng
                            │
                            ▼
     ┌──────────────────────────────────────────────┐
     │     TẦNG 1: NLU Intent Detection (Local)     │
     │   (Khớp quy tắc từ khóa / Regex chuẩn xác)   │
     └──────────────────────┬───────────────────────┘
                            │
      ┌─────────────────────┴─────────────────────┐
      ▼ (10 Intents tra cứu DB)                   ▼ (Câu hỏi mở/tư vấn sâu)
┌───────────────────────────────┐       ┌───────────────────────────────┐
│   TẦNG 2A: Zero-Token Router  │       │   TẦNG 2B: Context-Injection  │
│  - Lấy User ID từ session.    │       │  - Quét DB lấy hồ sơ liên quan│
│  - Query trực tiếp SQL DB.    │       │  - Đóng gói Prompt gửi LLM.   │
│  - Trả kết quả render Inline. │       │  - Gemini API / Qwen Local     │
│  - Thời gian: ~200ms          │       │  - Thời gian: ~1.5s            │
└───────────────────────────────┘       └───────────────────────────────┘
```

### 5.2. Tầng 1: Nhận diện Ý định Cục bộ (Zero-Token Intent Detection)

- Không gọi LLM ở bước này
- Quét từ khóa trong `intent.rules.js`
- Bypass trực tiếp → query DB → render Component

| Intent | Keywords | Tool |
|--------|----------|------|
| `view_scores` | điểm, bảng điểm, học bạ | family.scores |
| `view_schedule` | lịch, thời khóa biểu, tiết | family.schedule |
| `view_attendance` | điểm danh, vắng, chuyên cần | family.attendance |
| `view_tuition` | học phí, đóng tiền | family.tuition |
| `view_evaluations` | đánh giá, nhận xét, hạnh kiểm | family.evaluations |
| `view_notifications` | thông báo, tin nhắn | family.notifications |
| `compare_subjects` | so sánh, môn nào thấp | family.scores |
| `my_assignments` | phân công, tôi dạy | staff.assignments |
| `class_report` | báo cáo lớp, thống kê | staff.class_report |
| `help_features` | hướng dẫn, cách sử dụng | staff.help |

### 5.3. Tầng 2A: Zero-Token Router (Tra cứu trực tiếp)

```
User: "Điểm môn Toán HK1"
  → Intent: view_scores (matched: "điểm")
  → Get student_id from session
  → Query: SELECT * FROM scores WHERE student_id=X AND subject_id=Y
  → Render: ScoreResultCard inline trong chat
  → Thời gian: ~200ms, 0 token LLM
```

### 5.4. Tầng 2B: Context-Injection (AI Advisory)

```
User: "Con tôi bị cờ vàng môn Lý, nên học thế nào?"
  → Intent: ai_advice (matched: "nên", "học thế nào")
  → Build holistic profile:
      - scores môn Lý + xu hướng
      - attendance pattern (vắng thứ 2?)
      - conduct_grade + vi phạm
      - competency profile (radar data)
  → Prompt: "Given this student's holistic profile: [data], provide advice..."
  → Gửi Gemini API / Qwen Local
  → Response: lộ trình cải thiện cá nhân hóa
  → Thời gian: ~1.5s
```

### 5.5. Bảng tool Family (10 tools)

| toolId | Intents | Nguồn dữ liệu |
|--------|---------|---------------|
| `family.scores` | view_scores, compare_subjects | scores + subjects |
| `family.schedule` | view_schedule | schedules + teachers + rooms |
| `family.attendance` | view_attendance | attendance |
| `family.tuition` | view_tuition | tuitions + payments |
| `family.evaluations` | view_evaluations | evaluations |
| `family.notifications` | view_notifications | notifications |
| `family.extracurricular` | view_extracurricular | student_activity |
| `family.contact_teacher` | contact_teacher | users + classes |
| `llm.advice` | ai_advice | holistic profile → LLM |
| `llm.conversational` | general_chat | history + context → LLM |

### 5.6. Bảng tool Staff (8 tools)

| toolId | Intents | Nguồn dữ liệu |
|--------|---------|---------------|
| `staff.help` | help_features, how_to | static |
| `staff.admin_stats` | admin_stats | users + students + classes |
| `staff.assignments` | my_assignments | teacher_assignments |
| `staff.class_students` | list_students, search_student | students |
| `staff.class_scores` | view_class_scores | scores |
| `staff.class_report` | class_report_summary | scores + ews |
| `staff.class_attendance` | view_class_attendance | attendance |
| `staff.class_schedule` | view_class_schedule | schedules |

### 5.7. Cấu hình Context Payload cho AI (Tối ưu RAM)

Để AI đọc hiểu cấu trúc ERP 30+ bảng mà không sập bộ nhớ (RAM 11.2GB), context payload được tinh chỉnh tối giản:

```javascript
// services/ai/context.service.js — Tối ưu cho Qwen2.5-3B-Instruct
const AI_ACADEMIC_PROMPT_TEMPLATE = {
  system_instruction: "Bạn là Trợ lý Cố vấn Học thuật cao cấp. Phân tích dữ liệu học lực dựa trên Khung Năng Lực, tuyệt đối không bịa đặt số liệu.",

  // Chỉ trích xuất trường cần thiết, loại bỏ metadata dư thừa
  optimize_context: (studentData) => ({
    id: studentData.id,
    risk_level: studentData.ews_alerts[0]?.risk_level || "Normal",
    gpa: studentData.transcripts?.gpa_score || null,
    competencies_matrix: studentData.scores.map(s => ({
      subject: s.subject.name,
      skill: s.competency?.skill_name || null,
      status: s.score_value < 5.0 ? "At-Risk" : "Mastered"
    })),
    attendance_rate: studentData.attendance_rate,
    conduct_grade: studentData.conduct_grade,
    library_overdue: studentData.library_borrows?.filter(b => b.status === 'overdue').length || 0
  })
};
```

---

## V-BIS. Kịch bản Kiểm thử An toàn Dữ liệu (Enterprise Test Cases)

Bổ sung các tình huống kiểm tra bảo mật dữ liệu nghiêm ngặt theo tiêu chuẩn quốc tế:

| Mã | Kịch bản | Thao tác | Kết quả kỳ vọng |
|----|----------|----------|-----------------|
| **TC15** | Race Condition — Đăng ký môn tự chọn | 10 HS cùng bấm đăng ký ô trống cuối cùng tại cùng 1ms | Chỉ 1 HS thành công, 9 HS nhận `409 Conflict`, sĩ số không vượt ngưỡng |
| **TC16** | Horizontal Privilege Escalation — Rò rỉ tài chính | PH A gửi `GET /api/tuitions/student/99` (ID HS khác) | `403 Forbidden` — parentLink.middleware phát hiện không có quyền |
| **TC17** | Audit Logging — Kiểm toán điểm số | GVBM cập nhật điểm thi giữa kỳ | Bảng `score_audit_log` tự động ghi: `modified_by`, `old_value`, `new_value`, `modified_at` — bản ghi không thể xóa |
| **TC18** | Time-window Validation — Ghi đè sau chốt sổ | GVBM gửi `PUT /scores/:id` sau ngày lock_date | `403 Forbidden` — Time-window middleware chặn |
| **TC19** | Transaction Lock — Over-enrollment | 2 HS cùng đăng ký môn chỉ còn 1 chỗ | DB transaction: 1 COMMIT, 1 ROLLBACK → sĩ số chính xác |
| **TC20** | Dedup Alert — Gửi trùng cảnh báo | GVCN điểm danh vắng 2 lần trong ngày cho cùng 1 HS | Chỉ 1 pending_alert được tạo, alert cũ bị cancelled |

---

## VI. Phân quyền & Vai trò

### 6.1. Phân cấp

```
Admin (toàn quyền)
 └── Giáo viên (do admin phân công)
       ├── GVBM (môn × lớp × năm học)   → teacher_assignments
       ├── GVCN (1 lớp × 1 năm học)     → classes.homeroom_teacher_id
       └── Cả hai: gộp quyền trên 1 tài khoản role='subject'
             ├── Học sinh  (read-only — bản thân)
             └── Phụ huynh (read-only — con đã liên kết)
```

### 6.2. Ma trận quyền

| Chức năng | Admin | GVCN | GVBM | PH | HS |
|-----------|:-----:|:----:|:----:|:--:|:--:|
| Quản lý tài khoản | ✅ | — | — | — | — |
| Quản lý HS | ✅ | Lớp CN | — | — | — |
| Nhập điểm (draft) | ✅ | Lớp mình* | Môn+lớp | — | — |
| Công bố điểm | ✅ | — | Điểm mình | — | — |
| Điểm danh | ✅ | Lớp CN | — | Xem con | Xem mình |
| EWS Dashboard | ✅ | Lớp CN | — | — | — |
| TKB (xếp/sửa) | ✅ | Tiết mình | Tiết mình | Xem con | Xem mình |
| Đề xuất dạy thay | ✅ | — | — | — | — |
| iCal feed | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mã mời PH | ✅ | Lớp CN | — | — | Xem mã |
| Học phí | ✅ | — | — | Xem con | Xem mình |
| AI Chatbot | ✅ | ✅ | ✅ | ✅ | ✅ |

### 6.3. Middleware

| Middleware | Kiểm tra |
|-----------|----------|
| `auth.middleware` | Verify JWT, gắn `req.user` |
| `role.middleware(...)` | Role trong danh sách cho phép |
| `permission.middleware('x.y')` | Tra cứu `PERMISSIONS[x.y]` |
| `homeroom.middleware` | `homeroom_teacher_id = req.user.id` |
| `assignment.middleware` | Có dòng active trong `teacher_assignments` |
| `parentLink.middleware` | PH có trong `parent_student` |
| `readonly.middleware` | Chặn POST/PUT/PATCH/DELETE cho PH/HS |
| `classView.middleware` | GVCN xem tất cả môn, GVBM chỉ môn mình |
| `chatScope.middleware` | GVBM ≠ GVCN trong chat AI |

---

## VII. Tài khoản demo

Mật khẩu mặc định: **`edusmart123`**

| Vai trò | Email | Persona AI |
|---------|-------|-----------|
| Admin | `admin@edusmart.local` | staff |
| GVCN 10A1 | `gvcn.10a1@edusmart.local` | staff |
| GVBM Toán | `gv.toan@edusmart.local` | staff |
| Học sinh | `hs.10a1.01@edusmart.local` | family |
| Phụ huynh | `ph.10a1.01@edusmart.local` | family |

Seed data: 3 lớp × 30 HS = 90 HS + 90 PH + 6,480 dòng điểm + 12 competencies.

---

## VIII. Cài đặt & Chạy dự án

### 1. Clone & install

```bash
git clone <repo>
cd edusmart
cd backend && npm install
cd ../frontend && npm install
```

### 2. Cấu hình môi trường

```bash
# Backend
cd backend
cp .env.example .env
# Điền: DATABASE_URL, JWT_SECRET, AI_PROVIDER, SMTP_*, VAPID_*

# Frontend
cd ../frontend
cp .env.example .env
```

### 3. Tạo schema + seed

```bash
cd backend
npm run db:migrate
npm run db:seed
```

### 4. Chạy

```bash
# Backend (port 3001)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

### 5. Scripts

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy development |
| `npm run db:migrate` | Chạy migrations |
| `npm run db:seed` | Seed dữ liệu mẫu |
| `npm run db:reset` | Reset DB (migrate + seed lại) |
| `npm test` | Chạy tests (Jest) |
| `npm run ai:install-cli` | Cài AI CLI tools |

---

## IX. Cấu trúc thư mục

```
edusmart/
├── README.md
├── docs/
│   ├── PROJECT_SUMMARY.md          ← Tài liệu tổng hợp
│   └── TIMETABLE_MODULE_SPEC.md    ← Đặc tả chi tiết module TKB
│
├── backend/
│   ├── app.js                      # Entry point (Express + Cron)
│   ├── package.json
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js         # Sequelize (SQLite/PostgreSQL)
│   │   │   ├── env.js              # Biến môi trường
│   │   │   └── permissions.js      # Ma trận quyền
│   │   │
│   │   ├── models/                 # 20+ Sequelize models
│   │   │   ├── index.js            # Auto-load + associations
│   │   │   ├── User.js
│   │   │   ├── Student.js
│   │   │   ├── Score.js            # + status (draft/published)
│   │   │   ├── Schedule.js         # + week_parity, delivery_mode
│   │   │   ├── EWSRiskScore.js     # NEW
│   │   │   ├── Competency.js       # NEW
│   │   │   ├── ScoreCompetencyTag.js # NEW
│   │   │   ├── GradingPeriod.js    # NEW
│   │   │   ├── PendingAttendanceAlert.js # NEW
│   │   │   └── ... (15 models khác)
│   │   │
│   │   ├── controllers/            # 20+ controllers
│   │   │   ├── ews.controller.js   # NEW
│   │   │   ├── competency.controller.js # NEW
│   │   │   ├── invite.controller.js # NEW
│   │   │   ├── search.controller.js # NEW
│   │   │   ├── ical.controller.js  # NEW
│   │   │   ├── substitution.controller.js # NEW
│   │   │   ├── grading-period.controller.js # NEW
│   │   │   └── ... (13 controllers khác)
│   │   │
│   │   ├── routes/                 # 20+ route modules
│   │   │
│   │   ├── services/
│   │   │   ├── ews.service.js      # NEW: ABC risk model
│   │   │   ├── competency.service.js # NEW: Standards-based grading
│   │   │   ├── invite.service.js   # NEW: Secure invite codes
│   │   │   ├── substitution.service.js # NEW: Auto substitution
│   │   │   ├── ical.service.js     # NEW: RFC 5545 iCal feed
│   │   │   ├── score.service.js
│   │   │   ├── pdf.service.js
│   │   │   ├── email.service.js
│   │   │   ├── schedule.service.js
│   │   │   ├── push-notification.service.js
│   │   │   ├── schedule-notify.service.js
│   │   │   │
│   │   │   ├── ai/                 # AI Orchestration
│   │   │   │   ├── chat-orchestrator.service.js
│   │   │   │   ├── intent.service.js / intent.rules.js
│   │   │   │   ├── context.service.js
│   │   │   │   ├── llm.service.js  # Hybrid: Gemini + Qwen
│   │   │   │   ├── advice.service.js
│   │   │   │   └── student-data.service.js
│   │   │   │
│   │   │   ├── chat/               # Chat module dispatcher
│   │   │   │   ├── dispatcher.service.js
│   │   │   │   ├── registry.js
│   │   │   │   └── modules/
│   │   │   │       ├── family/     # 9 family tools
│   │   │   │       └── staff/      # 8 staff tools
│   │   │   │
│   │   │   └── scheduling/         # TKB Solver
│   │   │       ├── solver/
│   │   │       │   ├── school-solver.js
│   │   │       │   ├── greedy-init.js
│   │   │       │   ├── hill-climb.js  # + week_parity
│   │   │       │   ├── hard-checker.js
│   │   │       │   └── soft-scorer.js
│   │   │       └── ...
│   │   │
│   │   ├── middleware/             # 9 middleware
│   │   └── utils/
│   │       ├── gradeCalc.js
│   │       └── responseHelper.js
│   │
│   ├── database/
│   │   ├── migrations/             # 30+ migration files
│   │   └── seeders/                # 14+ seeder files
│   │
│   └── jobs/
│       ├── schedule-reminder.job.js # Smart Cron Reminder
│       ├── score-lock.job.js       # Auto-lock grading periods
│       └── attendance-alert.job.js # Delayed 15-min alerts
│
├── frontend/
│   ├── src/
│   │   ├── api/                    # 20+ API modules
│   │   │   ├── ews.api.js          # NEW
│   │   │   ├── competency.api.js   # NEW
│   │   │   ├── invite.api.js       # NEW
│   │   │   ├── search.api.js       # NEW
│   │   │   ├── ical.api.js         # NEW
│   │   │   └── ...
│   │   │
│   │   ├── pages/
│   │   │   ├── admin/              # 13 trang Admin
│   │   │   │   ├── GradingPeriods.jsx # NEW
│   │   │   │   └── ...
│   │   │   ├── teacher/            # 9 trang GV
│   │   │   ├── family/             # 6 trang PH/HS
│   │   │   │   ├── LinkStudent.jsx # NEW
│   │   │   │   └── ...
│   │   │   └── shared/             # 4 trang chung
│   │   │
│   │   ├── components/
│   │   │   ├── dashboard/          # NEW: Widget system
│   │   │   │   ├── WidgetGrid.jsx
│   │   │   │   └── widgets/
│   │   │   ├── ews/                # NEW
│   │   │   │   ├── RiskBadge.jsx
│   │   │   │   └── AtRiskWidget.jsx
│   │   │   ├── search/             # NEW
│   │   │   │   └── OmniSearch.jsx
│   │   │   ├── schedule/
│   │   │   │   ├── MobileTimeline.jsx # NEW
│   │   │   │   ├── ConflictTooltip.jsx # NEW
│   │   │   │   └── ...
│   │   │   ├── chat/
│   │   │   │   ├── SideDrawer.jsx  # NEW
│   │   │   │   └── ...
│   │   │   ├── scores/
│   │   │   ├── layout/
│   │   │   └── ui/                 # 15 UI components
│   │   │
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── contexts/
│   │   ├── config/
│   │   └── utils/
│   │
│   └── public/
│       └── sw.js                   # Service Worker (Web Push)
```

---

## X. Env variables

### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=sqlite:./database/edusmart.sqlite
# hoặc: DATABASE_URL=postgresql://user:pass@host:5432/edusmart

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CURRENT_SCHOOL_YEAR=2024-2025

# AI — Hybrid Orchestration
AI_PROVIDER=gemini              # gemini | anthropic | local
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-api03-...
# Local fallback (RTX 4060, ~2.2GB VRAM):
AI_MODE=api                     # api | local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-3b-instruct
OLLAMA_GPU_LAYERS=99            # Số layer chạy trên GPU

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=edusmart@school.edu.vn

# Web Push
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
ENABLE_SCHEDULE_CRON=1
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE=http://localhost:3001/api
```

---

## XI. Đặc tả UI chi tiết

> Xem thêm: Các trang chi tiết cho từng vai trò, mockup ASCII, bảng elements, modal forms, API calls — đã mô tả đầy đủ trong phiên bản trước (§17 UI Specification).

---

## XII. Implementation Roadmap

| Phase | Tuần | Nội dung |
|-------|------|----------|
| 1: Foundation | 1–2 | Migrations (24 bảng), Models, Seeders, Associations |
| 2: Backend Core | 3–4 | Auth, CRUD, Scores, Attendance, Notifications |
| 3: Academic Engine | 5–6 | EWS service, Competency service, Grading Periods, Draft/Publish |
| 4: Timetable Engine | 7–8 | Hill Climbing + week_parity, Substitution, iCal feed |
| 5: AI Orchestrator | 9–10 | Intent rules, Context injection, Hybrid LLM, Chat modules |
| 6: Frontend Core | 11–12 | Dashboard widgets, Omni-Search, Mobile Timeline, Side-drawer AI |
| 7: Integration | 13–14 | Smart notifications, Cron reminders, Web Push, Email |
| 8: Testing & Polish | 15–16 | Unit tests, Integration tests, E2E, Performance, Docs |

---

*Cập nhật: 2025-07 — EduSmart Next-Gen v2.0*
*Chuẩn tham chiếu: PowerSchool, Infinite Campus, Canvas LMS, Ellucian Banner*
