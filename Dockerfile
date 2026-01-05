ARG NODE_VERSION
FROM node:${NODE_VERSION}

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY prisma ./prisma


COPY . .
RUN npm run build && \
    npx prisma generate

ENV PORT=4000

ENTRYPOINT ["npm", "run", "start"]