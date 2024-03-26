FROM alpine:3.19.1
ENV NODE_VERSION 20.11.1

RUN apk add --no-cache nodejs npm

WORKDIR /app

# Server
COPY package.json package-lock.json /app/
RUN npm ci --only=production

COPY ./ ./

RUN npm install -g ts-node

ENV Env prod
ENV Port 8080
ENV ResourcePrefix 'http://localhost:5173'

EXPOSE 8080 6379

CMD ["ts-node", "server/server.js"]
