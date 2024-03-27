#!/bin/bash

docker run --name ucw-app --network host --env-file .env universalconnectfoundation/ucw-app:v0.0.1