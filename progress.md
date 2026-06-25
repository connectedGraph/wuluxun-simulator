Original prompt: 做一个武陆逊模拟器：开局允许刷牌器；无选将等其他元素；玩家武陆逊，对方兀突骨；使用十周年UI；挂载到端口，后续可部署到 nginx；不要一口气直接修改无名杀源码。

## 2026-06-22

- 项目采用独立扩展 + 静态 webroot 方案，不修改无名杀核心源码。
- `extension/extension.js` 注册固定乱斗场景：武陆逊 vs 兀突骨，兀突骨保留原版 AI。
- 入口页只保留 `单挑` 和 `重来`，写入本地配置后进入 `noname.html`。
- 修复早期启动页创建 IndexedDB `video` 仓库缺少 `keyPath: "time"` 的问题；如果检测到错误 schema，会重建模拟器 profile。
- 默认关闭录像、音频和多余系统入口，避免结束对局时写录像报错，也减少资源压力。
- 新增 `scripts/build-webroot.ps1`：从 `D:\Git-Program\noname\resources\app` 构建 `webroot`，跳过 Electron 壳、用户缓存、无关扩展、核心音频和大部分武将图片。
- 新增 `scripts/start-web.ps1`：释放桌面版占用的 8089 后，用普通 Python 静态服务器启动 `webroot`。
- 新增 `shims/static-browser.js`：构建时覆盖到 `webroot\noname\init\browser.js`，给纯静态服务器补最小文件 API，避免依赖原 web server 的 `/checkFile` 等接口。
- 重新构建并启动 `webroot`，当前由 Python 静态服务器监听 `127.0.0.1:8089`，没有启动 `noname.exe`。
- 使用干净 Chrome profile 通过 CDP 验证：入口只有 `单挑`、`重来`；点击 `单挑` 后进入 `noname.html`；场上 2 名角色为武陆逊和兀突骨；未再出现 IndexedDB `IDBObjectStore.put` 弹窗。
- 当前生成后的 `webroot` 大小约 `168.02 MB`。
- 恢复音效体验时没有复制完整 `audio/skill` 目录；当前白名单包含武陆逊死亡语音 `audio/die/wu_luxun.mp3`，以及武陆逊三技能语音：`dcxiongmu1/2`、`dczhangcai1/2`、`dcruxian1/2`。十周年UI自带彩蛋 `extension/十周年UI/audio/caidan/luxun1.mp3`、`luxun2.mp3` 随扩展保留。
- 定位到十周年卡牌皮肤未生效的原因：静态浏览器 shim 的 `game.getFileList()` 以前总是返回空列表，而十周年UI通过它枚举 `extension/十周年UI/image/card-skins`。已改为构建时生成 `webroot/__filelist.json`，并由 shim 返回卡牌皮肤目录清单。
- 重建并在 `http://127.0.0.1:8089/` 验证：`READ_OK.decade=true`，十周年卡牌资源读到 241 张，当前场上 4 张卡全部是 `.decade-card`，背景指向 `extension/十周年UI/image/card-skins/decade/*.png`。验证截图：`webroot-verify-decade-card.png`。
- 用户反馈浏览器里仍像旧版。定位到 `noname.html` 会注册原版 `service-worker.js`，可能继续返回旧资源。已在构建脚本中移除 `service-worker.js` 拷贝，并把构建后的 `noname.html` 入口替换为注销 service worker、清空 Cache Storage 的轻量脚本；`start.html` 进入游戏前也会清缓存。
- 卡牌样式仍使用 `decade`，但关闭 `extension_十周年UI_cardAlternateName`，去掉彩色牌名辅助竖条/标签，更接近用户截图里的纯十周年水墨黑边卡面。
- 增加隐藏验证函数 `window.wuluxunAudioTest()`。浏览器验证结果：解析到 `skill/dcxiongmu1.mp3`、`skill/dcxiongmu2.mp3`、`skill/dczhangcai1.mp3`、`skill/dczhangcai2.mp3`、`skill/dcruxian1.mp3`、`skill/dcruxian2.mp3`；实际请求 `dcxiongmu1`、`dczhangcai2`、`dcruxian1` 均为 HTTP 200，音频元素无错误。验证截图：`webroot-verify-audio-skill.png`。

