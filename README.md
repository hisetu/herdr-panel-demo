# Herdr Panel Demo

在既有的 **Files／Changes 按鈕旁新增 Demo**，三者共用同一個右側面板，不新增工具列或第二個側欄。

## 操作方式

```text
┌──────────┬─────────────────────────────────────────┐
│ Spaces   │ Tabs …                Files Changes Demo│
│ Agents   ├───────────────────────────┬─────────────┤
│          │ Terminal                  │ 所選的面板  │
│          │                           │ Files 或    │
│          │                           │ Changes 或  │
│          │                           │ Demo        │
└──────────┴───────────────────────────┴─────────────┘
```

- 點擊 Demo：切換到工作區資訊並開啟右側面板。
- 面板開啟時點 Files 或 Changes：在同一個區域切換內容。
- 再次點擊目前啟用的按鈕：收起右側面板。
- Demo 內的「關閉」也會收起同一個右側區域。
- 沿用原有分隔線拖曳與每個 Space 記住面板選擇的邏輯。

## Layout 與 Mod 的責任

| 檔案 | 責任 |
|---|---|
| `layouts/demo-right-panel.json` | 既有 `panel-body` stack 加入 `demo-inspector` 子節點，tab bar 改用個人 Mod |
| `mods/demo-tabs/main.js` | 從內建 tabs 0.1.13 複製，保留原有 tab 操作與 Files／Changes，新增 Demo 按鈕 |
| `mods/demo-inspector/main.js` | 畫出目前 Space、Tab、Machine、目錄與 Terminal ID，處理關閉按鈕 |
| `mods/demo-pane/main.js` | 在每個 Pane 標題列的程式名稱旁顯示 Terminal ID；遠端保留完整 machine/address |
| `mods/demo-tabs/panel.svg` | Demo 按鈕圖示 |

開啟 Demo 的核心指令：

```js
run("layout.select", { stack: "panel-body", child: "demo-inspector" });
run("layout.show", { id: "panel" });
```

收起面板：

```js
run("layout.hide", { id: "panel" });
```

不改動全域 `workspace.panels` 偏好，也不修改 Herdr 內建 tabs Mod。個人 `demo-tabs` 會將 Demo 納入可選面板，所以每個 Space 恢復選擇時不會把 Demo 當作無效項目。

## 安裝與預覽

需要已安裝的 Herdr 桌面版、Node.js 與 Python 3。沒有第三方 npm 相依套件，不需執行 npm install。

```bash
cd /Volumes/TB4-1TB/Projects/herdr-panel-demo
bash scripts/check.sh

# 僅供首次安裝；遇到同名檔案會拒絕覆寫
python3 scripts/install.py

# 顯示範例
herdr-app do layout.switch --name demo-right-panel
```

安裝預設寫入 `~/.config/herdr-app`，若設定 `HERDR_APP_HOME` 則使用該目錄。安裝腳本不會自行切換 Layout。

本機已安裝的上一版範例已同步修正。舊版 `demo-toolbar` 不再被 Layout 引用；專案舊碼保留在 `archive/demo-toolbar/`，方便對照兩種配置。安裝目錄裡舊的 `mods/demo-toolbar/` 目前也未被使用。

## 開發

Herdr 監看的是安裝目錄，不是專案目錄。修改專案後需同步對應檔案至安裝目錄；同步前先檢查是否有自己的修改，不要直接覆寫。

- 改 Demo 按鈕與面板開關：`mods/demo-tabs/main.js`。
- 改 Demo 內容：`mods/demo-inspector/main.js`。
- 改右側寬度：Layout 的 `panel` 節點。
- 增加更多面板：同時新增 stack 子節點、按鈕與 enabled 項目。
- 個人 tabs 是內建 0.1.13 的副本，不會自動合併後續內建更新。
- 圖示仍引用部分內建資產，因此此專案依賴相容版本的 Herdr。

三個 Mod 都使用原生 GPUI，不是 HTML／CSS；Node.js 僅用來測試。Mods 不執行 shell 或網路請求、不讀取額外檔案，也不啟停 Terminal。tab bar 沿用的使用者操作（新增／關閉 tab 等）維持原有行為。

## 驗證

`bash scripts/check.sh` 執行十一項自動測試，再執行三個 Mod 的 `herdr-app check`。Pane 標題列另外涵蓋本機 ID、完整遠端地址、Mod Pane 無 Terminal 時不顯示 ID，以及找不到 Pane 的情況。測試涵蓋共用 stack、三個按鈕、選擇／開啟／收起、每個 Space 還原 Demo、空資料與即時資訊 rendering。VM Modules 可能顯示 Node 的實驗性功能警告。

實機驗收：依序點 Files → Demo → Changes，確認使用同一個右側區域；再次點擊目前面板的按鈕，確認收起。也應測試切換 Space 後恢復選擇、調整分隔線寬度，以及 `herdr-app status` 沒有 errors。

`layouts/demo-right-panel.svg` 是示意縮圖，不是實機截圖。

## 切回原本介面

```bash
herdr-app do layout.switch --name main-issues
```

不需重新啟動 App 或 Core。切換 Layout 不會關閉既有 Terminal。
