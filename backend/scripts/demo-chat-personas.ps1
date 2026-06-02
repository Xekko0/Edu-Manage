# Demo AI chat — 5 persona (cần backend :3001)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$base = "http://localhost:3001/api"
$pass = "edusmart123"

$accounts = @(
  @{ email = "admin@edusmart.local"; msg = "Thống kê toàn trường" },
  @{ email = "gvcn.10a1@edusmart.local"; msg = "Thời khóa biểu lớp 10A1" },
  @{ email = "gv.toan@edusmart.local"; msg = "Phân công của tôi" },
  @{ email = "ph.10a1.01@edusmart.local"; msg = "Lịch học tuần này" },
  @{ email = "hs.10a1.01@edusmart.local"; msg = "Học phí đã đóng chưa" }
)

foreach ($acc in $accounts) {
  Write-Host "`n=== $($acc.email) ===" -ForegroundColor Cyan
  $login = Invoke-RestMethod -Method POST -Uri "$base/auth/login" -ContentType "application/json" `
    -Body (@{ email = $acc.email; password = $pass } | ConvertTo-Json)
  $token = $login.data.accessToken
  $headers = @{ Authorization = "Bearer $token" }
  $status = Invoke-RestMethod -Method GET -Uri "$base/chat/status" -Headers $headers
  Write-Host "Persona: $($status.data.persona) | LLM: $($status.data.llm_configured)"
  $chatBody = (@{ message = $acc.msg } | ConvertTo-Json -Compress)
  $chat = Invoke-RestMethod -Method POST -Uri "$base/chat/message" -Headers $headers `
    -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($chatBody))
  Write-Host "Intent: $($chat.data.intent) | source: $($chat.data.source) | tool_id: $($chat.data.tool_id)"
  $preview = $chat.data.message
  if ($preview.Length -gt 180) { $preview = $preview.Substring(0, 180) + "..." }
  Write-Host $preview
}