TODO:

- 下一轮可继续裁剪 `character` 数据包、`node_modules` 和十周年UI资源，但要逐项验证技能、牌堆、AI 和 UI 不缺依赖。

## 2026-06-23

- 修复每次进入时的扩展报错弹窗：原因为模拟器扩展把多条 CSS 合成一个字符串传给 `lib.init.sheet()`，无名杀底层 `insertRule()` 无法解析。现在改为自己注入 `<style>`，不再触发 alert。
- 顶部原生系统入口已压到只剩音量按钮 `♫`；`选项`、`牌堆`、`公共区域`、`显示身份`、`乱斗` 等入口会被隐藏，避免从模拟器跳回完整无名杀菜单。
- 收窄启动隐藏规则：不再整体隐藏 `.dialog.character.fullwidth.fullheight`，避免阻断身份模式/场景模式启动流程，只隐藏旧入口按钮和菜单交互。
- 固定武陆逊势力选择：对 `wu_luxun` 临时覆盖 `get.selectGroup()` 返回空选择，并设定 group 为 `wu`，避免出现“请选择你的势力 / 吴势力”中断模拟器启动。
- 重新构建并启动 `http://127.0.0.1:8089/`。Chrome 自动验证通过：无 alert、`#window` 可见、场上为武陆逊 vs 兀突骨、顶部只剩 `♫`、没有乱斗入口词、没有势力选择提示、卡牌背景指向十周年 `decade` 资源。验证截图：`webroot-verify-final-simulator.png`。

TODO:

- 对局内仍保留换牌/取消/托管/记录/退出等原生按钮；如果要做到“最终入口只有单挑和重来”，建议下一步逐个隐藏并验证刷牌器、AI 托管和重来不受影响。
- 仍有 `noname.config.txt` 404 和一个资源 404 的浏览器 console 记录；目前不影响启动和对局，可后续定位具体 URL 并补空文件或改 shim。

## 2026-06-23 神秀峥嵘

- 用户提供素材目录 `C:\Users\18086\Desktop\神秀峥嵘`，其中含静态立绘 PNG 和 `url.json`。
- 新增 `scripts/import-shenxiu-assets.ps1`：从素材目录复制第一张图片为 `extension\assets\skins\shenxiu_zhengrong\character\wu_luxun.png`，并按 URL 中的 `XiongMu/ZhangCai/RuXian/Dead` 与 `_01/_02` 编号下载并重命名语音。
- 已通过 7890 代理下载神秀峥嵘专属语音：`dcxiongmu1/2`、`dczhangcai1/2`、`dcruxian1/2`、`wu_luxun_die.mp3`。`ForceDownload` 覆盖跑过一遍，修正了早期中断导致的雄幕 1/2 可能错位问题。
- `extension/extension.js` 现在将武陆逊 `img` 指向本地神秀峥嵘静态立绘，并对武陆逊的三个技能和阵亡语音优先使用皮肤包语音；缺文件时仍可回退构建脚本复制到 `audio/skill`、`audio/die` 的同名文件。
- 新增 `window.wuluxunSkinAssetTest()` 用于检查皮肤图和七条语音是否可访问。
- 已重建并重启 `http://127.0.0.1:8089/`。使用系统 Chrome 验证：无 alert，武陆逊玩家框已显示神秀峥嵘静态图；`wuluxunSkinAssetTest()` 中皮肤图和 7 条语音均返回 200；`wuluxunAudioTest()` 解析到 `ext:武陆逊模拟器/assets/skins/shenxiu_zhengrong/audio/dcxiongmu1/2.mp3`、`dczhangcai1/2.mp3`、`dcruxian1/2.mp3`。验证截图：`webroot-verify-shenxiu-skin.png`。

## 2026-06-23 启动器形象选择

