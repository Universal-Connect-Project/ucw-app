# NOTE: This Dockerfile is not meant to be run alone, but can be for development purposes.
# See the DOCKER.md file in the root of the project for more information.
# Please run `docker compose up` from the root of the project to run the docker environment for
# the UCW-APP project, which this Dockerfile is part of.
ARG WRKDR=/opt/app

FROM alpine:3.20.3 as base
ENV NODE_VERSION 20.15.0

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
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}

COPY --from=pruner ${WRKDR}/out/json/apps/${APP}/package.json .
COPY --from=pruner ${WRKDR}/out/package-lock.json .

# Using npm i here until we move to new version of the MX Connect Widget...
RUN npm i -g turbo  \
    && npm i --omit=dev

COPY --from=pruner ${WRKDR}/out/full/ .
RUN turbo run build --filter=${APP}

FROM base as runner
ARG APP
ARG WRKDR

WORKDIR ${WRKDR}

RUN npm i -g serve@14.2.3  \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodejs
USER nodejs

COPY --from=builder --chown=nodejs:nodejs ${WRKDR}/apps/${APP}/vite.config.ts .
COPY --from=builder --chown=nodejs:nodejs ${WRKDR}/apps/${APP}/dist .
COPY --from=builder --chown=nodejs:nodejs ${WRKDR}/package.json .

EXPOSE ${UI_PORT}

CMD ["sh", "-c", "serve -n -p ${UI_PORT} ."]
