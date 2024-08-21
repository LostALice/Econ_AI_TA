# Code by AkinoAlice@TyrantRey

from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, Form
from fastapi import HTTPException
from fastapi import FastAPI

from utils.helper import (
    ResponseHandler,
    VectorHandler,
    MilvusHandler,
    MySQLHandler,
    FileHandler,
)
from utils.model import (
    QuestioningModel,
    LoginFormModel,
    RatingModel,
)
from utils.error import *

from logging.handlers import RotatingFileHandler
from starlette.responses import FileResponse
from typing import Literal
from pprint import pformat

import datetime
import hashlib
import logging
import uuid
import json
import jwt
import sys
import os

# logging
log_format = "%(asctime)s, %(levelname)s [%(filename)s:%(lineno)d] %(message)s"
RotatingFileHandler("./Event.log", mode="a", maxBytes=5 *
                    1024*1024, backupCount=1, encoding="utf-8", delay=0)
logging.basicConfig(filename="./Event.log", filemode="w+", format=log_format,
                    level=logging.NOTSET, encoding="utf-8")
logging.getLogger().addHandler(logging.StreamHandler(sys.stdout))
logging.debug(f"""Debug {os.getenv("DEBUG")}""")


# disable logging
logging.getLogger("multipart").propagate = False

CORS_allow_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        os.getenv("CORS_ALLOWED_ORIGIN"),
    ]

logging.info(pformat(("CORS:", CORS_allow_origins)))

