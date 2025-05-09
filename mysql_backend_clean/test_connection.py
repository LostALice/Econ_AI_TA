# 測試資料庫連接（使用 PyMySQL）
import sys
import os
import logging
from dotenv import load_dotenv
import pymysql

# 設定日誌
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_connection():
    """測試資料庫連接"""
    try:
        # 載入環境變數
        load_dotenv()
        
        # 明確從環境變數獲取資料庫設定
        host = os.getenv('MYSQL_HOST', 'localhost')
        port = int(os.getenv('MYSQL_PORT', '3306'))
        user = os.getenv('MYSQL_USER', 'root')
        password = os.getenv('MYSQL_PASSWORD', 'mysql')
        database = os.getenv('MYSQL_DATABASE', 'econ_afs')
        
        # 印出連接信息以調試（不包含密碼）
        logger.info(f"嘗試連接到資料庫 {database} 在 {host}:{port} 使用者 {user}")
        
        # 連接到指定的資料庫
        connection = pymysql.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )
        
        cursor = connection.cursor()
        
        # 執行簡單查詢
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        
        # 顯示資料表列表
        logger.info(f"資料庫中的資料表:")
        for table in tables:
            logger.info(f"- {table[0]}")
            
            # 檢查資料表結構
            cursor.execute(f"DESCRIBE {table[0]}")
            columns = cursor.fetchall()
            for column in columns:
                logger.info(f"  - {column[0]} ({column[1]})")
                
        # 關閉連接
        cursor.close()
        connection.close()
        logger.info("資料庫連接已關閉")
        
        return True
    except Exception as e:
        logger.error(f"資料庫連接測試時發生錯誤: {e}")
        return False

if __name__ == "__main__":
    if test_connection():
        print("資料庫連接測試成功")
    else:
        print("資料庫連接測試失敗，請檢查 .env 檔案中的資料庫連接設定")
