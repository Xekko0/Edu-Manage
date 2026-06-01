$ErrorActionPreference = 'Continue'
$base = "http://localhost:3001/api"

function Login($email, $password = "edusmart123") {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $res = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" -Body $body
  return $res.data.accessToken
}

function Headers($token) { return @{ Authorization = "Bearer $token" } }

function TestCase($desc, $expectedStatus, $block) {
  try {
    $result = & $block
    if ($expectedStatus -eq 200) {
      Write-Host ("[PASS] " + $desc) -ForegroundColor Green
    } else {
      Write-Host ("[FAIL] " + $desc + " (expected " + $expectedStatus + ", got 200)") -ForegroundColor Red
    }
    return $result
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq $expectedStatus) {
      Write-Host ("[PASS] " + $desc + " (status=" + $code + ")") -ForegroundColor Green
    } else {
      Write-Host ("[FAIL] " + $desc + " (expected " + $expectedStatus + ", got " + $code + ")") -ForegroundColor Red
      Write-Host ("       " + $_.Exception.Message) -ForegroundColor DarkRed
    }
  }
}

Write-Host "`n=== Dang nhap cac vai tro ===" -ForegroundColor Cyan
$tokenAdmin   = Login "admin@edusmart.local"
$tokenGVCN    = Login "gvcn.10a1@edusmart.local"
$tokenGVCN2   = Login "gvcn.10a2@edusmart.local"
$tokenGVBM    = Login "gv.toan@edusmart.local"
$tokenHS      = Login "hs.10a1.01@edusmart.local"
$tokenPH      = Login "ph.10a1.01@edusmart.local"
$tokenPH_KHAC = Login "ph.10a2.01@edusmart.local"
Write-Host "  OK -- 7 tai khoan"

# URLs co dau & duoc escape bang chuoi tuong duong
$scoreStuUrl   = $base + '/scores/student/1?semester=1' + '&' + 'school_year=2024-2025'
$scoreClsUrl   = $base + '/scores/class/1?semester=1' + '&' + 'school_year=2024-2025'
$evalStuUrl    = $base + '/evaluations/student/1?school_year=2024-2025'

Write-Host "`n=== TEST 1: Admin CRUD danh muc ===" -ForegroundColor Cyan
TestCase "Admin tao mon hoc moi" 201 {
  $b = @{ code = "MT_TEST"; name = "Test Mon Hoc" } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/subjects" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenAdmin)
}
TestCase "GVBM tao mon hoc => 403" 403 {
  $b = @{ code = "MT_X"; name = "X" } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/subjects" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenGVBM)
}
TestCase "PH tao mon hoc => 403 (readonly)" 403 {
  $b = @{ code = "Y"; name = "Y" } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/subjects" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenPH)
}

