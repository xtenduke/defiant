FROM node:14.17.0 AS install
WORKDIR /app

COPY ["package.json", "yarn.lock", "proto/", "./"]
COPY . .
RUN yarn install
RUN yarn bootstrap:docker

ENV NODE_ENV=production
FROM node:14.17.0 as run
WORKDIR /app

COPY --from=install ./app/dist ./dist
COPY ["package.json", "yarn.lock", "./"]
RUN yarn install
EXPOSE 3000
CMD [ "yarn", "start" ]