#!/bin/bash

for file in ./dist/esm/*.js; do
  echo "Updating $file contents..."

  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/\.js'/\.mjs'/g" "$file"
  else
    sed -i "s/\.js'/\.mjs'/g" "$file"
  fi

  echo "Renaming $file to ${file%.js}.mjs..."
  mv "$file" "${file%.js}.mjs"
done