Write-Host "`n=== TEST 2: GVCN tao HS lop minh va lop khac ===" -ForegroundColor Cyan
TestCase "GVCN 10A1 tao HS vao lop minh" 201 {
  $b = @{
    email = "hs.10a1.new@edusmart.local"; password = "test1234"; full_name = "HS Moi";
    student_code = "HS10A199"; class_id = 1
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/students" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenGVCN)
}
TestCase "GVCN 10A1 tao HS vao lop 10A2 => 403" 403 {
  $b = @{
    email = "hs.10a2.bad@edusmart.local"; password = "test1234"; full_name = "Bad";
    student_code = "HS10A299"; class_id = 2
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/students" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenGVCN)
}

Write-Host "`n=== TEST 3: GVCN tao PH cho HS lop minh ===" -ForegroundColor Cyan
TestCase "GVCN 10A1 tao PH cho HS lop minh (student_id=1)" 201 {
  $b = @{
    email = "ph.new.test@edusmart.local"; password = "test1234"; full_name = "PH Moi"; student_id = 1
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/users/parent-for-student" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenGVCN)
}
TestCase "GVCN 10A1 tao PH cho HS lop 10A2 => 403" 403 {
  $b = @{
    email = "ph.bad.test@edusmart.local"; password = "test1234"; full_name = "Bad"; student_id = 31
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/users/parent-for-student" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenGVCN)
}

Write-Host "`n=== TEST 4: GVBM nhap diem mon minh / khong phai mon minh ===" -ForegroundColor Cyan
$subjects = Invoke-RestMethod -Uri "$base/subjects" -Method GET -Headers (Headers $tokenAdmin)
$toanId = ($subjects.data | Where-Object { $_.code -eq "TOAN" }).id
$lyId = ($subjects.data | Where-Object { $_.code -eq "VLY" }).id

TestCase "GVBM Toan nhap diem Toan lop 10A1" 201 {
  $b = @{
    student_id = 1; subject_id = $toanId; class_id = 1; score_type = "oral";
    score_value = 8.5; semester = 1; school_year = "2024-2025"
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/scores" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenGVBM)
}
TestCase "GVBM Toan nhap diem VAT LY => 403" 403 {
  $b = @{
    student_id = 1; subject_id = $lyId; class_id = 1; score_type = "oral";
    score_value = 8.5; semester = 1; school_year = "2024-2025"
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/scores" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenGVBM)
}

Write-Host "`n=== TEST 5: HS / PH chi xem cua minh ===" -ForegroundColor Cyan
TestCase "HS xem diem cua chinh minh (student_id=1)" 200 {
  Invoke-RestMethod -Uri $scoreStuUrl -Method GET -Headers (Headers $tokenHS)
}
TestCase "PH xem diem cua con (student_id=1)" 200 {
  Invoke-RestMethod -Uri $scoreStuUrl -Method GET -Headers (Headers $tokenPH)
}
TestCase "PH lop 10A2 xem diem HS lop 10A1 => 403" 403 {
  Invoke-RestMethod -Uri $scoreStuUrl -Method GET -Headers (Headers $tokenPH_KHAC)
}
TestCase "HS thu nhap diem => 403 (readonly)" 403 {
  $b = @{ student_id = 1; subject_id = $toanId; class_id = 1; score_type = "oral"; score_value = 10; semester = 1; school_year = "2024-2025" } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/scores" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenHS)
}

Write-Host "`n=== TEST 6: GVCN xem toan bo diem lop minh ===" -ForegroundColor Cyan
$r = TestCase "GVCN xem diem ca lop 10A1" 200 {
  Invoke-RestMethod -Uri $scoreClsUrl -Method GET -Headers (Headers $tokenGVCN)
}
if ($r) { Write-Host ("  -> " + $r.data.Count + " HS trong lop") }

TestCase "GVCN 10A2 xem diem lop 10A1 => 403" 403 {
  Invoke-RestMethod -Uri $scoreClsUrl -Method GET -Headers (Headers $tokenGVCN2)
}

Write-Host "`n=== TEST 7: Hoc phi (PH/HS xem cua con/minh) ===" -ForegroundColor Cyan
$r = TestCase "PH xem hoc phi cua con" 200 {
  Invoke-RestMethod -Uri "$base/tuitions/student/1" -Method GET -Headers (Headers $tokenPH)
}
if ($r) {
  $r.data | ForEach-Object {
    Write-Host ("  HK" + $_.semester + ": " + $_.amount + " | " + $_.status)
  }
}

Write-Host "`n=== TEST 8: Danh gia / Nhan xet ===" -ForegroundColor Cyan
$r = TestCase "PH xem danh gia con" 200 {
  Invoke-RestMethod -Uri $evalStuUrl -Method GET -Headers (Headers $tokenPH)
}
if ($r) { Write-Host ("  -> " + $r.data.Count + " danh gia") }

TestCase "GVBM Toan tao nhan xet mon Toan cho HS lop 10A1" 201 {
  $b = @{
    student_id = 1; subject_id = $toanId; type = "subject";
    semester = 1; school_year = "2024-2025"; content = "HS hoc Toan tot."
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/evaluations" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenGVBM)
}

TestCase "GVBM Toan tao nhan xet HOMEROOM => 403 (chi GVCN)" 403 {
  $b = @{
    student_id = 1; type = "homeroom"; semester = 1; school_year = "2024-2025"; content = "X"
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/evaluations" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenGVBM)
}

Write-Host "`n=== TEST 9: So dau bai ===" -ForegroundColor Cyan
$r = TestCase "GVCN xem so dau bai lop minh" 200 {
  Invoke-RestMethod -Uri "$base/journals/class/1" -Method GET -Headers (Headers $tokenGVCN)
}
if ($r) { Write-Host ("  -> " + $r.data.Count + " ban ghi") }

TestCase "PH xem so dau bai lop cua con" 200 {
  Invoke-RestMethod -Uri "$base/journals/class/1" -Method GET -Headers (Headers $tokenPH)
}

TestCase "PH lop khac xem so lop 10A1 => 403" 403 {
  Invoke-RestMethod -Uri "$base/journals/class/1" -Method GET -Headers (Headers $tokenPH_KHAC)
}

TestCase "GVCN ghi so dau bai lop minh (tong)" 201 {
  $b = @{
    class_id = 1; lesson_date = "2025-05-20"; content = "Tiet hoc tot."; rating = "good"
  } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/journals" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenGVCN)
}

TestCase "GVCN ghi so lop khac => 403" 403 {
  $b = @{ class_id = 2; lesson_date = "2025-05-20"; content = "X" } | ConvertTo-Json
  Invoke-RestMethod -Uri "$base/journals" -Method POST -ContentType "application/json" -Body $b -Headers (Headers $tokenGVCN)
}

Write-Host "`nHOAN TAT KIEM THU PHAN QUYEN!" -ForegroundColor Green
