# Defiant
**WORK IN PROGRESS**
***

### What is this?


A distributed messaging service, built with Node and gRPC

Designed to run in small clusters, (think RPi cluster)

***
### Running

#### Single instance
```
unsupported at the moment
```

#### Cluster
```
$ cd core
$ yarn install
$ yarn bootstrap
$ yarn cluster:server:start
```

#### Cluster test
```
$ cd test
$ yarn test:grpc:cluster
```
