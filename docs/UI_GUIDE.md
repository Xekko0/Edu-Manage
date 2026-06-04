# Hướng dẫn UI — EduSmart v1.1

> Design system modern trung tính: **slate + teal**. Tham chiếu luồng: [FLOWS.md](./FLOWS.md), tài khoản: [ACCOUNTS.md](./ACCOUNTS.md).

## Tokens

| Token | Tailwind | Mục đích |
|-------|----------|----------|
| Primary | `primary`, `brand` (alias) | CTA, nav active |
| Surface | `surface`, `bg-slate-50` | Nền app |
| Card | `bg-white shadow-card rounded-card` | Khối nội dung |
| Border | `border-slate-200` | Viền input/card |
| Danger | `rose-600` | Xóa, lỗi |

## Typography

- `text-display` — tiêu đề trang lớn
- `text-h1` — PageHeader
- `text-h2` — tiêu đề section trong Card
- `text-body` / `text-caption`

## Components (`frontend/src/components/ui`)

| Component | Dùng khi |
|-----------|----------|
| `Button` | Mọi CTA (`variant`: primary, secondary, outline, danger; `size`: sm/md/lg) |
| `Input` / `Select` | Form — luôn qua `FormField` nếu có label+error |
| `Card` + `CardHeader` + `CardBody` | Thay `bg-white border` thủ công |
| `DataTable` | Danh sách có cột + empty state |
| `EmptyState` | Không có dữ liệu |
| `StatCard` | Dashboard số liệu |
| `RoleBadge` | Hiển thị persona (`gvcn`, `gvbm`, …) |
| `PageHeader` | Tiêu đề trang + actions (không nút Quay lại — dùng TopBar) |

## Layout (`components/layout`)

- `AppShell` — sidebar desktop + drawer mobile + TopBar
- `navConfig.js` — menu theo persona
- `StudentContextBar` — PH chọn con (sticky)

## Persona & navigation

| Persona | Nguồn | Home |
|---------|-------|------|
| admin | `role=admin` | `/admin` |
| gvcn | `capabilities.persona` hoặc `is_homeroom` | `/teacher/homeroom` |
| gvbm | `capabilities.persona` | `/teacher/subject` |
| parent / student | role | `/family` |

## Admin — Khung CT & phòng

| Trang | Mục đích |
|-------|----------|
| `/admin/curriculum` | Định mức tiết/tuần theo khối (Toán 4, Văn 4, …) |
| `/admin/rooms` | Phòng Lab, Tin học, lớp học — tránh trùng phòng khi sinh TKB |

## Admin — Thời khóa biểu (`/admin/schedules`)

1. **Khung giờ** — ngày dạy, tối đa 5 tiết/ca sáng & chiều → **Lưu khung giờ**
2. **Tự động xếp lịch** — đồng bộ phân công theo khung CT, xóa và sinh lại TKB lớp đang chọn
3. Panel **Kiểm tra toàn trường** — theo dõi trùng lịch / lệch khung CT
4. Lưới — kéo thả; ô đỏ = trùng GV / lớp / phòng → **Giải trùng** khi còn conflict
5. Modal **Sửa tiết** — phòng + chủ đề / nhắc bài tập / trực tiếp–trực tuyến + link (admin)

## GV / HS / PH — `/schedule`

- **GV**: lưới `ScheduleGridTable`; modal sửa phòng, chuyển tiết, nội dung tiết (`PATCH /schedules/:id/lesson`)
- **HS / PH**: `StudentScheduleView` — mỗi ô hiển thị môn, GV, phòng đầy đủ, badge Trực tiếp / Trực tuyến; online có nút **Vào lớp**
- Click tiết → `ScheduleSlotDetail` (chủ đề, nhắc bài tập nổi bật)
- **HS**: banner bật **Thông báo đẩy** (Web Push, HTTPS hoặc localhost); chọn nhắc 15 hoặc 30 phút trước giờ học

### Components (`frontend/src/components/schedule`)

| Component | Vai trò |
|-----------|---------|
| `StudentScheduleView` | Lưới TKB DTO cho HS/PH |
| `ScheduleSlotDetail` | Drawer chi tiết một tiết |
| `ScheduleGridTable` | Lưới GV/Admin |

Hook `useWebPush` + `public/sw.js` — đăng ký push qua `push.api.js`.

## Checklist smoke UI (5 tài khoản)

1. **Admin** — sidebar đủ nhóm; bảng Students trong Card
2. **GVCN** — menu Lớp CN; điểm danh; TopBar badge GVCN
3. **GVBM** — không menu điểm danh; nhập điểm
4. **PH** — context bar chọn con; family scores
5. **HS** — `/schedule`: phòng+GV+mode; chi tiết tiết; bật push; family dashboard; chat FAB teal

## Icons

Dùng `lucide-react`, size 18–20px trong nav và empty state.
