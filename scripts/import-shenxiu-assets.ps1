param(
    [string]$SourceDir = "",
    [string]$ProjectRoot = "D:\Git-Program\wuluxun-simulator",
    [switch]$ForceDownload
)

[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"

function Copy-FirstExistingFile($Candidates, $Target) {
    foreach ($candidate in $Candidates) {
        if (Test-Path -LiteralPath $candidate) {
            New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Target) | Out-Null
            Copy-Item -LiteralPath $candidate -Destination $Target -Force
            return $candidate
        }
    }
    throw "No source image found. Tried: $($Candidates -join ', ')"
}

function Invoke-DownloadWithProxyFallback($Uri, $OutFile) {
    if (!$ForceDownload -and (Test-Path -LiteralPath $OutFile) -and ((Get-Item -LiteralPath $OutFile).Length -gt 0)) {
        return "cached"
    }
    $proxies = @("http://127.0.0.1:7897", "http://127.0.0.1:7890")
    foreach ($proxy in $proxies) {
        try {
            Invoke-WebRequest -Uri $Uri -OutFile $OutFile -Proxy $proxy -UseBasicParsing -TimeoutSec 30
            if ((Test-Path -LiteralPath $OutFile) -and ((Get-Item -LiteralPath $OutFile).Length -gt 0)) {
                return $proxy
            }
        } catch {
            Remove-Item -LiteralPath $OutFile -Force -ErrorAction SilentlyContinue
        }
    }
    throw "Download failed through proxies 7897 and 7890: $Uri"
}

function Get-QuoteRows($Data) {
    $rows = New-Object System.Collections.Generic.List[object]

    foreach ($skill in $Data.skills) {
        $index = 1
        foreach ($quote in $skill.quotes) {
            $audioUrl = [string]$quote.audio
            $skillKey = $null
            $audioIndex = $index
            if ($audioUrl -match "_0?([0-9]+)\.mp3(?:$|\?)") {
                $audioIndex = [int]$Matches[1]
            }
            if ($audioUrl -match "XiongMu") {
                $skillKey = "dcxiongmu"
            } elseif ($audioUrl -match "ZhangCai") {
                $skillKey = "dczhangcai"
            } elseif ($audioUrl -match "RuXian") {
                $skillKey = "dcruxian"
            } elseif ($audioUrl -match "Dead") {
                $skillKey = "die"
            }
            if (!$skillKey) {
                continue
            }
            $targetName = if ($skillKey -eq "die") { "wu_luxun_die.mp3" } else { "$skillKey$audioIndex.mp3" }
            $rows.Add([ordered]@{
                skill = $skill.name
                key = $skillKey
                index = $audioIndex
                text = $quote.text
                source = $quote.audio
                file = $targetName
            })
            $index++
        }
    }

    return $rows
}

$resolvedProjectRoot = [System.IO.Path]::GetFullPath($ProjectRoot)
if ([string]::IsNullOrWhiteSpace($SourceDir)) {
    $skinDirName = -join ([char[]](0x795E, 0x79C0, 0x5CE5, 0x5D58))
    $SourceDir = Join-Path ([Environment]::GetFolderPath("Desktop")) $skinDirName
}
$resolvedSourceDir = [System.IO.Path]::GetFullPath($SourceDir)
if (!(Test-Path -LiteralPath $resolvedSourceDir)) {
    throw "Missing source directory: $resolvedSourceDir"
}

$skinRoot = Join-Path $resolvedProjectRoot "extension\assets\skins\shenxiu_zhengrong"
$characterRoot = Join-Path $skinRoot "character"
$audioRoot = Join-Path $skinRoot "audio"
New-Item -ItemType Directory -Force -Path $characterRoot, $audioRoot | Out-Null

$imageCandidates = @(
    Get-ChildItem -LiteralPath $resolvedSourceDir -File |
        Where-Object { $_.Extension -match '^\.(png|jpg|jpeg|webp)$' } |
        Sort-Object @{ Expression = { if ($_.BaseName -match 'static|jing|wu_luxun|wuluxun') { 0 } else { 1 } } }, Name |
        ForEach-Object { $_.FullName }
)
$copiedImage = Copy-FirstExistingFile $imageCandidates (Join-Path $characterRoot "wu_luxun.png")

$jsonPath = Join-Path $resolvedSourceDir "url.json"
if (!(Test-Path -LiteralPath $jsonPath)) {
    throw "Missing url.json: $jsonPath"
}
$data = Get-Content -LiteralPath $jsonPath -Encoding UTF8 -Raw | ConvertFrom-Json
$rows = @(Get-QuoteRows $data)
if ($rows.Count -eq 0) {
    throw "No known skill rows found in url.json"
}

$downloadReport = New-Object System.Collections.Generic.List[object]
foreach ($row in $rows) {
    $target = Join-Path $audioRoot $row.file
    $proxy = Invoke-DownloadWithProxyFallback $row.source $target
    $downloadReport.Add([ordered]@{
        skill = $row.skill
        key = $row.key
        file = $row.file
        proxy = $proxy
        bytes = (Get-Item -LiteralPath $target).Length
        source = $row.source
    })
}

$manifest = [ordered]@{
    hero = $data.hero
    skin = $data.skin
    character = "wu_luxun"
    image = "character/wu_luxun.png"
    sourceImage = $copiedImage
    quotes = $rows
    downloads = $downloadReport
}
$manifest | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $skinRoot "manifest.json") -Encoding UTF8

Write-Host ("Imported skin assets: " + $skinRoot)
Write-Host ("Image: " + $copiedImage)
foreach ($item in $downloadReport) {
    Write-Host ("Audio: {0} -> {1} ({2} bytes via {3})" -f $item.skill, $item.file, $item.bytes, $item.proxy)
}
