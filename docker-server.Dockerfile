# NOTE: This Dockerfile is not meant to be run alone, but can be for development purposes.
# See the DOCKER.md file in the root of the project for more information.
# Please run `docker compose up` from the root of the project to run the docker environment for
# the UCW-APP project, which this Dockerfile is part of.
ARG WRKDR=/opt/app

FROM alpine:3.20.3 AS base
ENV NODE_VERSION 20.15.0

RUN apk --update --no-cache --virtual add nodejs npm \
    && rm -rf /var/cache/apk/*

FROM base AS pruner
RUN npm i -g turbo
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}

COPY . ${WRKDR}
RUN turbo prune --scope=${APP} --docker

FROM base AS builder
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}

COPY --from=pruner ${WRKDR}/out/json/apps/${APP}/package.json .
COPY --from=pruner ${WRKDR}/out/json/packages/utils/package.json ./packages/utils
COPY --from=pruner ${WRKDR}/out/package-lock.json .

RUN npm pkg delete scripts.prepare  \
    && npm ci --omit=dev

FROM base AS runner
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}

RUN npm i -g ts-node  \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodejs
USER nodejs

COPY --from=pruner --chown=nodejs:nodejs ${WRKDR}/out/full/apps/${APP}/ .
COPY --from=pruner --chown=nodejs:nodejs ${WRKDR}/out/full/packages/utils/ ./packages/utils
COPY --from=builder --chown=nodejs:nodejs ${WRKDR}/node_modules/ ./node_modules

EXPOSE ${PORT}

CMD ["ts-node", "./src/server.js"]
