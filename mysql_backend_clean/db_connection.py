import pymysql
from typing import Dict, List, Any, Optional, Tuple
import os
import logging
import base64
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

# 設定日誌
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DBConnection:
    """MySQL 資料庫連接類"""
    
    def __init__(self):
        """初始化資料庫連接"""
        self.connection = None
        try:
            # 從環境變數獲取資料庫連接資訊
            host = os.getenv('MYSQL_HOST', 'localhost')
            port = int(os.getenv('MYSQL_PORT', '3306'))
            user = os.getenv('MYSQL_USER', 'root')
            password = os.getenv('MYSQL_PASSWORD', 'mysql')
            database = os.getenv('MYSQL_DATABASE', 'econ_afs')
            
            self.connection = pymysql.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor  # 使用字典游標返回結果
            )
            
            if self.connection:
                logger.info(f"已成功連接到 MySQL 資料庫 {database} 在 {host}")
        except Exception as e:
            logger.error(f"資料庫連接失敗: {e}")
            raise e
    
    def close(self):
        """關閉資料庫連接"""
        if self.connection:
            self.connection.close()
            logger.info("資料庫連接已關閉")
    
    def insert_questions(self, questions: List[Dict[str, Any]], file_name: str, doc_type: str) -> bool:
        """
        插入多個題目到資料庫
        
        參數:
            questions: 題目列表
            file_name: 檔案名稱
            doc_type: 文件類型
        
        返回:
            成功插入的題目數量
        """
        successful_inserts = 0
        try:
            with self.connection.cursor() as cursor:
                for question in questions:
                    # 從字典獲取題目資料
                    question_no = question.get('QuestionNo.', '')
                    chapter_no = question.get('ChapterNo', '')
                    question_text = question.get('QuestionInChinese', '')
                    option_a = question.get('AnswerAInChinese', '')
                    option_b = question.get('AnswerBInChinese', '')
                    option_c = question.get('AnswerCInChinese', '')
                    option_d = question.get('AnswerDInChinese', '')
                    correct_answer = question.get('CorrectAnswer', '')
                    explanation = question.get('AnswerExplainInChinese', '')
                    picture = question.get('Picture', '')  # 可以為空
                    
                    # SQL 插入語句
                    sql = """
                    INSERT INTO questions (question_no, chapter_no, question_text, option_a, option_b, option_c, option_d, 
                                          correct_answer, explanation, picture, file_name, doc_type)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                    chapter_no = VALUES(chapter_no),
                    question_text = VALUES(question_text),
                    option_a = VALUES(option_a),
                    option_b = VALUES(option_b),
                    option_c = VALUES(option_c),
                    option_d = VALUES(option_d),
                    correct_answer = VALUES(correct_answer),
                    explanation = VALUES(explanation),
                    picture = VALUES(picture),
                    doc_type = VALUES(doc_type)
                    """
                    
                    # 執行 SQL
                    cursor.execute(sql, (question_no, chapter_no, question_text, option_a, option_b, option_c, option_d, 
                                       correct_answer, explanation, picture, file_name, doc_type))
                    successful_inserts += 1
                
                # 提交事務
                self.connection.commit()
                logger.info(f"成功插入/更新 {successful_inserts} 個題目")
                
                return successful_inserts
        except Exception as e:
            logger.error(f"插入題目時發生錯誤: {e}")
            self.connection.rollback()
            return 0
    
    def record_file_upload(self, file_id: str, file_name: str, doc_type: str, question_count: int = 0) -> bool:
        """
        記錄上傳的檔案
        
        參數:
            file_id: 檔案 ID
            file_name: 檔案名稱
            doc_type: 文件類型
            question_count: 題目數量
        
        返回:
            是否成功
        """
        try:
            with self.connection.cursor() as cursor:
                # SQL 插入語句
                sql = """
                INSERT INTO uploaded_files (file_id, file_name, doc_type, question_count)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                file_name = VALUES(file_name),
                doc_type = VALUES(doc_type),
                question_count = VALUES(question_count),
                last_update = CURRENT_TIMESTAMP
                """
                
                # 執行 SQL
                cursor.execute(sql, (file_id, file_name, doc_type, question_count))
                
                # 提交事務
                self.connection.commit()
                logger.info(f"成功記錄檔案上傳: {file_name}")
                
                return True
        except Exception as e:
            logger.error(f"記錄檔案上傳時發生錯誤: {e}")
            self.connection.rollback()
            return False
    
    def get_file_list(self, doc_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        獲取檔案列表
        
        參數:
            doc_type: 文件類型 (可選)
        
        返回:
            檔案列表
        """
        try:
            with self.connection.cursor() as cursor:
                if doc_type:
                    sql = "SELECT file_id as fileID, file_name as fileName, doc_type as docType, upload_time as uploadTime, question_count as questionCount FROM uploaded_files WHERE doc_type = %s ORDER BY upload_time DESC"
                    cursor.execute(sql, (doc_type,))
                else:
                    sql = "SELECT file_id as fileID, file_name as fileName, doc_type as docType, upload_time as uploadTime, question_count as questionCount FROM uploaded_files ORDER BY upload_time DESC"
                    cursor.execute(sql)
                
                result = cursor.fetchall()
                
                # 轉換日期時間為字串以便 JSON 序列化
                for item in result:
                    if 'uploadTime' in item and item['uploadTime']:
                        item['uploadTime'] = item['uploadTime'].strftime('%Y-%m-%d %H:%M:%S')
                
                return result
        except Exception as e:
            logger.error(f"獲取檔案列表時發生錯誤: {e}")
            return []
    
    def get_questions_by_file(self, file_name: str) -> List[Dict[str, Any]]:
        """
        獲取指定檔案中的所有題目
        
        參數:
            file_name: 檔案名稱
        
        返回:
            題目列表
        """
        try:
            with self.connection.cursor() as cursor:
                sql = """
                SELECT id, question_no, chapter_no, question_text, option_a, option_b, option_c, option_d, 
                       correct_answer, explanation, picture, file_name, upload_time
                FROM questions
                WHERE file_name = %s
                ORDER BY question_no
                """
                cursor.execute(sql, (file_name,))
                
                result = cursor.fetchall()
                
                # 轉換日期時間為字串以便 JSON 序列化
                for item in result:
                    if 'upload_time' in item and item['upload_time']:
                        item['upload_time'] = item['upload_time'].strftime('%Y-%m-%d %H:%M:%S')
                
                return result
        except Exception as e:
            logger.error(f"獲取題目時發生錯誤: {e}")
            return []
    
    def delete_file_and_questions(self, file_id: str, file_name: str) -> bool:
        """
        刪除檔案記錄和對應的題目
        
        參數:
            file_id: 檔案 ID
            file_name: 檔案名稱
        
        返回:
            是否成功
        """
        try:
            with self.connection.cursor() as cursor:
                # 首先刪除題目
                sql_delete_questions = "DELETE FROM questions WHERE file_name = %s"
                cursor.execute(sql_delete_questions, (file_name,))
                
                # 再刪除檔案記錄
                sql_delete_file = "DELETE FROM uploaded_files WHERE file_id = %s"
                cursor.execute(sql_delete_file, (file_id,))
                
                # 提交事務
                self.connection.commit()
                logger.info(f"成功刪除檔案和題目: {file_name}")
                
                return True
        except Exception as e:
            logger.error(f"刪除檔案和題目時發生錯誤: {e}")
            self.connection.rollback()
            return False
    
    def get_question_count(self, file_name: str) -> int:
        """
        獲取指定檔案中的題目數量
        
        參數:
            file_name: 檔案名稱
        
        返回:
            題目數量
        """
        try:
            with self.connection.cursor() as cursor:
                sql = "SELECT COUNT(*) as count FROM questions WHERE file_name = %s"
                cursor.execute(sql, (file_name,))
                
                result = cursor.fetchone()
                return result.get('count', 0) if result else 0
        except Exception as e:
            logger.error(f"獲取題目數量時發生錯誤: {e}")
            return 0
