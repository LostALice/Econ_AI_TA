# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.model.database.vector_database import SearchSimilarityModel
from Backend.utils.helper.logger import CustomLoggerHandler

from pymilvus import MilvusClient
from pymilvus import DataType

from typing import Literal, Dict
from pprint import pformat
from os import getenv

import numpy as np

# development
from dotenv import load_dotenv

load_dotenv("./.env")


class SetupMilvus(object):
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SetupMilvus, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        self.DEBUG = getenv("MILVUS_DEBUG")
        self.HOST = getenv("MILVUS_HOST")
        self.PORT = getenv("MILVUS_PORT")
        self.MILVUS_VECTOR_DIM = int(str(getenv("MILVUS_VECTOR_DIM")))
        self.DEFAULT_COLLECTION_NAME = str(getenv("MILVUS_DEFAULT_COLLECTION_NAME"))

        assert self.DEBUG is not None, "Missing MILVUS_DEBUG environment variable"
        assert self.HOST is not None, "Missing MILVUS_HOST environment variable"
        assert self.PORT is not None, "Missing MILVUS_PORT environment variable"
        assert (
            self.MILVUS_VECTOR_DIM > 0 and self.MILVUS_VECTOR_DIM is not None
        ), "MILVUS_VECTOR_DIM must be a positive integer"
        assert (
            self.DEFAULT_COLLECTION_NAME is not None
        ), "Missing MILVUS_DEFAULT_COLLECTION_NAME environment variable"

        self.logger = CustomLoggerHandler(__name__).setup_logging()

        self.logger.debug("========================")
        self.logger.debug("| Start loading Milvus |")
        self.logger.debug("========================")

        self._setup()

        self.logger.debug("===========================")
        self.logger.debug("| Milvus Loading Finished |")
        self.logger.debug("===========================")

    def _setup(self) -> None:
        self.milvus_client = MilvusClient(uri=f"http://{self.HOST}:{self.PORT}")

        try:
            if self.DEBUG in ["True", "true"]:
                self.logger.warning("Dropping collection")
                self.milvus_client.drop_collection(
                    collection_name=self.DEFAULT_COLLECTION_NAME
                )
        finally:
            loading_status = self.milvus_client.get_load_state(
                collection_name=self.DEFAULT_COLLECTION_NAME
            )

        self.logger.debug(
            pformat(
                f"""Milvus loading collection `{
                      self.DEFAULT_COLLECTION_NAME}`: {loading_status["state"]}"""
            )
        )

        if (
            not loading_status
            or loading_status["state"] == loading_status["state"].NotExist
        ):
            self.logger.error("Milvus collection not loaded")
            self.logger.debug(pformat("Creating Milvus database"))
            self._create_collection(collection_name=self.DEFAULT_COLLECTION_NAME)

    def _create_collection(
        self,
        collection_name: str,
        index_type: Literal[
            "FLAT",
            "IVF_FLAT",
            "IVF_SQ8",
            "IVF_PQ",
            "HNSW",
            "ANNOY",
            "RHNSW_FLAT",
            "RHNSW_PQ",
            "RHNSW_SQ",
        ] = "IVF_FLAT",
        metric_type: Literal["L2", "IP"] = "L2",
    ) -> Dict:

        schema = MilvusClient.create_schema(
            auto_id=True,
            enable_dynamic_field=False,
        )

        schema.add_field(
            field_name="id", datatype=DataType.VARCHAR, max_length=512, is_primary=True
        )
        # file_id
        schema.add_field(
            field_name="source", datatype=DataType.VARCHAR, max_length=1024
        )
        schema.add_field(
            field_name="file_uuid", datatype=DataType.VARCHAR, max_length=36
        )
        schema.add_field(
            field_name="content", datatype=DataType.VARCHAR, max_length=4096
        )
        schema.add_field(
            field_name="vector",
            datatype=DataType.FLOAT_VECTOR,
            dim=self.MILVUS_VECTOR_DIM,
        )

        self.logger.debug(pformat(f"Creating schema: {schema}"))

        index_params = self.milvus_client.prepare_index_params()

        index_params.add_index(
            field_name="vector",
            index_type=index_type,
            metric_type=metric_type,
            params={"nlist": 128},
        )

        self.logger.debug(pformat(f"Creating index: {index_params}"))

        self.milvus_client.create_collection(
            collection_name=collection_name,
            index_params=index_params,
            metric_type=metric_type,
            schema=schema,
        )

        collection_status = self.milvus_client.get_load_state(
            collection_name=collection_name
        )

        self.logger.debug(pformat(f"Creating collection: {collection_name}"))
        return collection_status


class MilvusHandler(SetupMilvus):
    def __init__(self) -> None:
        super().__init__()

    def insert_sentence(
        self,
        docs_filename: str,
        vector: np.ndarray,
        content: str,
        file_uuid: str,
        collection: str = "default",
        remove_duplicates: bool = True,
    ) -> dict:
        """
        Insert a sentence (regulation) from a document into the vector database.

        This function inserts a sentence along with its associated metadata into the specified
        collection in the vector database. It can optionally remove duplicates before insertion.

        Args:
            docs_filename (str): The filename of the document containing the sentence.
            vector (np.ndarray): The vector representation of the sentence.
            content (str): The actual content of the sentence.
            file_uuid (str): A unique identifier for the file.
            collection (str, optional): The name of the collection to insert into. Defaults to "default".
            remove_duplicates (bool, optional): Whether to remove duplicate entries before insertion. Defaults to True.

        Returns:
            dict: A dictionary containing information about the insertion operation, including
                  the number of rows inserted and the list of inserted primary keys.
        """
        # fix duplicates
        if remove_duplicates:
            is_duplicates = self.milvus_client.query(
                collection_name=collection,
                filter=f"""(source == "{docs_filename}") and (content == "{content}")""",  # fmt: off
            )  # nopep8
            if is_duplicates:
                info = self.milvus_client.delete(
                    collection_name="default", ids=[i["id"] for i in is_duplicates]
                )
                self.logger.debug(pformat(f"Deleted: {info}"))

        success = self.milvus_client.insert(
            collection_name=collection,
            data={
                "source": str(docs_filename),
                "vector": vector,
                "content": content,
                "file_uuid": file_uuid,
            },
        )

        return success

    def search_similarity(
            self,
            question_vector: np.ndarray,
            collection_name: str = "default",
            limit: int = 3,
        ) -> list[SearchSimilarityModel]:
        """
        Perform a similarity search on a vector database.

        Args:
            question_vector (np.ndarray): Vector representation of the query.
            collection_name (str, optional): Milvus collection name. Defaults to "default".
            limit (int, optional): Maximum number of similar documents to retrieve. Defaults to 3.

        Returns:
            list[SearchSimilarityModel]: List of similar documents with their metadata.

        Raises:
            ValueError: If the question vector is invalid or empty.
            MilvusException: If there are issues with Milvus database connection or search.
        """

        docs_results = self.milvus_client.search(
            collection_name=collection_name, data=[question_vector], limit=limit
        )[0]
        self.logger.info(f"question_vector: {question_vector}")
        self.logger.info(f"docs_results: {docs_results}")

        query_search_result = []

        for _ in docs_results:
            file_ = self.milvus_client.get(
                collection_name="default",
                ids=_["id"],
            )[0]

            query_search_result.append(
                SearchSimilarityModel(
                    file_uuid=file_["file_uuid"],
                    content=file_["content"],
                    source=file_["source"],
                )
            )

        self.logger.debug(pformat(query_search_result))

        return query_search_result
