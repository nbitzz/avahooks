FROM node:lts-alpine AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json package-lock.json /temp/dev/
RUN cd /temp/dev && npm install

RUN mkdir -p /temp/prod
COPY package.json package-lock.json /temp/prod/
RUN cd /temp/prod && npm install --omit dev --include=optional

FROM base AS build
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
RUN NODE_ENV=production npm run build

FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=build /usr/src/app/dist dist
COPY --from=build /usr/src/app/package.json .

EXPOSE 3000/tcp
CMD [ "npm", "start" ]