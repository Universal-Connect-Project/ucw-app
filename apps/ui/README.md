# Universal Connect Widget embedded project

## Docker

The image for this project is hosted on Dockerhub. It is meant to be run via docker-compose. Please follow the steps in the
[README.md](../../README.md) for more information.

## Local Development

The [UCW NPM Module](https://www.npmjs.com/package/@ucp-npm/components?activeTab=readme) is used here, and is rendered in a small Vite/React wrapper app, and served-up from the `server` project.

Please follow the steps in the [README.md](../../README.md) in order to get started, before you start local development.

In order to do local development, run the following commands from the root of the project:

```
turbo run dev --filter=ui
```

The `./apps/server/.env` file is used to configure the port that the widget ui will be served on. The default is http://localhost:5173. If you need to change this, you can do so in the `./apps/server/.env` file.

If you need to update the UCW NPM package to a newly published version, simply run in `./apps/ui`:

`npm i -S @ucp-npm/components@<version>`
