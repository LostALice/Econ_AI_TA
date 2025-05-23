# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.database.database import mysql_client
from Backend.utils.helper.model.api.v1.management import UserModel, ClassModel


class ManagementDatabaseController:
    def __init__(self) -> None:
        self.database = mysql_client
        self.logger = CustomLoggerHandler().get_logger()

    def query_teacher_list(self) -> list[UserModel]:
        self.database.cursor.execute("""
            SELECT
                u.user_id,
                u.username,
                r.role_name
            FROM
                `user` AS u
                JOIN `role` AS r ON u.role_id = r.role_id
            WHERE
                r.role_name IN ('Teacher', 'TA');""")

        self.database.sql_query_logger()
        data = self.database.cursor.fetchall()

        self.logger.debug(data)

        return [
            UserModel(
                user_id=user["user_id"],
                username=user["username"],
                role_name=user["role_name"],
            )
            for user in data
        ]

    def query_user_list(self) -> list[UserModel]:
        self.database.cursor.execute("""
            SELECT
                u.user_id,
                u.username,
                r.role_name
            FROM
                `user` AS u
            JOIN `role` AS r ON u.role_id = r.role_id;""")

        self.database.sql_query_logger()
        data = self.database.cursor.fetchall()

        self.logger.debug(data)

        return [
            UserModel(
                user_id=user["user_id"],
                username=user["username"],
                role_name=user["role_name"],
            )
            for user in data
        ]

    def get_class_list(self) -> list[ClassModel]:
        self.database.cursor.execute("""
            SELECT
                class_id,
                classname
            FROM
                class;""")
        self.database.sql_query_logger()
        data = self.database.cursor.fetchall()

        self.logger.debug(data)

        return [
            ClassModel(
                class_id=class_["class_id"],
                classname=class_["classname"],
            )
            for class_ in data
        ]

    def create_class(self, classname: str) -> int:
        self.database.cursor.execute(
            """
            INSERT INTO class (classname)
            VALUES (%s);
            """,
            (classname,),
        )
        self.database.sql_query_logger()
        self.database.commit()

        class_id = self.database.cursor.lastrowid
        self.logger.debug(class_id)
        
        return class_id