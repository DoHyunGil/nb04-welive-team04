ARG NODE_VERSION
FROM node:${NODE_VERSION}

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci 

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

ENV PORT=4000

ENTRYPOINT ["npm", "run", "dev"]