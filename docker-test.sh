#!/bin/bash

docker compose rm -f -s
#docker compose pull --ignore-buildable --quiet
#docker compose up --build --wait-timeout 300 --detach

BUILD_CHECK=$(docker logs ucw-app-server 2>&1 | grep "App initialized successfully")

echo '---------------------------------'
echo "${BUILD_CHECK}"
echo '---------------------------------'

if [[ $BUILD_CHECK == *"App initialized successfully"* ]]; then
  echo 'Build passed!'
else
  echo 'Build failed! :('
fi
