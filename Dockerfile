FROM alpine:3.19
ENV NODE_VERSION 20.11.1

RUN apk add --no-cache nodejs npm
RUN npm config set registry https://registry.npmjs.org/

# Support packages
RUN npm install -g ts-node concurrently

WORKDIR /app

# Server
COPY package.json package-lock.json /app/
RUN npm ci --verbose

# Test...
RUN mkdir ./ui
COPY ./ui/package.json ./ui/package-lock.json /app/ui/
RUN cd /app/ui &&  \
    npm ci
# End test

COPY ./ ./

# Test 2
RUN cd /app/ui &&  \
    npm run build
# End test 2

## UI
#RUN cd ./ui &&  \
#    npm ci &&  \
#    npm run build

ENV Env prod
ENV Port 8080
ENV ResourcePrefix 'http://localhost:5173'

EXPOSE 8080 5173

CMD ["npm", "run", "docker:run"]
