ARG NODE_VERSION=20
FROM node:${NODE_VERSION}

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

ENV PORT=4000
EXPOSE 4000

ENTRYPOINT ["npm", "run", "start"]