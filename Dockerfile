ARG NODE_VERSION=20
FROM node:${NODE_VERSION}

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all source files
COPY . .

# Generate Prisma client and build
RUN npx prisma generate && npm run build

ENV PORT=4000
EXPOSE 4000

ENTRYPOINT ["npm", "run", "start"]