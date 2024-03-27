#!/bin/bash

TAG=$1
[ -z "$TAG" ] && TAG="v0.0.1"
docker build -t universalconnectfoundation/ucw-ui:${TAG} .