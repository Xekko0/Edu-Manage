# Ma trận phân quyền — EduSmart v1.1

> Đây là tài liệu chuẩn quyền hệ thống. Mọi controller/middleware phải tuân theo `src/config/permissions.js`.

## Phân cấp tổng quan

```
Admin
 └── Giáo viên (do admin phân công)
       ├── GVBM (môn × lớp × năm học)   → bảng teacher_assignments
       ├── GVCN (1 lớp × 1 năm học)     → classes.homeroom_teacher_id
       └── Cả hai: gộp quyền trên **một tài khoản** `role='subject'` + `homeroom_teacher_id` + `teacher_assignments`
             ├── Học sinh  (chỉ xem — bản thân)
             └── Phụ huynh (chỉ xem — con đã được GVCN liên kết)
```

---

## 1. Admin — toàn quyền

| Phạm vi | Hành động |
| --- | --- |
| Tài khoản | Tạo / sửa / xóa / reset password mọi tài khoản (GV, PH, HS) |
| Danh mục | CRUD môn học, khối, lớp, năm học, học phí |
| Phân công | Gán GVBM (môn × lớp), gán GVCN (lớp) |
| Dữ liệu | Toàn quyền xem & chỉnh sửa mọi bảng |

---

## 2. Giáo viên — gộp quyền theo vai trò được phân

> 1 tài khoản có thể vừa là GVCN của lớp A vừa là GVBM dạy môn X ở lớp B và C. Hệ thống tự gộp quyền.

### 2.1 Vai trò GVBM (subject) — phạm vi: môn × lớp được phân công

| Hành động | Có quyền |
| --- | --- |
| Nhập / sửa điểm môn mình ở lớp được phân công | ✅ (qua `teacher_assignments`) |
| Quản lý cột điểm, bài kiểm tra môn đó | ✅ |
| Xem danh sách HS các lớp dạy | ✅ |
| Ghi sổ đầu bài tiết dạy của mình | ✅ |
| Nhận xét HS môn mình | ✅ |
| Sửa điểm môn khác | ❌ |
| Liên kết PH ↔ HS | ❌ |
| Tạo / sửa tài khoản | ❌ |

### 2.2 Vai trò GVCN (homeroom) — phạm vi: lớp chủ nhiệm

| Hành động | Có quyền |
| --- | --- |
| Xem toàn bộ điểm tất cả môn của lớp | ✅ |
| Thêm / sửa HS trong lớp (tên, ngày sinh, mật khẩu...) | ✅ |
| Reset mật khẩu HS lớp mình | ✅ |
| Tạo / sửa tài khoản PH cho HS trong lớp | ✅ |
| Liên kết HS ↔ PH | ✅ |
| Ghi sổ đầu bài tổng cho lớp | ✅ |
| Đánh giá / nhận xét HS lớp mình | ✅ |
| Điểm danh lớp mình | ✅ |
| Sửa điểm môn không phải mình dạy | ❌ (trừ khi đồng thời được phân công GVBM môn đó) |

---

## 3. Học sinh — chỉ xem (read-only)

| Được xem | Không được |
| --- | --- |
| Điểm số bản thân | Sửa bất kỳ dữ liệu nào |
| Lịch học, lịch thi | Xem dữ liệu HS khác |
| Thông báo từ trường + GV | |
| Đánh giá, nhận xét của GV | |
| Học phí bản thân | |

---

## 4. Phụ huynh — chỉ xem con đã liên kết (read-only)

| Được xem (con đã link) | Không được |
| --- | --- |
| Bảng điểm của con | Sửa bất kỳ dữ liệu nào |
| Lịch học, lịch thi của con | Xem con của PH khác |
| Thông báo trường + GV | |
| Đánh giá, nhận xét về con | |
| Học phí của con | |
| AI Chatbot Widget (hỏi nhanh) | |

---

## Cơ chế kiểm tra (định nghĩa middleware)

| Middleware | Kiểm tra |
| --- | --- |
| `auth.middleware` | Verify JWT, gắn `req.user = { id, role, email }` |
| `role.middleware(...allowed)` | Role có trong danh sách cho phép |
| `permission.middleware('xxx.yyy')` | Tra cứu `PERMISSIONS[xxx.yyy]` |
| `homeroom.middleware` | `classes.homeroom_teacher_id = req.user.id` (chủ nhiệm lớp đang thao tác) |
| `assignment.middleware` | Có dòng active trong `teacher_assignments` |
| `parentLink.middleware` | PH có dòng trong `parent_student` với `student_id` đang xem |
| `selfStudent.middleware` | HS chỉ truy cập `students.user_id = req.user.id` |
| `readOnly.middleware` | Chặn method POST/PUT/PATCH/DELETE cho PH & HS |

### Quy tắc kết hợp

- GVCN sửa HS lớp mình      → `auth` + `role(homeroom, admin)` + `homeroom(class_id)`
- GVBM nhập điểm            → `auth` + `role(subject, homeroom, admin)` + `assignment(class_id, subject_id)`
- PH xem điểm con           → `auth` + `role(parent)` + `parentLink(student_id)`
- HS xem điểm bản thân      → `auth` + `role(student)` + `selfStudent(student_id)`
