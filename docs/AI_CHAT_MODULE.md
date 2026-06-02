# Module AI Chatbox — EduSmart (5 persona)

## Persona

| Persona | Tài khoản demo | Role DB | Pipeline |
|---------|----------------|---------|----------|
| Admin | admin@edusmart.local | admin | staff |
| GVCN | gvcn.10a1@edusmart.local | subject + homeroom_teacher_id | staff |
| GVBM | gv.toan@edusmart.local | subject | staff |
| Phụ huynh | ph.10a1.01@edusmart.local | parent | family |
| Học sinh | hs.10a1.01@edusmart.local | student | family |

Mật khẩu seed: `edusmart123` — xem [ACCOUNTS.md](./ACCOUNTS.md).

## Kiến trúc (module-first)

Chi tiết: [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md).

```
POST /api/chat/message
  → chat-orchestrator (resolvePersona)
  → rules intent → context → chat/dispatcher → tool module | LLM tool
```

File chính:

- `backend/src/services/ai/chat-orchestrator.service.js`
- `backend/src/services/chat/dispatcher.service.js` + `handlers/*` + `tools/*`
- `backend/src/services/ai/intent.*` (rules only)
- `backend/src/middleware/chatScope.middleware.js` (GVBM ≠ GVCN)
- `frontend/src/config/chatPersonas.js`

## API

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/api/chat/status` | Trạng thái AI + persona |
| POST | `/api/chat/message` | Gửi tin (rate limit 20/phút) |
| GET | `/api/chat/sessions` | Danh sách phiên |
| GET | `/api/chat/sessions/:token` | Lịch sử |
| DELETE | `/api/chat/sessions/:token` | Xóa phiên |
| POST | `/api/chat/end-session` | Kết thúc phiên |

Body `POST /message`: `{ message, session_token?, student_id?, class_id? }`

## Hybrid LLM (controlled tools)

- **Intent:** luôn rules (không LLM phân loại).
- Có API key: `general_chat` / `ai_advice` dùng LLM; tra cứu vẫn qua tool modules (`source: module`).
- Không có key: rules + template fallback; tools DB vẫn chạy.
- Response: `source`, `tool_id` — xem [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md).

Cấu hình: [AI_SETUP.md](./AI_SETUP.md)

## Ví dụ câu hỏi

**Admin:** Thống kê toàn trường · Phân công GV · Tôi có thể làm gì?

**GVCN:** Danh sách HS lớp · Điểm danh · Liên kết PH · Báo cáo lớp

**GVBM:** Phân công của tôi · Cách nhập điểm · (điểm danh → từ chối)

**PH/HS:** Điểm môn Toán · Học phí · So sánh các môn · Tóm tắt tình hình

## Checklist demo

- [ ] 5 account — widget hiện, chips/welcome khác nhau
- [ ] GVBM hỏi điểm danh → từ chối
- [ ] GVCN hỏi điểm danh → có hướng dẫn/dữ liệu
- [ ] GET /chat/sessions trả đúng user
- [ ] Không API key — vẫn trả lời rules

## Test

```bash
cd backend
npm test
# Demo 5 persona (backend :3001):
./scripts/demo-chat-personas.ps1
```
