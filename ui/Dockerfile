FROM node:20 as builder

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci

COPY ./ ./

RUN npm run build

FROM alpine:3.19.1 as web
ENV NODE_VERSION 20.11.1

RUN apk --update --no-cache add nodejs npm wget

WORKDIR /app

COPY package.json package-lock.json vite.config.ts /app/
RUN npm ci --only=production &&  \
    npm i -g vite@5.2.6

COPY --from=builder /app/dist /app/dist

EXPOSE 5173

CMD ["npm", "run", "preview"]
