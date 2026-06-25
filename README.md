# 武陆逊模拟器

这是无名杀的独立网页适配层，围绕“武陆逊 vs 兀突骨”做成一个可直接部署的单挑启动器。

## 运行

构建精简网页目录：

```powershell
[Console]::InputEncoding=[System.Text.Encoding]::UTF8; [Console]::OutputEncoding=[System.Text.Encoding]::UTF8; & 'D:\Git-Program\wuluxun-simulator\scripts\build-webroot.ps1'
```

启动静态服务器：

```powershell
[Console]::InputEncoding=[System.Text.Encoding]::UTF8; [Console]::OutputEncoding=[System.Text.Encoding]::UTF8; & 'D:\Git-Program\wuluxun-simulator\scripts\start-web.ps1'
```

入口：

`http://127.0.0.1:8089/`

## 当前状态

- 启动页标题是 `武陆逊模拟器`
- 主按钮是 `启动`
- 入口只保留 `经典形象` / `神秀峥嵘`
- 对局固定两人：玩家武陆逊，对方兀突骨
- 对方保留原版 AI
- UI 使用 `十周年UI`
- 牌面、音效、武陆逊专属语音已保留
- 背景支持随机、上传和模糊调节
- 随机背景会先存进 IndexedDB，进入对局后只读本地缓存，不会再请求远端 API
- 对局内只保留必要入口，方便后续继续解耦和部署
- 部署时直接发布 `webroot`，再用 nginx 反代即可

## 神秀峥嵘素材

导入桌面素材目录：

```powershell
[Console]::InputEncoding=[System.Text.Encoding]::UTF8; [Console]::OutputEncoding=[System.Text.Encoding]::UTF8; & 'D:\Git-Program\wuluxun-simulator\scripts\import-shenxiu-assets.ps1' -SourceDir 'C:\Users\18086\Desktop\神秀峥嵘'
```

约定文件：

- `extension\assets\skins\shenxiu_zhengrong\character\wu_luxun.png`
- `extension\assets\skins\shenxiu_zhengrong\audio\dcxiongmu1.mp3`
- `extension\assets\skins\shenxiu_zhengrong\audio\dcxiongmu2.mp3`
- `extension\assets\skins\shenxiu_zhengrong\audio\dczhangcai1.mp3`
- `extension\assets\skins\shenxiu_zhengrong\audio\dczhangcai2.mp3`
- `extension\assets\skins\shenxiu_zhengrong\audio\dcruxian1.mp3`
- `extension\assets\skins\shenxiu_zhengrong\audio\dcruxian2.mp3`
- `extension\assets\skins\shenxiu_zhengrong\audio\wu_luxun_die.mp3`

## 文件边界

- 源码目录：`D:\Git-Program\wuluxun-simulator`
- 交付目录：`C:\Users\18086\Desktop\wuluxun-simulator`
- 构建产物：`webroot`
- 桌面版无名杀安装目录只作为构建来源，不需要作为运行前提
