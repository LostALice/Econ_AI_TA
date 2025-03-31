# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.model.RAG.vector_extractor import (
    AFSEmbeddingConfig,
    OLLAMAEmbeddingConfig,
    EmbeddingDeployModel,
    OPENAIEmbeddingConfig,
)
from Backend.utils.helper.logger import CustomLoggerHandler

from typing import Union
from openai import OpenAI
from ollama import Client
from os import getenv

import numpy as np
import requests  # type: ignore
import json

# development
if getenv("DEBUG") is None:
    from dotenv import load_dotenv

    load_dotenv("./.env")


class VectorHandler(object):
    """API: https://docs.twcc.ai/docs/user-guides/twcc/afs/api-and-parameters/embedding-api"""

    def __init__(self) -> None:
        self.logger = CustomLoggerHandler(__name__).setup_logging()

        _mode = getenv("EMBEDDING_DEPLOY_MODE")
        _vector_dim = getenv("MILVUS_VECTOR_DIM")

        assert (
            _mode is not None
            and _mode != ""
            and _mode in ["local", "openai", "ollama", "afs"]
        ), "EMBEDDING_DEPLOY_MODE environment variable is not set or not valid"
        assert (
            _vector_dim is not None and _vector_dim != "" and int(_vector_dim) >= 8
        ), "MILVUS_VECTOR_DIM environment variable is not set or not valid"

        self.EMBEDDING_DEPLOY_MODE = EmbeddingDeployModel(mode=_mode).mode
        self.vector_dim = int(_vector_dim)

        self.logger.debug(f"Embedding DEPLOY MODE: {self.EMBEDDING_DEPLOY_MODE}")
        self.vector_encoder: Union[
            AfsEmbeddingEncoder,
            OpenaiEmbeddingEncoder,
            OllamaEmbeddingEncoder,
            # LocalResponser,
        ]

        if self.EMBEDDING_DEPLOY_MODE == "ollama":
            self.vector_encoder = OllamaEmbeddingEncoder()

        elif self.EMBEDDING_DEPLOY_MODE == "openai":
            self.vector_encoder = OpenaiEmbeddingEncoder()

        elif self.EMBEDDING_DEPLOY_MODE == "afs":
            self.vector_encoder = AfsEmbeddingEncoder()

        # elif self.EMBEDDING_DEPLOY_MODE == "local":
        #     self.Responser = LocalResponser()

        else:
            self.logger.error(
                f"Invalid EMBEDDING_DEPLOY_MODE: {self.EMBEDDING_DEPLOY_MODE}"
            )
            raise ValueError("Invalid EMBEDDING_DEPLOY_MODE")

        self.vector_encoder.initialization()

    def encoder(self, text: str) -> np.ndarray:
        vector = self.vector_encoder.encode(text)

        return np.pad(
            vector,
            (0, self.vector_dim - len(vector)),
            mode="constant",
            constant_values=0,
        )


class OllamaEmbeddingEncoder(object):
    def __init__(self):
        self.logger = CustomLoggerHandler(__name__).setup_logging()

    def initialization(self) -> None:
        _ollama_host = getenv("OLLAMA_HOST")
        _ollama_port = getenv("OLLAMA_PORT")
        _ollama_embedding_model_name = getenv("OLLAMA_EMBEDDING_MODEL_NAME")

        assert _ollama_host is not None, "Environment variable OLLAMA_HOST not set"
        assert _ollama_port is not None, "Environment variable OLLAMA_PORT not set"
        assert _ollama_embedding_model_name is not None, (
            "Environment variable OLLAMA_MODEL_NAME not set"
        )

        self.ollama_config = OLLAMAEmbeddingConfig(
            ollama_host=_ollama_host,
            ollama_port=int(_ollama_port),
            ollama_embedding_model_name=_ollama_embedding_model_name,
        )

        self.ollama_host = self.ollama_config.ollama_host
        self.ollama_port = self.ollama_config.ollama_port
        self.ollama_embedding_model_name = (
            self.ollama_config.ollama_embedding_model_name
        )
        self.ollama_host_url = f"{self.ollama_host}:{self.ollama_port}"

        try:
            self.ollama_client = Client(host=self.ollama_host_url)
        except Exception as e:
            self.logger.error(f"Failed to initialize OLLAMA client: {e}")

    def encode(self, text: str) -> list[float]:
        """
        Encode the input text into a vector embedding using ollama's API.

        This method sends the input text to ollama's embedding service and returns
        the resulting vector representation.

        Args:
            text (str): The input text to be encoded into a vector embedding.

        Returns:
            list[float]: A list of floats representing the vector embedding of the input text.

        Raises:
            Exception: If there's an error in calling the ollama API or processing the response.
        """
        vector = self.ollama_client.embeddings(
            model=self.ollama_embedding_model_name,
            prompt=text,
        )
        return [i for i in vector.embedding]