app = FastAPI(debug=True)
app.add_middleware(
    CORSMiddleware,
    # can alter with time
    allow_origins=CORS_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UtilsLoader(object):
    def __init__(self) -> None:
        self.milvus_client = MilvusHandler()
        self.mysql_client = MySQLHandler()
        self.encoder_client = VectorHandler()
        self.docs_client = FileHandler()
        self.RAG = ResponseHandler()


LOADER = UtilsLoader()

logging.debug("====================")
logging.debug("| Loading Finished |")
logging.debug("====================")


@app.get("/", status_code=200)
async def test():
    return HTTPException(status_code=200, detail="test ok")


@app.post("/login/", status_code=200)
async def login(login_form: LoginFormModel):
    username = login_form.username
    hashed_password = login_form.hashed_password

    _status, user_info = LOADER.mysql_client.get_user_info(username, hashed_password)

    if _status != 200:
        return {
            "success": False,
            "response": _status,
        }

    if _status == 200:
        login_info = {}
        login_info["expire_time"] = str(datetime.datetime.now() + datetime.timedelta(days=1))
        login_info["role_name"] = user_info["role_name"]
        login_info["username"] = user_info["username"]
        login_info["user_id"] = user_info["user_id"]

        logging.debug(pformat(login_info))

        jwt_token = jwt.encode(login_info, os.getenv("JWT_SECRET"), algorithm=os.getenv("JWT_ALGORITHM"))
        logging.debug(f"Generated new jwt token:{jwt_token}")

    _success = LOADER.mysql_client.insert_login_token(login_info["user_id"], jwt_token)
    if _success:
        return {
            "success": True,
            "jwt_token": jwt_token,
            "role": login_info["role_name"]
        }
    else:
        return HTTPException(status_code=500, detail="unknown issue")

@app.post("/sign/", status_code=200)
async def sign_in(username: str, password: str):
    hash_function = hashlib.sha3_256()
    hashed_password = hash_function.update(password).hexdigest()


    LOADER.mysql_client.create_user(username, hashed_password)
    return HTTPException(status_code=200, detail="login")


@app.get("/documentation/{docs_id}", status_code=200)
async def get_docs(docs_id: str) -> FileResponse:
    """download documentation from docs_id

    Args:
        docs_id (str): documentation uuid

    Returns:
        FileResponse | HTTPException: file or error
    """

    if docs_id == "":
        return HTTPException(status_code=200, detail="Empty request")

    file_name = LOADER.mysql_client.query_docs_name(docs_id)["file_name"]
    file_extension = file_name.split(".")[-1]
    if uuid.UUID(docs_id, version=4) and os.path.exists(f"./files/{docs_id}.{file_extension}"):
        return FileResponse(
            f"./files/{docs_id}.{file_extension}",
            media_type="application/pdf",
            filename=file_name)

    else:
        return HTTPException(500, detail="Incorrect uuid format or file not found")


@app.get("/department/{department}/", status_code=200)
async def get_department_docs_list(
        department: Literal[
            "docx",
            "pptx"
        ] = "其他"):

    docs_list = LOADER.mysql_client.select_department_docs_list(department)

    return {
        "docs_list": docs_list
    }


@app.get("/uuid/")
async def get_uuid():
    uuid_ = str(uuid.uuid4())
    return uuid_


@app.post("/upload/", status_code=200)
async def file_upload(
    docs_file: UploadFile,
    tags: list[str] = Form(),
    department: Literal[
        "docx",
        "pptx",
    ] = "docx",
    collection: str = "default"
):
    """upload a docs file

    Args:
        docs_file (UploadFile): docs file
        tags (list[str], optional): file tags. Defaults to Form().
        collection (str, optional): insert into collection. Defaults to "default".

    Returns:
        file_id: file uuid
    """
    file_tags = str(json.dumps({
        "department": department,
        "tags": tags
    }))
    filename = str(docs_file.filename)
    file_extension = filename.split(".")[-1]
    file_uuid = str(uuid.uuid4())

    logging.debug(
        pformat(f"""docs_file: {filename} file_uuid: {file_uuid} tags: {file_tags}"""))

    if file_extension != department:
        # exclude non invalid files
        logging.debug(pformat(f"Invalid file type: {file_extension}, prefer: {department}"))
        return HTTPException(status_code=200, detail="Invalid file type")

    # save uploaded pdf file
    docs_contents = docs_file.file.read()
    with open(f"./files/{file_uuid}.{file_extension}", "wb") as f:
        f.write(docs_contents)

    # files identify
    if department == "docx":
        splitted_content = LOADER.docs_client.MS_docx_splitter(
            f"./files/{file_uuid}.docx")
        logging.debug(pformat(splitted_content))

    if department == "pptx":
        splitted_content = LOADER.docs_client.MS_pptx_splitter(
            f"./files/{file_uuid}.pptx")
        logging.debug(pformat(splitted_content))

    # insert to milvus
    for sentence in splitted_content:
        vector = LOADER.encoder_client.encoder(sentence)
        insert_info = LOADER.milvus_client.insert_sentence(
            docs_filename=filename,
            vector=vector,
            content=sentence,
            file_uuid=file_uuid,
            collection=collection
        )

        logging.debug(pformat(insert_info))

    success = LOADER.mysql_client.insert_file(
        file_uuid=file_uuid, filename=filename, tags=file_tags, collection=collection)

    if success:
        return {
            "success": success,
            "file_id": file_uuid,
        }

    return HTTPException(status_code=200, detail="Internal server error")


@app.post("/rating/", status_code=200)
async def question_rating(rating_model: RatingModel):
    """Score of the answer

    Args:
        rating_model (RatingModel): question_uuid: string
                                    rating: bool
    Returns:
        _type_: _description_
    """
    question_uuid = rating_model.question_uuid
    score = rating_model.rating

    logging.debug(pformat({
        "question_uuid": question_uuid,
        "score": score,
    }))

    success = LOADER.mysql_client.update_rating(question_uuid=question_uuid, rating=score)

    return {
        "success": success
    }


@app.post("/chat/{chat_id}/", status_code=200)
async def questioning(question_model: QuestioningModel):
    """Ask the question and return the answer from RAG

    Args:
        chat_id (str): chatroom uuid
        question (str): question content
        user_id (str): user id
        collection (str, optional): collection of docs database. Defaults to "default".

    Returns:
        answer: response of the question
        server_status_code: 200 | 500
    """
    chat_id = question_model.chat_id
    question = question_model.question
    user_id = question_model.user_id
    collection = question_model.collection
    question_uuid = str(uuid.uuid4())

    logging.debug(pformat({
        "chat_id": chat_id,
        "question": question,
        "user_id": user_id,
        "collection": collection,
        "question_uuid": question_uuid
    }))

    # search question
    question_vector = LOADER.encoder_client.encoder(question)
    docs_result = LOADER.milvus_client.search_similarity(
        question_vector, collection_name=collection)

    regulations_content = [x["content"] for x in docs_result]
    regulations_file_uuid = [x["file_uuid"] for x in docs_result]

    # handling duplicates files name
    seen = set()
    files = []
    for x in docs_result:
        if not x["source"] in seen:
            files.append({
                "file_name": x["source"],
                "file_uuid": x["file_uuid"],
            })
            seen.add(x["source"])

    answer, token_size = LOADER.RAG.response(
        regulations=regulations_content, question=question)
    answer = "".join(answer).replace("\n\n", "\n")

    # insert into mysql
    LOADER.mysql_client.insert_chatting(
        chat_id=chat_id,
        qa_id=question_uuid,
        answer=answer,
        question=question,
        token_size=token_size,
        sent_by=user_id,
        file_ids=regulations_file_uuid
    )

    if answer:
        return {
            "question_uuid": question_uuid,
            "answer": answer,
            "files": files
        }

    return HTTPException(status_code=200, detail="Internal server error")

if __name__ == "__main__":
    # development only
    # uvicorn main:app --reload --host 0.0.0.0 --port 8080
    app.run(debug=os.getenv("DEBUG"))
