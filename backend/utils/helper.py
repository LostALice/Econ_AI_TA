# Code by AkinoAlice@TyrantRey

from langchain_community.document_loaders import PyPDFLoader

from utils.setup import SetupMYSQL, SetupMilvus
from utils.error import *

from text2vec import SentenceModel
from llama_cpp import Llama
from pprint import pformat
from numpy import ndarray

import logging
import opencc
import os


class MySQLHandler(SetupMYSQL):
    def __init__(self) -> None:
        super().__init__()

    def insert_file(self, file_uuid: str, filename: str, tags: str, collection: str = "default") -> bool:
        """insert a file record into the database

        Args:
            file_uuid (str): file uuid
            filename (str): filenames
            tags (str): file tags
            collection (str, optional): insert into which collection. Defaults to "default".

        Returns:
            bool: success or failure
        """
        logging.debug(
            pformat(f"insert_file {file_uuid} {filename} {tags} {collection}"))

        self.cursor.execute("""
            INSERT INTO file (file_id, file_name, tags, collection)
            VALUES (
                %s, %s, %s, %s
            );""", (file_uuid, filename, tags, collection))

        return self.commit()

    def insert_chatting(
        self,
        chat_id: str,
        qa_id: str,
        question: str,
        answer: str,
        token_size: int,
        sent_by: str,
        file_ids: list[str] | None = None,
    ) -> bool:
        """inserts a new record during chatting

        Args:
            chat_id (str): chatroom id
            qa_id (str): question id
            question (str): context of the question
            answer (str): context of the answer
            token_size (int): question token size
            sent_by (str): user id
            file_ids (list[str] | None, optional): answer included files. Defaults to None.

        Returns:
            bool: success or failure
        """

        logging.debug(pformat({
            "chat_id": chat_id,
            "qa_id": qa_id,
            "question": question,
            "answer": answer,
            "token_size": token_size,
            "sent_by": sent_by,
            "file_ids": file_ids,
        }))

        self.cursor.execute("""
            INSERT INTO `FCU_LLM`.`qa` (chat_id, qa_id, question, answer, token_size, sent_by)
            VALUES (
                %s, %s, %s, %s, %s, %s
            );
        """, (chat_id, qa_id, question, answer, token_size, sent_by))

        success = self.commit()

        # checkpoint
        assert success

        if not file_ids is None:
            for file_id in set(file_ids):
                self.cursor.execute("""
                    INSERT INTO `FCU_LLM`.`attachment` (chat_id, qa_id, file_id)
                    VALUES (
                        %s, %s, %s
                    );
                """, (chat_id, qa_id, file_id))
            success = self.commit()
            assert success

        return success

    def query_docs_id(self, docs_name: str) -> str:
        self.cursor.execute("""SELECT file_id
            FROM FCU_LLM.file
            WHERE file_name = %s
            """, (docs_name,)
        )

        self.sql_query_logger()
        file_name = self.cursor.fetchone()
        logging.info(pformat(file_name))
        return file_name

    def query_docs_name(self, docs_id: str) -> str:
        self.cursor.execute("""SELECT file_name
            FROM FCU_LLM.file
            WHERE file_id = %s
            """, (docs_id,)
        )

        self.sql_query_logger()
        file_name = self.cursor.fetchone()
        logging.info(pformat(file_name))
        return file_name

    def select_department_docs_list(self, department_name: str) -> list[dict[str, str, str]]:
        """get department docs list

        Returns:
            list[dict[file_id, file_name, last_update]]: list of docs
        """

        self.cursor.execute(
            """ SELECT file_id, file_name, last_update
                FROM FCU_LLM.file
                WHERE `expired` = 0 AND `tags` -> "$.department" = %s
            """, (department_name,)
        )

        self.sql_query_logger()
        query_result = self.cursor.fetchall()
        logging.debug(pformat(f"select file list query: {query_result}"))

        return query_result

    def sql_query_logger(self) -> None:
        """log sql query
        """
        logging.debug(pformat(
            f"committed sql: {str(self.cursor.statement)}"
        ))

    def commit(self, close_connection: bool = False) -> bool:
        """commit a transaction or not then rollback

        Args:
            close_connection (bool, optional): close connection. Defaults to True.

        Returns:
            bool: success or failure
        """
        try:
            self.sql_query_logger()
            self.connection.commit()
            logging.debug(pformat("Mysql committed"))
            return True
        except Exception as error:
            logging.error(error)
            self.connection.rollback()
            return False
        finally:
            if close_connection:
                self.connection.close()
                logging.debug(pformat("Mysql connection closed"))


