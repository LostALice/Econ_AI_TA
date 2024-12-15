# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.model.api.v1.chatroom import (
    RatingModel,
    AnswerRatingModel,
    QuestioningModel,
    QuestionResponseModel,
)
from Backend.utils.database.vector_database import MilvusHandler
from Backend.utils.RAG.response_handler import ResponseHandler
from Backend.utils.RAG.vector_extractor import VectorHandler
from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.database.database import MySQLHandler

# from Backend.utils.helper.model.model import *

from fastapi import APIRouter, HTTPException
from pprint import pformat
from uuid import uuid4

router = APIRouter()
mysql_client = MySQLHandler()
milvus_client = MilvusHandler()
encoder_client = VectorHandler()
response_client = ResponseHandler()
logger = CustomLoggerHandler(__name__).setup_logging()


@router.get("/chatroom/uuid/")
async def get_uuid() -> str:
    """
    Generates uuid for a new chatroom.

    Returns:
        uuid: String
    """
    chatroom_uuid = str(uuid4())
    logger.info(f"Generated chatroom: UUID: {chatroom_uuid}")
    return chatroom_uuid


@router.post("/chatroom/rating/", status_code=200)
async def answer_rating(
    rating_model: RatingModel,
) -> AnswerRatingModel:
    """
    Update the rating for a specific answer in the chatroom.

    This function receives a rating for an answer, updates it in the database,
    and returns the status of the operation.

    Args:
        rating_model (RatingModel): A model containing the rating information.
            It includes:
            - question_uuid (str): The unique identifier of the question.
            - rating (bool): The rating given to the answer (True for positive, False for negative).

    Returns:
        AnswerRatingModel: A model containing the result of the rating operation.
            It includes:
            - status_code (int): HTTP status code (200 for success).
            - success (bool): Indicates whether the rating update was successful.

    Raises:
        HTTPException: If there's an internal server error (status code 500).
    """
    question_uuid = rating_model.question_uuid
    score = rating_model.rating

    logger.debug(
        pformat(
            {
                "question_uuid": question_uuid,
                "score": score,
            }
        )
    )

    success = mysql_client.update_rating(question_uuid=question_uuid, rating=score)

    if success:
        return AnswerRatingModel(status_code=200, success=success)

    raise HTTPException(status_code=500, detail="Internal Server Error")


@router.post("/chatroom/{chat_id}/", status_code=200)
async def questioning(
    question_model: QuestioningModel,
) -> QuestionResponseModel:
    """Ask the question and return the answer from RAG

    Args:
        Args:
        chat_id (str): chatroom uuid
        question (str): question content
        user_id (str): user id
        collection (str, optional): collection of docs database. Defaults to "default".
        language (str): language for the response

    Returns:
        answer: response of the question
        server_status_code: 200 | 500
    """
    chat_id = question_model.chat_id
    question = question_model.question
    user_id = question_model.user_id
    collection = question_model.collection
    language = question_model.language
    question_uuid = str(uuid4())

    logger.debug(
        pformat(
            {
                "chat_id": chat_id,
                "question": question,
                "user_id": user_id,
                "collection": collection,
                "question_uuid": question_uuid,
            }
        )
    )

    # search question
    question_text = question[-1] if isinstance(question, list) else question
    question_vector = encoder_client.encoder(question_text)
    docs_result = milvus_client.search_similarity(
        question_vector, collection_name=collection
    )

    document_content = [x.content for x in docs_result]
    document_file_uuid = [str(x.file_uuid) for x in docs_result]

    # handling duplicates files name
    seen = set()
    files = []
    for docs in docs_result:
        if not docs.source in seen:
            files.append(
                {
                    "file_name": docs.source,
                    "file_uuid": docs.file_uuid,
                }
            )
            seen.add(docs.source)

    answer, token_size = response_client.response(
        question=question,
        queried_document=document_content,
        max_tokens=8192,
        language=language,
    )
    answer = "".join(answer).replace("\n\n", "\n")

    # insert into mysql
    mysql_client.insert_chatting(
        chat_id=chat_id,
        qa_id=question_uuid,
        answer=answer,
        question=question[-1],
        token_size=token_size,
        sent_by=user_id,
        file_ids=document_file_uuid,
    )

    if answer:
        return QuestionResponseModel(
            status_code=200,
            question_uuid=question_uuid,
            answer=answer,
            files=files,
        )

    raise HTTPException(status_code=500, detail="Internal server error")
