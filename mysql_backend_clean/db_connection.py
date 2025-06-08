# Code by wonmeow

import pymysql  # type: ignore[import-untyped]
import os
import logging
import base64

from collections import Counter
from dotenv import load_dotenv
from typing import Dict, List, Any, Tuple
from mysql_backend_clean.model.db_connection import ResultModel

# 載入環境變數
load_dotenv()

# 設定日誌
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class DBConnection:
    """MySQL 資料庫連接類"""

    def __init__(self):
        """初始化資料庫連接"""
        self.connection = None
        try:
            # 從環境變數獲取資料庫連接資訊
            host = os.getenv("MYSQL_HOST", "localhost")
            port = int(os.getenv("MYSQL_PORT", "3306"))
            user = os.getenv("MYSQL_USER", "root")
            password = os.getenv("MYSQL_PASSWORD", "mysql")
            database = os.getenv("MYSQL_DATABASE", "econ_afs")

            self.connection = pymysql.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                database=database,
                charset="utf8mb4",
                cursorclass=pymysql.cursors.DictCursor,  # 使用字典游標返回結果
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

    def insert_questions(
        self, questions: List[Dict[str, Any]], file_name: str, doc_type: str
    ) -> int:
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
        failed_inserts = 0
        failures: Counter = Counter()

        try:
            with self.connection.cursor() as cursor:
                # 先刪除可能存在的舊題目，確保不會有重複
                try:
                    delete_sql = "DELETE FROM questions WHERE file_name = %s"
                    cursor.execute(delete_sql, (file_name,))
                    deleted_count = cursor.rowcount
                    if deleted_count > 0:
                        logger.info(
                            f"已刪除舊有題目 {deleted_count} 題 (檔案名: {file_name})"
                        )
                    self.connection.commit()
                except Exception as e:
                    logger.warning(f"刪除舊有題目時發生錯誤: {e}")
                    self.connection.rollback()

                # 批次處理，每50題一批
                batch_size = 50
                total_batches = (len(questions) + batch_size - 1) // batch_size

                for batch_index in range(total_batches):
                    start_idx = batch_index * batch_size
                    end_idx = min(start_idx + batch_size, len(questions))
                    batch_questions = questions[start_idx:end_idx]

                    logger.info(
                        f"處理第 {batch_index + 1}/{total_batches} 批次題目 ({start_idx + 1} 到 {end_idx})"
                    )
                    # 處理批次中的每個題目
                    batch_successful = 0
                    for idx, question in enumerate(batch_questions):
                        try:
                            # 從字典獲取題目資料（使用轉換後的欄位名稱）
                            question_no = question.get("question_no", "")
                            chapter_no = question.get("chapter_no", "")
                            question_text = question.get("question_text", "")
                            option_a = question.get("option_a", "")
                            option_b = question.get("option_b", "")
                            option_c = question.get("option_c", "")
                            option_d = question.get("option_d", "")
                            correct_answer = question.get("correct_answer", "")
                            explanation = question.get("explanation", "")
                            picture = question.get("picture", None)  # 可以為空

                            # 檢查圖片資料
                            if picture is not None:
                                if isinstance(picture, bytes):
                                    logger.info(
                                        f"第 {start_idx + idx + 1} 題 - 有二進位圖片資料，大小: {len(picture)} 位元組"
                                    )
                                else:
                                    logger.warning(
                                        f"第 {start_idx + idx + 1} 題 - 圖片資料不是二進位格式，類型: {type(picture)}"
                                    )
                                    try:
                                        # 嘗試強制轉換為二進位
                                        picture = bytes(picture)
                                        logger.info(
                                            f"第 {start_idx + idx + 1} 題 - 成功將圖片轉換為二進位，大小: {len(picture)} 位元組"
                                        )
                                    except Exception as e:
                                        logger.error(
                                            f"第 {start_idx + idx + 1} 題 - 無法將圖片轉換為二進位，錯誤: {str(e)}"
                                        )
                                        picture = None
                            else:
                                logger.info(
                                    f"第 {start_idx + idx + 1} 題 - 沒有圖片資料"
                                )

                            # 檢查問題內容是否超出資料庫欄位長度
                            if len(question_text) > 65000:  # MEDIUMTEXT 欄位的最大長度
                                logger.warning(
                                    f"第 {start_idx + idx + 1} 題 - 題目內容過長 ({len(question_text)}字元), 會被截斷"
                                )
                                question_text = question_text[:65000]  # 留有餘量

                            # 檢查是否有重複題目 (相同 question_no, chapter_no, file_name)
                            check_sql = """
                            SELECT id FROM questions 
                            WHERE question_no = %s AND chapter_no = %s AND file_name = %s
                            """
                            cursor.execute(
                                check_sql, (question_no, chapter_no, file_name)
                            )
                            existing = cursor.fetchone()

                            if existing:
                                # 如果找到重複題目，使用 UPDATE 語句
                                update_sql = """
                                UPDATE questions SET
                                    question_text = %s,
                                    option_a = %s,
                                    option_b = %s,
                                    option_c = %s,
                                    option_d = %s,
                                    correct_answer = %s,
                                    explanation = %s,
                                    picture = %s,
                                    doc_type = %s
                                WHERE id = %s
                                """
                                cursor.execute(
                                    update_sql,
                                    (
                                        question_text,
                                        option_a,
                                        option_b,
                                        option_c,
                                        option_d,
                                        correct_answer,
                                        explanation,
                                        picture,
                                        doc_type,
                                        existing["id"],
                                    ),
                                )
                                logger.info(
                                    f"更新第 {start_idx + idx + 1} 題 (ID: {existing['id']}, 題號: {question_no}, 章節: {chapter_no})"
                                )
                            else:
                                # 如果沒有重複，使用 INSERT 語句
                                sql = """
                                INSERT INTO questions 
                                    (question_no, chapter_no, question_text, option_a, option_b, option_c, option_d, 
                                    correct_answer, explanation, picture, file_name, doc_type)
                                VALUES 
                                    (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                """
                                cursor.execute(
                                    sql,
                                    (
                                        question_no,
                                        chapter_no,
                                        question_text,
                                        option_a,
                                        option_b,
                                        option_c,
                                        option_d,
                                        correct_answer,
                                        explanation,
                                        picture,
                                        file_name,
                                        doc_type,
                                    ),
                                )
                            # 成功插入一個題目
                            batch_successful += 1
                            successful_inserts += 1
                        except Exception as insert_error:
                            logger.error(
                                f"插入第 {start_idx + idx + 1} 題時發生錯誤: {insert_error}"
                            )
                            failed_inserts += 1
                            error_type = str(type(insert_error).__name__)
                            failures[error_type] += 1

                    # 批次完成後提交
                    try:
                        self.connection.commit()
                        logger.info(
                            f"第 {batch_index + 1} 批次完成，本批次成功插入 {batch_successful} 題"
                        )
                    except Exception as commit_error:
                        logger.error(
                            f"提交第 {batch_index + 1} 批次時發生錯誤: {commit_error}"
                        )
                        self.connection.rollback()
                        # 回滾後，從本批次中成功計數中減去
                        successful_inserts -= batch_successful

                # 詳細記錄結果
                logger.info(
                    f"題目插入結果統計: 成功={successful_inserts}, 失敗={failed_inserts}, 總計={len(questions)}"
                )

                # 如果有失敗，記錄各類型錯誤數量
                # if i were you, i will log error in each statement
                if failed_inserts > 0:
                    logger.error("插入失敗類型統計:")
                    for error_type, count in failures.items():
                        logger.error(f"- {error_type}: {count} 題")

                # 驗證實際插入數量
                verify_sql = (
                    "SELECT COUNT(*) as count FROM questions WHERE file_name = %s"
                )
                cursor.execute(verify_sql, (file_name,))
                verify_result = cursor.fetchone()
                verify_count = verify_result.get("count", 0) if verify_result else 0

                if verify_count != successful_inserts:
                    logger.warning(
                        f"插入數量驗證不符：計數={successful_inserts}，實際={verify_count}"
                    )
                    successful_inserts = verify_count

                return successful_inserts
        except Exception as e:
            logger.error(f"整體插入題目時發生錯誤: {e}")
            self.connection.rollback()
            return 0

    def insert_questions_batch(
        self,
        questions: List[Dict[str, Any]],
        file_id: str,
        file_name: str,
        doc_type: str,
    ) -> int:
        """
        批量插入題目到資料庫

        參數:
            questions: 題目列表
            file_id: 檔案 ID
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
                    question_no = question.get("question_no", "")
                    chapter_no = question.get("chapter_no", "")
                    question_text = question.get("question_text", "")
                    option_a = question.get("option_a", "")
                    option_b = question.get("option_b", "")
                    option_c = question.get("option_c", "")
                    option_d = question.get("option_d", "")
                    correct_answer = question.get("correct_answer", "")
                    explanation = question.get("explanation", "")
                    picture = question.get("picture", None)  # 可以為空

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
                    cursor.execute(
                        sql,
                        (
                            question_no,
                            chapter_no,
                            question_text,
                            option_a,
                            option_b,
                            option_c,
                            option_d,
                            correct_answer,
                            explanation,
                            picture,
                            file_name,
                            doc_type,
                        ),
                    )
                    successful_inserts += 1

                # 提交事務
                self.connection.commit()
                logger.info(f"成功批量插入/更新 {successful_inserts} 個題目")

                return successful_inserts
        except Exception as e:
            logger.error(f"批量插入題目時發生錯誤: {e}")
            self.connection.rollback()
            return 0

    def record_file_upload(
        self, file_id: str, file_name: str, doc_type: str, question_count: int = 0
    ) -> bool:
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

    def get_file_list(self, doc_type: str | None = None) -> List[Dict[str, Any]]:
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
                    if "uploadTime" in item and item["uploadTime"]:
                        item["uploadTime"] = item["uploadTime"].strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )

                return result
        except Exception as e:
            logger.error(f"獲取檔案列表時發生錯誤: {e}")
            return []

    def get_questions_by_file(self, file_id: str) -> List[Dict[str, Any]]:
        """
        獲取指定檔案中的所有題目

        參數:
            file_id: 檔案 ID

        返回:
            題目列表
        """
        try:
            # 首先獲取檔案名稱
            with self.connection.cursor() as cursor:
                sql_file = "SELECT file_name, question_count FROM uploaded_files WHERE file_id = %s"
                cursor.execute(sql_file, (file_id,))
                file_result = cursor.fetchone()

                if not file_result:
                    logger.error(f"找不到檔案ID: {file_id}")
                    return []

                file_name = file_result["file_name"]
                expected_count = file_result.get("question_count", 0)
                logger.info(f"預期題目數量: {expected_count} (檔案名: {file_name})")

                # 先獲取實際題目數量
                count_sql = (
                    "SELECT COUNT(*) as total FROM questions WHERE file_name = %s"
                )
                cursor.execute(count_sql, (file_name,))
                count_result = cursor.fetchone()
                actual_count = count_result.get("total", 0) if count_result else 0
                logger.info(f"資料庫實際題目數量: {actual_count} (檔案名: {file_name})")

                # 再獲取檔案的題目（無限制）
                sql = """
                SELECT id, question_no, chapter_no, question_text, option_a, option_b, option_c, option_d, 
                       correct_answer, explanation, picture, file_name, upload_time
                FROM questions
                WHERE file_name = %s
                ORDER BY question_no
                """
                cursor.execute(sql, (file_name,))

                result = cursor.fetchall()
                logger.info(f"查詢返回題目數量: {len(result)} (檔案名: {file_name})")
                # 轉換日期時間為字串以便 JSON 序列化
                for item in result:
                    if "upload_time" in item and item["upload_time"]:
                        item["upload_time"] = item["upload_time"].strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )
                    # 將資料轉換為前端需要的格式
                    item["id"] = str(item["id"])
                    item["question"] = item["question_text"]

                    # 處理二進制圖片資料，轉換為 Base64 以便前端顯示
                    if item.get("picture") and isinstance(item["picture"], bytes):
                        # 嘗試識別圖片類型
                        img_type = "png"  # 預設為 PNG
                        if item["picture"].startswith(b"\xff\xd8"):
                            img_type = "jpeg"
                        elif item["picture"].startswith(b"\x89\x50\x4e\x47"):
                            img_type = "png"
                        elif item["picture"].startswith(b"\x47\x49\x46\x38"):
                            img_type = "gif"

                        # 轉換為 Base64 字串
                        try:
                            base64_data = base64.b64encode(item["picture"]).decode(
                                "utf-8"
                            )
                            item["picture"] = (
                                f"data:image/{img_type};base64,{base64_data}"
                            )
                        except Exception as e:
                            logger.error(f"無法將圖片轉換為 Base64: {e}")
                            item["picture"] = None

                    # 確保選項數據有效
                    valid_options = []
                    if item.get("option_a"):
                        valid_options.append(item["option_a"])
                    if item.get("option_b"):
                        valid_options.append(item["option_b"])
                    if item.get("option_c"):
                        valid_options.append(item["option_c"])
                    if item.get("option_d"):
                        valid_options.append(item["option_d"])

                    # 如果沒有有效選項，則提供空陣列
                    item["options"] = valid_options if valid_options else []

                    item["answer"] = item["correct_answer"]
                    item["category"] = item["chapter_no"]
                    item["difficulty"] = "普通"  # 預設難度
                    item["modified"] = False

                    # 輸出調試信息，檢查選項數據
                    if len(valid_options) == 0:
                        logger.warning(f"題目 {item['id']} 沒有有效選項")

                # 更新預期題目數量與實際數量不符的情況
                if expected_count != actual_count:
                    logger.warning(
                        f"題目數量不一致：預期 {expected_count}，實際 {actual_count}，調整記錄"
                    )
                    try:
                        update_sql = "UPDATE uploaded_files SET question_count = %s WHERE file_id = %s"
                        cursor.execute(update_sql, (actual_count, file_id))
                        self.connection.commit()
                    except Exception as e:
                        logger.error(f"更新題目數量失敗: {e}")

                return result
        except Exception as e:
            logger.error(f"獲取題目時發生錯誤: {e}")
            return []

    def delete_file_and_questions(self, file_id: str) -> bool:
        """
        刪除檔案記錄和對應的題目

        參數:
            file_id: 檔案 ID

        返回:
            是否成功
        """
        try:
            with self.connection.cursor() as cursor:
                # 首先查詢 file_name
                sql_get_file_name = (
                    "SELECT file_name FROM uploaded_files WHERE file_id = %s"
                )
                cursor.execute(sql_get_file_name, (file_id,))
                file_result = cursor.fetchone()

                if not file_result:
                    logger.error(f"找不到檔案ID: {file_id}")
                    return False

                file_name = file_result["file_name"]

                # 先刪除題目
                sql_delete_questions = "DELETE FROM questions WHERE file_name = %s"
                cursor.execute(sql_delete_questions, (file_name,))
                questions_deleted = cursor.rowcount
                logger.info(f"已刪除 {questions_deleted} 個題目來自檔案: {file_name}")

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
                return result.get("count", 0) if result else 0
        except Exception as e:
            logger.error(f"獲取題目數量時發生錯誤: {e}")
            return 0

    def get_file_info(self, file_id: str) -> Dict[str, Any]:
        """
        獲取特定檔案的資訊

        參數:
            file_id: 檔案ID

        返回:
            檔案資訊字典，如果找不到則返回空字典
        """
        try:
            with self.connection.cursor() as cursor:
                sql = """
                SELECT file_id, file_name, doc_type, upload_time, last_update, question_count
                FROM uploaded_files
                WHERE file_id = %s
                """
                cursor.execute(sql, (file_id,))

                result = cursor.fetchone()

                if result:
                    # 轉換日期時間為字串以便 JSON 序列化
                    if "upload_time" in result and result["upload_time"]:
                        result["upload_time"] = result["upload_time"].strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )
                    if "last_update" in result and result["last_update"]:
                        result["last_update"] = result["last_update"].strftime(
                            "%Y-%m-%d %H:%M:%S"
                        )

                    return result
                else:
                    logger.warning(f"找不到檔案ID: {file_id}")
                    return {}
        except Exception as e:
            logger.error(f"獲取檔案資訊時發生錯誤: {e}")
            return {}

    def get_questions_by_file_name(self, file_name: str) -> List[Dict[str, Any]]:
        """
        取得特定檔案的題目 (依檔案名稱)

        參數:
            file_name: 檔案名稱

        返回:
            題目列表
        """
        try:
            with self.connection.cursor() as cursor:
                sql = """
                SELECT * FROM questions 
                WHERE file_name = %s
                ORDER BY chapter_no, question_no
                """
                cursor.execute(sql, (file_name,))
                questions = cursor.fetchall()

                logger.info(f"找到 {len(questions)} 個題目 (檔案名: {file_name})")
                return questions
        except Exception as e:
            logger.error(f"取得檔案題目錯誤: {e}")
            return []

    def get_questions(self, file_id: str) -> Tuple[List[Dict[str, Any]], str]:
        """
        獲取指定檔案 ID 的題目和檔案名稱

        參數:
            file_id: 檔案 ID

        返回:
            Tuple[List[Dict[str, Any]], str]: (題目列表, 檔案名稱)
        """
        try:
            # 首先獲取檔案名稱
            with self.connection.cursor() as cursor:
                sql_file = "SELECT file_name FROM uploaded_files WHERE file_id = %s"
                cursor.execute(sql_file, (file_id,))
                file_result = cursor.fetchone()

                if not file_result:
                    logger.error(f"找不到檔案ID: {file_id}")
                    return [], ""

                file_name = file_result["file_name"]

                # 獲取檔案的題目
                questions = self.get_questions_by_file_name(file_name)
                logger.info(
                    f"查詢返回題目數量: {len(questions)} (檔案ID: {file_id}, 檔案名: {file_name})"
                )

                return questions, file_name
        except Exception as e:
            logger.error(f"獲取題目時發生錯誤: {e}")
            return [], ""

    def update_questions(
        self, file_id: str, questions: List[Dict[str, Any]]
    ) -> ResultModel:
        """
        更新題目內容

        參數:
            file_id: 檔案 ID
            questions: 要更新的題目列表 (包含 id, question, options, answer 等欄位)

        返回:
            Dict: 包含更新結果的字典，如 {
                'success': bool,
                'updated_count': int,
                'deleted_count': int,
                'error': str
            }
        """
        result: ResultModel = ResultModel(
            success=False,
            updated_count=0,
            deleted_count=0,
            error="",
        )

        try:
            with self.connection.cursor() as cursor:
                # 首先獲取檔案名稱
                sql_get_file_name = (
                    "SELECT file_name FROM uploaded_files WHERE file_id = %s"
                )
                cursor.execute(sql_get_file_name, (file_id,))
                file_result = cursor.fetchone()

                if not file_result:
                    result.error = f"找不到檔案ID: {file_id}"
                    return result

                file_name = file_result["file_name"]

                # 獲取資料庫中當前題目的ID列表，用於之後識別刪除的題目
                sql_get_current_ids = "SELECT id FROM questions WHERE file_name = %s"
                cursor.execute(sql_get_current_ids, (file_name,))
                current_ids = [item["id"] for item in cursor.fetchall()]
                # 收集前端發送的題目ID列表，用於比較
                updated_ids = []
                deleted_ids = []

                # 處理每個題目的更新
                for question in questions:
                    try:
                        question_id = question.get("id")
                        if not question_id:
                            continue

                        # 檢查題目是否標記為刪除
                        if question.get("deleted"):
                            # 如果題目被標記為刪除，將其ID加入刪除列表
                            try:
                                deleted_ids.append(int(question_id))
                            except ValueError:
                                # 如果ID不是數字(如 'new-123456')，跳過這個題目
                                continue
                            continue

                        # 將ID加入更新列表
                        try:
                            updated_ids.append(int(question_id))
                        except ValueError:
                            # 如果ID不是數字(如 'new-123456')，可能是新題目，但也許格式不正確
                            continue

                        # 只處理已修改的題目，如果題目沒有 modified 標記或標記為 False，則跳過
                        if not question.get("modified", False):
                            continue

                        # 處理選項 - 從 options 列表轉回 option_a, option_b 等欄位
                        options = question.get("options", [])
                        option_a = options[0] if len(options) > 0 else ""
                        option_b = options[1] if len(options) > 1 else ""
                        option_c = options[2] if len(options) > 2 else ""
                        option_d = options[3] if len(options) > 3 else ""

                        # 處理圖片 - 如果是 base64 字串，轉換回二進位
                        picture_data = None
                        if (
                            question.get("picture")
                            and isinstance(question["picture"], str)
                            and question["picture"].startswith("data:image/")
                        ):
                            try:
                                # 拆解 base64 字串
                                header, base64_data = question["picture"].split(",", 1)
                                picture_data = base64.b64decode(base64_data)
                            except Exception as e:
                                logger.error(f"轉換圖片失敗: {e}")

                        # 更新資料
                        update_sql = """
                        UPDATE questions
                        SET question_text = %s,
                            option_a = %s,
                            option_b = %s,
                            option_c = %s,
                            option_d = %s,
                            correct_answer = %s,
                            chapter_no = %s
                        WHERE id = %s AND file_name = %s
                        """

                        cursor.execute(
                            update_sql,
                            (
                                question.get("question", ""),
                                option_a,
                                option_b,
                                option_c,
                                option_d,
                                question.get("answer", ""),
                                question.get("category", ""),
                                question_id,
                                file_name,
                            ),
                        )

                        # 如果有圖片更新，單獨處理
                        if picture_data is not None:
                            update_picture_sql = (
                                "UPDATE questions SET picture = %s WHERE id = %s"
                            )
                            cursor.execute(
                                update_picture_sql, (picture_data, question_id)
                            )

                        if cursor.rowcount > 0:
                            result.updated_count += 1
                    except Exception as e:
                        logger.error(f"更新題目 {question.get('id')} 失敗: {e}")
                        continue
                # 只處理明確標記為刪除的題目，而不是自動刪除不在更新列表中的題目
                if deleted_ids:
                    delete_sql = "DELETE FROM questions WHERE id IN (%s)" % ",".join(
                        ["%s"] * len(deleted_ids)
                    )
                    cursor.execute(delete_sql, deleted_ids)
                    result.deleted_count = len(deleted_ids)
                    logger.info(
                        "已刪除 %s 個題目：%s",
                        result.deleted_count,
                        deleted_ids,
                    )

                # 更新檔案的題目數量
                new_count = len(current_ids) - len(deleted_ids)
                update_file_sql = (
                    "UPDATE uploaded_files SET question_count = %s WHERE file_id = %s"
                )
                cursor.execute(update_file_sql, (new_count, file_id))

                # 提交所有更改
                self.connection.commit()
                result.success = True
                logger.info(
                    f"成功更新檔案 {file_id} 的題目：更新 {result.updated_count}，刪除 {result.deleted_count}"
                )

                return result

        except Exception as e:
            self.connection.rollback()
            error_msg = str(e)
            logger.error(f"更新題目時發生錯誤: {error_msg}")
            result.error = error_msg
            return result
