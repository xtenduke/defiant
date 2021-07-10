rev=$(git log -1 --format=%h)
name="$DOCKER_USERNAME/defiant:$rev"
echo "building $name"

docker buildx build --push --platform linux/arm/v7,linux/arm64/v8,linux/amd64 --tag "$name" .