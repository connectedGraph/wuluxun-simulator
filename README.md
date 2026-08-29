# 武陆逊模拟器

基于开源三国杀游戏[《无名杀》](https://github.com/libnoname/noname)与[《十周年UI》](https://github.com/diandian157/decadeUI)扩展定制的单人单挑模拟器:固定扮演武陆逊,对战兀突骨(原版 AI 托管),开局面板可刷手气卡。

## 上游与出处

本项目不是从零写的游戏,而是在以下开源项目基础上定制:

| 组件 | 来源 | 说明 |
|---|---|---|
| [无名杀 noname](https://github.com/libnoname/noname) | GPL-3.0 | 游戏本体,完整源码在本仓库根目录 |
| [十周年UI decadeUI](https://github.com/diandian157/decadeUI) | GPL-3.0 | 界面美化扩展,位于 `extension/十周年UI/`,版本 1.3.1 |

对无名杀本体的定制集中在一处:`mode/identity.js`(身份模式的 `chooseCharacter` 流程),其余文件保持上游原样,便于跟 进上游更新。启动器入口是 `index.html`,把开局配置写入浏览器存储后跳转 `noname.html` 进对局。

## 运行

环境要求:Windows + Python 3(仅用于起静态服务器)。

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-web.ps1
```

默认监听 `http://127.0.0.1:8089/`,浏览器打开即可。启动脚本自带:

- 静态服务器响应带 `Cache-Control: no-store`,改完代码刷新即生效,不会被浏览器缓存坑
- 重复启动会自动替换旧进程;可用 `-Port` 参数换端口

## 开局面板说明

- **形象**:经典形象 / 神秀峥嵘 二选一(皮肤素材在 `image/skin/shenxiu_zhengrong/`)
- **随机背景 / 上传背景**:背景图存 IndexedDB,进对局只读本地缓存,不再请求远端
- **背景模糊**:滑杆 0–28px,启动器与对局内共用同一设置

## 协议与二次分发

- 无名杀本体与十周年UI 扩展均为 **GPL-3.0** 开源,本项目整体同样以 GPL-3.0 提供
- 打包、二次分发**请保留代码出处**:<https://github.com/libnoname/noname> 与 <https://github.com/diandian157/decadeUI>
- 请不要用于商业用途
