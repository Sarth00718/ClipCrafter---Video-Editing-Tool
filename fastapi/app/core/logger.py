"""
Structured logging setup for the application.
Provides a pre-configured logger with console output and optional file rotation.
"""

import logging
import sys
from app.core.config import settings


def get_logger(name: str = "rag_scripter") -> logging.Logger:
    """Return a configured logger instance.

    Args:
        name: Logger name (typically module __name__).

    Returns:
        A logging.Logger with stream handler and proper formatting.
    """
    logger = logging.getLogger(name)

    if not logger.handlers:
        logger.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))

        fmt = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        console = logging.StreamHandler(sys.stdout)
        console.setFormatter(fmt)
        logger.addHandler(console)

        # Prevent duplicate logs when imported from multiple modules
        logger.propagate = False

    return logger