class MilvusHandler(SetupMilvus):
    def __init__(self) -> None:
        super().__init__()

    def insert_sentence(
        self,
        docs_filename: str,
        vector: ndarray,
        content: str,
        file_uuid: str,
        collection: str = "default",
        remove_duplicates: bool = True
    ) -> dict:
        """insert a sentence(regulations) from docs

        Args:
            docs_filename (str): docs filename
            vector (ndarray): vector of sentences
            content (str): docs content
            file_uuid (str): file_uuid
            collection (str, optional): insert into which collection. Defaults to "default".
            remove_duplicates (bool, optional): remove duplicates vector in database. Defaults to True.

        Returns:
            dict: _description_
        """
        # fix duplicates
        if remove_duplicates:
            is_duplicates = self.milvus_client.query(
                collection_name=collection,
                filter=f"""(source == "{docs_filename}") and (content == "{content}")""")  # nopep8
            if is_duplicates:
                info = self.milvus_client.delete(
                    collection_name="default",
                    ids=[i["id"] for i in is_duplicates]
                )
                logging.debug(pformat(f"Deleted: {info}"))

        success = self.milvus_client.insert(
            collection_name=collection,
            data={
                "source": str(docs_filename),
                "vector": vector,
                "content": content,
                "file_uuid": file_uuid
            }
        )

        return success

    def search_similarity(
        self,
        question_vector: ndarray,
        collection_name: str = "default",
        limit: int = 10
    ) -> list[dict[str, str, int]]:
        """search for similarity using answer from user and vector database

        Args:
            question_vector (ndarray): vector of question
            collection (str, optional): the collection of searching. Defaults to "default".
            limit (int, optional): number of rows to return. Defaults to 10.

        Returns:
            regulations[dict[source, content, file_uuid]]: list of regulations including source(filename), content(content in file) and file_uuid
        """

        docs_results = self.milvus_client.search(collection_name=collection_name, data=[
                                                 question_vector], limit=limit)[0]
        logging.info(f"docs_results: {docs_results}")

        regulations = []

        for _ in docs_results:
            file_ = self.milvus_client.get(
                collection_name="default",
                ids=_["id"],
            )[0]

            regulations.append({
                "source": file_["source"],
                "content": file_["content"],
                "file_uuid": file_["file_uuid"],
            })

        logging.debug(pformat(regulations))

        return regulations


class FileHandler(object):
    def __init__(self) -> None:
        ...

    def pdf_splitter(self, document_path: str) -> list[str]:
        """split document(pdf) into lines for tokenize

        Args:
            document_path (str): document path

        Raises:
            FormatError: pdf file error or not a pdf file

        Returns:
            list[str]: list of lines
        """
        if not document_path.endswith(".pdf"):
            raise FormatError("Supported formats: .pdf")

        pdf = PyPDFLoader(document_path)
        all_splits = pdf.load_and_split()
        splitted_content = "".join([text.page_content.replace("\n", "").replace(" ", "")
                                    for text in all_splits]).split("。")

        # last element is ""
        return splitted_content[:-1]


class VectorHandler(object):
    def __init__(self) -> None:
        self.HF_embedding_model = os.getenv("HF_EMBEDDING_MODEL")
        self.embedding = SentenceModel(self.HF_embedding_model)

    def encoder(self, text: str) -> ndarray:
        """convert text to ndarray (vector)

        Args:
            text (str): text to be converted

        Returns:
            ndarray: numpy array (vector)
        """
        return self.embedding.encode(text)


class RAGHandler(object):
    def __init__(self) -> None:
        # only except .gguf format
        if not os.getenv("LLM_MODEL").endswith(".gguf"):
            raise FormatError

        if not os.path.exists(f"""./model/{os.getenv("LLM_MODEL")}"""):
            from huggingface_hub import hf_hub_download
            hf_hub_download(
                repo_id=os.getenv("REPO_ID"),
                filename=os.getenv("LLM_MODEL"),
                local_dir="./model"
            )

        self.model = Llama(
            model_path=f"""./model/{os.getenv("LLM_MODEL")}""",
            verbose=False,
            n_gpu_layers=-1,
            n_ctx=0,
        )

        self.system_prompt = "你是一個逢甲大學的學生助理，你只需要回答關於學分，課程，老師等有關資料，不需要回答學分，課程，老師以外的問題。你現在有以下資料 {regulations} 根據上文回答問題"

        self.converter = opencc.OpenCC("s2tw.json")

    def token_counter(self, prompt: str) -> int:
        return len(self.model.tokenize(prompt.encode("utf-8")))

    def response(self, question: str, regulations: list, max_tokens: int = 8192) -> tuple[str | int]:
        """response from RAG

        Args:
            question (str): question from user
            regulations (list): regulations from database
            max_tokens (int, optional): max token allowed. Defaults to 8192.

        Returns:
            answer: response from RAG
            token_size: token size
        """
        content = self.system_prompt.format(regulations=" ".join(regulations))

        token_size = self.token_counter(content)

        message = [
            {
                "role": "system",
                "content": content,
            },
            {
                "role": "user",
                "content": question
            },
        ]

        output = self.model.create_chat_completion(
            message,
            stop=["<|eot_id|>", "<|end_of_text|>"],
            max_tokens=max_tokens,
            temperature=.5
        )["choices"][0]["message"]["content"]

        return self.converter.convert(output), token_size


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv("./.env")

    VectorHandler().encoder("學分的抵免原則")
    MilvusHandler().search_similarity()
