# Docker

This repo uses [Docker](https://www.docker.com/) as a containerization tool.

## Docker commands for testing

### server
```shell
docker build -f ./docker-server.Dockerfile -t ucp-app-server-cli --build-arg APP=server .
docker run --name ucp-app-server-cli -p 8080:8080 --env-file ./apps/server/.env -t ucp-app-server-cli
```

### ui
```shell
docker build -f ./docker-ui.Dockerfile -t ucp-app-ui-cli --build-arg APP=ui .
docker run --name ucp-app-ui-cli -p 5137:5137 -e UI_PORT=5137 -t ucp-app-ui-cli
```

To run any of these containers interactively, use the `-i` flag.

```shell
docker run --name ucp-app-ui-cli -p 5137:5137 -e UI_PORT=5137 -it ucp-app-server-cli sh
```
### compose
```shell
docker compose up --pull never
```