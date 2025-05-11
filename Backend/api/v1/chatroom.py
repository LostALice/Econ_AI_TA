# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.model.api.v1.chatroom import (
    RatingModel,
    AnswerRatingModel,
    QuestioningModel,
    QuestionResponseModel,
)
from Backend.utils.database.vector_database import milvus_client
from Backend.utils.RAG.response_handler import response_client
from Backend.utils.RAG.vector_extractor import encoder_client
from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.database.database import mysql_client
from Backend.utils.helper.api.dependency import require_student

from fastapi import APIRouter, Depends, HTTPException
from pprint import pformat
from uuid import uuid4

import base64
import os

router = APIRouter(dependencies=[Depends(require_student)])
# mysql_client = MySQLHandler()
# milvus_client = MilvusHandler()
# encoder_client = VectorHandler()
# response_client = ResponseHandler()
logger = CustomLoggerHandler().get_logger()
logger.debug("| Chatroom Loading Finished |")


@router.get("/uuid/")
async def get_uuid() -> str:
    """
    Generates uuid for a new chatroom.

    Returns:
        uuid: String
    """
    chatroom_uuid = str(uuid4())
    logger.info(f"Generated chatroom: UUID: {chatroom_uuid}")
    return chatroom_uuid


@router.patch("/rating/", status_code=200)
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


@router.post("/{chat_id}/", status_code=200)
async def questioning(
    question_model: QuestioningModel,
) -> QuestionResponseModel:
    """Ask the question and return the answer from RAG

    Args:
        Args:
        chat_id (str): chatroom uuid
        question (list[str]): question content
        sent_by_username (str): user name
        collection (str, optional): collection of docs database. Defaults to "default".
        language (str): language for the response
        images: (optional: list[str] | None): list of base64 encoded images

    Returns:
        status_code: int
        question_uuid: str
        answer: str
        files: list[dict[str, str]]
    """
    chat_id = question_model.chat_id
    question = question_model.question
    sent_by_username = question_model.sent_by_username
    collection = question_model.collection
    language = question_model.language
    question_type = question_model.question_type
    question_uuid = str(uuid4())
    images = question_model.images

    logger.debug(
        pformat(
            {
                "chat_id": chat_id,
                "question": question,
                "sent_by_username": sent_by_username,
                "collection": collection,
                "question_uuid": question_uuid,
            }
        )
    )

    # save image
    # assume not more than 3 image in a single request
    if images:
        for base64_image in images:
            image_file_data = base64.b64decode(base64_image)
            image_uuid = str(uuid4())
            image_path = f"./images/chat/{chat_id}/{question_uuid}/{image_uuid}.png"

            while os.path.exists(image_path):
                image_uuid = str(uuid4())
                image_path = f"./images/chat/{chat_id}/{question_uuid}/{image_uuid}.png"
                logger.warning(f"Image file already exists: {image_path}")
            else:
                logger.info(f"Saving image: {image_path}")
                os.makedirs(os.path.dirname(image_path), exist_ok=True)
                with open(image_path, "wb") as f:
                    f.write(image_file_data)
                mysql_client.insert_image(
                    chat_id=chat_id, qa_id=question_uuid, image_uuid=image_uuid
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
        if docs.source not in seen:
            files.append(
                {
                    "file_name": docs.source,
                    "file_uuid": docs.file_uuid,
                }
            )
            seen.add(docs.source)

    answer, token_size = response_client.generate_response(
        question=question,
        queried_document=document_content,
        question_type=question_type,
        max_tokens=8192,
        language=language,
        images=images,
    )

    # insert into mysql
    mysql_client.insert_chatting(
        chat_id=chat_id,
        qa_id=question_uuid,
        answer=answer,
        question=question[-1],
        token_size=token_size,
        sent_by_username=sent_by_username,
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