- 启动器改为只展示武陆逊形象，不再展示兀突骨头像；兀突骨仍保留在固定两人局中，由原版 AI 控制。
- 启动器新增 `经典形象` / `神秀峥嵘` 二选一，默认保留 `神秀峥嵘`。选择写入配置键 `extension_武陆逊模拟器_wuluxunSkin`，进入对局后扩展只读该开局选择，不提供对局内换肤入口。
- `extension/extension.js` 现在仅在选择 `shenxiu_zhengrong` 时替换武陆逊立绘、玩家头像类名和皮肤包语音；选择 `classic` 时保持无名杀原版武陆逊立绘和核心技能语音。
- `scripts/build-webroot.ps1` 移除了把神秀语音覆盖到 `webroot\audio\skill` / `audio\die` 的兜底复制，避免经典形象串到神秀语音。核心白名单仍复制原版 `dcxiongmu`、`dczhangcai`、`dcruxian` 和 `wu_luxun` 死亡语音。
- 已重建并重启 `http://127.0.0.1:8089/`。系统 Chrome 验证：启动器神秀/经典预览图均可显示，启动器文本不含兀突骨；神秀进局后 `wuluxunAudioTest().skin` 为 `shenxiu_zhengrong` 且技能音频解析到 `ext:武陆逊模拟器/assets/skins/...`；经典进局后 `wuluxunAudioTest().skin` 为 `classic` 且技能音频解析到 `skill/dcxiongmu*.mp3` 等核心路径；对局内没有 `经典/神秀/皮肤` 按钮。
- 验证截图：`webroot-verify-shenxiu-choice-launcher.png`、`webroot-verify-classic-choice-launcher.png`、`webroot-verify-shenxiu-choice-game.png`、`webroot-verify-classic-choice-game.png`。验证 JSON：`webroot-verify-skin-choice.json`。

## 2026-06-23 启动器背景模块

- 启动器新增背景模块：`随机背景`、`上传背景`、`背景模糊` 滑杆。
- 随机背景使用 `https://api.rls.ovh/horizontal`，该接口 HEAD 返回 403，但浏览器 GET 与 PowerShell GET 均可获取 AVIF；实现上立即写入 CSS 背景 URL，让浏览器流式加载，避免等 8MB 左右的 AVIF 完整下载才显影。
- 上传背景保存到独立 IndexedDB `wuluxun_launcher_assets` 的 `assets/background_blob`，进入对局时只重建无名杀 profile，不会清掉该上传背景。
- 背景模式与模糊度分别保存在 `localStorage`：`wuluxun_launcher_bg_mode`、`wuluxun_launcher_bg_blur`。
- 已重建并重启 `http://127.0.0.1:8089/`。系统 Chrome 验证：默认背景 CSS 指向随机 API；点击 `随机背景` 会刷新到带时间戳的 API URL；滑杆可把 CSS `--launcher-bg-blur` 改为 18px；上传本地 PNG 后背景变为 `blob:http://127.0.0.1:8089/...` 且模式为 `custom`；点击 `单挑` 后仍能进入对局，玩家数为 2，`wuluxunAudioTest().skin` 为 `shenxiu_zhengrong`。
- 验证截图：`webroot-verify-background-api-immediate.png`、`webroot-verify-background-module-final.png`、`webroot-verify-background-enter-game.png`。验证 JSON：`webroot-verify-background-module-final.json`。

## 2026-06-23 对局背景同步

- 修复“单挑进去背景换不了”的问题：上一版背景模块只作用在启动器 `index.html`，对局页 `noname.html` 没读取同一套配置。
- `extension/extension.js` 新增对局背景层 `#wuluxun-game-background`，在 `arenaReady` 时读取 `wuluxun_launcher_bg_mode`、`wuluxun_launcher_bg_blur` 和独立 IndexedDB `wuluxun_launcher_assets`，并把启动器选择的随机/上传背景铺到无名杀场景底层。
- 新增验证函数 `window.wuluxunBackgroundTest()`，会重新应用背景并返回当前 mode、source、blur、CSS 背景和背景层状态。
- 已重建并重启 `http://127.0.0.1:8089/`。系统 Chrome 验证：上传本地 PNG 后进入单挑，`wuluxunBackgroundTest()` 返回 `mode=custom`、`active=true`、背景为 `blob:http://127.0.0.1:8089/...`、模糊为 `18px`，玩家数为 2；切到远程随机模式后进入单挑，返回 `mode=remote`、背景为 `https://api.rls.ovh/horizontal`、模糊为 `12px`，玩家数为 2。
- 验证截图：`webroot-verify-game-bg-custom.png`、`webroot-verify-game-bg-remote.png`。验证 JSON：`webroot-verify-game-bg-custom.json`、`webroot-verify-game-bg-remote.json`。

