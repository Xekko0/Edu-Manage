# ĐẶC TẢ CHI TIẾT MODULE THỜI KHÓA BIỂU (TIMETABLE MODULE SPECIFICATION)

> EduSmart Next-Gen v2.0 — Tài liệu thiết kế chi tiết module TKB
> Bao gồm: Data Model, Business Logic, API, UI Components, Workflows

---

## Mục lục

1. [Tổng quan module](#1-tổng-quan-module)
2. [Mô hình dữ liệu](#2-mô-hình-dữ-liệu)
3. [Ràng buộc nghiệp vụ](#3-ràng-buộc-nghiệp-vụ)
4. [Thuật toán xếp lịch](#4-thuật-toán-xếp-lịch)
5. [API Endpoints](#5-api-endpoints)
6. [UI Components](#6-ui-components)
7. [Workflows](#7-workflows)
8. [Sub-features](#8-sub-features)

---

## 1. Tổng quan module

Module Thời khóa biểu (TKB) là phân hệ phức tạp nhất của EduSmart, đảm nhận vai trò **điều phối đa tài nguyên** (Giáo viên, Phòng học, Học sinh) trong không gian thời gian (Tuần, Ngày, Ca, Tiết).

### 1.1. Phạm vi chức năng

| Chức năng | Mô tả | Vai trò |
|-----------|-------|---------|
| Cấu hình khung giờ | Thiết lập ngày dạy, ca sáng/chiều, số tiết/ca, thời lượng tiết, giờ nghỉ | Admin |
| Khung chương trình khối | Định mức tiết/năm, tiết/tuần cho mỗi môn theo khối | Admin |
| Phân công GV | Gán GV → Lớp × Môn × HK × Tiết/tuần | Admin |
| Xếp lịch tự động | Hill Climbing solver xếp tiết vào lưới | Admin |
| Xếp lịch thủ công | Kéo thả tiết từ palette vào lưới | Admin |
| Kiểm tra xung đột | Validate cứng/mềm toàn trường hoặc theo lớp | Admin |
| Giải trùng | Tự động resolve conflicts | Admin |
| Xem lịch theo lớp | Lưới TKB lớp học | All |
| Xem lịch theo GV | Lưới lịch làm việc GV | Admin, GV |
| Xem lịch theo phòng | Trạng thái sử dụng phòng | Admin |
| Xem lịch cá nhân | Timeline/dòng thời gian cho HS/GV | HS, GV, PH |
| Sửa tiết học | Đổi phòng, nội dung, hình thức | Admin, GV |
| Tuần chẵn/lẻ | Xếp lịch theo chu kỳ 2 tuần | Admin |
| Dạy thay | Đề xuất GV thay thế tự động | Admin |
| iCal feed | Đồng bộ lịch sang Google/Apple/Outlook | All |
| Nhắc lịch | Cron nhắc trước giờ học | HS, GV |

### 1.2. Actors (Người tham gia)

| Actor | Vai trò | Quyền |
|-------|---------|-------|
| Admin | Quản trị viên | Tạo/sửa/xóa TKB, cấu hình, xếp lịch |
| GVCN | Giáo viên chủ nhiệm | Xem TKB lớp CN, sửa tiết mình dạy |
| GVBM | Giáo viên bộ môn | Xem TKB mình dạy, sửa nội dung tiết |
| Học sinh | Người học | Xem TKB lớp mình |
| Phụ huynh | Người giám hộ | Xem TKB con |

---

## 2. Mô hình dữ liệu

### 2.1. Entity Relationship

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ timetable_configs│     │    subjects      │     │     rooms       │
│ (Cấu hình khung │     │   (Môn học)      │     │  (Phòng học)    │
│  giờ)           │     └────────┬────────┘     └────────┬────────┘
└────────┬────────┘              │                       │
         │                       │                       │
         │              ┌────────┴────────┐              │
         │              │teacher_assignments│             │
         │              │(Phân công GV)    │             │
         │              └────────┬────────┘              │
         │                       │                       │
         │    ┌──────────────────┼───────────────────────┘
         │    │                  │
         │    ▼                  ▼
         │ ┌─────────────────────────────────────────────┐
         └►│                  schedules                   │
           │            (Tiết học — Bảng trung tâm)       │
           ├─────────────────────────────────────────────┤
           │ id, class_id, subject_id, teacher_id        │
           │ day_of_week, session, period, semester       │
           │ room_id, week_parity, delivery_mode          │
           │ lesson_topic, homework_reminder              │
           │ online_meeting_url, school_year              │
           └──────────────────┬──────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  attendance   │ │  schedules   │ │teacher_      │
     │ (Điểm danh)  │ │ (Xung đột)  │ │unavailability│
     └──────────────┘ └──────────────┘ │(Lịch bận GV) │
                                       └──────────────┘
```

### 2.2. Bảng `timetable_configs` — Cấu hình khung giờ

| Cột | Kiểu | Mô tả | Ví dụ |
|-----|------|-------|-------|
| id | INT PK | Khóa chính | 1 |
| school_year | VARCHAR(9) | Năm học | "2024-2025" |
| semester | INT | Học kỳ | 1 |
| teaching_days | JSON | Ngày dạy trong tuần | `[1,2,3,4,5]` (T2-T6) |
| morning_periods | INT | Số tiết/ca sáng | 5 |
| afternoon_periods | INT | Số tiết/ca chiều | 4 |
| afternoon_enabled | BOOLEAN | Bật ca chiều | true |
| period_duration_minutes | INT | Thời lượng tiết (phút) | 45 |
| morning_break_after | INT | Nghỉ sau tiết thứ | 2 |
| morning_break_minutes | INT | Thời gian nghỉ (phút) | 20 |
| semester_start | DATE | Ngày bắt đầu HK | 2024-09-01 |
| semester_end | DATE | Ngày kết thúc HK | 2025-01-31 |
| holidays | JSON | Ngày nghỉ lễ | `["2024-09-02"]` |
| period_times | JSON | Giờ bắt đầu/kết thúc mỗi tiết | `{1:{start:"07:00",end:"07:45"}}` |

### 2.3. Bảng `schedules` — Tiết học (Bảng trung tâm)

| Cột | Kiểu | Mô tả | Constraint |
|-----|------|-------|-----------|
| id | INT PK | Khóa chính | Auto-increment |
| class_id | INT FK | Lớp học | NOT NULL → classes.id |
| subject_id | INT FK | Môn học | NOT NULL → subjects.id |
| teacher_id | INT FK | Giáo viên | NOT NULL → users.id |
| day_of_week | INT | Thứ (1=T2, 7=CN) | NOT NULL |
| session | VARCHAR | Ca (morning/afternoon) | NOT NULL |
| period | INT | Tiết (1–9) | NOT NULL |
| semester | INT | Học kỳ (1/2) | NOT NULL |
| room_id | INT FK | Phòng học | → rooms.id |
| room | VARCHAR | Tên phòng (legacy) | — |
| week_parity | ENUM | Tuần (all/even/odd) | DEFAULT 'all' |
| delivery_mode | ENUM | Hình thức (offline/online) | DEFAULT 'offline' |
| online_meeting_url | VARCHAR | Link Zoom/Teams | — |
| lesson_topic | VARCHAR | Chủ đề tiết học | — |
| homework_reminder | VARCHAR | Nhắc bài tập | — |
| school_year | VARCHAR(9) | Năm học | NOT NULL |

**Indexes:**
- `(class_id, day_of_week, session, period, semester, week_parity)` — Unique slot per class
- `(teacher_id, day_of_week, session, period, semester)` — Check teacher conflict
- `(room_id, day_of_week, session, period, semester)` — Check room conflict

### 2.4. Bảng `teacher_unavailability` — Lịch bận GV

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT PK | Khóa chính |
| teacher_id | INT FK | Giáo viên |
| school_year | VARCHAR(9) | Năm học |
| day_of_week | INT | Thứ |
| session | VARCHAR | Ca |
| period | INT | Tiết |
| reason | VARCHAR(200) | Lý do bận |

### 2.5. Bảng `rooms` — Phòng học

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT PK | Khóa chính |
| name | VARCHAR | Tên phòng (P.201, Lab) |
| room_type | VARCHAR | Loại (classroom/lab/computer/gym) |
| capacity | INT | Sức chứa |
| campus | VARCHAR | Cơ sở |
| is_active | BOOLEAN | Hoạt động |

### 2.6. Bảng `room_assets` — Thiết bị phòng

| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | INT PK | Khóa chính |
| room_id | INT FK | Phòng học |
| asset_name | VARCHAR | Tên thiết bị |
| quantity | INT | Số lượng |
| condition | ENUM | good/needs_repair/broken |

---

## 3. Ràng buộc nghiệp vụ

### 3.1. Ràng buộc cứng (Hard Constraints) — BẮT BUỘC

| # | Ràng buộc | Mô tả | Kiểm tra tại |
|---|-----------|-------|--------------|
| HC1 | Ô lớp | Tối đa 1 tiết / `(class, day, session, period, week_parity)` | `hard-checker.js` |
| HC2 | Ô GV | Tối đa 1 tiết / `(teacher, day, session, period)` toàn trường | `hard-checker.js` |
| HC3 | Phòng | Không 2 lớp cùng phòng cùng `(day, session, period)` | `hard-checker.js` |
| HC4 | Khung CT | `periods_per_week` phân công = chuẩn khối | `hard-checker.js` |
| HC5 | 7 tiết/ngày | Tối đa 7 tiết / `(class, day)` gộp sáng+chiều (GDPT) | `hard-checker.js` |
| HC6 | GV bận | Không xếp tiết vào `(teacher, day, session, period)` có trong `teacher_unavailability` | `hard-checker.js` |
| HC7 | Phòng loại | Môn cần lab → phải xếp vào phòng loại lab | `hard-checker.js` |

### 3.2. Ràng buộc mềm (Soft Constraints) — ƯU TIÊN

| # | Ràng buộc | Mô tả | Trọng số |
|---|-----------|-------|----------|
| SC1 | Phân tán môn | Không dồn môn cùng buổi/ngày | -2 per duplicate |
| SC2 | Gap tiết | Tránh tiết trống xen kẽ giữa các tiết dạy | -3 per gap |
| SC3 | Tiết chiều | Ưu tiên xếp sáng trước | -1 per afternoon slot |
| SC4 | Cân bằng ngày | Phân bổ đều số tiết mỗi ngày | -1 per imbalance |
| SC5 | Thứ tự tự nhiên | Môn chính ưu tiên tiết 1-3 | -1 per violation |

### 3.3. Logic kiểm tra xung đột

```javascript
// hard-checker.js — Kiểm tra 1 tiết có vi phạm HC không
function checkHardConstraints(slot, existingSlots, rooms, unavailability) {
  const violations = [];

  // HC1: Trùng ô lớp
  const classConflict = existingSlots.find(s =>
    s.class_id === slot.class_id &&
    s.day_of_week === slot.day_of_week &&
    s.session === slot.session &&
    s.period === slot.period &&
    (s.week_parity === 'all' || slot.week_parity === 'all' || s.week_parity === slot.week_parity)
  );
  if (classConflict) violations.push('class');

  // HC2: Trùng GV
  const teacherConflict = existingSlots.find(s =>
    s.teacher_id === slot.teacher_id &&
    s.day_of_week === slot.day_of_week &&
    s.session === slot.session &&
    s.period === slot.period
  );
  if (teacherConflict) violations.push('teacher');

  // HC3: Trùng phòng
  if (slot.room_id) {
    const roomConflict = existingSlots.find(s =>
      s.room_id === slot.room_id &&
      s.day_of_week === slot.day_of_week &&
      s.session === slot.session &&
      s.period === slot.period
    );
    if (roomConflict) violations.push('room');
  }

  // HC6: GV bận
  const isUnavailable = unavailability.some(u =>
    u.teacher_id === slot.teacher_id &&
    u.day_of_week === slot.day_of_week &&
    u.session === slot.session &&
    u.period === slot.period
  );
  if (isUnavailable) violations.push('teacher_unavailable');

  // HC7: Phòng loại
  if (slot.room_type_required) {
    const room = rooms.find(r => r.id === slot.room_id);
    if (room && room.room_type !== slot.room_type_required) {
      violations.push('room_type');
    }
  }

  return violations;
}
```

---

## 4. Thuật toán xếp lịch

### 4.1. Tổng quan luồng

```
Admin bấm "Xếp toàn trường"
  │
  ▼
┌─────────────────────────────────────┐
│ Step 1: Build Problem                │
│ - Lấy tất cả teacher_assignments    │
│ - Tính periods_needed per assignment │
│ - Tạo slots cần xếp                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Step 2: Greedy Initial Placement     │
│ - Thứ tự: môn có nhiều tiết trước  │
│ - Chọn ô có soft score cao nhất    │
│ - Đảm bảo không vi phạm HC        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Step 3: Hill Climbing Optimization   │
│ - Lặp: random move/swap             │
│ - Chấp nhận nếu soft score cải thiện│
│ - Timeout: 30s hoặc ~2000 bước     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Step 4: Bulk Create                  │
│ - Lưu tất cả schedules vào DB      │
│ - Trả kết quả (created, missing)   │
└─────────────────────────────────────┘
```

### 4.2. Greedy Initial Placement

```javascript
// greedy-init.js
function greedyInit(assignments, grid, rooms, unavailability) {
  // Sắp xếp theo độ khó: môn có nhiều tiết/tuần trước
  const sorted = assignments.sort((a, b) => b.periods_per_week - a.periods_per_week);

  const placed = [];

  for (const assignment of sorted) {
    for (let i = 0; i < assignment.periods_per_week; i++) {
      // Tìm ô tốt nhất (không vi phạm HC, soft score cao nhất)
      let bestSlot = null;
      let bestScore = -Infinity;

      for (const day of grid.days) {
        for (const period of grid.periods) {
          const session = period <= grid.morningPeriods ? 'morning' : 'afternoon';
          const candidate = {
            class_id: assignment.class_id,
            subject_id: assignment.subject_id,
            teacher_id: assignment.teacher_id,
            day_of_week: day,
            session,
            period,
            semester: assignment.semester,
          };

          const violations = checkHardConstraints(candidate, placed, rooms, unavailability);
          if (violations.length > 0) continue;

          const score = computeSoftScore(candidate, placed);
          if (score > bestScore) {
            bestScore = score;
            bestSlot = candidate;
          }
        }
      }

      if (bestSlot) {
        placed.push(bestSlot);
      }
    }
  }

  return placed;
}
```

### 4.3. Hill Climbing Optimization

```javascript
// hill-climb.js
function hillClimb(initialSlots, grid, rooms, unavailability, timeout = 30000) {
  let current = [...initialSlots];
  let currentScore = computeTotalSoftScore(current);
  const startTime = Date.now();
  let steps = 0;

  while (Date.now() - startTime < timeout && steps < 2000) {
    steps++;

    // Chọn ngẫu nhiên 1 move hoặc swap
    const action = Math.random() < 0.5 ? 'move' : 'swap';

    let candidate;
    if (action === 'move') {
      // Move: đổi vị trí 1 tiết
      const idx = Math.floor(Math.random() * current.length);
      const slot = { ...current[idx] };
      const newDay = grid.days[Math.floor(Math.random() * grid.days.length)];
      const newPeriod = grid.periods[Math.floor(Math.random() * grid.periods.length)];
      slot.day_of_week = newDay;
      slot.period = newPeriod;
      slot.session = newPeriod <= grid.morningPeriods ? 'morning' : 'afternoon';

      const violations = checkHardConstraints(slot, current.filter((_, i) => i !== idx), rooms, unavailability);
      if (violations.length > 0) continue;

      candidate = [...current];
      candidate[idx] = slot;
    } else {
      // Swap: đổi vị trí 2 tiết
      const idx1 = Math.floor(Math.random() * current.length);
      let idx2 = Math.floor(Math.random() * current.length);
      if (idx1 === idx2) continue;

      candidate = [...current];
      const temp = { ...candidate[idx1] };
      candidate[idx1] = { ...candidate[idx2], class_id: temp.class_id, subject_id: temp.subject_id, teacher_id: temp.teacher_id };
      candidate[idx2] = { ...temp, class_id: candidate[idx2].class_id, subject_id: candidate[idx2].subject_id, teacher_id: candidate[idx2].teacher_id };

      // Kiểm tra HC cho cả 2 tiết mới
      const v1 = checkHardConstraints(candidate[idx1], candidate.filter((_, i) => i !== idx1), rooms, unavailability);
      const v2 = checkHardConstraints(candidate[idx2], candidate.filter((_, i) => i !== idx2), rooms, unavailability);
      if (v1.length > 0 || v2.length > 0) continue;
    }

    const newScore = computeTotalSoftScore(candidate);
    if (newScore > currentScore) {
      current = candidate;
      currentScore = newScore;
    }
  }

  return { slots: current, score: currentScore, steps };
}
```

### 4.4. Soft Scorer

```javascript
// soft-scorer.js
function computeSoftScore(slot, existingSlots) {
  let score = 0;

  // SC1: Phân tán môn — phạt nếu cùng môn cùng ngày
  const sameSubjectSameDay = existingSlots.filter(s =>
    s.class_id === slot.class_id &&
    s.subject_id === slot.subject_id &&
    s.day_of_week === slot.day_of_week
  );
  score -= sameSubjectSameDay.length * 2;

  // SC2: Gap tiết — phạt nếu tạo gap
  const classDaySlots = existingSlots
    .filter(s => s.class_id === slot.class_id && s.day_of_week === slot.day_of_week)
    .map(s => s.period)
    .sort((a, b) => a - b);
  classDaySlots.push(slot.period);
  classDaySlots.sort((a, b) => a - b);
  for (let i = 1; i < classDaySlots.length; i++) {
    if (classDaySlots[i] - classDaySlots[i-1] > 1) {
      score -= 3; // Gap penalty
    }
  }

  // SC3: Ưu tiên sáng
  if (slot.session === 'afternoon') score -= 1;

  return score;
}
```

---

## 5. API Endpoints

### 5.1. Cấu hình

| Method | Path | Mô tả | Role |
|--------|------|-------|------|
| GET | `/timetable-config` | Lấy cấu hình khung giờ | All |
| PUT | `/timetable-config` | Cập nhật cấu hình | Admin |

### 5.2. Quản lý TKB

| Method | Path | Mô tả | Role |
|--------|------|-------|------|
| GET | `/schedules?class_id=&semester=&school_year=` | TKB theo lớp | All |
| GET | `/schedules/mine` | TKB của GV hiện tại | GV |
| GET | `/schedules/my-class` | TKB lớp mình (HS/PH) | HS, PH |
| GET | `/schedules/by-room?room_id=` | TKB theo phòng | Admin |
| POST | `/schedules` | Tạo 1 tiết | Admin |
| PUT | `/schedules/:id` | Sửa tiết | Admin |
| PATCH | `/schedules/:id/move` | Di chuyển tiết | Admin |
| PATCH | `/schedules/:id/lesson` | Sửa nội dung tiết | Admin, GV |
| DELETE | `/schedules/:id` | Xóa tiết | Admin |

### 5.3. Xếp lịch tự động

| Method | Path | Mô tả | Role |
|--------|------|-------|------|
| POST | `/schedules/auto-arrange` | Xếp lịch 1 lớp | Admin |
| POST | `/schedules/auto-arrange-school` | Xếp lịch toàn trường | Admin |
| POST | `/schedules/resolve-conflicts` | Giải trùng | Admin |
| GET | `/schedules/validation?class_id=` | Validate 1 lớp | Admin |
| GET | `/schedules/validation-school` | Validate toàn trường | Admin |
| GET | `/schedules/readiness` | Kiểm tra readiness | Admin |

### 5.4. Dạy thay & iCal

| Method | Path | Mô tả | Role |
|--------|------|-------|------|
| GET | `/schedules/:id/substitutes` | Top 3 GV thay thế | Admin |
| GET | `/ical/teacher/:id` | iCal feed GV | Public |
| GET | `/ical/student/:id` | iCal feed HS | Public |
| GET | `/ical/class/:id` | iCal feed lớp | Public |
| GET | `/ical/link` | URL iCal cá nhân | Auth |

---

## 6. UI Components

### 6.1. Component Architecture

```
Schedule Page (/schedule)
├── PerspectiveSelector (Admin only)
│   ├── [Theo lớp] [Theo giáo viên] [Theo phòng]
│   └── Toggle switch giữa 3 view
│
├── StudentScheduleDashboard (HS)
│   ├── Header: ngày, lớp, sĩ số
│   ├── Now Card: tiết đang học (highlight)
│   ├── Next Card: tiết sắp tới
│   └── Timeline: danh sách tiết hôm nay
│
├── TeacherScheduleDashboard (GV)
│   ├── Header: ngày, tên GV, stats
│   ├── Now Card: tiết đang dạy
│   ├── Gap Alerts: tiết trống xen kẽ
│   └── Timeline: lịch dạy hôm nay
│
├── ParentScheduleDashboard (PH)
│   ├── Header: ngày, tên con, lớp
│   ├── Now Card: con đang học
│   └── Timeline: lịch học con
│
├── AdminResourceView (Admin - Phòng)
│   ├── Summary: tổng/trống/dùng/công suất cao
│   └── Room Grid: mỗi phòng 1 card
│       ├── Status: đang dùng/trống
│       ├── Current slot info
│       ├── Usage bar (%)
│       └── Period slots (color-code)
│
├── ScheduleGridTable (Admin/GV - Lớp)
│   ├── Header: Thứ × Tiết
│   ├── Break rows (ra chơi)
│   ├── Slot cells (click → detail)
│   └── Conflict overlay (đỏ nhấp nháy)
│
├── ScheduleCalendarNav
│   ├── Month calendar
│   ├── Week navigation (prev/next)
│   └── Semester dates
│
├── MobileTimeline (Mobile < 768px)
│   ├── Now section (highlight)
│   ├── Upcoming section
│   ├── Past section
│   └── Dynamic action buttons
│
├── ScheduleSlotDetail (Modal)
│   ├── Time, subject, teacher
│   ├── Room, delivery mode
│   ├── Online link button
│   ├── Lesson topic
│   └── Homework reminder
│
├── ConflictTooltip
│   ├── Red flash overlay
│   ├── Error message list
│   └── Arrow pointing to cell
│
└── EditSlotModal (Admin/GV)
    ├── Room input
    ├── Lesson topic
    ├── Homework reminder
    ├── Delivery mode selector
    ├── Online meeting URL
    ├── Move form (day/session/period)
    └── Delete button
```

### 6.2. Admin Schedule Hub (4 Tabs)

#### Tab 1: Chuẩn bị (Prepare)

```
┌─────────────────────────────────────────────────────────┐
│ CHECKLIST READINESS                                      │
│                                                          │
│ ✅ Bước 1: Khung chương trình khối                      │
│    → 12 chuẩn đã cấu hình cho khối 10, 11               │
│    [Đến trang Khung CT →]                                │
│                                                          │
│ ✅ Bước 2: Phòng học                                     │
│    → 8 phòng đã thiết lập                                │
│    [Đến trang Phòng →]                                   │
│                                                          │
│ ⚠️ Bước 3: Phân công GV                                 │
│    → 18/20 phân công (thiếu 2)                           │
│    [Đến trang Phân công →]                               │
│                                                          │
│ ✅ Bước 4: Khung giờ                                     │
│    → T2-T6, Sáng 5 tiết, Chiều 4 tiết                    │
│    [Cấu hình →]                                          │
│                                                          │
│ ✅ Bước 5: Lịch học kỳ                                   │
│    → HK1: 01/09 → 31/01                                  │
│    [Cấu hình →]                                          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ CẤU HÌNH KHUNG GIỜ                                      │
│                                                          │
│ Ngày dạy: [☑T2 ☑T3 ☑T4 ☑T5 ☑T6 ☐T7 ☐CN]              │
│                                                          │
│ Ca sáng: [5] tiết    Ca chiều: [☑ Bật] [4] tiết        │
│ Thời lượng: [45] phút                                    │
│                                                          │
│ Nghỉ: sau tiết [2], nghỉ [20] phút                       │
│                                                          │
│ HK1: [01/09/2024] → [31/01/2025]                         │
│ HK2: [01/02/2025] → [31/05/2025]                         │
│                                                          │
│ Nghỉ Tết: [25/01] → [09/02]                              │
│                                                          │
│ [Lưu cấu hình]                                           │
└─────────────────────────────────────────────────────────┘
```

#### Tab 2: Xếp lịch (Arrange)

```
┌─────────────────────────────────────────────────────────┐
│ [Lớp: 10A1 ▾] [☑Sáng ☑Chiều]                          │
│ [Xếp lớp này] [Xếp toàn trường] [Làm mới]               │
├──────────────────────┬──────────────────────────────────┤
│ PALETTE              │ LƯỚI TKB                         │
│ ┌──────────────────┐ │ ┌────┬────┬────┬────┬────┬────┐ │
│ │ 📘 Toán - GV:A   │ │ │    │ T2 │ T3 │ T4 │ T5 │ T6 │ │
│ │ (2/3 tiết)       │ │ ├────┼────┼────┼────┼────┼────┤ │
│ ├──────────────────┤ │ │ 1  │    │    │    │    │    │ │
│ │ 📗 Văn - GV:B   │ │ │ 2  │    │    │    │    │    │ │
│ │ (3/3 tiết) ✓     │ │ ├────┼────┼────┼────┼────┼────┤ │
│ ├──────────────────┤ │ │    │ RA │CHƠI│    │    │    │ │
│ │ 📙 Lý - GV:C    │ │ ├────┼────┼────┼────┼────┼────┤ │
│ │ (1/2 tiết)       │ │ │ 3  │    │    │    │    │    │ │
│ ├──────────────────┤ │ │ 4  │    │    │    │    │    │ │
│ │ 📕 Hóa - GV:D   │ │ │ 5  │    │    │    │    │    │ │
│ │ (0/2 tiết)       │ │ ├────┼────┼────┼────┼────┼────┤ │
│ ├──────────────────┤ │ │ 6  │    │    │    │    │    │ │
│ │ 🗑 XÓA           │ │ │ 7  │    │    │    │    │    │ │
│ └──────────────────┘ │ │ 8  │    │    │    │    │    │ │
│                      │ │ 9  │    │    │    │    │    │ │
│ Kéo thả từ palette   │ └────┴────┴────┴────┴────┴────┘ │
│ vào lưới để xếp lịch │                                  │
└──────────────────────┴──────────────────────────────────┘
```

**Thao tác:**
- Kéo môn từ palette → ô trống = tạo tiết mới
- Kéo tiết → ô khác = di chuyển
- Kéo tiết → vùng xóa = xóa tiết
- Click tiết = mở EditSlotModal

#### Tab 3: Kiểm tra (Review)

```
┌─────────────────────────────────────────────────────────┐
│ KẾT QUẢ XẾP LỊCH                                        │
│ ┌─────────┬─────────┬─────────┬─────────┐               │
│ │ Lớp     │ Đã xếp  │ Thiếu   │ Trùng   │               │
│ ├─────────┼─────────┼─────────┼─────────┤               │
│ │ 10A1    │ 28/28   │ 0       │ 0       │               │
│ │ 10A2    │ 27/28   │ 1       │ 0       │               │
│ │ 11A1    │ 28/28   │ 0       │ 0       │               │
│ └─────────┴─────────┴─────────┴─────────┘               │
├─────────────────────────────────────────────────────────┤
│ VALIDATION TOÀN TRƯỜNG                                   │
│                                                          │
│ Hard OK: ✅ Không vi phạm ràng buộc cứng                 │
│ Curriculum OK: ⚠️ 1 lớp thiếu 1 tiết                    │
│ Soft Score: 85/100                                       │
│                                                          │
│ Chi tiết vi phạm:                                        │
│ • 10A2: Thiếu 1 tiết Toán (GV:A bận tiết 3 T4)         │
│                                                          │
│ [Giải trùng] [Làm mới]                                  │
├─────────────────────────────────────────────────────────┤
│ TỔNG HỢP PER-CLASS                                       │
│ ┌─────────┬────────┬────────┬────────┬────────┐         │
│ │ Lớp     │ Toán   │ Văn    │ Lý     │ ...    │         │
│ ├─────────┼────────┼────────┼────────┼────────┤         │
│ │ 10A1    │ 3/3    │ 3/3    │ 2/2    │        │         │
│ │ 10A2    │ 2/3 ⚠️ │ 3/3    │ 2/2    │        │         │
│ └─────────┴────────┴────────┴────────┴────────┘         │
└─────────────────────────────────────────────────────────┘
```

#### Tab 4: Xem lịch (View)

```
┌─────────────────────────────────────────────────────────┐
│ [Theo lớp ▾ / Theo phòng ▾] [☑Sáng ☑Chiều]             │
├─────────────────────────────────────────────────────────┤
│ ScheduleCalendarNav:                                      │
│ [<] Tháng 9/2024 [>]  ·  Tuần 16/09 → 22/09            │
│ [T2] [T3] [T4] [T5] [T6]                                │
├─────────────────────────────────────────────────────────┤
│ ┌────┬──────────┬──────────┬──────────┬──────────┬────┐ │
│ │ Tiết│   T2     │   T3     │   T4     │   T5     │ T6 │ │
│ ├────┼──────────┼──────────┼──────────┼──────────┼────┤ │
│ │ 1  │ Toán     │ Văn      │ Lý       │ Hóa      │ Anh│ │
│ │    │ GV:A     │ GV:B     │ GV:C     │ GV:D     │GV:E│ │
│ │    │ P.201    │ P.202    │ Lab      │ Lab      │P.203│ │
│ ├────┼──────────┼──────────┼──────────┼──────────┼────┤ │
│ │ 2  │ Toán     │ Anh      │ Hóa      │ Lý       │ Tin│ │
│ │    │ GV:A     │ GV:E     │ GV:D     │ GV:C     │GV:F│ │
│ │    │ P.201    │ P.203    │ Lab      │ Lab      │Tin │ │
│ ├────┼──────────┴──────────┴──────────┴──────────┴────┤ │
│ │ -- │                  RA CHƠI                         │ │
│ ├────┼──────────┬──────────┬──────────┬──────────┬────┤ │
│ │ 3  │ Tin      │ Sử       │ Địa      │ GDCD     │    │ │
│ │    │ GV:F     │ GV:G     │ GV:H     │ GV:I     │    │ │
│ │    │ Tin      │ P.202    │ P.202    │ P.202    │    │ │
│ └────┴──────────┴──────────┴──────────┴──────────┴────┘ │
└─────────────────────────────────────────────────────────┘
```

### 6.3. Student Schedule Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ 📅 Thứ Ba, 17/06/2025                                   │
│ Nguyễn An — Lớp 10A1                                     │
│ ┌─────────┬─────────┬─────────┐                         │
│ │ 6 tiết  │ 2/6 đã │ 4 sắp   │                         │
│ │ hôm nay │ học     │ tới     │                         │
│ └─────────┴─────────┴─────────┘                         │
├─────────────────────────────────────────────────────────┤
│ 🟢 ĐANG DIỄN RA (animate-pulse)                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Tiết 2 · 07:45 – 08:30                              │ │
│ │ 📘 Toán Học                                          │ │
│ │ 👤 GV: Nguyễn Văn A                                 │ │
│ │ 📍 Phòng 201                                         │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ 🔵 TIẾP THEO                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Tiết 3 — Vật Lý · 08:30 – 09:15                    │ │
│ │ 👤 GV: Trần Thị B · 📍 Phòng Lab                    │ │
│ │ ⚠️ BT: Làm bài tập chương 4                         │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ TẤT CẢ TIẾT HÔM NAY                                     │
│ [1] Văn · GV:C · P.305 ✅ Đã qua                       │
│ [2] Toán · GV:A · P.201 🔄 Đang học                    │
│ [3] Lý · GV:B · Lab ⏳ Sắp tới                         │
│ [4] Hóa · GV:D · P.102 ⏳ Sắp tới                      │
│ [5] Anh · GV:E · P.203 ⏳ Sắp tới                      │
│ [6] Tin · GV:F · Tin ⏳ Sắp tới                         │
└─────────────────────────────────────────────────────────┘
```

### 6.4. Mobile Timeline (< 768px)

```
┌─────────────────────────────────────┐
│ 📅 Thứ Ba, 17/06/2025              │
├─────────────────────────────────────┤
│ ⏰ Đang diễn ra                     │
│ ┌─────────────────────────────────┐ │
│ │ Tiết 2 · 07:45 – 08:30         │ │
│ │ 📘 Toán                         │ │
│ │ 👤 GV: Nguyễn A                 │ │
│ │ 📍 P.201 · Còn 15 phút         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⏰ Sắp tới                          │
│ ┌─────────────────────────────────┐ │
│ │ Tiết 3 · 08:30 – 09:15         │ │
│ │ 📘 Vật Lý                       │ │
│ │ 👤 GV: Trần B · 📍 Lab         │ │
│ │ 🔗 [Vào lớp online]            │ │ ← Dynamic button
│ │ ⚠️ BT: Chương 4                │ │ ← Homework badge
│ └─────────────────────────────────┘ │
│                                     │
│ ⏰ Đã qua                           │
│ ┌─────────────────────────────────┐ │
│ │ Tiết 1 · 07:00 – 07:45         │ │
│ │ 📘 Văn · GV: Lê C · P.305     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 6.5. Edit Slot Modal

```
┌─────────────────────────────────────────────────────────┐
│ SỬA TIẾT HỌC                                    [×]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 📘 Toán — Lớp 10A1                                      │
│ GV: Nguyễn Văn A                                         │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Phòng: [P.201        ]                               │ │
│ │ Chủ đề: [Giải phương trình bậc 2      ]             │ │
│ │ Nhắc BT: [Bài tập trang 45             ]            │ │
│ │ Hình thức: [Trực tiếp ▾]                             │ │
│ │ Link online: [                              ]        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ─── Chuyển sang ô khác ───                              │
│                                                          │
│ Thứ: [T2 ▾]  Ca: [Sáng ▾]  Tiết: [1 ▾]                │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Lưu nội dung]  [Lưu vị trí]  [Xóa tiết]  [Hủy]   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 6.6. Conflict Tooltip

```
Khi kéo tiết "Toán - GV:A" vào ô T3 Tiết 2 (GV:A đã có lịch ở 10A2):

┌─────────────────────────────────────┐
│ ⚠️ Xung đột lịch học                │
│ • Giáo viên đã có tiết ở lớp khác  │
│                                     │
│ GV Nguyễn Văn A đã dạy 10A2 lúc    │
│ T3, Tiết 2                          │
└─────────────────────────────────────┘
         ▲ (mũi tên chỉ ô bị lỗi)
    ┌────┴────┐
    │ [ĐỎ    │ ← Ô lưới nhấp nháy đỏ
    │  NHẤP  │    animate-pulse
    │  NHÁY] │
    └─────────┘
```

---

## 7. Workflows

### 7.1. Luồng xếp lịch từ đầu

```
Admin đăng nhập
  │
  ▼
Vào /admin/schedules → Tab "Chuẩn bị"
  │
  ├─ Bước 1: Khung CT khối → /admin/curriculum
  │   └─ Thêm chuẩn: khối 10, Toán, HK1, 3 tiết/tuần
  │
  ├─ Bước 2: Phòng học → /admin/rooms
  │   └─ Thêm: P.201 (classroom, 40 chỗ), Lab (lab, 30 chỗ)
  │
  ├─ Bước 3: Phân công GV → /admin/assignments
  │   └─ GV:A dạy Toán lớp 10A1, HK1, 3 tiết/tuần
  │
  ├─ Bước 4: Khung giờ → Tab "Chuẩn bị" → Form
  │   └─ T2-T6, Sáng 5 tiết, Chiều 4 tiết, 45 phút/tiết
  │
  └─ Bước 5: Lịch HK → Tab "Chuẩn bị" → Form
      └─ HK1: 01/09 → 31/01, Nghỉ Tết: 25/01 → 09/02
  │
  ▼
Tab "Xếp lịch"
  │
  ├─ Chọn lớp 10A1 → [Xếp lớp này]
  │   └─ Greedy init → Hill Climbing → Kết quả
  │
  └─ Hoặc [Xếp toàn trường]
      └─ Xếp lần lượt 3 lớp → Tổng hợp
  │
  ▼
Tab "Kiểm tra"
  │
  ├─ Xem kết quả: 10A1 28/28 ✓, 10A2 27/28 ⚠️
  ├─ Hard OK ✓, Soft Score 85/100
  └─ [Giải trùng] → Tự động sửa 10A2
  │
  ▼
Tab "Xem lịch"
  │
  └─ Xem lưới TKB hoàn chỉnh, click tiết để sửa
```

### 7.2. Luồng sửa tiết thủ công

```
Admin/GV click vào tiết trên lưới
  │
  ▼
EditSlotModal mở
  │
  ├─ Sửa phòng: P.201 → Lab
  ├─ Sửa chủ đề: "Giải PT bậc 2" → "Hàm số"
  ├─ Sửa hình thức: Trực tiếp → Trực tuyến
  ├─ Nhập link: https://zoom.us/j/...
  ├─ Nhập BT: "Bài tập trang 50"
  │
  └─ [Lưu nội dung] → PATCH /schedules/:id/lesson
  └─ [Lưu vị trí] → PATCH /schedules/:id/move
  └─ [Xóa tiết] → DELETE /schedules/:id
```

### 7.3. Luồng dạy thay

```
GV:A báo bận đột xuất (thứ 3, tiết 2)
  │
  ▼
Admin cập nhật teacher_unavailability
  │
  ▼
GET /schedules/:id/substitutes
  │
  ▼
Hệ thống quét:
  1. Tìm GV dạy Toán (cùng subject_id)
  2. Loại trừ GV trùng tiết T3.T2
  3. Loại trừ GV bận (unavailability)
  4. Chấm điểm: ưu tiên GV trống tiết liền kề
  │
  ▼
Top 3 đề xuất:
  1. GV:B (trống T3.T1 và T3.T3) → Score 2
  2. GV:C (trống T3.T3) → Score 1
  3. GV:D (trống T3.T1) → Score 1
  │
  ▼
Admin chọn GV:B → Cập nhật schedule.teacher_id
```

### 7.4. Luồng đồng bộ iCal

```
User click "Thêm vào Calendar" trên trang Schedule
  │
  ▼
GET /ical/link → trả về URL
  │
  ▼
Modal hiển thị:
  • URL: https://edusmart.local/api/ical/student/42
  • [Copy URL]
  • Hướng dẫn: Google Calendar → Settings → Add by URL
  │
  ▼
User paste URL vào Google Calendar
  │
  ▼
Google Calendar tự động fetch .ics mỗi 12h
  │
  ▼
Lịch EduSmart hiển thị trên điện thoại
```

---

## 8. Sub-features

### 8.1. Tuần chẵn/lẻ (Week Parity)

**Mục tiêu:** Xếp lịch cho môn có số tiết lẻ (VD: Sử 1.5/tuần → tuần chẵn 2 tiết, tuần lẻ 1 tiết).

**Data model:**
```
schedules.week_parity: 'all' | 'even' | 'odd'
```

**UI:**
- Admin ViewTab: toggle "Tuần chẵn" / "Tuần lẻ" / "Cả hai"
- HS/PH: tự động hiển thị tuần hiện tại

**Logic:**
```
Nếu week_parity = 'all' → hiển thị mọi tuần
Nếu week_parity = 'even' → chỉ hiển thị tuần chẵn
Nếu week_parity = 'odd' → chỉ hiển thị tuần lẻ
```

### 8.2. Dạy thay tự động (Substitution)

**Mục tiêu:** Khi GV bận, tự đề xuất GV thay thế phù hợp.

**API:** `GET /schedules/:id/substitutes`

**Logic scoring:**
```
Score = gapScore + classBonus

gapScore:
  - GV trống tiết liền kề (trước/sau) = 0 → tốt
  - GV có 1 tiết liền kề = 1
  - GV có 2 tiết liền kề = 2 → xấu

classBonus:
  - GV đã dạy lớp này trước đó = +1
  - GV chưa dạy = +0

Sắp xếp: score thấp = tốt hơn → top 3
```

### 8.3. iCal Feed

**Mục tiêu:** Đồng bộ lịch sang Google/Apple/Outlook Calendar.

**API:**
- `GET /ical/teacher/:id` — Feed .ics cho GV
- `GET /ical/student/:id` — Feed .ics cho HS
- `GET /ical/class/:id` — Feed .ics cho lớp

**Format:** RFC 5545 iCalendar

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EduSmart//Schedule//VN
X-WR-CALNAME:EduSmart - Nguyễn An
BEGIN:VEVENT
DTSTART:20250617T070000
DTEND:20250617T074500
SUMMARY:Toán - Nguyễn Văn A
LOCATION:Phòng 201
DESCRIPTION:Môn: Toán\nGV: Nguyễn Văn A\nPhòng: 201
UID:edusmart-slot-123@edusmart.local
END:VEVENT
END:VCALENDAR
```

### 8.4. Conflict Overlay

**Mục tiêu:** Hiển thị lỗi xung đột real-time khi kéo thả.

**Behavior:**
```
onDragEnd(event):
  1. Lấy vị trí thả (day, period)
  2. Validate hard constraints
  3. Nếu vi phạm:
     - Ô lưới chuyển đỏ (bg-red-500)
     - animate-pulse
     - ConflictTooltip hiện với danh sách lỗi
     - Hủy thao tác (không gọi API)
  4. Nếu OK:
     - Gọi API createSchedule/moveSchedule
     - Refresh grid
```

### 8.5. Smart Cron Reminder

**Mục tiêu:** Nhắc HS/GV trước giờ học 15/30 phút.

**Cron:** `0 6,12 * * 1-6` (6:00 và 12:00 T2-T7)

**Logic:**
```
1. Quét schedules trong ca sắp diễn ra
2. Tính giờ nhắc = tiết đầu ca - 15 phút (hoặc 30 phút)
3. Kiểm tra dedup (wasReminderSentRecently)
4. Gửi Web Push + In-app Notification
5. Payload: { title, body, icon, data: { schedule_id, room, online_url } }
```

### 8.6. Schedule Mutation Workflow

**Mục tiêu:** Thông báo đa kênh khi TKB thay đổi.

```
Admin sửa tiết (đổi phòng/GV/giờ)
  │
  ▼
Validate cứng/mềm
  │
  ├─ Lỗi → ConflictOverlay UI
  │
  └─ OK → Update DB
      │
      ▼
    Delayed Queue (5 phút)
      │
      ├─ Admin sửa lại trong 5 phút → hủy thông báo cũ
      │
      └─ Hết 5 phút → Gửi:
          ├─ Web Push → GV + HS lớp
          ├─ Email SMTP → chi tiết thay đổi
          └─ Refresh AI Chatbot context
```

---

*Cập nhật: 2025-06 — EduSmart Next-Gen v2.0*
