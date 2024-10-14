# Docker

This repo uses [Docker](https://www.docker.com/) (or any docker-compatible client) as a containerization tool.

Some compatible options are:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Rancher Desktop](https://rancherdesktop.io/)

Please note, you do not need a "desktop" version of docker to run this project. Any docker-compatible container client is all
that is required. However, not all clients have been tested with this project.

## Docker Images

The images for this repo are available on [DockerHub](https://hub.docker.com/repositories/universalconnectfoundation). You can change the version of the images that you pull by setting
the `DOCKER_IMAGE_SERVER` and `DOCKER_IMAGE_UI` values in the `.env` file found in the project root.

## Docker commands for testing

You can use the following commands to test the docker images. _They are not normally
run separately, and instead are run together, using the `docker compose up` command._
However, there are times when you may want to test the individual docker images, to make sure
they are working as expected, or to debug issues. This allows you to do so.

### Server

```shell
docker build -f ./docker-server.Dockerfile -t ucw-app-server-cli --build-arg APP=server .
docker run --name ucw-app-server-cli --rm -p 8080:8080 --env-file ./apps/server/.env -t ucw-app-server-cli
```

### UI

```shell
docker build -f ./docker-ui.Dockerfile -t ucw-app-ui-cli --build-arg APP=ui .
docker run --name ucw-app-ui-cli --rm -p 5137:5137 -e UI_PORT=5137 -t ucw-app-ui-cli
```

## Testing with Docker Compose

While developing the UCW with docker compose, using ` --build` should build the docker images, so local changes can be tested.

```shell
docker compose up --build
```
