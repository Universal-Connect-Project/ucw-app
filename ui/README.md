# Universal Connect Widget embedded project

## Docker
This project is hosted on Dockerhub. It is mean to be run via docker-compose. Please follow the steps in the 
[README.md](../README.md) for more information.

## Local Development
This is where the UCW NPM Module is used in order to expose the Connect Widget via the ucw-app project

In order to do local development, run the following commands from the root of the project:
```
cd ./ui
```
```
npm ci
```
```
npm run dev
```

The `./server/config.js` is already setup to use the exposed service (http://localhost:5173).

The above commands will allow this UI to be used with the server project, which is also in this repo.
Follow the steps in the [README.md](../README.md) to run the `server` locally.

If you need to update the UCW NPM package to a newly published version, simply run 

`npm i -S @ucp-npm/components@<version>`