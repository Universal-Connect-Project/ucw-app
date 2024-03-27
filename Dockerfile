FROM alpine:3.19.1
ENV NODE_VERSION 20.11.1

RUN apk --update --no-cache add nodejs npm wget

WORKDIR /app

# Server
COPY package.json package-lock.json tsconfig.json tsconfig.paths.json /app/
RUN npm ci --only=production &&  \
    npm i -g ts-node

COPY ./server ./server
COPY ./shared ./shared

ENV Env prod
ENV Port 8080
ENV ResourcePrefix 'http://localhost:5173'

EXPOSE 8080 6379

CMD ["ts-node", "server/server.js"]
