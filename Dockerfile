ARG NODE_VERSION=20
FROM node:${NODE_VERSION}

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all source files
COPY . .

# Generate Prisma client (separate step for better error visibility)
# Note: DATABASE_URL is dummy for build, real URL is in .env.production at runtime
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    npx prisma generate && \
    echo "=== Prisma Client Generated Successfully ==="

# Build TypeScript (separate step for better error visibility)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    npm run build && \
    echo "=== Build Completed Successfully ==="

ENV PORT=4000
EXPOSE 4000

ENTRYPOINT ["npm", "run", "start"]