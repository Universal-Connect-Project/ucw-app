# NOTE: This Dockerfile is not meant to be run alone.
# Please run `docker compose up` from the root of the project to run the docker environment for this project.

FROM node:20 as builder
ENV NODE_VERSION 20.12.2

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci

COPY ./ ./

RUN npm run build

FROM alpine:3.19.1 as web
ENV NODE_VERSION 20.12.2

RUN apk --update --no-cache add nodejs npm

WORKDIR /app

COPY package.json package-lock.json vite.config.ts /app/
RUN npm ci --omit=dev &&  \
    npm i -g serve@14.2.1

COPY --from=builder /app/dist /app/dist

EXPOSE ${ResourcePort}

CMD ["sh", "-c", "serve -p ${ResourcePort} /app/dist"]
