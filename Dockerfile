ARG NODE_VERSION=20
FROM node:${NODE_VERSION}

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all source files
COPY . .

# Generate Prisma client (separate step for better error visibility)
RUN echo "=== Generating Prisma Client ===" && \
    npx prisma generate && \
    echo "=== Prisma Client Generated Successfully ==="

# Build TypeScript (separate step for better error visibility)
RUN echo "=== Building TypeScript ===" && \
    npm run build && \
    echo "=== Build Completed Successfully ==="

ENV PORT=4000
EXPOSE 4000

ENTRYPOINT ["npm", "run", "start"]