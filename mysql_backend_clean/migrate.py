# 資料庫遷移腳本（使用 PyMySQL）
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


def create_database():
    """創建資料庫"""
    try:
        # 明確從環境變數獲取資料庫設定
        host = os.getenv("MYSQL_HOST", "localhost")
        port = int(os.getenv("MYSQL_PORT", "3306"))
        user = os.getenv("MYSQL_USER", "root")
        password = os.getenv("MYSQL_PASSWORD", "mysql")

        # 印出連接信息以調試（不包含密碼）
        logger.info(f"嘗試連接到 MySQL 伺服器 {host}:{port} 使用者 {user}")

        # 連接到 MySQL 伺服器，不指定資料庫
        connection = pymysql.connect(host=host, port=port, user=user, password=password)

        cursor = connection.cursor()

        # 創建資料庫 (如果不存在)
        db_name = os.getenv("MYSQL_DATABASE", "econ_afs")
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        logger.info(f"資料庫 '{db_name}' 已建立或已存在")

        # 關閉連接
        cursor.close()
        connection.close()

        return True
    except Exception as e:
        logger.error(f"建立資料庫時發生錯誤: {e}")
        return False


def create_tables():
    """創建資料表"""
    try:
        # 明確從環境變數獲取資料庫設定
        host = os.getenv("MYSQL_HOST", "localhost")
        port = int(os.getenv("MYSQL_PORT", "3306"))
        user = os.getenv("MYSQL_USER", "root")
        password = os.getenv("MYSQL_PASSWORD", "mysql")
        database = os.getenv("MYSQL_DATABASE", "econ_afs")

        # 印出連接信息以調試（不包含密碼）
        logger.info(f"嘗試連接到資料庫 {database} 在 {host}:{port} 使用者 {user}")

        # 連接到指定的資料庫
        connection = pymysql.connect(
            host=host, port=port, user=user, password=password, database=database
        )

        cursor = connection.cursor()

        # 建立題目資料表
        create_questions_table = """
        CREATE TABLE IF NOT EXISTS questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question_no VARCHAR(50) NOT NULL,
            chapter_no VARCHAR(50) NOT NULL,
            question_text MEDIUMTEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,            correct_answer VARCHAR(255) NOT NULL,
            explanation TEXT NOT NULL,
            picture MEDIUMBLOB,
            file_name VARCHAR(255) NOT NULL,
            upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            doc_type VARCHAR(50) NOT NULL,
            INDEX file_name_idx (file_name),
            INDEX question_chapter_idx (question_no, chapter_no, file_name)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        """

        # 建立檔案記錄資料表
        create_files_table = """
        CREATE TABLE IF NOT EXISTS uploaded_files (
            file_id VARCHAR(255) PRIMARY KEY,
            file_name VARCHAR(255) NOT NULL,
            doc_type VARCHAR(50) NOT NULL,
            upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            question_count INT DEFAULT 0
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
        """

        cursor.execute(create_questions_table)
        cursor.execute(create_files_table)
        connection.commit()

        logger.info("資料表建立或已存在")

        # 關閉連接
        cursor.close()
        connection.close()

        return True
    except Exception as e:
        logger.error(f"建立資料表時發生錯誤: {e}")
        return False


def apply_database_fixes():
    """應用資料庫結構修正"""
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

        logger.info(f"已成功連接到 MySQL 資料庫 {database} 在 {host}，準備應用結構修正")

        with connection.cursor() as cursor:
            # 檢查索引結構
            cursor.execute("SHOW INDEX FROM questions WHERE Key_name = 'question_no'")
            if cursor.fetchone():
                try:
                    cursor.execute("ALTER TABLE questions DROP INDEX `question_no`")
                    logger.info("已刪除唯一索引約束 'question_no'")
                except Exception as e:
                    logger.warning(f"刪除舊索引時出現錯誤: {e}")

            # 檢查檔案名稱索引
            cursor.execute("SHOW INDEX FROM questions WHERE Key_name = 'file_name_idx'")
            if not cursor.fetchone():
                try:
                    cursor.execute(
                        "ALTER TABLE questions ADD INDEX file_name_idx (file_name)"
                    )
                    logger.info("已新增 file_name_idx 索引")
                except Exception as e:
                    logger.warning(f"新增檔案名稱索引時出現錯誤: {e}")

            # 檢查題號章節索引
            cursor.execute(
                "SHOW INDEX FROM questions WHERE Key_name = 'question_chapter_idx'"
            )
            if not cursor.fetchone():
                try:
                    cursor.execute(
                        "ALTER TABLE questions ADD INDEX question_chapter_idx (question_no, chapter_no, file_name)"
                    )
                    logger.info("已新增 question_chapter_idx 索引")
                except Exception as e:
                    logger.warning(f"新增題號章節索引時出現錯誤: {e}")

        # 提交事務
        connection.commit()
        logger.info("資料表結構修正完成")

        # 關閉連接
        connection.close()
        return True

    except Exception as e:
        logger.error(f"應用資料庫修正時發生錯誤: {e}")
        return False


if __name__ == "__main__":
    logger.info("開始執行資料庫遷移")

    # 步驟 1: 創建資料庫
    if create_database():
        # 步驟 2: 創建資料表
        if create_tables():
            # 步驟 3: 應用資料庫結構修正
            if apply_database_fixes():
                logger.info("資料庫遷移與結構修正完成")
            else:
                logger.error("資料庫結構修正失敗")
        else:
            logger.error("建立資料表失敗")
    else:
        logger.error("建立資料庫失敗")
