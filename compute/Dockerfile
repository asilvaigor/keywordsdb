FROM python:3.14-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Need this for fastembed to work
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc-multilib \
    && rm -rf /var/lib/apt/lists/*

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
RUN uv sync --frozen --no-dev --no-cache --no-install-project

COPY src src

EXPOSE 8080
USER nobody
