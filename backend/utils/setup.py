# Code by AkinoAlice@TyrantRey

from pymilvus import MilvusClient
from pymilvus import DataType

from typing import Literal, Dict
from os import getenv

import mysql.connector as connector
from pprint import pformat
import logging


class SetupMYSQL(object):
    def __init__(self) -> None:
        self.HOST = getenv("MYSQL_HOST")
        self.USER = getenv("MYSQL_USER_NAME")
        self.PASSWORD = getenv("MYSQL_PASSWORD")
        self.DATABASE = getenv("MYSQL_DATABASE")

        self.connection = connector.connect(
            host=getenv("MYSQL_HOST"),
            user=getenv("MYSQL_USER_NAME"),
            password=getenv("MYSQL_PASSWORD"),
            port=getenv("MYSQL_PORT"),
        )
        self.cursor = self.connection.cursor(
            dictionary=True, prepared=True)

        try:
            self.connection.database = getenv("MYSQL_DATABASE")
            if getenv("MYSQL_DEBUG") == "True":
                logging.warning("Dropping database")
                self.cursor.execute(f"DROP DATABASE {self.DATABASE}")
                self.commit()
                self.create_database()
        except connector.Error as error:
            logging.error(error)
            logging.debug(pformat(f"Creating MYSQL database {self.DATABASE}"))
            self.create_database()
        finally:
            logging.debug(pformat(f"Using MYSQL database {self.DATABASE}"))
            self.connection.database = getenv("MYSQL_DATABASE")
            self.cursor = self.connection.cursor(
                dictionary=True, prepared=True)

    def create_database(self) -> None:
        self.cursor.execute(f"CREATE DATABASE {self.DATABASE};")
        self.connection.connect(database=self.DATABASE)
        self.connection.commit()

        # ROLE table
        self.cursor.execute(
            """
            CREATE TABLE `FCU_LLM`.`role` (
                `role_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `role_name` VARCHAR(45) NOT NULL,
                PRIMARY KEY (`role_id`),
                UNIQUE INDEX `role_id` (`role_id` ASC)
            );

            """
        )
        self.connection.commit()

        # USER table
        self.cursor.execute(
            """
            CREATE TABLE `FCU_LLM`.`user` (
                `user_id` INT NOT NULL AUTO_INCREMENT,
                `username` VARCHAR(45) NOT NULL,
                `role_id` INT UNSIGNED NOT NULL,
                PRIMARY KEY (`user_id`),
                FOREIGN KEY (`role_id`) REFERENCES `role`(`role_id`)
            );
            """
        )
        self.connection.commit()

        # LOGIN table
        self.cursor.execute(
            """
            CREATE TABLE `FCU_LLM`.`login` (
                `user_id` INT NOT NULL,
                `password` VARCHAR(64) NOT NULL,
                `jwt` VARCHAR(255) NOT NULL DEFAULT "",
                `last_login` TIMESTAMP NOT NULL DEFAULT NOW(),
                PRIMARY KEY (`user_id`),
                FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`)
            );
            """
        )
        self.connection.commit()

        # CHAT table
        self.cursor.execute(
            """
            CREATE TABLE `FCU_LLM`.`chat` (
                `chat_id` VARCHAR(45) NOT NULL,
                `user_id` INT NOT NULL,
                `chat_name` VARCHAR(45) NOT NULL,
                PRIMARY KEY (`chat_id`),
                UNIQUE INDEX `chat_id` (`chat_id` ASC),
                FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`)
            );
            """
        )

        # FILE table
        self.cursor.execute(
            """
            CREATE TABLE `FCU_LLM`.`file` (
                `file_id` VARCHAR(45) NOT NULL,
                `collection` VARCHAR(45) NOT NULL DEFAULT "default",
                `file_name` VARCHAR(255) NOT NULL,
                `last_update` TIMESTAMP NOT NULL DEFAULT NOW(),
                `expired` TINYINT NOT NULL DEFAULT "0",
                `tags` JSON NOT NULL DEFAULT (JSON_OBJECT()),
                PRIMARY KEY (`file_id`, `collection`),
                UNIQUE INDEX `file_id` (`file_id` ASC)
            );
            """
        )

        # QA table
        self.cursor.execute(
            """
            CREATE TABLE `FCU_LLM`.`qa` (
                `chat_id` VARCHAR(45) NOT NULL,
                `qa_id` VARCHAR(45) NOT NULL,
                `question` LONGTEXT NOT NULL,
                `answer` LONGTEXT NOT NULL,
                `token_size` INT NOT NULL DEFAULT 0,
                `rating`TINYINT DEFAULT NULL,
                `sent_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `sent_by` VARCHAR(45) NOT NULL,
                PRIMARY KEY (`chat_id`, `qa_id`),
                UNIQUE INDEX `qa_id` (`qa_id`),
                FOREIGN KEY (`chat_id`) REFERENCES `chat`(`chat_id`)
            );
            """
        )

        # ATTACHMENT table
        self.cursor.execute(
            """
            CREATE TABLE `FCU_LLM`.`attachment` (
                `chat_id` VARCHAR(45) NOT NULL,
                `qa_id` VARCHAR(45) NOT NULL,
                `file_id` VARCHAR(45) NOT NULL,
                PRIMARY KEY (`qa_id`, `file_id`),
                FOREIGN KEY (`chat_id`) REFERENCES `chat`(`chat_id`),
                FOREIGN KEY (`file_id`) REFERENCES `file`(`file_id`),
                FOREIGN KEY (`qa_id`) REFERENCES `qa`(`qa_id`)
            );
            """
        )

        self.connection.commit()

        # Admin account
        admin_username = getenv("ROOT_USERNAME") if getenv("ROOT_USERNAME") else "admin"
        admin_password = getenv("ROOT_PASSWORD") if getenv("ROOT_PASSWORD") else b"ADMIN-"

        import hashlib
        hashed_admin_password = hashlib.sha3_256(admin_password.encode("utf-8")).hexdigest()
        logging.info(f"Root username: {admin_username}")
        logging.info(f"Root password: {hashed_admin_password}")

        self.cursor.execute(
            """
            INSERT INTO `role` (`role_name`) VALUES ("Admin");
            """
        )
        self.cursor.execute(
            """
            INSERT INTO `user` (`username`, `role_id`) VALUES (%s, 1);
            """, (admin_username,)
        )
        self.cursor.execute(
            """
            INSERT INTO `login` (user_id, password) VALUES (1, %s);
            """, (hashed_admin_password,)
        )
        self.connection.commit()

        # Anonymous
        self.cursor.execute(
            """
            INSERT INTO `role` (`role_name`) VALUES ("Anonymous");
            """
        )
        self.cursor.execute(
            """
            INSERT INTO `user` (`username`, `role_id`) VALUES (%s, 2);
            """, ("Anonymous",)
        )
        self.connection.commit()

        logging.debug(pformat(f"Created MYSQL database {self.DATABASE}"))


