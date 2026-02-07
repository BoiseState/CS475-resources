FROM node:25.6-alpine3.22

RUN mkdir /app

ADD package-lock.json /app
ADD package.json /app
ADD tsconfig.json /app

WORKDIR /app

RUN npm install --only=dev

COPY . .

RUN npm run build

CMD ["node", "dist/rainbowTable.js"]
