FROM node:14.17.0 AS install
WORKDIR /app

COPY ["package.json", "yarn.lock", "proto/", "./"]
COPY . .
RUN yarn install
RUN yarn bootstrap:docker

ENV NODE_ENV=production
FROM node:14.17.0-alpine as run
WORKDIR /app

COPY --from=install ./app/dist ./dist
COPY --from=install ./app/node_modules ./node_modules
COPY ["package.json", "yarn.lock", "./"]
EXPOSE 3000
CMD [ "yarn", "start" ]
