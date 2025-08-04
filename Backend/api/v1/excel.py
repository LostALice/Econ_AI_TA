# Code by wonmeow
# Modify by TyrantRey 24/7/25

import uuid
import base64
import datetime

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from Backend.utils.helper.model.api.v1.excel import (
    FileUploadSuccessModel,
    FileListSuccessModel,
    FileDeleteSuccessModel,
    QuestionsSuccessModel,
    QuestionsUpdateModel,
    QuestionsUpdateSuccessModel,
)
from Backend.utils.RAG.excel_handler import excel_client
from Backend.utils.helper.logger import CustomLoggerHandler

logger = CustomLoggerHandler().get_logger()

router = APIRouter()


@router.post("/upload/")
async def upload_excel_file(
    excel_file: UploadFile = File(...),
    doc_type: str = Form(...),
) -> FileUploadSuccessModel:
    """Upload Excel file and save to database

    Args:
        excel_file: Excel file
        doc_type: docs type ("TESTING" / "THEOREM")

    Returns:
        Class FileUploadSuccessModel:
            file_id: str
            file_name: str
            last_update: str
            message: str
            status_code: int = 200

    Raises:
        HTTPException:
            422: "No Excel file given"
            400: "Parsing Error"
            500: "Upload Error"
    """
    if excel_file.filename is None or excel_file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(422, "只接受 Excel 檔案 (.xlsx, .xls)")

    try:
        # 讀取檔案內容
        contents = await excel_file.read()
        file_id = f"db-{uuid.uuid4()}"
        file_name = excel_file.filename

        # 將檔案內容轉換為 base64
        content_b64 = base64.b64encode(contents).decode("utf-8")

        if excel_file.content_type is None:
            raise HTTPException(status_code=422, detail="Unexpected file type")

        # 解析 Excel 內容為題目資料
        try:
            questions = excel_client.parse_excel_to_questions(
                content_b64, excel_file.content_type
            )
        except ValueError as e:
            logger.error(f"Excel Parsing Error: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            logger.error(f"Excel 處理時發生意外錯誤: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Excel Parsing Error: {str(e)}"
            )

        logger.info(f"Parsed question: {len(questions)}")
        # 儲存題目到資料庫
        success = excel_client.save_questions_to_db(
            questions, file_id, file_name, doc_type
        )
        logger.info(success)
        if not success:
            raise HTTPException(status_code=422, detail="儲存題目到資料庫失敗")

        # 取得當前時間作為最後更新時間
        last_update = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        return FileUploadSuccessModel(
            file_id=file_id,
            file_name=file_name,
            last_update=last_update,
            message="檔案上傳成功",
        )

    except HTTPException as e:
        # 重新拋出 HTTP 錯誤，保持原始狀態碼和詳情
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")


@router.get("/list/{doc_type}/")
async def get_file_list(doc_type: str) -> FileListSuccessModel:
    """取得檔案列表"""
    try:
        file_list = excel_client.get_file_list(doc_type)
        return FileListSuccessModel(docs_list=file_list)
    except Exception as e:
        logger.error(f"取得檔案列表錯誤: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"取得檔案列表錯誤: {str(e)}"
        ) from e


