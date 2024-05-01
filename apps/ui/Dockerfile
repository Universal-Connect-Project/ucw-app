# TODO: This comment might need to change, depending on how compose will work with turborepo
# NOTE: This Dockerfile is not meant to be run alone.
# Please run `docker compose up` from the root of the project to run the docker environment for
# the UCW-APP project, which this Dockerfile is part of.
FROM node:20 as base

FROM base as builder
ENV NODE_VERSION 20.12.2
WORKDIR /app
RUN npm i -g turbo
COPY package.json package-lock.json /app/
RUN npm ci
COPY ./ ./
RUN npm run build

FROM base as web
ENV NODE_VERSION 20.12.2
RUN apk --update --no-cache add nodejs npm
WORKDIR /app

COPY package.json package-lock.json vite.config.ts /app/
RUN npm ci --omit=dev &&  \
    npm i -g serve@14.2.1
COPY --from=builder /app/dist /app/dist

EXPOSE ${RESOURCE_PORT}

CMD ["sh", "-c", "serve -p ${RESOURCE_PORT} /app/dist"]
