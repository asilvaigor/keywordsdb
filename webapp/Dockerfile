FROM node:22.12-slim

# Setup user, give correct permissions
WORKDIR /app
ENV HOME /app
ENV PATH /app/node_modules/.bin:$PATH
RUN chown -R nobody /app
ENV NEXT_PUBLIC_ENV $ENV

# Install dependencies
COPY package.json bun.lock ./
RUN npm install --no-save bun@latest
RUN bun install --frozen-lockfile

# Build
COPY app app
COPY components components
COPY lib lib
COPY next.config.ts components.json tsconfig.json postcss.config.mjs ./
RUN bun run build

# Serve
CMD bun run start
