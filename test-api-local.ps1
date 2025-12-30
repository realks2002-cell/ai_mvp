# 로컬 API 테스트 스크립트
# 개발 서버가 실행 중이어야 합니다 (npm run dev)

Write-Host "로컬 API 테스트 중..." -ForegroundColor Yellow

$body = @{
    userInput = "안녕하세요"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    Write-Host "`nAPI 호출 중..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/ask" -Method Post -Headers $headers -Body $body
    
    Write-Host "`n✅ 성공!" -ForegroundColor Green
    Write-Host "응답:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    
    if ($response.success) {
        Write-Host "`nAI 응답: $($response.message)" -ForegroundColor Cyan
    } else {
        Write-Host "`n❌ 오류: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "`n❌ 오류 발생:" -ForegroundColor Red
    Write-Host "상태 코드: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "오류 메시지: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "응답 본문: $responseBody" -ForegroundColor Red
    }
    
    Write-Host "`n⚠️ 개발 서버가 실행 중인지 확인하세요: npm run dev" -ForegroundColor Yellow
}

