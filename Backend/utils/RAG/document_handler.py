# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.error import FormatError, UnsupportedFileFormat

from unstructured.partition.pptx import partition_pptx
from unstructured.partition.docx import partition_docx
from unstructured.partition.ppt import partition_ppt
from unstructured.partition.doc import partition_doc
from unstructured.partition.pdf import partition_pdf

from typing import Optional, Literal


class DocumentSplitter(object):
    def __init__(self) -> None: ...

    def document_splitter(
        self,
        document_path: str,
        file_type: Literal["pptx", "docx", "ppt", "doc", "pdf"],
    ) -> list[str]:
        """
        Split a document into a list of content strings.

        This method takes a document path and its file type, verifies the file extension,
        extracts the content using the appropriate partition function, and then processes
        the extracted content into a list of strings.

        Args:
            document_path (str): The path to the document file.
            file_type (Literal["pptx", "docx", "ppt", "doc", "pdf"]): The type of the document file.

        Returns:
            list[str]: A list of strings, each representing a portion of the document's content.

        Raises:
            FormatError: If the document's extension doesn't match the specified file_type.
            UnsupportedFileFormat: If the specified file_type is not supported.

        Note:
            The method removes all newlines and spaces from the extracted content and
            splits it into sentences using the '。' character as a delimiter.
        """

        document_extension = document_path.split(".")[-1]

        assert document_extension == file_type, FormatError(
            document_extension, file_type
        )

        if file_type == "pdf":
            extracted_page = partition_pdf(document_path)

        elif file_type == "pptx":
            extracted_page = partition_pptx(document_path)

        elif file_type == "ppt":
            extracted_page = partition_ppt(document_path)

        elif file_type == "docx":
            extracted_page = partition_docx(document_path)

        elif file_type == "doc":
            extracted_page = partition_doc(document_path)

        else:
            # TO BE COMPLETED: Implement other file types (e.g., txt, jpg, png) splitters here.
            raise UnsupportedFileFormat(file_type)

        extracted_page = list(filter(lambda x: str(x) != "", extracted_page))
        splitted_page_content = "".join(
            [
                str(page_content).replace("\n", "").replace(" ", "")
                for page_content in extracted_page
            ]
        ).split("。")

        return splitted_page_content
