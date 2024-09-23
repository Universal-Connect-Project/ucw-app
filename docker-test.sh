
docker compose rm -f -s
docker compose pull --ignore-buildable --quiet
docker compose up --build --wait --detach

BUILD_CHECK=$(docker logs ucw-app-server 2>&1 | grep "App initialized successfully")

echo "-----------------"
echo "${BUILD_CHECK}"
echo "-----------------"

if [[ ${BUILD_CHECK} == *"App initialized successfully"* ]]; then
  echo "Build passed!"
  echo "### 🐳 Docker Images Test Results"
  echo "The tests passed! 🎉🎉🎉"
  exit 0
else
  echo "Build failed! :("
  echo "### 🐳 Docker Images Test Results"
  echo "The tests failed! 😭😭😭"
  echo "Please check the logs."
  exit 1
fi