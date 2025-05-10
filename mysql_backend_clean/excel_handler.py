from typing import Dict, List, Any, Optional
import base64
import pandas as pd
import logging
import io
import re
try:
    from .db_connection import DBConnection
except ImportError:
    from db_connection import DBConnection

logger = logging.getLogger(__name__)

class ExcelHandler:
    """Excel 檔案處理類"""
    
    @staticmethod
    def parse_excel_to_questions(file_content: str, file_type: str) -> List[Dict[str, Any]]:
        """解析 Excel 檔案內容為題目列表
        
        Args:
            file_content (str): Base64 編碼的檔案內容
            file_type (str): 檔案類型
            
        Returns:
            List[Dict[str, Any]]: 題目列表
        """
        try:
            # 解碼 Base64 內容
            content = file_content
            if "base64," in content:
                content = content.split("base64,")[1]
            
            binary_data = base64.b64decode(content)
            buffer = io.BytesIO(binary_data)
            
            # 使用 pandas 讀取 Excel
            df = pd.read_excel(buffer)
            
            # 檢查必要欄位是否存在
            required_fields = [
                "QuestionNo.", "ChapterNo", "QuestionInChinese", 
                "AnswerAInChinese", "AnswerBInChinese", "AnswerCInChinese", "AnswerDInChinese", 
                "CorrectAnswer", "AnswerExplainInChinese"
            ]
            
            # 調整欄位名稱，處理可能的空格或大小寫差異
            df.columns = [col.strip() for col in df.columns]
            column_mapping = {}
            for col in df.columns:
                for req in required_fields:
                    if col.lower() == req.lower() or col.lower().replace(" ", "") == req.lower().replace(".", ""):
                        column_mapping[col] = req
            
            # 檢查是否所有必要欄位都存在 (除了Picture欄位可選外)
            if len(column_mapping) < len(required_fields):
                missing_fields = [field for field in required_fields if field not in column_mapping.values()]
                logger.error(f"Excel 檔案欄位不符合要求，缺少必要欄位: {missing_fields}，目前找到 {list(df.columns)}")
                raise ValueError(f"Excel 檔案格式不正確，請確保包含所有必要欄位")
                
            # 重命名欄位以符合標準格式
            df = df.rename(columns=column_mapping)
            
            # 檢查是否有 "Picture" 欄位
            has_picture = "Picture" in df.columns
            
            questions = []
            for idx, row in df.iterrows():
                # 檢查必要欄位是否有值（除了Picture欄位外）
                has_null = False
                for field in required_fields:
                    if pd.isna(row[field]):
                        logger.warning(f"第 {idx+1} 行中的 {field} 欄位為空")
                        has_null = True
                        break
                
                if has_null:
                    logger.warning(f"跳過含有空值的行: {row.to_dict()}")
                    continue
                
                # 識別正確答案
                correct_answer = row["CorrectAnswer"]
                if isinstance(correct_answer, str) and correct_answer.upper() in ["A", "B", "C", "D"]:
                    letter_to_option = {
                        "A": "AnswerAInChinese",
                        "B": "AnswerBInChinese",
                        "C": "AnswerCInChinese",
                        "D": "AnswerDInChinese"
                    }
                    correct_answer_text = row[letter_to_option[correct_answer.upper()]]
                else:
                    correct_answer_text = correct_answer
                
                # 構建題目資料
                question = {
                    "question_no": str(row["QuestionNo."]),
                    "chapter_no": str(row["ChapterNo"]),
                    "question_text": str(row["QuestionInChinese"]),
                    "option_a": str(row["AnswerAInChinese"]),
                    "option_b": str(row["AnswerBInChinese"]),
                    "option_c": str(row["AnswerCInChinese"]),
                    "option_d": str(row["AnswerDInChinese"]),
                    "correct_answer": str(correct_answer_text),
                    "explanation": str(row["AnswerExplainInChinese"])
                }
                
                # 處理圖片欄位 (如果存在)
                if has_picture and not pd.isna(row.get("Picture")):
                    # 檢查圖片是否是字符串或二進制格式
                    picture = row["Picture"]
                    if isinstance(picture, str):
                        # 如果是 Base64 格式
                        if picture.startswith("data:image") and ";base64," in picture:
                            question["picture"] = picture
                        else:
                            # 嘗試將其轉換為 Base64 (假設是某種編碼)
                            try:
                                picture_bytes = picture.encode("utf-8")
                                question["picture"] = f"data:image/png;base64,{base64.b64encode(picture_bytes).decode('utf-8')}"
                            except:
                                question["picture"] = None
                    else:
                        # 嘗試直接編碼為 Base64
                        try:
                            question["picture"] = f"data:image/png;base64,{base64.b64encode(picture).decode('utf-8')}"
                        except:
                            question["picture"] = None
                else:
                    question["picture"] = None
                    
                questions.append(question)
            
            if not questions:
                logger.warning("沒有找到有效的題目資料，所有行都缺少必要欄位或有空值")
                raise ValueError("Excel 檔案中沒有有效的題目資料，請確保所有必要欄位都有值")
                
            return questions
            
        except Exception as e:
            logger.error(f"解析 Excel 檔案錯誤: {e}")
            raise
    
    @staticmethod
    def save_questions_to_db(questions: List[Dict[str, Any]], file_id: str, file_name: str, doc_type: str) -> bool:
        """將題目儲存至資料庫
        
        Args:
            questions (List[Dict[str, Any]]): 題目列表
            file_id (str): 檔案ID
            file_name (str): 檔案名稱
            doc_type (str): 文件類型
            
        Returns:
            bool: 操作是否成功
        """
        try:
            db = DBConnection()
            
            # 首先記錄檔案上傳
            db.record_file_upload(file_id, file_name, doc_type, len(questions))
            
            # 插入題目批次
            question_count = db.insert_questions(questions, file_name, doc_type)
            
            # 更新題目數量
            if question_count > 0:
                db.record_file_upload(file_id, file_name, doc_type, question_count)
            
            db.close()
            return question_count > 0
        except Exception as e:
            logger.error(f"儲存題目至資料庫錯誤: {e}")
            return False
    
    @staticmethod
    def get_file_list(doc_type: str) -> List[Dict[str, Any]]:
        """取得檔案列表
        
        Args:
            doc_type (str): 文件類型
            
        Returns:
            List[Dict[str, Any]]: 檔案列表
        """
        try:
            db = DBConnection()
            file_list = db.get_file_list(doc_type)
            db.close()
            return file_list
        except Exception as e:
            logger.error(f"取得檔案列表錯誤: {e}")
            return []
    @staticmethod
    def get_questions_by_file(file_id: str) -> List[Dict[str, Any]]:
        """取得特定檔案的題目
        
        Args:
            file_id (str): 檔案ID
            
        Returns:
            List[Dict[str, Any]]: 題目列表，格式化為前端需要的格式
        """
        try:
            db = DBConnection()
            questions = db.get_questions_by_file(file_id)
            db.close()
            
            # 檢查是否成功取得題目
            if not questions:
                logger.warning(f"找不到檔案ID {file_id} 的題目")
                return []
                
            return questions
        except Exception as e:
            logger.error(f"取得題目錯誤: {e}")
            return []
    
    @staticmethod
    def delete_file(file_id: str) -> bool:
        """刪除檔案及其題目
        
        Args:
            file_id (str): 檔案ID
            
        Returns:
            bool: 操作是否成功
        """
        try:
            db = DBConnection()
            success = db.delete_file_and_questions(file_id, file_id)
            db.close()
            return success
        except Exception as e:
            logger.error(f"刪除檔案錯誤: {e}")
            return False
