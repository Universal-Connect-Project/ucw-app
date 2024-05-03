# TODO: This comment might need to change, depending on how compose will work with turborepo
# NOTE: This Dockerfile is not meant to be run alone.
# Please run `docker compose up` from the root of the project to run the docker environment for
# the UCW-APP project, which this Dockerfile is part of.
FROM alpine:3.19.1 as base
ENV NODE_VERSION 20.12.2

RUN apk --update --no-cache --virtual add nodejs npm \
    && rm -rf /var/cache/apk/*

FROM base as pruner
RUN npm i -g turbo
ARG APP

WORKDIR /opt/app

COPY / /opt/app
#RUN turbo prune --scope=${APP} --docker
#
#FROM base as builder
#RUN npm i -g turbo
#ARG APP
#
#WORKDIR ${WRKDIR}
#
#COPY --from=pruner /opt/app/out/full/ /opt/app
#COPY --from=pruner /opt/app/out/package-lock.json /opt/app
#RUN npm ci --omit=dev

#COPY --from=pruner /opt/app/out/full/ .
#
#RUN turbo run build --filter=${APP}
#
#FROM base as runner
#WORKDIR /opt/app
#
#COPY --from=builder vite.config.ts .
#COPY --from=builder /opt/app/out/full/apps/${APP}/dist .
#COPY --from=builder /opt/app/out/full/apps/${APP}/package.json .
#RUN npm i -g serve@14.2.3
#
#COPY --from=builder /opt/app/dist /opt/app/dist
#
#EXPOSE ${UI_PORT}
#
#CMD ["sh", "-c", "serve -p ${UI_PORT} /opt/app/dist"]
