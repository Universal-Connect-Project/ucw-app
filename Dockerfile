# NOTE: This Dockerfile is not meant to be run alone.
# Please run `docker compose up` from the root of the project to run the docker environment for this project.

FROM alpine:3.19.1
ENV NODE_VERSION 20.11.1

RUN apk --update --no-cache add nodejs npm

WORKDIR /app

COPY package.json package-lock.json tsconfig.json tsconfig.paths.json /app/
RUN npm ci --only=production &&  \
    npm i -g ts-node

COPY ./server ./server
COPY ./shared ./shared

ENV Env prod

EXPOSE ${Port}

CMD ["ts-node", "server/server.js"]
