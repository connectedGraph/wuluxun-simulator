param(
    [string]$NonameAppRoot = "D:\Git-Program\noname\resources\app",
    [string]$WebRoot = "D:\Git-Program\wuluxun-simulator\webroot"
)

[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"

function Copy-Directory($Source, $Target) {
    if (!(Test-Path -LiteralPath $Source)) {
        throw "Missing source directory: $Source"
    }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Target) | Out-Null
    Copy-Item -LiteralPath $Source -Destination $Target -Recurse -Force
}

function Copy-File($Source, $Target) {
    if (!(Test-Path -LiteralPath $Source)) {
        throw "Missing source file: $Source"
    }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Target) | Out-Null
    Copy-Item -LiteralPath $Source -Destination $Target -Force
}

function Copy-AudioFile($RelativePath) {
    $source = Join-Path $NonameAppRoot ("audio\" + $RelativePath)
    $target = Join-Path $resolvedWebRoot ("audio\" + $RelativePath)
    if (Test-Path -LiteralPath $source) {
        Copy-File $source $target
    }
}

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$resolvedProjectRoot = [System.IO.Path]::GetFullPath($projectRoot)
$resolvedWebRoot = [System.IO.Path]::GetFullPath($WebRoot)
$pidFile = Join-Path $projectRoot "webserver.pid"
$decadeName = -join ([char[]](0x5341, 0x5468, 0x5E74, 0x0055, 0x0049))
$simName = -join ([char[]](0x6B66, 0x9646, 0x900A, 0x6A21, 0x62DF, 0x5668))
if (!$resolvedWebRoot.StartsWith($resolvedProjectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to rebuild outside project root: $resolvedWebRoot"
}

if (Test-Path -LiteralPath $pidFile) {
    $oldPidText = Get-Content -LiteralPath $pidFile -Encoding UTF8 -ErrorAction SilentlyContinue
    $oldPid = 0
    if ([int]::TryParse($oldPidText, [ref]$oldPid)) {
        $oldProcess = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
        if ($oldProcess) {
            Stop-Process -Id $oldPid -Force
            Start-Sleep -Milliseconds 400
        }
    }
    Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

if (Test-Path -LiteralPath $resolvedWebRoot) {
    Remove-Item -LiteralPath $resolvedWebRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $resolvedWebRoot | Out-Null

$rootFiles = @(
    "jit-test.ts",
    "LICENSE",
    "noname.js",
    "package.json",
    "README.md"
)
foreach ($file in $rootFiles) {
    Copy-File (Join-Path $NonameAppRoot $file) (Join-Path $resolvedWebRoot $file)
}
$nonameHtmlPath = Join-Path $resolvedWebRoot "noname.html"
Copy-File (Join-Path $NonameAppRoot "index.html") $nonameHtmlPath
$nonameHtml = Get-Content -LiteralPath $nonameHtmlPath -Encoding UTF8 -Raw
$nonameHtml = $nonameHtml.Replace('src="vue"', 'src="./node_modules/.pnpm/vue@3.5.28/node_modules/vue/dist/vue.esm-browser.js"')
$startupChromeStyle = @'
  <style id="wuluxun-startup-hide">
    .main.menu.dialog {
      display: none !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    .dialog.character.fullwidth.fullheight .packnode,
    .dialog.character.fullwidth.fullheight .dialogbutton {
      opacity: 0 !important;
      pointer-events: none !important;
    }
  </style>
'@
$nonameHtml = $nonameHtml.Replace("<head>", "<head>`r`n$startupChromeStyle")
$serviceWorkerShim = @'
  <script type="module">
    sessionStorage.setItem("isJITReloaded", "true");
    sessionStorage.setItem("canUseTs", "true");
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister());
      }).catch(() => {});
    }
    if ("caches" in window) {
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => {});
    }
  </script>
'@
$nonameHtml = [regex]::Replace($nonameHtml, '(?s)\s*<script type="module">// src/entry\.ts.*?</script>', "`r`n$serviceWorkerShim")
Set-Content -LiteralPath $nonameHtmlPath -Encoding UTF8 -Value $nonameHtml
Set-Content -LiteralPath (Join-Path $resolvedWebRoot "preload.js") -Encoding UTF8 -Value 'export { default } from "./noname/init/browser.js";'

$coreDirectories = @(
    "_virtual",
    "card",
    "character",
    "font",
    "game",
    "layout",
    "mode",
    "node_modules",
    "noname",
    "theme"
)
foreach ($dir in $coreDirectories) {
    Copy-Directory (Join-Path $NonameAppRoot $dir) (Join-Path $resolvedWebRoot $dir)
}

$audioRoot = Join-Path $resolvedWebRoot "audio"
New-Item -ItemType Directory -Force -Path $audioRoot | Out-Null
foreach ($dir in @("card", "effect", "voice")) {
    Copy-Directory (Join-Path $NonameAppRoot ("audio\" + $dir)) (Join-Path $audioRoot $dir)
}
foreach ($file in @(
    "die\wu_luxun.mp3",
    "skill\dcxiongmu1.mp3",
    "skill\dcxiongmu2.mp3",
    "skill\dczhangcai1.mp3",
    "skill\dczhangcai2.mp3",
    "skill\dcruxian1.mp3",
    "skill\dcruxian2.mp3"
)) {
    Copy-AudioFile $file
}

Copy-File (Join-Path $projectRoot "shims\static-browser.js") (Join-Path $resolvedWebRoot "noname\init\browser.js")
New-Item -ItemType Directory -Force -Path (Join-Path $resolvedWebRoot "mode\identity") | Out-Null
Set-Content -LiteralPath (Join-Path $resolvedWebRoot "mode\identity\index.js") -Encoding UTF8 -Value 'export { default, type } from "../identity.js";'

$imageRoot = Join-Path $resolvedWebRoot "image"
New-Item -ItemType Directory -Force -Path $imageRoot | Out-Null
Copy-Directory (Join-Path $NonameAppRoot "image\card") (Join-Path $imageRoot "card")
New-Item -ItemType Directory -Force -Path (Join-Path $imageRoot "character") | Out-Null
foreach ($image in @("wu_luxun.jpg", "wutugu.jpg", "default_silhouette_double.jpg", "default_silhouette_female.jpg", "default_silhouette_male.jpg", "hidden_image.jpg")) {
    Copy-File (Join-Path $NonameAppRoot ("image\character\" + $image)) (Join-Path $imageRoot ("character\" + $image))
}
New-Item -ItemType Directory -Force -Path (Join-Path $imageRoot "background") | Out-Null
foreach ($image in @("ol_bg.jpg", "noname_bg.jpg")) {
    Copy-File (Join-Path $NonameAppRoot ("image\background\" + $image)) (Join-Path $imageRoot ("background\" + $image))
}

$extensionRoot = Join-Path $resolvedWebRoot "extension"
New-Item -ItemType Directory -Force -Path $extensionRoot | Out-Null
Copy-Directory (Join-Path $NonameAppRoot ("extension\" + $decadeName)) (Join-Path $extensionRoot $decadeName)
Copy-Directory (Join-Path $projectRoot "extension") (Join-Path $extensionRoot $simName)

$fileListManifest = [ordered]@{}
function Add-FileListEntry($RelativeDir) {
    $normalizedRelativeDir = $RelativeDir.Replace("\", "/").Trim("/")
    $absoluteDir = Join-Path $resolvedWebRoot $RelativeDir
    if (!(Test-Path -LiteralPath $absoluteDir)) {
        return
    }
    $folders = @(Get-ChildItem -LiteralPath $absoluteDir -Directory | Sort-Object Name | ForEach-Object { $_.Name })
    $files = @(Get-ChildItem -LiteralPath $absoluteDir -File | Sort-Object Name | ForEach-Object { $_.Name })
    $fileListManifest[$normalizedRelativeDir] = [ordered]@{
        folders = $folders
        files = $files
    }
}

$cardSkinsRelativeRoot = "extension\$decadeName\image\card-skins"
Add-FileListEntry $cardSkinsRelativeRoot
$cardSkinsAbsoluteRoot = Join-Path $resolvedWebRoot $cardSkinsRelativeRoot
if (Test-Path -LiteralPath $cardSkinsAbsoluteRoot) {
    Get-ChildItem -LiteralPath $cardSkinsAbsoluteRoot -Directory | ForEach-Object {
        Add-FileListEntry (Join-Path $cardSkinsRelativeRoot $_.Name)
    }
}
$fileListManifestJson = $fileListManifest | ConvertTo-Json -Depth 5
Set-Content -LiteralPath (Join-Path $resolvedWebRoot "__filelist.json") -Encoding UTF8 -Value $fileListManifestJson

$entryHtml = Get-Content -LiteralPath (Join-Path $projectRoot "extension\start.html") -Encoding UTF8 -Raw
$entryHtml = $entryHtml.Replace("../../image/", "image/")
$entryHtml = $entryHtml.Replace('"../../noname.html", "../../index.html"', '"noname.html"')
$entryHtml = $entryHtml.Replace('return "../../index.html";', 'return "noname.html";')
Set-Content -LiteralPath (Join-Path $resolvedWebRoot "index.html") -Encoding UTF8 -Value $entryHtml

$bytes = (Get-ChildItem -LiteralPath $resolvedWebRoot -Recurse -File | Measure-Object -Property Length -Sum).Sum
Write-Host ("Built webroot: " + $resolvedWebRoot)
Write-Host ("Size: {0:N2} MB" -f ($bytes / 1MB))
