[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"

function Join-Chars([int[]] $codes) {
  return -join ([char[]]$codes)
}

$nonameRoot = "D:\Git-Program\noname"
$appRoot = Join-Path $nonameRoot "resources\app"
$outputs = @(
  (Join-Path $nonameRoot "noname.config.txt"),
  (Join-Path $appRoot "noname.config.txt")
)

$decadeName = Join-Chars @(0x5341, 0x5468, 0x5E74, 0x55, 0x49)
$simName = Join-Chars @(0x6B66, 0x9646, 0x900A, 0x6A21, 0x62DF, 0x5668)
$sceneIntro = Join-Chars @(0x56FA, 0x5B9A, 0x4E24, 0x4EBA, 0x5C40, 0xFF1A, 0x4F60, 0x63A7, 0x5236, 0x6B66, 0x9646, 0x900A, 0xFF0C, 0x5BF9, 0x65B9, 0x5140, 0x7A81, 0x9AA8, 0x7531, 0x539F, 0x7248, 0x41, 0x49, 0x6258, 0x7BA1, 0x3002)
$stageIntro = Join-Chars @(0x6B66, 0x9646, 0x900A, 0x8D77, 0x624B, 0x4E0E, 0x51FA, 0x724C, 0x6A21, 0x62DF, 0x5165, 0x53E3, 0x3002)

$scene = [ordered]@{
  name = $simName
  intro = $sceneIntro
  gameDraw = $true
  replacepile = $false
  cardPileTop = @()
  cardPileBottom = @()
  discardPile = @()
  players = [object[]]@(
    [ordered]@{
      name = "wu_luxun"
      name2 = "none"
      identity = "zhu"
      position = 1
      playercontrol = $true
      handcards = @()
      equips = @()
      judges = @()
    },
    [ordered]@{
      name = "wutugu"
      name2 = "none"
      identity = "fan"
      position = 2
      playercontrol = $false
      handcards = @()
      equips = @()
      judges = @()
    }
  )
}

$stage = [ordered]@{
  name = $simName
  intro = $stageIntro
  mode = "sequal"
  level = 0
  scenes = [object[]]@($scene)
}

$payload = [ordered]@{
  config = [ordered]@{
    mode = "brawl"
    show_splash = "off"
    extensions = [object[]]@($decadeName, $simName)
    extension_qianhuan_enable = $false
    ("extension_" + $decadeName + "_enable") = $true
    ("extension_" + $simName + "_enable") = $true
    change_card_mode_config_identity = "unlimited"
    double_character_mode_config_identity = $false
    free_choose_mode_config_identity = $false
    player_number_mode_config_identity = 2
  }
  data = [ordered]@{
    brawl = [ordered]@{
      scene = [ordered]@{ $simName = $scene }
      stage = [ordered]@{ $simName = $stage }
      currentBrawl = "wuluxun_simulator"
    }
  }
}

$json = $payload | ConvertTo-Json -Depth 100 -Compress
$encoded = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json))
foreach ($output in $outputs) {
  Set-Content -LiteralPath $output -Value $encoded -Encoding utf8
}

Write-Host ("Wrote config import files: " + ($outputs -join "; "))
