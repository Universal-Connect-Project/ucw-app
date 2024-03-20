#!/bin/bash

docker run -p 8080:8080 -p 5173:5173 --env-file .env ucw-app