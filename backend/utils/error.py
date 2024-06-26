# Code by AkinoAlice@TyrantRey


# other stuff
class MissingArgumentError(Exception):
    ...


# Milvus
class MilvusError(Exception):
    ...


class MilvusConnectionError(MilvusError):
    ...


# MySQL
class MySQLError(Exception):
    ...


class MySQLConnectionError(MySQLError):
    ...


# File
class FileError(Exception):
    ...


class FormatError(FileError):
    ...


class NotFoundError(FileError):
    ...


# RAG
class RAGError(Exception):
    ...


class MaximumTokenSizeError(RAGError):
    ...


class ChatNotEqualError(RAGError):
    ...
