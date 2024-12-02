# NOTE: This Dockerfile is not meant to be run alone, but can be for development purposes.
# See the DOCKER.md file in the root of the project for more information.
# Please run `docker compose up` from the root of the project to run the docker environment for
# the UCW-APP project, which this Dockerfile is part of.
FROM node:20

WORKDIR /usr/src/app

# Copy app source
COPY . .
 
RUN npm install
RUN npm run build

EXPOSE ${PORT}

CMD ["npm", "run", "start:server"]
