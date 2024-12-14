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
    def __init__(self, message):
        super().__init__(message)

    def __str__(self):
        return f"{self.message}"


class FormatError(FileError):
    def __init__(self, received_file_format: str, accepted_file_format: list[str] | str):
        self.accepted_file_format = accepted_file_format
        self.received_file_format = received_file_format

    def __str__(self):
        return f"Unaccepted file format: {self.received_file_format} Prefer: {self.accepted_file_format}"

class UnsupportedFileFormat(FileError):
    def __init__(self, file_format: str):
        self.unsupported_file_format = file_format

    def __str__(self):
        return f"Unsupported file format {self.unsupported_file_format}"

class NotFoundError(FileError):
    ...


# RAG
class RAGError(Exception):
    ...


class MaximumTokenSizeError(RAGError):
    ...


class ChatNotEqualError(RAGError):
    ...


if __name__ == "__main__":
    raise FormatError("str", "txt")
