# Sơ đồ ERD — EduSmart v1.1

> File `ERD.png` sẽ được sinh ra từ DBeaver / dbdiagram.io sau khi hoàn thiện migrations (Tuần 1-2).
> File này chứa khai báo bảng dạng dbdiagram.io DSL — copy & paste vào https://dbdiagram.io để render.

```dbml
Table users {
  id           int [pk, increment]
  email        varchar [unique, not null]
  password     varchar [not null]
  full_name    varchar [not null]
  role         enum('admin','homeroom','subject','parent','student')
  phone        varchar
  avatar_url   varchar
  is_active    boolean [default: true]
  created_at   timestamp
  updated_at   timestamp
}

Table students {
  id              int [pk, increment]
  user_id         int [ref: > users.id, unique]
  student_code    varchar [unique]
  date_of_birth   date
  gender          enum('male','female','other')
  address         varchar
  class_id        int [ref: > classes.id]
  enrollment_year int
}

Table parent_student {
  parent_id  int [ref: > users.id]
  student_id int [ref: > students.id]
  indexes { (parent_id, student_id) [pk] }
}

Table classes {
  id                   int [pk, increment]
  name                 varchar
  grade_level          int
  school_year          varchar
  homeroom_teacher_id  int [ref: > users.id]
}

Table subjects {
  id   int [pk, increment]
  code varchar [unique]
  name varchar
}

Table teacher_assignments {
  id          int [pk, increment]
  teacher_id  int [ref: > users.id]
  class_id    int [ref: > classes.id]
  subject_id  int [ref: > subjects.id]
  school_year varchar
  is_active   boolean [default: true]
}

Table scores {
  id          int [pk, increment]
  student_id  int [ref: > students.id]
  subject_id  int [ref: > subjects.id]
  class_id    int [ref: > classes.id]
  score_type  enum('oral','15min','1period','semester')
  score_value decimal(4,2)
  semester    int
  school_year varchar
  entered_by  int [ref: > users.id]
}

Table schedules {
  id           int [pk, increment]
  class_id     int [ref: > classes.id]
  subject_id   int [ref: > subjects.id]
  teacher_id   int [ref: > users.id]
  day_of_week  int
  period       int
  room         varchar
  school_year  varchar
}

Table attendance {
  id              int [pk, increment]
  student_id      int [ref: > students.id]
  schedule_id     int [ref: > schedules.id]
  attendance_date date
  status          enum('present','excused','absent')
  marked_by       int [ref: > users.id]
}

Table notifications {
  id        int [pk, increment]
  user_id   int [ref: > users.id]
  title     varchar
  body      text
  type      enum('system','score','attendance','event','message')
  is_read   boolean [default: false]
  email_sent boolean [default: false]
}

Table extracurriculars {
  id          int [pk, increment]
  name        varchar
  start_date  timestamp
  end_date    timestamp
  location    varchar
}

Table student_activity {
  id           int [pk, increment]
  student_id   int [ref: > students.id]
  activity_id  int [ref: > extracurriculars.id]
  attended     boolean
}

Table chat_sessions {
  id            int [pk, increment]
  user_id       int [ref: > users.id]
  session_token varchar [unique]
  messages      jsonb
  total_tokens  int
  ended_at      timestamp
}
```
