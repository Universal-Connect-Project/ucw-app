# TODO: This comment might need to change, depending on how compose will work with turborepo
# NOTE: This Dockerfile is not meant to be run alone.
# Please run `docker compose up` from the root of the project to run the docker environment for
# the UCW-APP project, which this Dockerfile is part of.
ARG WRKDR=/opt/app

FROM alpine:3.19.1 as base
ENV NODE_VERSION 20.12.2

RUN apk --update --no-cache --virtual add nodejs npm \
    && rm -rf /var/cache/apk/*

# OLD
#RUN apk --update --no-cache --virtual add nodejs npm \
#    && rm -rf /var/cache/apk/* \
#    && npm i -g turbo ts-node

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

FROM base as runner
RUN npm i -g ts-node
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
USER nodejs

COPY --from=pruner --chown=nodejs:nodejs ${WRKDR}/out/full/apps/${APP}/ .
COPY --from=builder --chown=nodejs:nodejs ${WRKDR}/node_modules/ ./node_modules

ENV Env prod

EXPOSE ${PORT}

CMD ["ts-node", "./src/server.js"]