class AfsEmbeddingEncoder(object):
    def initialization(self) -> None:
        _api_key = str(getenv("AFS_API_URL"))
        _url = str(getenv("AFS_API_KEY"))
        _embedding_model = str(getenv("AFS_EMBEDDING_MODEL_NAME"))

        assert _api_key is not None and _api_key != "", (
            "API_KEY environment variable is not set"
        )
        assert _url is not None and _url != "", (
            "API_URL environment variable is not set"
        )
        assert _embedding_model is not None and _embedding_model != "", (
            "AFS_EMBEDDING_MODEL_NAME environment variable is not set"
        )

        self.config = AFSEmbeddingConfig(
            url=_url + "/models/conversation",
            api_key=_api_key,
            embedding_model_name=_embedding_model,
        )

        self.url = self.config.url
        self.api_key = self.config.api_key
        self.embedding_model_name = self.config.embedding_model_name

    def encode(self, text: str) -> np.ndarray:
        """
        Encode the input text into a vector embedding using AFS's API.

        This method sends the input text to AFS's embedding service and returns
        the resulting vector representation.

        Args:
            text (str): The input text to be encoded into a vector embedding.

        Returns:
            list[float]: A list of floats representing the vector embedding of the input text.

        Raises:
            Exception: If there's an error in calling the AFS API or processing the response.
        """

        headers = {
            "Content-Type": "application/json",
            "X-API-HOST": "afs-inference",
            "X-API-KEY": self.api_key,
        }

        data = {"model": self.embedding_model_name, "inputs": [text]}

        response = requests.post(self.url, headers=headers, data=json.dumps(data))
        response_data = response.json()
        print(response_data)
        embeddings_vector = response_data["data"][0]["embedding"]
        unpadded_vector = np.asarray(embeddings_vector, dtype=float)

        # return np.pad(
        #     unpadded_vector,
        #     (0, 4096 - len(unpadded_vector)),
        #     mode="constant",
        #     constant_values=0,
        # )

        return unpadded_vector

    # def encoder(self, text: str) -> np.ndarray:
    #     """convert text to ndarray (vector)

    #     Args:
    #         text (str): text to be converted

    #     Returns:
    #         ndarray: numpy array (vector)
    #     """

    #     headers = {
    #         "Content-Type": "application/json",
    #         "X-API-HOST": "afs-inference",
    #         "X-API-KEY": self.api_key,
    #     }

    #     data = {"model": self.embedding_model_name, "inputs": [text]}

    #     response = requests.post(self.url, headers=headers, data=json.dumps(data))
    #     response_data = response.json()
    #     print(response_data)
    #     embeddings_vector = response_data["data"][0]["embedding"]
    #     unpadded_vector = np.asarray(embeddings_vector, dtype=float)

    #     # return np.pad(
    #     #     unpadded_vector,
    #     #     (0, 4096 - len(unpadded_vector)),
    #     #     mode="constant",
    #     #     constant_values=0,
    #     # )

    #     return unpadded_vector


class OpenaiEmbeddingEncoder(object):
    def __init__(self):
        self.logger = CustomLoggerHandler(__name__).setup_logging()

    def initialization(self) -> None:
        _openai_api_key = getenv("OPENAI_API_KEY")
        _openai_embedding_model_name = getenv("OPENAI_EMBEDDING_MODEL_NAME")

        assert _openai_api_key is not None, (
            "Environment variable OPENAI_API_KEY not set"
        )
        assert _openai_embedding_model_name is not None, (
            "Environment variable OPENAI_EMBEDDING_MODEL_NAME not set"
        )

        self.openai_config = OPENAIEmbeddingConfig(
            openai_api_key=_openai_api_key,
            openai_embedding_model_name=_openai_embedding_model_name,
        )

        self.openai_api_key = self.openai_config.openai_api_key
        self.openai_embedding_model_name = (
            self.openai_config.openai_embedding_model_name
        )

        try:
            self.openai_client = OpenAI()
        except Exception as e:
            self.logger.error(f"Failed to initialize OLLAMA client: {e}")

    def encode(self, text: str) -> list[float]:
        """
        Encode the input text into a vector embedding using OpenAI's API.

        This method sends the input text to OpenAI's embedding service and returns
        the resulting vector representation.

        Args:
            text (str): The input text to be encoded into a vector embedding.

        Returns:
            list[float]: A list of floats representing the vector embedding of the input text.

        Raises:
            Exception: If there's an error in calling the OpenAI API or processing the response.
        """
        response = self.openai_client.embeddings.create(
            model=self.openai_embedding_model_name,
            input=text,
        )
        return response.data[0].embedding
