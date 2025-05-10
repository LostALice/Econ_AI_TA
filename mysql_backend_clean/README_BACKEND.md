# 經濟腦TA 後端服務

這是經濟腦TA專案的後端服務，提供Excel題目檔案上傳、查詢和管理功能。

## 功能特色

- Excel檔案上傳與解析
- 題目資料存儲至MySQL資料庫
- RESTful API提供前端調用
- 完整的錯誤處理與日誌記錄
- 支援不同章節中相同題號的題目

## 需求

- Python 3.8+
- MySQL 5.7+ 或 8.0+
- 安裝 requirements.txt 中列出的Python套件

## 快速開始

1. 確保已安裝Python和MySQL
2. 配置 `.env` 文件中的資料庫連接參數
3. 運行以下命令安裝依賴套件：

```
pip install -r requirements.txt
```

4. 初始化資料庫結構（包含資料庫修正）：

```
python migrate.py
```

5. 啟動服務：

```
python app.py
```

或者，直接執行 `start_server.bat` 一鍵完成上述步驟。

## 資料庫結構說明

本系統使用MySQL資料庫存儲題目和上傳檔案的資訊，主要包含兩個資料表：

1. **questions** - 存儲解析自Excel的題目
   - 支援不同章節中的相同題號（索引結構為 `question_no`, `chapter_no`, `file_name`）
   - 每個題目包含題號、章節、選項、答案等完整信息
   - 已優化索引結構，以支援相同題號的題目

2. **uploaded_files** - 記錄已上傳的檔案
   - 存儲檔案ID、名稱、類型和包含的題目數量
   - 支援檔案狀態管理和題目數量統計

## API說明

服務啟動後，API可通過 http://localhost:8000/api/v1 訪問。

### 主要端點：

- **上傳Excel文件**：`POST /api/v1/excel/upload/`
  - 參數：excel_file (文件), doc_type (文件類型)
  - 返回：上傳成功信息與文件ID

- **獲取文件列表**：`GET /api/v1/excel/{doc_type}/`
  - 返回：指定類型的所有文件列表

- **獲取題目**：`GET /api/v1/questions/{file_id}/`
  - 返回：特定文件的所有題目

- **健康檢查**：`GET /health`
  - 返回：服務健康狀態

## Excel檔案格式

上傳的Excel檔案必須包含以下欄位：

1. QuestionNo. (題號)
2. ChapterNo (章節號)
3. QuestionInChinese (中文題目)
4. AnswerAInChinese (選項A)
5. AnswerBInChinese (選項B)
6. AnswerCInChinese (選項C)
7. AnswerDInChinese (選項D)
8. CorrectAnswer (正確答案)
9. AnswerExplainInChinese (解析)
10. Picture (圖片，可選)

除了Picture欄位外，其餘欄位均為必填。

## 測試

測試上傳功能建議使用以下方式：

1. 使用Postman或類似工具發送文件上傳請求
2. 使用前端應用通過文件上傳組件提交Excel文件

## 錯誤處理

服務將返回適當的HTTP狀態碼和詳細錯誤信息：

- 400：請求參數錯誤
- 404：資源不存在
- 422：參數驗證失敗
- 500：服務器內部錯誤

所有錯誤和警告將記錄在app.log文件中。
