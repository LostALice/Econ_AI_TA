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

    def query_class_user_list(self, class_id: int) -> list[UserModel]:
        self.database.cursor.execute(
            """
            SELECT
                cu.user_id,
                u.username,
                r.role_name
            FROM
                class_user AS cu
            JOIN 
                `role` AS r ON cu.role_id = r.role_id
            JOIN 
                `user` AS u ON u.user_id = cu.user_id
            WHERE
                cu.class_id = %s;""",
            (class_id,),
        )

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
                class
            WHERE
                enabled = 1;""")
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

    def get_class_by_user_id(self, user_id: int) -> list[ClassModel]:
        self.database.cursor.execute(
            """
            SELECT
                c.class_id,
                c.classname
            FROM
                class_user AS cu
            JOIN 
                class AS c ON c.class_id = cu.class_id
            WHERE
                user_id = %s
            GROUP BY
                c.class_id;""",
            (user_id,),
        )
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

    def new_class(self, classname: str) -> int:
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

    def delete_class(self, class_id: int) -> int:
        self.database.cursor.execute(
            """
            UPDATE class
            SET enable = 0
            WHERE class_id=%s;
            """,
            (class_id,),
        )

        self.database.sql_query_logger()
        self.database.commit()

        deleted_class_id = self.database.cursor.lastrowid
        self.logger.debug(deleted_class_id)

        return deleted_class_id

    def new_user(self, class_id: int, user_id: int, role_id: int) -> int:
        self.database.cursor.execute(
            """
            INSERT INTO class_user (class_id, user_id, role_id)
            VALUES (%s, %s, %s)
            """,
            (class_id, user_id, role_id),
        )

        self.database.sql_query_logger()
        self.database.commit()

        added_user_id = self.database.cursor.lastrowid
        self.logger.debug(added_user_id)

        return added_user_id

    def delete_user(self, class_id, user_id: int) -> int:
        self.database.cursor.execute(
            """
            DELETE FROM class_user 
            WHERE class_id=%s AND user_id=%s 
            """,
            (class_id, user_id),
        )

        self.database.sql_query_logger()
        self.database.commit()

        deleted_user_id = self.database.cursor.lastrowid
        self.logger.debug(deleted_user_id)

        return deleted_user_id
