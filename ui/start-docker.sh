#!/bin/bash

IS_RUNNING="false"
IS_CREATED="false"
NAME=ucw-ui-local
CMD=""

if ! docker info > /dev/null 2>&1; then
  echo "This script uses docker, and it isn't running. Please start docker and try again."
  exit 1
fi

CONTAINER_NAME=$(docker ps -a -q -f name=$NAME)

if [[ -n "$CONTAINER_NAME" && $(docker inspect -f '{{.State.Running}}' $CONTAINER_NAME) = "true" ]]; then
  IS_RUNNING="true"
fi

if [ "$IS_RUNNING" = "true" ]; then
  IS_CREATED="true"
elif [[ -n "$CONTAINER_NAME" ]]; then
  IS_CREATED="true"
fi

if [ "$IS_RUNNING" = "true" ]; then
  echo "Container is already running: ${CONTAINER_NAME}"
  exit 1
elif [ "$IS_CREATED" = "true" ]; then
  CMD="docker start -a ${CONTAINER_NAME}"
else
  CMD="docker run --pull never --name ${NAME} -p 5173:5173 ${NAME}"
fi

eval $CMD
ERROR=$?

if [ $ERROR -ne 0 ]; then
  echo "------------------------------"
  echo "Unable to start container."

  if [ $ERROR -eq 125 ]; then
    echo "Perhaps the image isn't built yet? Please build the image, by running './build-docker.sh', and try again."
  else
    echo "Error: $ERROR"
  fi

  echo "------------------------------"
  exit 1
fi
