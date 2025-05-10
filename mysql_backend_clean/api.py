# Excel 處理 API
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import uuid
import json
import logging
import base64
try:
    from .excel_handler import ExcelHandler
    from .db_connection import DBConnection
except ImportError:
    from excel_handler import ExcelHandler
    from db_connection import DBConnection
import datetime

logger = logging.getLogger(__name__)

router = APIRouter()

class FileUploadSuccessModel(BaseModel):
    file_id: str
    file_name: str
    last_update: str
    message: str
    status_code: int = 200

class FileListSuccessModel(BaseModel):
    docs_list: List[Dict[str, Any]]
    status_code: int = 200

class FileDeleteSuccessModel(BaseModel):
    file_id: str
    message: str
    status_code: int = 200

class QuestionsSuccessModel(BaseModel):
    file_id: str
    file_name: str
    questions: List[Dict[str, Any]]
    status_code: int = 200

@router.post("/excel/upload/", response_model=FileUploadSuccessModel)
async def upload_excel_file(
    excel_file: UploadFile = File(...),
    doc_type: str = Form(...),
):
    """上傳 Excel 檔案並儲存到資料庫
    
    Args:
        excel_file: Excel 檔案
        doc_type: 文件類型 ("TESTING" 或 "THEOREM")
        
    Returns:
        FileUploadSuccessModel: 上傳成功後的回應
        
    Raises:
        HTTPException: 檔案格式不正確或儲存失敗時拋出
    """
    try:
        # 檢查是否為 Excel 檔案
        if not excel_file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="只接受 Excel 檔案 (.xlsx, .xls)")
        
        # 讀取檔案內容
        contents = await excel_file.read()
        file_id = f"db-{uuid.uuid4()}"
        file_name = excel_file.filename
        
        # 將檔案內容轉換為 base64
        content_b64 = base64.b64encode(contents).decode('utf-8')
        
        # 解析 Excel 內容為題目資料
        try:
            questions = ExcelHandler.parse_excel_to_questions(content_b64, excel_file.content_type)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # 儲存題目到資料庫
        success = ExcelHandler.save_questions_to_db(questions, file_id, file_name, doc_type)
        
        if not success:
            raise HTTPException(status_code=500, detail="儲存題目到資料庫失敗")
        
        # 取得當前時間作為最後更新時間
        last_update = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        return FileUploadSuccessModel(
            file_id=file_id,
            file_name=file_name,
            last_update=last_update,
            message="檔案上傳成功"
        )
    
    except HTTPException:
        # 重新拋出 HTTP 錯誤，保持原始狀態碼和詳情
        raise
    
    except Exception as e:
        logger.error(f"上傳 Excel 檔案錯誤: {str(e)}")
        raise HTTPException(status_code=500, detail=f"上傳檔案錯誤: {str(e)}")

@router.get("/excel/{doc_type}/", response_model=FileListSuccessModel)
async def get_file_list(doc_type: str):
    """取得檔案列表"""
    try:
        file_list = ExcelHandler.get_file_list(doc_type)
        return FileListSuccessModel(
            docs_list=file_list
        )
    except Exception as e:
        logger.error(f"取得檔案列表錯誤: {str(e)}")
        raise HTTPException(status_code=500, detail=f"取得檔案列表錯誤: {str(e)}")

@router.get("/excel/questions/{file_id}/", response_model=QuestionsSuccessModel)
async def get_questions(file_id: str):
    """取得指定檔案的題目
    
    Args:
        file_id (str): 檔案 ID
        
    Returns:
        QuestionsSuccessModel: 題目列表和檔案資訊
        
    Raises:
        HTTPException: 找不到檔案或發生錯誤時拋出
    """
    try:
        # 獲取題目列表
        questions = ExcelHandler.get_questions_by_file(file_id)
        
        if not questions:
            # 如果找不到題目，嘗試從 uploaded_files 表獲取檔案信息
            logger.warning(f"從 questions 表找不到檔案ID: {file_id} 的題目，嘗試從 uploaded_files 表獲取檔案信息")
            db = DBConnection()
            file_info = db.get_file_info(file_id)
            db.close()
            
            if not file_info:
                raise HTTPException(status_code=404, detail=f"找不到檔案ID: {file_id}")
            
            # 返回空題目列表但包含檔案信息
            return QuestionsSuccessModel(
                file_id=file_id,
                file_name=file_info.get("file_name", ""),
                questions=[]
            )
        
        # 假設第一個題目的 file_name 代表整個檔案名稱
        file_name = questions[0].get("file_name", "")
        
        # 轉換題目資料為前端需要的格式
        formatted_questions = []
        for q in questions:
            formatted_questions.append({
                "id": str(q.get("id", "")),
                "question": q.get("question", q.get("question_text", "")),
                "options": q.get("options", [
                    q.get("option_a", ""),
                    q.get("option_b", ""),
                    q.get("option_c", ""),
                    q.get("option_d", "")
                ]),
                "answer": q.get("answer", q.get("correct_answer", "")),
                "category": q.get("category", q.get("chapter_no", "")),
                "difficulty": q.get("difficulty", "普通"),
                "modified": False,
                "picture": q.get("picture", None)
            })
        
        return QuestionsSuccessModel(
            file_id=file_id,
            file_name=file_name,
            questions=formatted_questions
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"取得題目錯誤: {str(e)}")
        raise HTTPException(status_code=500, detail=f"取得題目錯誤: {str(e)}")

@router.delete("/excel/{file_id}/", response_model=FileDeleteSuccessModel)
async def delete_file(file_id: str):
    """刪除檔案及其題目"""
    try:
        success = ExcelHandler.delete_file(file_id)
        
        if not success:
            raise HTTPException(status_code=404, detail=f"找不到檔案ID: {file_id}")
        
        return FileDeleteSuccessModel(
            file_id=file_id,
            message="檔案刪除成功"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"刪除檔案錯誤: {str(e)}")
        raise HTTPException(status_code=500, detail=f"刪除檔案錯誤: {str(e)}")
