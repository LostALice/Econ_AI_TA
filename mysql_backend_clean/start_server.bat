@echo off
echo ===== 經濟腦TA 後端服務啟動腳本 =====
echo.

REM 確保使用 UTF-8 編碼
chcp 65001

REM 檢查是否已安裝 Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [錯誤] 未安裝 Python 或無法找到 Python
    echo 請安裝 Python 3.8 或更高版本後再執行此腳本
    echo https://www.python.org/downloads/
    pause
    exit /b 1
)

REM 檢查是否已安裝所需套件
echo [檢查] 安裝依賴套件...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [警告] 安裝套件時發生錯誤，繼續執行但可能會導致服務無法正常運行
) else (
    echo [成功] 已安裝所需套件
)

REM 檢查環境變數文件
if not exist .env (
    echo [警告] 找不到 .env 檔案，建立預設環境變數
    (
        echo MYSQL_HOST=localhost
        echo MYSQL_PORT=3306
        echo MYSQL_USER=root
        echo MYSQL_PASSWORD=mysql
        echo MYSQL_DATABASE=econ_afs
        echo API_HOST=0.0.0.0
        echo API_PORT=8000
        echo CORS_ORIGINS=*
    ) > .env
    echo [提示] 已建立預設 .env 檔案，請編輯該檔案以設定正確的資料庫連接資訊
) else (
    echo [成功] 找到 .env 環境變數檔案
)

REM 嘗試執行資料庫修正
echo [執行] 正在確保資料庫結構...
python migrate.py
if %ERRORLEVEL% NEQ 0 (
    echo [警告] 資料庫結構調整時發生錯誤，繼續執行但可能會導致服務無法正常運行
) else (
    echo [成功] 資料庫結構已更新
)

REM 啟動服務
echo [執行] 啟動 FastAPI 服務...
echo [提示] 請訪問 http://localhost:8000/docs 瀏覽 API 文檔
echo [提示] 按 CTRL+C 可終止服務

REM 確保創建臨時目錄
mkdir temp_extraction 2>nul
mkdir extracted_images 2>nul

python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
pause
