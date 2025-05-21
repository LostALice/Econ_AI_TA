# 經濟腦 TA 後端服務

這是經濟腦 TA 後端服務，用於處理 Excel 檔案上傳、題目管理等功能。

## 功能特點

- Excel 檔案上傳與解析
- 題目管理（查詢、更新、刪除）
- 支援 Excel 檔案中的圖片提取與關聯
- RESTful API 接口

## 環境要求

- Python 3.8+
- MySQL 資料庫

## 安裝

1. 複製專案
2. 安裝依賴套件

```bash
pip install -r requirements.txt
```

3. 設定環境變數（`.env` 檔案）

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=econ_afs
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=*
```

## 啟動服務

Windows:
```bash
start_server.bat
```

Linux/macOS:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

## API 文檔

啟動服務後，可以訪問 Swagger UI 文檔：

http://localhost:8000/docs

## Excel 圖片處理功能

本系統採用增強的 Excel 圖片處理功能，使用 `XlsxImageExtractor` 類來提取 Excel 文件中的圖片並與題目進行關聯。主要特點：

1. 直接從 Excel 檔案結構中提取圖片
2. 透過 XML 分析自動關聯圖片與對應題目
3. 支援辨識 Excel 中 "QuestionNo." 和 "ChapterNo" 欄位來建立題目唯一識別碼
4. 準確處理各種格式的圖片（PNG、JPEG、GIF）
5. 支援處理一個題目有多張圖片的情況
6. 使用行號和VM值雙重識別機制，確保圖片與題目的準確對應
7. 完整的日誌記錄和錯誤處理機制

### Excel 檔案要求

為了正確提取圖片，Excel 檔案應符合以下格式：

- A 欄：QuestionNo.（題號）
- B 欄：ChapterNo（章節號）
- C 欄：QuestionInChinese（題目文字）
- 圖片應嵌入到 Excel 中，而不是透過連結引用

### 圖片對應機制

系統採用以下策略來確保圖片正確對應到題目：

1. 分析Excel文件結構，提取所有嵌入的圖片
2. 識別每個圖片所在的行號和VM值（Excel內部的圖片ID）
3. 將圖片與相同行的題號和章節建立關聯
4. 處理多對一映射（一個題目有多張圖片）的情況
5. 在前端UI中顯示對應的圖片和題目

## 資料庫

系統使用 MySQL 資料庫，資料庫結構包含以下主要表：

- `questions`：儲存題目資訊
- `uploaded_files`：儲存已上傳檔案的記錄

## 故障排除

如果遇到問題，可以查看日誌文件 (`app.log`) 獲取詳細錯誤信息。
