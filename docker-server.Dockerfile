# TODO: This comment might need to change, depending on how compose will work with turborepo
# NOTE: This Dockerfile is not meant to be run alone.
# Please run `docker compose up` from the root of the project to run the docker environment for
# the UCW-APP project, which this Dockerfile is part of.
FROM alpine:3.19.1 as base
ENV NODE_VERSION 20.12.2

RUN apk --update --no-cache --virtual add nodejs npm \
    && rm -rf /var/cache/apk/* \
    && npm i -g turbo ts-node

FROM base AS pruned
ARG APP

WORKDIR /app
COPY . .
RUN turbo prune --scope=${APP} --docker
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
USER nodejs

COPY --chown=nextjs:nodejs ./src ./src

ENV Env prod

EXPOSE ${PORT}

CMD ["ts-node", "src/server.js"]
