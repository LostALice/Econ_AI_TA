import pymysql
import os
import logging
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

# 設定日誌
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def alter_table_picture_column():
    """修改 questions 資料表中的 picture 欄位為 MEDIUMBLOB"""
    try:
        # 明確從環境變數獲取資料庫設定
        host = os.getenv("MYSQL_HOST", "localhost")
        port = int(os.getenv("MYSQL_PORT", "3306"))
        user = os.getenv("MYSQL_USER", "root")
        password = os.getenv("MYSQL_PASSWORD", "mysql")
        database = os.getenv("MYSQL_DATABASE", "econ_afs")

        # 連接到指定的資料庫
        connection = pymysql.connect(
            host=host, port=port, user=user, password=password, database=database
        )

        logger.info(
            f"已成功連接到 MySQL 資料庫 {database} 在 {host}，準備修改資料表結構"
        )

        with connection.cursor() as cursor:
            # 檢查資料表結構
            cursor.execute("DESCRIBE questions")
            results = cursor.fetchall()
            logger.info("現有資料表結構:")
            for row in results:
                logger.info(f"欄位: {row[0]}, 類型: {row[1]}, 空值: {row[2]}")

            # 修改 picture 欄位型別
            logger.info("開始修改 picture 欄位類型為 MEDIUMBLOB...")
            cursor.execute("ALTER TABLE questions MODIFY COLUMN picture MEDIUMBLOB")

            # 確認修改後的結構
            cursor.execute("DESCRIBE questions")
            results = cursor.fetchall()
            logger.info("修改後的資料表結構:")
            for row in results:
                if row[0] == "picture":
                    logger.info(f"欄位: {row[0]}, 類型: {row[1]}, 空值: {row[2]}")

        # 提交事務
        connection.commit()
        logger.info("picture 欄位類型修改完成")

        # 關閉連接
        connection.close()
        return True

    except Exception as e:
        logger.error(f"修改資料表結構時發生錯誤: {e}")
        return False


if __name__ == "__main__":
    logger.info("開始執行資料表結構修改")

    if alter_table_picture_column():
        logger.info("資料表結構修改完成")
    else:
        logger.error("資料表結構修改失敗")