@router.get("/questions/{file_id}/")
async def get_questions(file_id: str) -> QuestionsSuccessModel:
    """取得指定檔案的題目

    Args:
        file_id (str): 檔案 ID

    Returns:
        QuestionsSuccessModel: 題目列表和檔案資訊

    Raises:
        HTTPException: 找不到檔案或發生錯誤時拋出
    """
    try:
        # 獲取題目列表和檔案名稱
        questions, file_name = excel_client.get_questions(file_id)

        if not questions:
            logger.warning(f"找不到檔案ID: {file_id} 的題目")
            raise HTTPException(
                status_code=404, detail=f"找不到檔案ID: {file_id} 的題目"
            )

        # 如果檔案名稱為空，使用檔案ID作為檔案名稱
        if not file_name:
            file_name = f"未命名檔案-{file_id}"

        # 轉換題目資料為前端需要的格式
        formatted_questions = []
        for q in questions:
            # 調試輸出：檢查原始資料庫資料
            logger.info(f"處理題目 ID {q.get('id')}:")
            logger.info(f"  question_text: {q.get('question_text')}")
            logger.info(f"  option_a: {q.get('option_a')}")
            logger.info(f"  option_b: {q.get('option_b')}")
            logger.info(f"  option_c: {q.get('option_c')}")
            logger.info(f"  option_d: {q.get('option_d')}")
            logger.info(f"  correct_answer: {q.get('correct_answer')}")
            logger.info(f"  chapter_no: {q.get('chapter_no')}")

            # 準備選項數據 - 確保按正確順序獲取
            options = []

            # 從資料庫欄位獲取選項，確保順序正確
            option_a = q.get("option_a", "").strip() if q.get("option_a") else ""
            option_b = q.get("option_b", "").strip() if q.get("option_b") else ""
            option_c = q.get("option_c", "").strip() if q.get("option_c") else ""
            option_d = q.get("option_d", "").strip() if q.get("option_d") else ""

            # 按順序添加選項，即使某個選項為空也要保持位置
            options = [option_a, option_b, option_c, option_d]

            # 調試輸出：檢查選項處理結果
            logger.info(f"  處理後的選項: {options}")

            # 處理圖片資料，確保二進制資料正確轉換為 Base64
            picture_data = q.get("picture")
            picture_base64 = None

            if picture_data and isinstance(picture_data, bytes):
                try:
                    # 嘗試識別圖片類型
                    img_type = "png"  # 預設為 PNG
                    if picture_data.startswith(b"\xff\xd8"):
                        img_type = "jpeg"
                    elif picture_data.startswith(b"\x89\x50\x4e\x47"):
                        img_type = "png"
                    elif picture_data.startswith(b"\x47\x49\x46\x38"):
                        img_type = "gif"

                    # 轉換為 Base64
                    picture_base64 = f"data:image/{img_type};base64,{base64.b64encode(picture_data).decode('utf-8')}"
                    logger.info(
                        f"成功將題目 {q.get('id')} 的圖片轉換為 Base64，大小: {len(picture_data)} 位元組"
                    )
                except Exception as pic_error:
                    logger.error(f"圖片轉換錯誤: {str(pic_error)}")
                    picture_base64 = None
            elif picture_data:
                logger.warning(
                    f"題目 {q.get('id')} 的圖片不是二進位格式: {type(picture_data)}"
                )

            # 構建格式化的題目資料
            formatted_question = {
                "id": str(q.get("id", "")),
                "question": q.get("question_text", "").strip()
                if q.get("question_text")
                else "",
                "options": options,  # 使用處理後的選項陣列
                "answer": q.get("correct_answer", "").strip()
                if q.get("correct_answer")
                else "",
                "category": q.get("chapter_no", "").strip()
                if q.get("chapter_no")
                else "",
                "difficulty": q.get("difficulty", "普通"),
                "modified": False,
                "picture": picture_base64,
            }

            # 調試輸出：檢查最終格式化結果
            logger.info("\t最終格式化結果:")
            logger.info("\t\tquestion: %s", formatted_question["question"])
            logger.info("\t\toptions: %s", formatted_question["options"])
            logger.info("\t\tanswer: %s", formatted_question["answer"])
            logger.info("\t\tcategory: %s", formatted_question["category"])

            formatted_questions.append(formatted_question)

        logger.info(f"成功格式化 {len(formatted_questions)} 個題目")

        return QuestionsSuccessModel(
            file_id=file_id, file_name=file_name, questions=formatted_questions
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"取得題目錯誤: {str(e)}")
        raise HTTPException(status_code=500, detail=f"取得題目錯誤: {str(e)}") from e


@router.put("/questions/")
async def update_questions(
    request: QuestionsUpdateModel,
) -> QuestionsUpdateSuccessModel:
    """更新題目內容

    Args:
        request (QuestionsUpdateModel): 包含檔案ID和要更新的題目列表

    Returns:
        QuestionsUpdateSuccessModel: 更新成功後的回應

    Raises:
        HTTPException: 更新失敗時拋出
    """
    try:
        file_id = request.file_id
        questions = request.questions

        if not file_id:
            raise HTTPException(status_code=400, detail="缺少檔案ID")

        if not questions:
            raise HTTPException(status_code=400, detail="沒有提供要更新的題目")

        # 更新題目
        result = excel_client.update_questions(file_id, questions)

        if not result.success:
            error_message = result.error or "未知錯誤"
            raise HTTPException(
                status_code=500, detail=f"更新題目失敗: {error_message}"
            )

        return QuestionsUpdateSuccessModel(
            file_id=file_id,
            updated_count=result.updated_count,
            deleted_count=result.deleted_count,
            message=f"成功更新題目，已更新 {result.updated_count} 題，已刪除 {result.deleted_count} 題",
        )

    except HTTPException:
        # 重新拋出 HTTP 錯誤，保持原始狀態碼和詳情
        raise

    except Exception as e:
        logger.error(f"更新題目時發生錯誤: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"更新題目時發生錯誤: {str(e)}"
        ) from e


@router.delete("/{file_id}/")
async def delete_file(file_id: str) -> FileDeleteSuccessModel:
    """刪除檔案及其題目"""
    try:
        success = excel_client.delete_file(file_id)

        if not success:
            raise HTTPException(status_code=404, detail=f"找不到檔案ID: {file_id}")

        return FileDeleteSuccessModel(file_id=file_id, message="檔案刪除成功")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"刪除檔案錯誤: {str(e)}")
        raise HTTPException(status_code=500, detail=f"刪除檔案錯誤: {str(e)}") from e
