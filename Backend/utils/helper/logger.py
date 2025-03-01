# Code by AkinoAlice@TyrantRey

from logging.handlers import RotatingFileHandler

from sys import stdout
import logging
import os


class CustomLoggerHandler:
    def __init__(self, name) -> None:
        self.name = name

    def setup_logging(self) -> logging.Logger:
        """Setup logging for the given module.

        Args:
            name (str, optional): module name calling this function. Defaults to __name__.

        Returns:
            logging.Logger: logger object
        """
        logger = logging.getLogger(self.name)

        log_format = "%(asctime)s, %(levelname)s [%(filename)s:%(lineno)d] %(message)s"
        logging.basicConfig(
            filename="./Event.log",
            filemode="w+",
            format=log_format,
            level=logging.NOTSET,
            encoding="utf-8",
        )
        file_handler = RotatingFileHandler(
            "./Event.log",
            mode="a",
            maxBytes=5 * 1024 * 1024,
            backupCount=1,
            encoding="utf-8",
            delay=False,
        )
        stream_handler = logging.StreamHandler(stdout)

        logger.addHandler(stream_handler)
        logger.addHandler(file_handler)

        return logger


if __name__ == "__main__":
    logger = CustomLoggerHandler(__name__).setup_logging()
    logging.getLogger("multipart").propagate = False
    logger.debug("debug")
    logger.info("info")
    logger.warning("warning")
    logger.critical("critical")
