# MySQL 資料庫整合說明

此模組提供了一個 MySQL 資料庫整合方案，用於存儲和管理 Excel 檔案中的題目。

## 功能特點

- 解析上傳的 Excel 檔案中的題目並存入資料庫
- 支援從資料庫獲取檔案列表和題目列表
- 支援刪除檔案及其關聯題目
- 提供 API 端點供前端呼叫
- 支援本地緩存作為離線備份機制

## 檔案結構

```
mysql_backend/
  ├── __init__.py               # 模組初始化檔
  ├── db_connection.py          # 資料庫連接類 (PyMySQL)
  ├── excel_handler.py          # Excel 檔案處理類
  ├── api.py                    # API 路由處理
  ├── migrate.py                # 資料庫遷移腳本
  ├── test_connection.py        # 資料庫連接測試
  └── install_packages.bat      # 依賴套件安裝腳本
```

## 資料表結構

### questions 資料表

用於存儲題目資料：

| 欄位名稱 | 資料類型 | 說明 |
|---------|---------|------|
| id | INT | 主鍵，自動遞增 |
| question_no | VARCHAR(50) | 題號 |
| chapter_no | VARCHAR(50) | 章節號 |
| question_text | TEXT | 題目內容 |
| option_a | TEXT | 選項 A |
| option_b | TEXT | 選項 B |
| option_c | TEXT | 選項 C |
| option_d | TEXT | 選項 D |
| correct_answer | VARCHAR(255) | 正確答案 |
| explanation | TEXT | 解釋說明 |
| picture | LONGTEXT | 圖片 (Base64格式，可為空) |
| file_name | VARCHAR(255) | 檔案名稱 |
| upload_time | TIMESTAMP | 上傳時間 |
| doc_type | VARCHAR(50) | 文件類型 |

### uploaded_files 資料表

用於存儲上傳的檔案資訊：

| 欄位名稱 | 資料類型 | 說明 |
|---------|---------|------|
| file_id | VARCHAR(255) | 主鍵，檔案 ID |
| file_name | VARCHAR(255) | 檔案名稱 |
| doc_type | VARCHAR(50) | 文件類型 |
| upload_time | TIMESTAMP | 上傳時間 |
| last_update | TIMESTAMP | 最後更新時間 |
| question_count | INT | 題目數量 |

## API 端點

### 1. 上傳 Excel 檔案

- **URL**: `/api/v1/excel/upload/`
- **方法**: POST
- **參數**:
  - excel_file: Excel 檔案
  - doc_type: 文件類型 ("TESTING" 或 "THEOREM")
- **回傳**: 檔案 ID、檔案名稱、最後更新時間

### 2. 獲取檔案列表

- **URL**: `/api/v1/excel/{doc_type}/`
- **方法**: GET
- **參數**:
  - doc_type: 文件類型 ("TESTING" 或 "THEOREM")
- **回傳**: 檔案列表

### 3. 獲取題目列表

- **URL**: `/api/v1/excel/questions/{file_id}/`
- **方法**: GET
- **參數**:
  - file_id: 檔案 ID
- **回傳**: 檔案 ID、檔案名稱、題目列表

### 4. 刪除檔案

- **URL**: `/api/v1/excel/{file_id}/`
- **方法**: DELETE
- **參數**:
  - file_id: 檔案 ID
- **回傳**: 檔案 ID、訊息

## 安裝與設定

1. 執行 `install_packages.bat` 安裝必要的 Python 套件
2. 編輯 `.env` 檔案設定資料庫連接資訊
3. 執行 `migrate.py` 初始化資料庫和資料表
4. 執行 `test_connection.py` 測試資料庫連接

## 前端整合

前端已修改為優先使用資料庫來儲存和獲取題目，同時保留本地緩存作為備用機制，以支援離線操作或處理資料庫連接失敗的情況。


## PyMySQL 更新

系統已從 mysql.connector 更新為 PyMySQL，提供更好的錯誤訊息和連接能力。

## 故障排除

如果遇到資料庫連接問題：

1. 確認 MySQL 服務是否運行 (`net start MySQL80`)
2. 確認 .env 檔案中的連接參數是否正確，特別是密碼
3. 確認 MySQL 用戶是否有適當權限
4. 執行 `python mysql_backend/test_connection.py` 以測試資料庫連接

## 注意事項

- Excel 檔案必須包含特定欄位：QuestionNo, ChapterNo, QuestionInChinese, AnswerAInChinese, AnswerBInChinese, AnswerCInChinese, AnswerDInChinese, CorrectAnswer, AnswerExplainInChinese, Picture
- 除了 Picture 欄位外，其他欄位不能為空值
- 資料庫表使用 utf8mb4 編碼，支援中文和特殊字元
