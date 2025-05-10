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
            
            # 添加可選欄位
            optional_fields = ["Picture", "PIC"]
            
            # 調整欄位名稱，處理可能的空格或大小寫差異
            df.columns = [col.strip() for col in df.columns]
            column_mapping = {}
            
            # 輸出檢查
            logger.info(f"Excel 檔案的欄位名稱: {list(df.columns)}")
            
            for col in df.columns:
                # 處理必要欄位
                for req in required_fields:
                    if col.lower() == req.lower() or col.lower().replace(" ", "") == req.lower().replace(".", ""):
                        column_mapping[col] = req
                
                # 特別處理 PIC 欄位映射到 Picture
                if col.lower() == "pic":
                    column_mapping[col] = "Picture"
                elif col.lower() == "picture":
                    column_mapping[col] = "Picture"
            
            # 檢查是否所有必要欄位都存在 (除了Picture欄位可選外)
            if len(column_mapping) < len(required_fields):
                missing_fields = [field for field in required_fields if field not in column_mapping.values()]
                logger.error(f"Excel 檔案欄位不符合要求，缺少必要欄位: {missing_fields}，目前找到 {list(df.columns)}")
                raise ValueError(f"Excel 檔案格式不正確，請確保包含所有必要欄位")
                
            # 重命名欄位以符合標準格式
            df = df.rename(columns=column_mapping)
              # 檢查是否有 "Picture" 欄位
            has_picture = "Picture" in df.columns
              # 統計總行數、有效行數和跳過行數
            total_rows = len(df)
            valid_rows = 0
            skipped_rows = 0
            skipped_reasons = {}  # 用於記錄跳過的原因
            
            logger.info(f"開始處理 Excel 檔案，總計 {total_rows} 行數據")
            
            questions = []
            for idx, row in df.iterrows():
                # 檢查題目欄位 - 這是唯一必須的欄位
                if "QuestionInChinese" not in df.columns or pd.isna(row.get("QuestionInChinese")):
                    reason = "缺少題目內容"
                    skipped_reasons[reason] = skipped_reasons.get(reason, 0) + 1
                    logger.warning(f"第 {idx+1} 行跳過: {reason}")
                    skipped_rows += 1
                    continue
                
                # 其他欄位都採用寬鬆處理，使用預設值填充而非跳過
                warning_fields = []
                for field in required_fields:
                    if field != "QuestionInChinese" and (field not in df.columns or pd.isna(row.get(field))):
                        warning_fields.append(field)
                
                # 只記錄警告，但仍處理該題目
                if warning_fields:
                    logger.warning(f"第 {idx+1} 行警告: 欄位 {', '.join(warning_fields)} 為空，使用預設值處理")
                
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
                  # 安全獲取欄位值，對於缺失的欄位使用預設值
                def safe_get(field_name, default=""):
                    if field_name in df.columns and not pd.isna(row.get(field_name)):
                        return str(row.get(field_name))
                    return default
                
                # 構建題目資料
                question = {
                    "question_no": safe_get("QuestionNo.", str(idx+1)),
                    "chapter_no": safe_get("ChapterNo", "未分類"),
                    "question_text": str(row["QuestionInChinese"]),
                    "option_a": safe_get("AnswerAInChinese"),
                    "option_b": safe_get("AnswerBInChinese"),
                    "option_c": safe_get("AnswerCInChinese"),
                    "option_d": safe_get("AnswerDInChinese"),
                    "correct_answer": str(correct_answer_text),
                    "explanation": safe_get("AnswerExplainInChinese", "無解釋")
                }
                      # 處理圖片欄位 (如果存在)
                picture_field = "Picture" if "Picture" in df.columns else ("PIC" if "PIC" in df.columns else None)
                if picture_field and not pd.isna(row.get(picture_field)):
                    # 檢查圖片是否是字符串或二進制格式
                    picture = row[picture_field]
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
                                logger.warning(f"無法編碼圖片字串: {picture[:30]}...")
                    else:
                        # 嘗試直接編碼為 Base64
                        try:
                            question["picture"] = f"data:image/png;base64,{base64.b64encode(picture).decode('utf-8')}"
                        except:
                            question["picture"] = None
                            logger.warning(f"無法編碼非字串圖片")
                else:
                    question["picture"] = None
                      # 輸出調試信息，檢查每個題目的欄位
                logger.info(f"成功解析題目 {question['question_no']}: {question['question_text'][:30]}... 選項數: {len([x for x in [question['option_a'], question['option_b'], question['option_c'], question['option_d']] if x])}, 答案: {question['correct_answer'][:30]}...")
                    
                questions.append(question)
                valid_rows += 1
              # 記錄結果統計
            logger.info(f"Excel檔案處理完成: 總行數={total_rows}, 成功解析={valid_rows}, 跳過={skipped_rows}")
            
            # 詳細記錄跳過原因
            if skipped_rows > 0:
                logger.warning("跳過題目的原因統計:")
                for reason, count in skipped_reasons.items():
                    logger.warning(f"- {reason}: {count} 題")
            
            if not questions:
                logger.warning("沒有找到有效的題目資料，所有行都缺少必要欄位或有空值")
                raise ValueError("Excel 檔案中沒有有效的題目資料，請確保至少包含問題內容和正確答案")
                
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
            
            # 記錄題目數量
            total_questions = len(questions)
            logger.info(f"準備存入資料庫: 檔案={file_name}, 總題目數={total_questions}")
            
            # 先輕量化記錄檔案上傳，稍後更新正確的題目數量
            db.record_file_upload(file_id, file_name, doc_type, 0)
            
            # 分析題目資料的章節和題號分佈
            chapter_question_stats = {}
            for q in questions:
                chapter = q.get('chapter_no', '未分類')
                q_no = q.get('question_no', '')
                if chapter not in chapter_question_stats:
                    chapter_question_stats[chapter] = set()
                chapter_question_stats[chapter].add(q_no)
            
            # 記錄章節和題目分佈情況
            for chapter, q_set in chapter_question_stats.items():
                logger.info(f"章節 '{chapter}' 包含 {len(q_set)} 個不同題號")
            
            # 插入題目批次
            question_count = db.insert_questions(questions, file_name, doc_type)
            
            # 記錄實際存入的數量
            logger.info(f"實際成功存入資料庫: {question_count}/{total_questions} 題")
            
            # 如果存入資料庫的數量與解析的數量不符，記錄警告
            if question_count < total_questions:
                logger.warning(f"警告: {total_questions - question_count} 題未能成功存入資料庫")
                
                # 進一步分析失敗原因
                db_questions = db.get_questions_by_file_name(file_name)
                db_chapters = {}
                for q in db_questions:
                    ch = q.get('chapter_no', '未分類')
                    q_no = q.get('question_no', '')
                    if ch not in db_chapters:
                        db_chapters[ch] = set()
                    db_chapters[ch].add(q_no)
                
                # 比較解析和實際存儲的差異
                for chapter, q_set in chapter_question_stats.items():
                    db_set = db_chapters.get(chapter, set())
                    if len(q_set) != len(db_set):
                        missing = q_set - db_set
                        if missing:
                            logger.warning(f"章節 '{chapter}' 缺少題號: {', '.join(missing)}")
            
            # 更新實際題目數量
            db.record_file_upload(file_id, file_name, doc_type, question_count)
            
            # 驗證實際存儲的題目數量
            verify_count = db.get_question_count(file_name)
            if verify_count != question_count:
                logger.warning(f"題目數量驗證不符：預期={question_count}，實際={verify_count}，重新更新記錄")
                db.record_file_upload(file_id, file_name, doc_type, verify_count)
                question_count = verify_count
            
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
            success = db.delete_file_and_questions(file_id)
            db.close()
            return success
        except Exception as e:
            logger.error(f"刪除檔案錯誤: {e}")
            return False
