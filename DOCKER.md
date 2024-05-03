# Docker

This repo uses [Docker](https://www.docker.com/) as a containerization tool.

## Docker commands for testing

You can use the following commands to test the docker images. _They are not normally
run separately, and instead they are run together, using the `docker compose up` command._ 
However, there are times when you may want to test the individual docker images, to make sure 
they are working as expected, or to debug issues. This allows you to do so.

### Server
```shell
docker build -f ./docker-server.Dockerfile -t ucw-app-server-cli --build-arg APP=server .
docker run --name ucw-app-server-cli -p 8080:8080 --env-file ./apps/server/.env -t ucw-app-server-cli
```

### UI
```shell
docker build -f ./docker-ui.Dockerfile -t ucw-app-ui-cli --build-arg APP=ui .
docker run --name ucw-app-ui-cli -p 5137:5137 -e UI_PORT=5137 -t ucw-app-ui-cli
```

### Docker Compose

Using `--pull never` will ensure that the docker images used are always local, and not from dockerhub. 
This ensures that our local changes can be tested.

```shell
docker compose up --pull never
```