## 2026-06-23 对局背景二次修复

- 用户反馈现有 Chrome 中单挑背景仍未生效。推断旧页面/无名杀主题可能继续用原生 `.background` 覆盖，或者扩展版本未变化导致当前浏览器吃旧 JS。
- `extension/extension.js` 加强背景同步：除 `#wuluxun-game-background` 兜底层外，现在还会直接把无名杀原生 `ui.background` / `.background` 设置成同一张图、同一模糊度，并添加 `wuluxun-native-background` class。
- 调整背景层 z-index：兜底层在 `z-index:0`，原生背景在 `z-index:1`，遮罩在 `z-index:2`，`#window` 在 `z-index:3`，减少被主题层级盖住的概率。
- 模拟器扩展版本从 `0.4.0` 升到 `0.4.1`，启动器写入的 `extension_武陆逊模拟器_version` 也同步更新，帮助现有 Chrome/profile 刷掉旧扩展缓存。
- 已重建并重启 `http://127.0.0.1:8089/`。系统 Chrome 验证：对局内 `.background` 已带 `wuluxun-native-background`，背景为上传图 `blob:http://127.0.0.1:8089/...`，`filter=blur(18px)`，`#window` 背景透明且位于上层，玩家数为 2。验证截图：`webroot-verify-game-bg-native.png`，验证 JSON：`webroot-verify-game-bg-native.json`。

## 2026-06-24 背景布局回收

- 用户反馈单挑页进去后视图会闪偏、布局错位。确认原因是上一版背景同步里还动到了 `#window` / 额外背景层，碰到了无名杀主窗口布局。
- 已回收危险样式，只保留对原生 `.background` 的背景图、模糊和禁用指针事件，不再改 `#window`。
- 模拟器版本同步升到 `0.4.2`，`extension/start.html`、`extension/extension.js`、`extension/info.json` 已更新，用于刷新浏览器缓存。
- 已重建并重启 `http://127.0.0.1:8089/`。Playwright 验证通过：`/index.html?v=0.4.2-bg-layout-fix` 可进单挑，`wuluxunBackgroundTest()` 显示 `mode=custom` / `mode=remote` 均正常，`.background.wuluxun-native-background` 可见，`#window` 保持原生 `position:absolute`、`zIndex:auto`，角色和手牌区域位置恢复正常。
- 当前验证截图：`webroot-verify-bg-layout-fix.png`、`webroot-verify-bg-layout-fix-remote.png`。仍存在的控制台 404 / `ERR_CONNECTION_CLOSED` 属于无名杀资源侧的杂音，未影响对局与背景。

## 2026-06-25 背景缓存一次性化

- 用户明确要求：随机背景 API 只在 launcher 侧触发一次，进入对局后必须只从 IndexedDB 读取，不再重新调用远端接口。
- 已把 launcher 的随机背景流程改为“抓图 -> 转 blob -> 写入 `wuluxun_launcher_assets/assets/background_blob` -> 预览本地 blob URL”；进入对局时扩展只读 IndexedDB。
- 还修掉了随机按钮/初始化时可能并发覆盖的问题，引入请求 token，避免旧请求把新缓存图覆盖掉。
- 已验证：点击 `随机背景` 后会访问 `https://api.rls.ovh/horizontal` 并把图片存进本地；进入单挑后网络请求里没有新的 `api.rls.ovh` 调用，对局页背景来源显示 `indexeddb-remote`，`#window` 布局保持原生状态。
- 版本已升到 `0.4.3`，对应文件：`extension/start.html`、`extension/extension.js`、`extension/info.json`。
