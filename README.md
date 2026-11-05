# aloongstat — 臺中台壽霸龍數據平台

紀錄員用手機逐球紀錄，送出就自動算好所有數據；比分與賽程公開，打擊、投球、情蒐等數據只給球隊帳號看（登入功能製作中）。

系統源自 NTU BaFiN 系隊的 bafinstat 與臺大棒球校隊的 NTUBAstat，這裡是霸龍獨立的一份：自己的程式、資料庫、網站與網址，和原本兩個網站互不影響。

| 要做的事 | 看這份 |
|---|---|
| 第一次架設（資料庫、網站、網域） | [docs/SETUP.md](docs/SETUP.md) |
| 日常維護、改功能、交接、故障排除 | [docs/HANDOVER.md](docs/HANDOVER.md) |
| 紀錄員與球員怎麼用網站 | [docs/USER_GUIDE.md](docs/USER_GUIDE.md)（網站的「使用指南」頁也有） |
| 資料安全制度（防護、帳號、事件處理） | [docs/SECURITY.md](docs/SECURITY.md) |
| 用 Claude 改程式時的規則 | [CLAUDE.md](CLAUDE.md) |

## 架構

| 部分 | 放在哪 |
|---|---|
| 程式碼 | 這個 GitHub repo（私人；`web/` 是網站） |
| 資料庫 | Supabase 免費方案（`supabase/schema.sql`） |
| 網站 | Cloudflare Workers（`web/wrangler.jsonc`）：GitHub 測試通過後直接部署上去（需要 GitHub Secrets 的 Cloudflare 權杖） |
| 自動化 | `.github/workflows/`：測試通過自動上線、每 3 天讓資料庫保持清醒、每日備份 |

## 本機開發

```
cd web
npm ci
npm run dev      # 本機預覽
npm test         # 測試
npm run build    # 建置
```

隊名、局數等設定在 `web/src/config/teamDefaults.ts`；隊徽在 `web/public/logo.png`（完整版）與 `web/public/mark.png`（正方形、只有霸龍頭像，給小圖示用）；配色取自隊徽：深藍 #011d3b、金黃 #f4cb21。
