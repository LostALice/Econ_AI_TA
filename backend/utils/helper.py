# Code by AkinoAlice@TyrantRey
from langchain_community.document_loaders import UnstructuredPowerPointLoader, UnstructuredWordDocumentLoader
from langchain_community.document_loaders import PyPDFLoader

from utils.setup import SetupMYSQL, SetupMilvus
from utils.error import *

from numpy import ndarray, asarray
from pprint import pformat
from utils.model import (
    UserInfoModel
)

import numpy as np
import requests
import logging
import hashlib
import json
import os


class MySQLHandler(SetupMYSQL):
    def __init__(self) -> None:
        super().__init__()

    def query_role(self, role_name: int) -> str | tuple[None, str]:
        """query the role name using role id

        Args:
            role_id (int): role id

        Returns:
            str: role name
            None: not found
        """
        logging.debug(
            pformat(f"create_user {role_name}"))

        self.cursor.execute("""SELECT role_id FROM `role` WHERE role_name = %s""", (role_name,))
        self.sql_query_logger()
        role_id = self.cursor.fetchone()
        logging.info(pformat(role_id))

        return role_id if role_id else None, "role_name not exists"


    def create_role(self, role_name: str) -> int | tuple[None, str]:
        """create a new role

        Args:
            role_name (str): name of the role

        Returns:
            int: the role_id
        """
        logging.debug(
            pformat(f"create_role {role_name}"))

        # check is role exist
        role_id = self.query_role(role_name)
        if role_id is None:
            return None, "role_name not exists"

        self.cursor.execute("""
            INSERT INTO `role` (role_name)
            VALUES (
                %s,
            );""", (role_name,))

        self.commit()

        role_id = self.query_role(role_name)
        return role_id


    def create_user(self, username: str, hashed_password: str, role_name: str) -> int:
        """create a new user

        Args:
            username (str): provide a username
            password (str): password
            roles (str): admin | user

        Returns:
            int:
                200: success
                302: username exists in database
                500: database error
        """
        logging.debug(
            pformat(f"create_user {username} {hashed_password} {role_name}"))

        # check if user already exists
        self.cursor.execute("""SELECT username FROM `users` WHERE username = %s""", (username,))

        self.sql_query_logger()
        is_username_exist = self.cursor.fetchone()
        logging.info("is_username_exist", is_username_exist)

        if is_username_exist:
            return 302

        # check if role exists in database
        self.cursor.execute("""SELECT role_id FROM `role` WHERE role_name = %s""", (role_name,))

        self.sql_query_logger()
        role_id = self.cursor.fetchone()
        logging.info(pformat(role_id))

        if is_username_exist:
            return 302

        self.cursor.execute("""
            INSERT INTO `login` (user_id, password)
            VALUES (
                %s, %s,
            );""", (username, hashed_password))

        return self.commit()

    def insert_login_token(self, user_id: str, jwt_token: str) -> bool:
        self.cursor.execute("""
            UPDATE login
            SET jwt = %s
            WHERE user_id = %s""", (jwt_token, user_id))

        return self.commit() ? True : False

    def get_user_info(self, username: str, hashed_password: str) -> tuple[int, dict[UserInfoModel]]:
        """check if the user logged

        Args:
            username (str): username
            hashed_password (str): hashed_password

        Returns:
            int:
                200: user inside database and password correct
                403: password incorrect
                500: database error
        """

        logging.debug(f"user: {username} trying to login")

        self.cursor.execute("""
            SELECT user.user_id, user.username, login.password, login.jwt, login.last_login, role.role_name
            FROM user
            JOIN login ON user.user_id = login.user_id
            JOIN role ON user.role_id = role.role_id
            WHERE user.username = %s AND login.password = %s""", (username, hashed_password))

        login_info = self.cursor.fetchone()

        logging.debug(pformat(login_info))

        if login_info:
            return 200, login_info
        else:
            return 403, "Error"


    def check_user(self, username: str, roles: str = None) -> int:
        """check username and password is inside database

        Args:
            username (str): username
            password (str): hash of password
            roles (str): admin | user | None roles

        Returns:
            int:
                200: user inside database and password correct
                401: username not found
                403: password incorrect
                500: database error
        """



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
            INSERT INTO `file` (file_id, file_name, tags, collection)
            VALUES (
                %s, %s, %s, %s
            );""", (file_uuid, filename, tags, collection))

        return self.commit()

    def update_rating(self, question_uuid: str, rating: bool) -> bool:
        """rating of the answer

        Args:
            question_uuid (str): uuid of the question
            rating (bool): True = good/ false = bad

        Returns:
            success: insert success or failure
        """
        logging.info(f"inserting rating {question_uuid}:{rating}")

        self.cursor.execute("""
            UPDATE table_name
            SET rating = %s
            WHERE qa_id = %s;""", (rating, question_uuid))

        success = self.commit()
        assert success
        return success

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
        self.cursor.execute("""SELECT user_id FROM user WHERE username = %s""", (sent_by, ))
        user_id = self.cursor.fetchone()["user_id"]

        logging.debug(pformat({
            "chat_id": chat_id,
            "qa_id": qa_id,
            "question": question,
            "answer": answer,
            "token_size": token_size,
            "sent_by": sent_by,
            "file_ids": file_ids,
            "user_id": user_id,
        }))

        self.cursor.execute("""
            INSERT IGNORE INTO `FCU_LLM`.`chat` (chat_id, user_id, chat_name)
            VALUES (
                %s, %s, %s
            );""", (chat_id, user_id, answer[:10]))

        success = self.commit()
        assert success

        self.cursor.execute("""
            INSERT INTO `FCU_LLM`.`qa` (chat_id, qa_id, question, answer, token_size, sent_by)
            VALUES (
                %s, %s, %s, %s, %s, %s
            );
        """, (chat_id, qa_id, question, answer, token_size, sent_by))

        success = self.commit()
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
            dict: Number of rows that were inserted and the inserted primary key list.
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
        limit: int = 3
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
        logging.info(f"question_vector: {question_vector}")
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

    def MS_pptx_splitter(self, document_path: str) -> list[str]:
        if not document_path.endswith((".pptx")):
            raise FormatError("Supported formats: .pptx")

        loader = UnstructuredPowerPointLoader(document_path)
        data = loader.load()
        splitted_content = "".join([text.page_content for text in data]).split("\n\n\n\n")
        splitted_content = [x.replace("\n", "").replace("\t", "") for x in splitted_content]
        splitted_content = filter(lambda x: x != "", splitted_content)
        return splitted_content

    def MS_docx_splitter(self, document_path: str) -> list[str]:
        if not document_path.endswith((".docx")):
            raise FormatError("Supported formats: .docx")

        docx = UnstructuredWordDocumentLoader(document_path)
        data = docx.load()
        splitted_content = "".join([text.page_content.replace("A:  ", "").replace("\n", "") for text in data]).split("  ")
        splitted_content = filter(lambda x: x != "", splitted_content)
        return splitted_content

# https://docs.twcc.ai/docs/user-guides/twcc/afs/api-and-parameters/embedding-api
class VectorHandler(object):
    def __init__(self) -> None:
        self.url = os.getenv("API_URL") + "/models/embeddings"
        self.api_key = os.getenv("API_KEY")

    def encoder(self, text: str) -> ndarray:
        """convert text to ndarray (vector)

        Args:
            text (str): text to be converted

        Returns:
            ndarray: numpy array (vector)
        """

        headers = {
                    "Content-Type": "application/json",
                    "X-API-HOST": "afs-inference",
                    "X-API-KEY": self.api_key
                }

        data = {
            "model": "ffm-embedding",
            "inputs": [text]
        }

        response = requests.post(self.url, headers=headers, data=json.dumps(data))
        response_data = response.json()
        print(response_data)
        embeddings_vector = response_data["data"][0]["embedding"]
        unpadded_vector = asarray(embeddings_vector, dtype=float)

        return np.pad(unpadded_vector, (0, 4096 - len(unpadded_vector)), mode="constant", constant_values=0)


# https://docs.twcc.ai/docs/user-guides/twcc/afs/api-and-parameters/conversation-api
class ResponseHandler(object):
    def __init__(self) -> None:
        self.url = os.getenv("API_URL") + "/models/conversation"

        self.api_key = os.getenv("API_KEY")

    def response(self, question: str, regulations: list, max_tokens: int = 8192) -> tuple[str, int]:
        """response from RAG

        Args:
            question (str): question from user
            regulations (list): regulations from database
            max_tokens (int, optional): max token allowed. Defaults to 8192.

        Returns:
            answer: response from RAG
            token_size: token size
        """

        headers = {
            "Content-Type": "application/json",
            "X-API-HOST": "afs-inference",
            "X-API-KEY": self.api_key,
        }

        data = {
            "model": "meta-llama31-70b-inst",
            "messages": [
                {
                    "role": "system",
                    "content": "你是經濟老師的得力助手，你必須用有支持的資訊來回答我的問題。你必須用中文或英文回答我取決於我問你的問題",
                },
                {
                    "role": "assistant",
                    "content": "當然，我會盡力回答你的問題，並根據你的問題選擇使用中文或英文回答。請問你有什麼問題需要解答",
                },
                {
                    "role": "human",
                    "content": "根據以下資料:" + "".join(regulations) + "回答以下問題:" + question + "請先用總結你的回答，之後解釋你的回答讓學生容易理解",
                },
            ],
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": 0.6,
                "top_k": 30,
                "top_p": 1,
                "frequence_penalty": 1,
            },
        }

        response = requests.post(self.url, headers=headers, data=json.dumps(data))
        response_data = response.json()
        logging.debug(f"Response: {pformat(response_data)}")
        return response_data.get("generated_text").replace("**", ""), response_data.get("prompt_tokens")

if __name__ == "__main__":
    ...