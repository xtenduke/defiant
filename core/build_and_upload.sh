rev=$(git log -1 --format=%h)
name="$DOCKER_USERNAME/defiant:$rev"
echo "building $name"
docker build --no-cache --tag "$name" .

echo "Pushing to dockerhub $name"
docker image push "$name"
