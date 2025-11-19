import os
import sys
import warnings
from typing import Literal, TextIO, cast

import structlog
from structlog.typing import EventDict, WrappedLogger

DEFAULT_EXCEPTION_TYPE = "Exception"

_logger_instance: structlog.stdlib.BoundLogger | None = None


def _override_pywarnings(logger: structlog.stdlib.BoundLogger) -> None:
    def showwarning(
        message: Warning | str,
        category: type[Warning],
        filename: str,
        lineno: int,
        file: TextIO | None = None,
        line: str | None = None,
    ) -> None:
        message = warnings.formatwarning(message, category, filename, lineno, line)
        logger.warning(message)

    warnings.showwarning = showwarning


def _override_stderr(logger: structlog.stdlib.BoundLogger) -> None:
    class StderrRedirector:
        def __init__(self) -> None:
            self.buf = ""

        def write(self, msg: str) -> None:
            self.buf += msg

        def flush(self) -> None:
            if self.buf:
                exc_type = self.__get_exception_type(self.buf)
                # Check if message is about Google Ads quota
                if "Resource has been exhausted" not in self.buf or "googleads.googleapis.com" not in self.buf:
                    logger.error(event=exc_type, exception=self.buf)
                self.buf = ""

        def __get_exception_type(self, traceback_string: str) -> str:
            """Parses a traceback string to get the exception type. Based on
            https://github.com/mahmoud/boltons/blob/master/boltons/tbutils.py#L749

            Args:
                traceback_string: string representation of a stack trace.
            """

            try:
                lines = traceback_string.split("\n")
                for i in range(len(lines) - 2, 0, -1):
                    if lines[i][0] in (" ", "\t"):
                        break
                last_line = lines[i + 1]
                exc_type = last_line.split(":")[0]
                return exc_type if exc_type else DEFAULT_EXCEPTION_TYPE
            except Exception:
                return DEFAULT_EXCEPTION_TYPE

    sys.stderr = StderrRedirector()


def configure_logger(
    mode: Literal["json", "console"] | None = None, level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
) -> None:
    """Configure the global logger. Should be called once at application startup.

    Args:
        mode: Logging mode. If None, uses LOG_MODE environment variable or defaults to "json".
        level: Log level.
    """
    global _logger_instance

    if _logger_instance is not None:
        return

    mode = mode if mode else cast(Literal["console", "json"], os.getenv("LOG_MODE", "json"))

    def to_gcp_convention(_: WrappedLogger, __: str, event_dict: EventDict) -> EventDict:
        event_dict["severity"] = event_dict.pop("level")
        event_dict["time"] = event_dict.pop("timestamp")
        if "event" in event_dict:
            event_dict["message"] = event_dict.pop("event")
        if "exception" in event_dict:
            exc_list: list[str] = event_dict.pop("exception").split("\n")
            event_dict["serviceContext"] = ({"service": "worker", "version": "1.0", "resource_type": "gce_instance"},)
            if "message" not in event_dict:
                event_dict["message"] = exc_list[-1]

            # Parse code location
            try:
                location = [line for line in exc_list if "/worker" in line][-1].split(",")
                event_dict["logging.googleapis.com/sourceLocation"] = dict(
                    file=location[0].split()[-1][1:-1], line=location[1].split()[-1], function=location[2].split()[-1]
                )
            except Exception:
                pass

            # Cleaning stack trace: very hacky, but gcloud groups all exceptions in the
            # same group without this
            # for i, line in enumerate(exc_list):
            #     if "/worker" in line and "dispatch" not in line:
            #         break
            # if i < len(exc_list):
            #     exc = "Traceback (most recent call last):\n" + "\n".join(exc_list[i:])
            # else:
            #     exc = "\n".join(exc_list)
            exc = "\n".join(exc_list)

            event_dict["stack_trace"] = exc
        return event_dict

    common_processors: list[structlog.typing.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.format_exc_info,
    ]
    renderers: list[structlog.typing.Processor]
    if mode == "json":
        renderers = [to_gcp_convention, structlog.processors.JSONRenderer()]
    else:
        renderers = [structlog.dev.ConsoleRenderer()]

    structlog.configure(
        processors=common_processors + renderers,
        cache_logger_on_first_use=True,
        wrapper_class=structlog.make_filtering_bound_logger(level),
    )

    _logger_instance = structlog.get_logger()

    if mode == "json":
        sys.stdout.reconfigure(line_buffering=True)  # type: ignore[union-attr]
        sys.stderr.reconfigure(line_buffering=True)  # type: ignore[union-attr]
        _override_pywarnings(_logger_instance)
        _override_stderr(_logger_instance)


def get_logger() -> structlog.stdlib.BoundLogger:
    """Get the configured logger instance.

    Returns:
        The configured logger instance.
    """
    global _logger_instance

    if _logger_instance is None:
        configure_logger()

    return _logger_instance  # type: ignore[return-value]
