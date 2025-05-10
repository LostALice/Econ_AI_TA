@echo off
REM 啟動經濟腦TA後端服務腳本
cls
echo ========================================
echo ===    經濟腦TA後端服務啟動程式     ===
echo ========================================

REM 確認是否已安裝所需套件
echo.
echo [1/3] 檢查並安裝所需套件...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo 錯誤: 安裝套件失敗，請檢查錯誤訊息。
    goto error
)
echo 套件安裝成功。

REM 檢查資料庫是否已設定
echo.
echo [2/3] 檢查並建立資料庫結構...
python migrate.py
if %errorlevel% neq 0 (
    echo 錯誤: 資料庫遷移失敗，請檢查資料庫連線設定。
    goto error
)
echo 資料庫設定完成。

REM 啟動API服務
echo.
echo [3/3] 啟動API服務...
echo 伺服器啟動後，可以訪問 http://localhost:8000/docs 查看API文檔
echo 按下 Ctrl+C 可以停止服務
echo.
python app.py
if %errorlevel% neq 0 (
    echo 錯誤: API服務啟動失敗，請檢查錯誤訊息。
    goto error
)

goto end

:error
echo.
echo 服務啟動過程中發生錯誤，請檢查上述錯誤訊息。
echo 您可能需要檢查以下項目:
echo - MySQL 資料庫是否已啟動
echo - .env 檔案中的資料庫連線設定是否正確
echo - 是否安裝了所有必要的 Python 套件
echo.
pause
exit /b 1

:end
pause
