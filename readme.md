# Econ AFS

## 概覽

經濟腦 TA 是一個全棧的教學輔助平台，包含：

- **後端 API 服務** (`mysql_backend_clean/`) 
- **前端管理界面** (`frontend/`) 
- **智慧題庫管理** - Excel 檔案解析、圖片提取、題目管理
- **登入系統** - 學生、助教、教師三種角色

## 主要功能

### 文檔管理系統 (`/docs`)

- **Excel 檔案上傳與解析**
  - 支援 .xlsx 格式
  - 自動解析題目、選項、答案和章節資訊
  - 圖片提取與關聯
  - 支援多圖片題目處理


- **題目編輯功能**
  - 線上編輯題目內容
  - 修改圖片 (X)
  - 

### 登入系統 (`/login`)

- **多角色身份認證**
  - 學生 (Student)
  - 助教 (TA)
  - 教師 (Teacher)

- **用戶管理**
  - 自動登入狀態檢查

### 後端 API 服務

- **Excel 處理 API**
  - `POST /excel/upload/` - 上傳 Excel 檔案
  - `GET /excel/list/{doc_type}/` - 獲取檔案列表
  - `GET /excel/questions/{file_id}/` - 獲取題目列表
  - `PUT /excel/questions/update/` - 更新題目
  - `DELETE /excel/delete/{file_id}/` - 刪除檔案

- **圖片處理功能**
  - Excel 內嵌圖片自動提取
  - Base64 圖片編碼
  - 關聯圖片與題目的關係
  - 支援 PNG、JPEG、GIF 格式

## 快速開始

### 環境要求

- **後端**
  - Python 3.8+
  - MySQL 5.7+
  - FastAPI 0.103.1+


### 安裝步驟

#### 後端設定

```bash
# 進入後端目錄
cd mysql_backend_clean

# 安裝 Python 依賴
pip install -r requirements.txt

# 設定環境變數（創建 .env 檔案）
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=econ_afs
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=*

# 啟動後端服務
# Windows
start_server.bat

# Linux/macOS
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 資料庫初始化

```bash
# 執行資料庫遷移
cd mysql_backend_clean
python migrate.py

# 或使用自動建表功能
python alter_table.py
```

## 使用指南

### Excel 檔案格式要求

為了正確解析題目和提取圖片，Excel 檔案應符合以下格式：

```
| A欄 (QuestionNo.) | B欄 (ChapterNo) | C欄 (QuestionInChinese) | D欄 (OptionA) | E欄 (OptionB) | ... |
|------------------|----------------|----------------------|--------------|--------------|-----|
| 1                | 第一章          | 題目內容               | 選項A         | 選項B         | ... |
```

**重要提醒：**
- 圖片應直接嵌入到 Excel 中，而非透過連結引用
- 系統會自動識別圖片所在的行號並與題目建立關聯
- 支援一個題目對應多張圖片的情況

### 權限說明

| 角色 | 權限 |
|------|------|
| **學生** | 瀏覽題庫 |
| **助教** | 學生權限 + 題目編輯、上傳題庫 |
| **教師** | 助教權限 + 題目編輯、上傳題庫 |


## 圖片提取技術架構

### 後端

- **資料庫**: MySQL + PyMySQL
- **檔案處理**: openpyxl, pandas
- **圖片處理**: Pillow, lxml
- **API 文檔**: Swagger/OpenAPI

### 前端

- **檔案處理**: xlsx

#### Context 狀態管理系統

前端採用 React Context API 進行全局狀態管理，包含以下核心 Context：

- **AuthContext** (`contexts/AuthContext.tsx`)
  - 用戶身份認證狀態管理
  - JWT Token 驗證與更新
  - 多角色權限控制 (學生/助教/教師)
  - 自動登入狀態檢查
  - Cookie 安全管理

- **ToastContextProvider** (`contexts/ToastContextProvider.tsx`)
  - 全局通知訊息管理
  - 成功/錯誤/警告訊息顯示
  - HeroUI Toast 組件整合

### 核心特性

#### Excel 圖片處理引擎

本系統採用增強的 Excel 圖片處理功能，使用 `XlsxImageExtractor`：

1. **直接提取**: 從 Excel 檔案結構中直接提取嵌入圖片
2. **XML 分析**: 透過分析 Excel XML 結構自動關聯圖片與題目
3. **圖片識別**: 使用行號和 Value Memory 雙重識別機制
4. **格式支援**: PNG、JPEG、GIF 等常見圖片格式，轉換成 base64

## 故障排除

### 常見問題

1. **Excel 上傳失敗**
   - 檢查檔案格式是否為 .xlsx 或 .xls
   - 確認檔案大小不超過限制
   - 查看後端日誌 (`app.log`) 獲取詳細錯誤信息

2. **圖片無法顯示**
   - 確認圖片已正確嵌入到 Excel 中
   - 檢查圖片格式是否支援（PNG、JPEG、GIF）
   - 查看瀏覽器控制台錯誤信息

3. **登入問題**
   - 確認角色選擇正確
   - 檢查用戶名和密碼格式
   - 清除瀏覽器 Cookie 並重新登入

### 日誌查看

```bash
# 查看後端日誌
tail -f mysql_backend_clean/app.log

# 查看資料庫連接狀態
python mysql_backend_clean/db_connection.py
```

### 預設測試帳號

系統預設提供以下測試帳號：

```
教師帳號:
  Email: teacher@fcu.edu.tw
  Password: teacher123

助教帳號:
  Email: ta@fcu.edu.tw  
  Password: ta123

學生帳號:
  Email: student@fcu.edu.tw
  Password: student123
```

### 程式碼結構

```
Econ_AFS/
├── mysql_backend_clean/        # 後端 API 服務
│   ├── api.py                 # API 路由定義
│   ├── app.py                 # FastAPI 應用主程式
│   ├── db_connection.py       # 資料庫連接管理
│   ├── excel_handler.py       # Excel 處理核心
│   ├── migrate.py             # 資料庫遷移腳本
│   ├── alter_table.py         # 表結構修改工具
│   ├── start_server.bat       # Windows 啟動腳本
│   └── requirements.txt       # Python 依賴
├── frontend/                  # 前端應用
│   ├── pages/
│   │   ├── docs/             # 文檔管理頁面
│   │   │   └── index.tsx     # 題庫管理主頁面
│   │   └── login/            # 登入相關頁面
│   │       └── index.tsx     # 登入頁面
│   └── contexts/             # React Context 狀態管理
│       ├── AuthContext.tsx   # 認證狀態管理
│       ├── LangContext.tsx   # 語言切換管理
│       ├── PasswordChangeContext.tsx  # 密碼修改管理
│       └── ToastContextProvider.tsx   # 通知訊息管理
│    
└── README.md  
```
