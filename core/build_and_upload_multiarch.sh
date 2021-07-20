echo "Prepare docker buildx"
docker run --rm --privileged docker/binfmt:820fdd95a9972a5308930a2bdfb8573dd4447ad3

rev=$(git log -1 --format=%h)
name="$DOCKER_USERNAME/defiant:$rev"
echo "building $name"

docker buildx build --push --platform linux/arm64/v8,linux/amd64 --tag "$name" .
