while ($true) {
    $status = git status --porcelain
    if ($status) {
        $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        git add .
        git commit -m "Auto-commit: $date"
        git push origin main
        Write-Host "Changes pushed at $date"
    }
    Start-Sleep -Seconds 30
}
