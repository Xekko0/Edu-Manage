# Ma trận luồng chức năng — EduSmart v1.1

> Chuẩn tham chiếu: [PERMISSIONS.md](./PERMISSIONS.md). GVCN = `users.role=subject` + `classes.homeroom_teacher_id`.

**Trạng thái:** OK | Lệch (đã sửa trong nhánh này) | Thiếu (backlog)

## 1. Xác thực & ngữ cảnh

| Chức năng | Actor | Route FE | API | Middleware | Trạng thái |
|-----------|-------|----------|-----|------------|------------|
| Đăng nhập | Tất cả | `/login` | `POST /auth/login` | — | OK |
| Hồ sơ + capabilities | GV/Admin/PH/HS | (auto) | `GET /auth/me` | auth | OK |
| Năm học mặc định | Tất cả | context | `CURRENT_SCHOOL_YEAR` env | — | OK |

## 2. Admin

| Chức năng | Route FE | API | Trạng thái |
|-----------|----------|-----|------------|
| Tổng quan | `/admin` | reports/stats | OK |
| Tài khoản | `/admin/users` | `/users` | OK |
| Học sinh | `/admin/students` | `/students` | OK |
| Lớp & khối | `/admin/classes` | `/classes` | OK |
| Môn học | `/admin/subjects` | `/subjects` | OK |
| Phân công GV | `/admin/assignments` | `/assignments` | OK |
| Phân bổ TKB | `/admin/schedules` | `/schedules` | OK (xếp lớp + toàn trường) |
| Học phí (cấu hình) | `/admin/tuitions` | `/tuitions` | OK |
| Báo cáo | `/admin/reports` | `/reports` | OK |
| Dự báo lên lớp | — | `/reports/promotion` | Thiếu (TODO SRS) |

## 3. Giáo viên — GVBM (`subject`, không GVCN)

| Chức năng | Route FE | API | Middleware | Trạng thái |
|-----------|----------|-----|------------|------------|
| Lớp dạy | `/teacher/subject` | `/assignments/mine` | auth | OK |
| Nhập điểm | `/teacher/score-entry` | `POST /scores/bulk` | auth + assignment | OK |
| Sổ đầu bài | `/teacher/journal` | `/journals` | assignment | OK |
| Đánh giá môn | `/teacher/evaluations` | `/evaluations` | auth | OK |
| TKB (lớp/môn) | `/schedule` | `/schedules` | auth | OK |
| Điểm danh lớp | — | — | — | OK (ẩn menu) |
| Liên kết PH | — | — | — | OK (ẩn menu) |

## 4. Giáo viên — GVCN (`subject` + homeroom_teacher_id)

| Chức năng | Route FE | API | Middleware | Trạng thái |
|-----------|----------|-----|------------|------------|
| Lớp chủ nhiệm | `/teacher/homeroom` | `/auth/me` | auth | OK |
| HS lớp | `/teacher/students` | `/students?class_id` | homeroom/list | OK |
| PH lớp | `/teacher/parents` | `/users/parent` | homeroom | OK |
| Điểm danh | `/teacher/attendance` | `POST/GET /attendance` | homeroom | OK |
| Xem điểm cả lớp | `/teacher/reports` | `GET /scores/class/:id` | classView | OK |
| Nhập điểm (môn được phân) | `/teacher/score-entry` | assignment | assignment | OK |
| Báo cáo lớp | `/teacher/reports` | `/reports/class` | homeroom | OK |

## 5. Phụ huynh / Học sinh

| Chức năng | Route FE | API | Middleware | Trạng thái |
|-----------|----------|-----|------------|------------|
| Chọn con (PH) | StudentSelector | `/students/me` | auth | OK |
| Bảng điểm | `/family/scores` | `GET /scores/student/:id` | parentLink | OK |
| Học bạ PDF | `/family/gradebook` | `GET .../pdf` | parentLink | OK |
| Đánh giá | `/family/evaluations` | `/evaluations/student/:id` | parentLink | OK |
| Học phí | `/family/tuition` | `/tuitions/student/:id` | parentLink | OK |
| TKB | `/schedule` | `GET /schedules/my-class` (DTO) | parentLink/self | OK |
| Thông báo | `/notifications` | `/notifications/me` | auth | OK |
| AI Chat | Widget | `/chat/message` | orchestrator | OK |

## 6. AI Chat (5 persona)

| Persona | Điều kiện | Tools | Trạng thái |
|---------|-----------|-------|------------|
| admin | role=admin | staff.* | OK |
| gvcn | subject + homeroom | staff.* + scope lớp CN | OK |
| gvbm | subject | staff.* + assignment | OK |
| parent | role=parent | family.* | OK |
| student | role=student | family.* | OK |

