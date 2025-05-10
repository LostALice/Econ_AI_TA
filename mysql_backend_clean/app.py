#!/usr/bin/env python3
"""
主程式入口點 - 經濟腦TA 後端服務
連接前端和 MySQL 資料庫，提供 Excel 檔案上傳與管理的功能
"""
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import uvicorn
import os
import sys
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# 添加當前目錄到系統路徑，以便正確導入本地模組
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# 載入環境變數
load_dotenv()

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),  # 輸出到控制台
        logging.FileHandler("app.log", encoding="utf-8"),  # 輸出到檔案
    ],
)
logger = logging.getLogger("經濟腦TA-API")

# 導入路由
try:
    from api import router as api_router
    from db_connection import DBConnection
except ImportError as e:
    logger.error(f"導入模組錯誤: {e}")
    sys.exit(1)

# 檢查資料庫連接
def check_db_connection():
    """檢查資料庫連接"""
    try:
        db = DBConnection()
        db.close()
        return True
    except Exception as e:
        logger.error(f"資料庫連接檢查失敗: {e}")
        return False

# 建立 FastAPI 應用
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    應用程式生命週期管理
    在應用啟動時檢查資料庫連接，在關閉時進行清理
    """
    # 啟動前檢查資料庫連接
    if not check_db_connection():
        logger.critical("無法連接到資料庫，應用程式將無法正常運行")
    else:
        logger.info("資料庫連接正常")
    
    yield
    
    # 應用關閉時執行清理
    logger.info("應用程式關閉")

app = FastAPI(
    title="經濟腦TA 後端 API",
    description="提供 Excel 題目管理功能",
    version="1.0.0",
    lifespan=lifespan,
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊路由
app.include_router(api_router, prefix="/api/v1")

# 錯誤處理
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """處理請求驗證錯誤"""
    errors = exc.errors()
    error_messages = [f"{err['loc']}: {err['msg']}" for err in errors]
    logger.warning(f"請求驗證錯誤: {error_messages}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": error_messages,
            "message": "請求數據無效",
            "status_code": 422
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """處理 HTTP 異常"""
    logger.warning(f"HTTP 異常: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "message": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """處理一般異常"""
    logger.error(f"未處理的異常: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "內部伺服器錯誤",
            "message": str(exc),
            "status_code": 500
        }
    )

# 健康檢查端點
@app.get("/health")
async def health_check():
    """健康檢查端點"""
    db_status = check_db_connection()
    if not db_status:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "message": "資料庫連接失敗",
                "service": "db"
            }
        )
    return {"status": "healthy", "message": "服務運行正常"}

# 應用入口
if __name__ == "__main__":
    # 從環境變數獲取主機和埠
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    logger.info(f"啟動應用於 {host}:{port}")
    uvicorn.run(
        "app:app", 
        host=host, 
        port=port, 
        reload=True,  # 開發模式自動重載
        log_level="info"
    )
