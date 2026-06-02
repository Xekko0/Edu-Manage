# Kiến trúc AI Chat (module-first — chuẩn doanh nghiệp)

## Luồng xử lý

```
POST /api/chat/message
  → chat-orchestrator.service.js (persona + RBAC)
  → intent (rules only) — intent.service / staff-intent.service
  → context — context.service / staff-context.service
  → chatScope.middleware (staff)
  → dispatcher.service.js → registry → tool module | LLM tool
```

## Thư mục `backend/src/services/chat/`

| Thành phần | Vai trò |
|------------|---------|
| `types.js` | `wrapToolResult` — contract `meta.source`, `meta.toolId` |
| `registry.js` | Catalog tool: id, audience, intents, handler |
| `dispatcher.service.js` | Điều phối theo intent |
| `modules/family/*` | Tools PH/HS (DB) |
| `modules/staff/*` | Tools Admin/GV (DB) |
| `modules/advice.tool.js` | LLM tư vấn |
| `modules/conversational.tool.js` | LLM PH/HS |
| `modules/staff-conversational.tool.js` | LLM GV/Admin |

## Bảng tool Family

| toolId | Intents |
|--------|---------|
| `family.scores` | view_scores, view_scores_subject, compare_subjects, view_gradebook |
| `family.schedule` | view_schedule |
| `family.attendance` | view_attendance |
| `family.tuition` | view_tuition |
| `family.evaluations` | view_evaluations |
| `family.notifications` | view_notifications |
| `family.extracurricular` | view_extracurricular |
| `family.contact_teacher` | contact_teacher |
| `llm.advice` | ai_advice |
| `llm.conversational.family` | general_chat |

## Bảng tool Staff

| toolId | Intents |
|--------|---------|
| `staff.help` | help_features, how_to, list_classes, link_parent_guide, create_student_guide |
| `staff.admin_stats` | admin_stats |
| `staff.assignments` | my_assignments, my_subject_scores |
| `staff.class_students` | list_students, search_student |
| `staff.class_scores` | view_class_scores |
| `staff.class_report` | class_report_summary, weak_students_in_class |
| `staff.class_attendance` | view_class_attendance |
| `staff.class_schedule` | view_class_schedule |
| `llm.conversational.staff` | general_chat |

## NLU vs LLM

- **Intent:** chỉ keyword rules. Không LLM phân loại.
- **LLM:** chỉ `general_chat`, `ai_advice` khi có API key.
- **Tra cứu:** tool module; conversational không duplicate TKB/điểm.

## Governance

- Tra cứu: `source: module`, `tool_id` từ registry.
- LLM: `source: llm`; prompt chỉ dùng snapshot, không bịa số.
- Không API key: tools vẫn chạy; LLM fallback rules.

## API response

```json
{
  "intent": "view_schedule",
  "intent_source": "rules",
  "source": "module",
  "tool_id": "family.schedule",
  "ai_mode": "rules"
}
```

## Tương thích

`router.service.js` / `staff-router.service.js` re-export dispatcher (deprecated).

## Phase 6 — RAG (tương lai)

Vector store quy chế/FAQ — không thay tool điểm/TKB realtime.