class SetupMilvus(object):
    def __init__(self) -> None:
        self.HOST = getenv("MILVUS_HOST")
        self.PORT = getenv("MILVUS_PORT")
        self.default_collection_name = getenv("MILVUS_DEFAULT_COLLECTION_NAME")

        self.milvus_client = MilvusClient(
            uri=f"http://{self.HOST}:{self.PORT}"
        )

        try:
            if getenv("MILVUS_DEBUG") == "True":
                logging.warning("Dropping collection")
                self.milvus_client.drop_collection(
                    collection_name=self.default_collection_name
                )
        finally:
            loading_status = self.milvus_client.get_load_state(
                collection_name=self.default_collection_name
            )

        logging.debug(pformat(f"""Milvus loading collection `{
                      self.default_collection_name}`: {loading_status["state"]}"""))

        if not loading_status or loading_status["state"] == loading_status["state"].NotExist:
            logging.error("Milvus collection not loaded")
            logging.debug(pformat("Creating Milvus database"))
            self.create_collection(
                collection_name=self.default_collection_name)

    def create_collection(
        self,
        collection_name: str,
        index_type: Literal["FLAT", "IVF_FLAT", "IVF_SQ8", "IVF_PQ", "HNSW",
                                    "ANNOY", "RHNSW_FLAT", "RHNSW_PQ", "RHNSW_SQ"] = "IVF_FLAT",
        metric_type: Literal["L2", "IP"] = "L2"
    ) -> Dict:

        schema = MilvusClient.create_schema(
            auto_id=True,
            enable_dynamic_field=False,
        )

        schema.add_field(field_name="id", datatype=DataType.VARCHAR,
                         max_length=512, is_primary=True)
        # file_id
        schema.add_field(field_name="source",
                         datatype=DataType.VARCHAR, max_length=1024)
        schema.add_field(field_name="file_uuid",
                         datatype=DataType.VARCHAR, max_length=36)
        schema.add_field(field_name="content", datatype=DataType.VARCHAR,
                         max_length=4096)
        schema.add_field(field_name="vector",
                         datatype=DataType.FLOAT_VECTOR, dim=getenv("MILVUS_VECTOR_DIM"))

        index_params = self.milvus_client.prepare_index_params()

        index_params.add_index(
            field_name="vector",
            index_type=index_type,
            metric_type=metric_type,
            params={
                "nlist": 128
            }
        )

        self.milvus_client.create_collection(
            collection_name=collection_name,
            index_params=index_params,
            metric_type=metric_type,
            schema=schema,
        )

        collection_status = self.milvus_client.get_load_state(
            collection_name=collection_name
        )

        logging.debug(pformat(f"Creating collection: {collection_name}"))
        return collection_status
