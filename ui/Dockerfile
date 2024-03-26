FROM alpine:3.19.1
ENV NODE_VERSION 20.11.1

RUN apk add --no-cache nodejs npm

WORKDIR /app

# Server
COPY package.json package-lock.json /app/
RUN npm ci --only=production

COPY ./ ./

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview"]
