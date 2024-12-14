# Code by AkinoAlice@TyrantRey

import numpy as np
import requests
import json
import os

# development
from dotenv import load_dotenv

load_dotenv("./.env")


class VectorHandler(object):
    """API: https://docs.twcc.ai/docs/user-guides/twcc/afs/api-and-parameters/embedding-api"""

    def __init__(self) -> None:
        self.api_key = os.getenv("API_KEY")
        self.url = os.getenv("API_URL")

        assert self.api_key is not None, "API_KEY environment variable is not set"
        assert self.url is not None, "API_URL environment variable is not set"

        self.url = str(self.url) + "/models/embeddings"

    def encoder(self, text: str) -> np.ndarray:
        """convert text to ndarray (vector)

        Args:
            text (str): text to be converted

        Returns:
            ndarray: numpy array (vector)
        """

        headers = {
            "Content-Type": "application/json",
            "X-API-HOST": "afs-inference",
            "X-API-KEY": self.api_key,
        }

        data = {"model": "ffm-embedding", "inputs": [text]}

        response = requests.post(self.url, headers=headers, data=json.dumps(data))
        response_data = response.json()
        print(response_data)
        embeddings_vector = response_data["data"][0]["embedding"]
        unpadded_vector = np.asarray(embeddings_vector, dtype=float)

        return np.pad(
            unpadded_vector,
            (0, 4096 - len(unpadded_vector)),
            mode="constant",
            constant_values=0,
        )
