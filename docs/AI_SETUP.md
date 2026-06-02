# Cấu hình AI — EduSmart

## Ứng dụng web (phụ huynh / học sinh)

Widget chat dùng **API** (SDK trong backend), **không** gọi CLI từ trình duyệt.

**Đối tượng:** 5 persona — Admin, GVCN, GVBM, Phụ huynh, Học sinh. Chi tiết module: [AI_CHAT_MODULE.md](./AI_CHAT_MODULE.md).

### Bước 1 — API key trong `backend/.env`

**Claude (Anthropic):**

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Lấy key: https://console.anthropic.com/

**Gemini (Google):**

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
```

Lấy key: https://aistudio.google.com/apikey

Khởi động lại: `cd backend && npm run dev`

### Bước 2 — Có thể hỏi gì?

| Loại | Ví dụ |
|------|--------|
| Điểm / học bạ | "Điểm môn Toán HK1", "Môn nào thấp nhất?" |
| Lịch học | "Thứ 3 học môn gì?" |
| Điểm danh | "Con vắng bao nhiêu buổi?" |
| Học phí | "Đã đóng học phí chưa?" |
| Nhận xét GV | "Nhận xét hạnh kiểm" |
| Thông báo | "Có thông báo mới không?" |
| Tư vấn | "Gợi ý ôn Vật lý" |
| **Hội thoại tự do** | "So sánh Toán và Lý", "Tóm tắt tình hình học tập" |

Có API key → AI đọc **toàn bộ hồ sơ** (điểm, lịch, học phí, nhận xét…) + **lịch sử chat** để trả lời câu hỏi mở.

Không có API key → chế độ từ khóa + trả lời mẫu (vẫn tra cứu điểm/lịch/học phí cơ bản).

### Giáo viên & Admin

| Loại | Ví dụ |
|------|--------|
| Quyền & menu | "Tôi có thể làm gì?", "Hướng dẫn sử dụng" |
| Lớp / HS | "Lớp tôi dạy", "Danh sách HS lớp 10A1", "Tìm học sinh Nguyễn" |
| Điểm / điểm danh | "Điểm trung bình lớp", "Lớp vắng nhiều không?" |
| Hướng dẫn thao tác | "Cách nhập điểm", "Cách điểm danh", "Phân công giáo viên" |
| Admin | "Thống kê toàn trường" |
| Hội thoại tự do | "So sánh HS yếu Toán trong lớp" (cần API key) |

Chọn **lớp** trên widget (hoặc ghi tên lớp trong câu hỏi, vd. 10A1).

---

## CLI cho lập trình viên (tuỳ chọn)

Công cụ dòng lệnh giúp **dev** thử prompt, **không** thay API trong server.

### Cài CLI (Windows PowerShell — quyền admin nếu cần)

```powershell
npm install -g @anthropic-ai/claude-code
npm install -g @google/gemini-cli
```

Hoặc trong project:

```powershell
cd edusmart/backend
npm run ai:install-cli
```

### Đăng nhập CLI

```powershell
# Claude Code — làm theo hướng dẫn sau khi cài
claude

# Gemini CLI
gemini
```

Sau khi đăng nhập CLI, copy **API key** vào `backend/.env` như trên.

---

## Kiểm tra

- `GET /api/chat/status` (JWT, role parent/student)
- Đăng nhập PH/HS → widget góc phải → "AI anthropic" hoặc "Chế độ cơ bản"

## Kiến trúc

```
Tin nhắn → intent (LLM / từ khóa)
        → context (hồ sơ HS)
        → router: tra cứu nhanh HOẶC general_chat (LLM + snapshot + lịch sử)
```
