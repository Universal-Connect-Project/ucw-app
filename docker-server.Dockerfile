# NOTE: This Dockerfile is not meant to be run alone, but can be for development purposes.
# See the DOCKER.md file in the root of the project for more information.
# Please run `docker compose up` from the root of the project to run the docker environment for
# the UCW-APP project, which this Dockerfile is part of.
ARG WRKDR=/opt/app

FROM alpine:3.20.3 AS base
ENV NODE_VERSION 20.15.0

RUN apk --update --no-cache --virtual add nodejs npm bash \
    && rm -rf /var/cache/apk/*

FROM base AS server-pruner
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}
COPY . ${WRKDR}

RUN npm i -g turbo \
    && turbo prune --scope=${APP} --docker

FROM base AS adapter-pruner
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}
COPY . ${WRKDR}

RUN npm i -g turbo \
    && turbo prune --scope=@ucp-npm/mx-adapter --docker

FROM base AS server-builder
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}

COPY --from=server-pruner ${WRKDR}/out/json/apps/${APP}/package.json .
COPY --from=server-pruner ${WRKDR}/out/json/packages/utils/package.json ./packages/utils/package.json
COPY --from=server-pruner ${WRKDR}/out/json/packages/mx-adapter/package.json ./packages/mx-adapter/package.json
COPY --from=server-pruner ${WRKDR}/out/package-lock.json .

RUN npm ci --omit=dev --ignore-scripts

FROM base AS adapter-builder
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}

COPY --from=adapter-pruner ${WRKDR}/out/json/packages/mx-adapter/package.json .
COPY --from=adapter-pruner ${WRKDR}/out/package-lock.json .

RUN npm i -g turbo typescript \
    && npm ci --omit=dev --ignore-scripts

COPY --from=adapter-pruner ${WRKDR}/out/full/ .
RUN turbo build --filter=./packages/mx-adapter

FROM base AS runner
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}

RUN npm i -g ts-node  \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodejs
USER nodejs

COPY --from=server-pruner --chown=nodejs:nodejs ${WRKDR}/out/full/apps/${APP}/ .
COPY --from=server-pruner --chown=nodejs:nodejs ${WRKDR}/out/full/packages/utils/ ./packages/utils
COPY --from=server-builder --chown=nodejs:nodejs ${WRKDR}/node_modules/ ./node_modules

COPY --from=adapter-builder --chown=nodejs:nodejs ${WRKDR}/packages/mx-adapter/dist ./packages/mx-adapter/dist
COPY --from=adapter-builder --chown=nodejs:nodejs ${WRKDR}/packages/mx-adapter/package.json ./packages/mx-adapter/package.json

EXPOSE ${PORT}

CMD ["ts-node", "./src/server.js"]
