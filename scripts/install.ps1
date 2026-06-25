[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$nonameRoot = "D:\Git-Program\noname"
$source = Join-Path $projectRoot "extension"
$extensionName = -join ([char[]](0x6B66, 0x9646, 0x900A, 0x6A21, 0x62DF, 0x5668))
$target = Join-Path $nonameRoot ("resources\app\extension\" + $extensionName)

New-Item -ItemType Directory -Force -Path $target | Out-Null
Get-ChildItem -LiteralPath $source -Force | Copy-Item -Destination $target -Recurse -Force

Write-Host ("Installed extension to " + $target)
