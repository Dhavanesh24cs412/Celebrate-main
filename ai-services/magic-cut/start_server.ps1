$expected_size = 375042383
$filename = "sam_vit_b_01ec64.pth"

Write-Host "Waiting for download to complete..."
while ($true) {
    if (Test-Path $filename) {
        $file = Get-Item $filename
        if ($file.Length -ge $expected_size) {
            Write-Host "Download complete. Starting server..."
            break
        }
        Write-Host "Current size: $($file.Length) / $expected_size"
    } else {
        Write-Host "File not found yet."
    }
    Start-Sleep -Seconds 5
}

.\venv\Scripts\python main.py