## 7. Thời khóa biểu (TKB)

### Luồng Admin (theo thực tế trường)

1. **Khung CT khối** — `GET/PUT /api/curriculum-standards` (định mức tiết/tuần theo khối 10–12)
2. **Phòng học** — `GET/POST/PUT /api/rooms` (Lab, Tin học, …)
3. **Khung giờ** — `GET/PUT /api/timetable-config` (tối đa **5 tiết/buổi**)
4. **Phân công GV** — `/admin/assignments` — `periods_per_week` **phải khớp** khung CT khối (API 400 nếu lệch)
5. **Sinh TKB** — `POST /schedules/generate`, `POST /schedules/generate-school` (chặn nếu lệch khung CT)
6. **Chỉnh tay** — kéo thả / CRUD tiết
7. **Xếp lại** — `POST /schedules/repack`, `POST /schedules/repack-school` (chỉ đổi vị trí)
8. **Kiểm tra** — `GET /schedules/validation`, `GET /schedules/validation-school` (`hard_ok`, `hard_violations`)
9. **Giải trùng** — `POST /schedules/resolve-conflicts`

| Ràng buộc cứng | Mô tả |
|----------------|--------|
| Một ô lớp | Tối đa 1 tiết / ô lớp |
| Một ô GV | Tối đa 1 tiết / khung giờ GV toàn trường |
| Một phòng | Không hai lớp cùng phòng cùng tiết (sinh TKB + CRUD) |
| Khung CT | `periods_per_week` phân công = chuẩn khối |
| Tối đa 5 tiết/buổi | `morning_periods` / `afternoon_periods` ≤ 5 |

| Vai trò xem TKB | Route |
|-----------------|-------|
| Admin | `/admin/schedules` |
| GV | `/schedule` (lớp / chỉ tiết mình dạy) |
| HS / PH | `/schedule` — lưới `StudentScheduleView`, click tiết → chi tiết; Web Push nhắc giờ |

### Luồng HS / PH (TKB chi tiết)

1. **Danh sách tiết** — `GET /api/schedules/my-class` trả `items[]` DTO (`slot_id`, `teacher_name`, `room` đầy đủ + campus, `delivery_mode`, `online_meeting_url`, `lesson_topic`, `homework_reminder`).
2. **Chi tiết tiết** — click ô → drawer `ScheduleSlotDetail` (cùng DTO).
3. **GV / Admin cập nhật tiết** — `PATCH /api/schedules/:id/lesson` (`lesson_topic`, `homework_reminder`, `delivery_mode`, `online_meeting_url`; online bắt buộc URL hợp lệ).
4. **Web Push (HS)** — `GET /api/push/vapid-public-key`, `POST /api/push/subscribe`; service worker `public/sw.js`; nhắc trước giờ học (15 hoặc 30 phút, preference localStorage) qua cron `ENABLE_SCHEDULE_CRON=1`.
5. **Đổi TKB đột xuất** — sau `update` / `move` / `generate-school` → in-app + push cho HS/PH lớp (`type=schedule`).

| API bổ sung | Mô tả |
|-------------|--------|
| `GET /schedules?view=student` | DTO cho HS/PH khi gọi list có `class_id` |
| `GET /schedules/my-class` | Tự lấy `class_id` từ HS / con PH |
| `PATCH /schedules/:id/lesson` | Metadata tiết (GV tiết mình + admin) |
| `GET/POST/DELETE /push/*` | VAPID + đăng ký subscription |

Sinh TKB: CREATE từ phân công, busy map GV + phòng chung toàn trường; gán `room_id` từ bảng phòng. Xếp lại: chỉ UPDATE vị trí.

Alias cũ: `POST /schedules/auto-arrange` → sinh lớp; `auto-arrange-school` → sinh hoặc giải trùng tùy body.

## 8. Checklist kiểm thử nhanh (5 tài khoản)

Xem [ACCOUNTS.md](./ACCOUNTS.md). Script: `backend/scripts/demo-chat-personas.ps1`.

| Tài khoản | Kiểm tra |
|-----------|----------|
| admin@ | Thống kê, phân công, TKB admin |
| gvcn.10a1@ | Điểm danh, HS, PH, điểm lớp, không 403 |
| gv.toan@ | Nhập điểm môn phân công; không điểm danh |
| ph.10a1.01@ | Điểm/học phí/TKB con; chat có payload |
| hs.10a1.01@ | TKB: phòng+GV+mode; click tiết; bật push; nhận thông báo khi admin đổi TKB |
