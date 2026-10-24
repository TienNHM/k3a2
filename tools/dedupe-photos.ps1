# Remove duplicate / near-duplicate photos under photos/ using a perceptual (difference) hash.
# The first photo in path order is kept; later look-alikes are deleted (with their thumbs).
# Run:  powershell -ExecutionPolicy Bypass -File tools/dedupe-photos.ps1 [-Threshold 6] [-DryRun]
param([int]$Threshold = 6, [switch]$DryRun)
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @"
public static class Ham {
  public static int Pop(ulong x) { int c = 0; while (x != 0) { x &= x - 1; c++; } return c; }
  public static int[] Find(ulong[] h, int idx, int[] keep, int keepCount, int th) {
    // returns index in keep[] of first kept hash within th of h[idx], or -1 (as 1-element array)
    for (int k = 0; k < keepCount; k++) { if (Pop(h[idx] ^ h[keep[k]]) <= th) return new int[] { k }; }
    return new int[] { -1 };
  }
}
"@

$root = Split-Path $PSScriptRoot -Parent
$photoDir = Join-Path $root 'photos'
$files = Get-ChildItem $photoDir -Recurse -File |
  Where-Object { $_.Extension -match '^\.(jpe?g|png|webp)$' -and $_.FullName -notmatch '\\(avatars|thumbs|_removed)\\' } |
  Sort-Object FullName

function Get-DHash([string]$path) {
  $img = [System.Drawing.Image]::FromFile($path)
  try {
    $bmp = New-Object System.Drawing.Bitmap 9, 8
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = 'HighQualityBilinear'
    $g.DrawImage($img, 0, 0, 9, 8)
    $g.Dispose()
    [uint64]$h = 0
    for ($y = 0; $y -lt 8; $y++) {
      for ($x = 0; $x -lt 8; $x++) {
        $a = $bmp.GetPixel($x, $y); $b = $bmp.GetPixel($x + 1, $y)
        $la = 0.299 * $a.R + 0.587 * $a.G + 0.114 * $a.B
        $lb = 0.299 * $b.R + 0.587 * $b.G + 0.114 * $b.B
        $h = ($h -shl 1) -bor [uint64]([int]($la -gt $lb))
      }
    }
    $bmp.Dispose()
    return $h
  } finally { $img.Dispose() }
}

$hashes = New-Object 'System.Collections.Generic.List[uint64]'
$paths = New-Object 'System.Collections.Generic.List[string]'
foreach ($f in $files) {
  $thumb = Join-Path (Join-Path $f.DirectoryName 'thumbs') $f.Name
  $src = if (Test-Path $thumb) { $thumb } else { $f.FullName }
  try { $hashes.Add((Get-DHash $src)); $paths.Add($f.FullName) } catch { Write-Warning "hash failed: $($f.FullName)" }
}

$h = $hashes.ToArray()
$keep = New-Object 'int[]' $h.Length
$keepCount = 0
$removed = 0
for ($i = 0; $i -lt $h.Length; $i++) {
  $r = [Ham]::Find($h, $i, $keep, $keepCount, $Threshold)
  if ($r[0] -ge 0) {
    $removed++
    if (-not $DryRun) {
      $p = $paths[$i]
      Remove-Item -LiteralPath $p -Force
      $t = Join-Path (Join-Path (Split-Path $p -Parent) 'thumbs') (Split-Path $p -Leaf)
      if (Test-Path -LiteralPath $t) { Remove-Item -LiteralPath $t -Force }
    }
  } else { $keep[$keepCount] = $i; $keepCount++ }
}
Write-Host "Scanned $($h.Length) photos, $(if ($DryRun) {'would remove'} else {'removed'}) $removed duplicates, kept $keepCount."
