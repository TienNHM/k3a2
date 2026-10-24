# Import one or more Google Photos album zips into photos/<Topic>/<Album>/
# - resizes to max 1600px (full) + 480px (thumbs/), JPEG quality 82, fixes EXIF rotation
# - skips videos and non-image files
# Run:  powershell -ExecutionPolicy Bypass -File tools/import-album.ps1 -Zip a-001.zip,a-002.zip -Topic "Cuoi cap" -Album "Lien hoan cuoi cap"
param(
  [Parameter(Mandatory)][string[]]$Zip,
  [Parameter(Mandatory)][string]$Topic,
  [Parameter(Mandatory)][string]$Album,
  [int]$Max = 1600,
  [int]$ThumbMax = 480,
  [switch]$VideosOnly,   # keep videos only (photos of this album were imported before)
  # videos are NOT put in the repo; they are moved here (per album) so they can be uploaded to YouTube
  [string]$VideoRoot = (Join-Path $env:USERPROFILE 'Videos\K3A2')
)
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$dest = Join-Path $root (Join-Path 'photos' (Join-Path $Topic $Album))
$thumbs = Join-Path $dest 'thumbs'
New-Item -ItemType Directory -Force $thumbs | Out-Null
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ('import-' + [guid]::NewGuid())
New-Item -ItemType Directory -Force $tmp | Out-Null
foreach ($z in $Zip) { Expand-Archive -LiteralPath $z -DestinationPath $tmp -Force }

$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)

function Save-Resized($img, $long, $path) {
  $scale = [math]::Min(1.0, $long / [math]::Max($img.Width, $img.Height))
  $w = [int]($img.Width * $scale); $h = [int]($img.Height * $scale)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'
  $g.DrawImage($img, 0, 0, $w, $h)
  $g.Dispose()
  $bmp.Save($path, $jpeg, $ep)
  $bmp.Dispose()
}

$files = if ($VideosOnly) { @() } else { Get-ChildItem $tmp -Recurse -File | Where-Object { $_.Extension -match '^\.(jpe?g|png|webp|heic)$' } | Sort-Object Name }
$i = (Get-ChildItem $dest -File -ErrorAction SilentlyContinue | Measure-Object).Count + 1
foreach ($f in $files) {
  try {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    if ($img.PropertyIdList -contains 274) {
      switch ($img.GetPropertyItem(274).Value[0]) {
        3 { $img.RotateFlip('Rotate180FlipNone') }
        6 { $img.RotateFlip('Rotate90FlipNone') }
        8 { $img.RotateFlip('Rotate270FlipNone') }
      }
    }
    $name = '{0:D3}.jpg' -f $i
    Save-Resized $img $Max (Join-Path $dest $name)
    Save-Resized $img $ThumbMax (Join-Path $thumbs $name)
    $img.Dispose()
    $i++
  } catch { Write-Warning "Skipped $($f.Name): $($_.Exception.Message)" }
}
$vids = @(Get-ChildItem $tmp -Recurse -File | Where-Object { $_.Extension -match '^\.(mp4|mov|mkv|avi|3gp|m4v|webm|mts|wmv)$' })
if ($vids.Count -gt 0) {
  $vd = Join-Path $VideoRoot $Album
  New-Item -ItemType Directory -Force $vd | Out-Null
  foreach ($v in $vids) {
    $target = Join-Path $vd $v.Name; $n = 1
    while (Test-Path -LiteralPath $target) { $target = Join-Path $vd ('{0}_{1}{2}' -f $v.BaseName, $n, $v.Extension); $n++ }
    Move-Item -LiteralPath $v.FullName -Destination $target
  }
  Write-Host "Saved $($vids.Count) videos to $vd"
}
Remove-Item $tmp -Recurse -Force
$mb = [math]::Round((Get-ChildItem $dest -Recurse -File | Measure-Object Length -Sum).Sum / 1MB, 1)
Write-Host "Imported $($i - 1) photos into $dest ($mb MB)."
