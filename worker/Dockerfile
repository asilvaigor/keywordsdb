FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Setup user, give correct permissions
WORKDIR /app
ENV HOME=/app
ENV PATH="${PATH}:/app/.local/bin"
RUN chown -R nobody /app
ENV PYTHONPATH="/app"

RUN uv venv

ENV VIRTUAL_ENV=/app/.venv
ENV PATH=/app/.venv/bin:$PATH

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --compile-bytecode --no-cache --no-install-project

COPY keywordsdb keywordsdb

RUN python -m compileall keywordsdb

EXPOSE 8080
USER nobody
