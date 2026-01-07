ARG NODE_VERSION
FROM node:${NODE_VERSION}

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY prisma ./prisma

COPY . .

ENV DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy"

RUN npx prisma generate && \
    npm run build

ENV PORT=4000

ENTRYPOINT ["npm", "run", "start"]