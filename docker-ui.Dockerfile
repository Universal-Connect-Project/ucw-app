# NOTE: This Dockerfile is not meant to be run alone, but can be for development purposes.
# See the DOCKER.md file in the root of the project for more information.
# Please run `docker compose up` from the root of the project to run the docker environment for
# the UCW-APP project, which this Dockerfile is part of.
ARG WRKDR=/opt/app

FROM alpine:3.19.1 as base
ENV NODE_VERSION 20.12.2

RUN apk --update --no-cache --virtual add nodejs npm \
    && rm -rf /var/cache/apk/*

FROM base as pruner
RUN npm i -g turbo
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}

COPY . ${WRKDR}
RUN turbo prune --scope=${APP} --docker

FROM base as builder
RUN npm i -g turbo
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}

COPY --from=pruner ${WRKDR}/out/json/apps/${APP}/package.json .
COPY --from=pruner ${WRKDR}/out/package-lock.json .

RUN npm ci --omit=dev

COPY --from=pruner ${WRKDR}/out/full/ .
RUN turbo run build --filter=${APP}

FROM base as runner
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}

COPY --from=builder ${WRKDR}/apps/${APP}/vite.config.ts .
COPY --from=builder ${WRKDR}/apps/${APP}/dist .
COPY --from=builder ${WRKDR}/package.json .
RUN npm i -g serve@14.2.3

EXPOSE ${UI_PORT}

CMD ["sh", "-c", "serve -n -p ${UI_PORT} ."]
