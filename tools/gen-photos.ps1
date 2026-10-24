# Quét thư mục photos/ và tạo photos.js.
# Mỗi thư mục con = 1 album (vd: photos/2016-van-nghe/, photos/2018-be-giang/).
# Chạy:  powershell -ExecutionPolicy Bypass -File tools/gen-photos.ps1
$root = Split-Path $PSScriptRoot -Parent
$photoDir = Join-Path $root 'photos'
$ext = '.jpg', '.jpeg', '.png', '.webp', '.gif'

$items = Get-ChildItem $photoDir -Recurse -File |
  Where-Object { $ext -contains $_.Extension.ToLower() -and $_.FullName -notmatch '\\avatars\\' } |
  Sort-Object FullName |
  ForEach-Object {
    $rel = $_.FullName.Substring($root.Length + 1).Replace('\', '/')
    $album = if ($_.Directory.FullName -eq $photoDir) { 'Khác' } else { $_.Directory.Name }
    [ordered]@{ src = $rel; album = $album; caption = $_.BaseName }
  }

$json = ConvertTo-Json -InputObject @($items) -Depth 3
$out = "// File này được tạo tự động bởi tools/gen-photos.ps1 — đừng sửa tay.`nwindow.PHOTOS = $json;`n"
[System.IO.File]::WriteAllText((Join-Path $root 'photos.js'), $out, (New-Object System.Text.UTF8Encoding $false))
Write-Host "Đã tạo photos.js với $(@($items).Count) ảnh."
