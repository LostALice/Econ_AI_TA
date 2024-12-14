# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.model.api.v1.documentation import (
    QueryDocumentListModel,
    FileUploadSuccessModel,
)
from Backend.utils.database.vector_database import MilvusHandler
from Backend.utils.RAG.document_handler import DocumentSplitter
from Backend.utils.RAG.vector_extractor import VectorHandler
from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.database.database import MySQLHandler

from fastapi import APIRouter, HTTPException
from fastapi import UploadFile, Form

from starlette.responses import FileResponse
from typing import Literal, Annotated
from pprint import pformat
from os import path

import uuid
import json

# FastAPI router setup
router = APIRouter()
mysql_client = MySQLHandler()
milvus_client = MilvusHandler()
docs_client = DocumentSplitter()
encoder_client = VectorHandler()
logger = CustomLoggerHandler(__name__).setup_logging()


@router.get("/documentation/{docs_id}", status_code=200)
async def get_docs(docs_id: str) -> FileResponse:
    """
    Retrieve and return a specific document file based on its unique identifier.

    This function fetches the document file associated with the provided docs_id
    from the file system and returns it as a FileResponse. It also handles error
    cases such as empty requests or non-existent files.

    Args:
        docs_id (str): The unique identifier of the document to retrieve.

    Returns:
        FileResponse: A FileResponse object containing the requested document file.

    Raises:
        HTTPException:
            - 422 status code if the docs_id is empty.
            - 500 status code if the UUID format is incorrect or the file is not found.
    """

    if docs_id == "":
        raise HTTPException(status_code=422, detail="Empty request")

    file_name = mysql_client.query_docs_name(docs_id)
    file_extension = file_name.split(".")[-1]
    if uuid.UUID(docs_id, version=4) and path.exists(
        f"./files/{docs_id}.{file_extension}"
    ):
        return FileResponse(
            f"./files/{docs_id}.{file_extension}",
            media_type="application/pdf",
            filename=file_name,
        )

    else:
        raise HTTPException(500, detail="Incorrect uuid format or file not found")


@router.get("/documentation/{documentation_type}/", status_code=200)
async def get_documentation_list(
    documentation_type: str = "其他",
) -> QueryDocumentListModel:
    """
    Retrieve a list of documents based on the specified documentation type.

    This function queries the database for documents matching the given documentation type
    and returns a list of these documents.

    Args:
        documentation_type (str, optional): The type of documentation to retrieve.
            Defaults to "其他" (meaning "Other" in Chinese).

    Returns:
        QueryDocumentListModel: A model containing the status code and the list of
            documents matching the specified type.

    Raises:
        HTTPException: If no documents are found for the given documentation type.
    """
    docs_list = mysql_client.query_documentation_type_list(documentation_type)

    if not docs_list:
        raise HTTPException(406, detail="No documents found")

    return QueryDocumentListModel(
        status_code=200,
        docs_list=docs_list,
    )


@router.post("/documentation/upload/", status_code=200)
async def file_upload(
    docs_file: UploadFile,
    tags: Annotated[list[str], Form()],
    docs_format: str = "docx",
    collection: str = "default",
) -> FileUploadSuccessModel:
    """
    Upload a document file, process its content, and store it in the database.

    This function handles the upload of a document file, splits its content,
    generates vector representations, and stores the information in both
    MySQL and Milvus databases.

    Args:
        docs_file (UploadFile): The uploaded document file.
        tags (Annotated[list[str], Form()]): A list of tags associated with the document.
        docs_format (str, optional): The format of the document. Defaults to "docx".
        collection (str, optional): The name of the collection to store the document in. Defaults to "default".

    Returns:
        FileUploadSuccessModel: A model containing the status code and the UUID of the uploaded file.

    Raises:
        HTTPException: If there's an error in file type, format, or database operations.
    """

    file_tags = str(json.dumps({"docs_format": docs_format, "tags": tags}))
    filename = str(docs_file.filename)
    file_extension = filename.split(".")[-1]
    file_uuid = str(uuid.uuid4())

    logger.debug(
        pformat(f"""docs_file: {filename} file_uuid: {file_uuid} tags: {file_tags}""")
    )

    if file_extension != docs_format:
        # exclude non invalid files
        logger.warning(
            pformat(f"Invalid file type: {file_extension}, prefer: {docs_format}")
        )
        raise HTTPException(status_code=422, detail="Invalid file type")

    # save uploaded pdf file
    docs_contents = docs_file.file.read()
    with open(f"./files/{file_uuid}.{file_extension}", "wb") as f:
        f.write(docs_contents)

    # files identify
    if docs_format == "docx":
        splitted_content = docs_client.document_splitter(
            f"./files/{file_uuid}.docx", "docx"
        )
        logger.debug(pformat(splitted_content))

    elif docs_format == "pptx":
        splitted_content = docs_client.document_splitter(
            f"./files/{file_uuid}.pptx", "pptx"
        )
        logger.debug(pformat(splitted_content))
    else:
        logger.error(pformat(f"Unsupported file format: {docs_format}"))
        raise HTTPException(status_code=422, detail="Unsupported file format")

    # insert to milvus
    for sentence in splitted_content:
        vector = encoder_client.encoder(sentence)
        insert_info = milvus_client.insert_sentence(
            docs_filename=filename,
            vector=vector,
            content=sentence,
            file_uuid=file_uuid,
            collection=collection,
        )

        logger.debug(pformat(insert_info))

    success = mysql_client.insert_file(
        file_uuid=file_uuid, filename=filename, tags=file_tags, collection=collection
    )

    if success:
        return FileUploadSuccessModel(
            status_code=200,
            file_id=file_uuid,
        )

    raise HTTPException(status_code=500, detail="Internal server error")
