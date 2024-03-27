#!/bin/bash

TAG=$1
[ -z "$TAG" ] && TAG="dev"
docker build -t universalconnectfoundation/ucw-app:${TAG} .