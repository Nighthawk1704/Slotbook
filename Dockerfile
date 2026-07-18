FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (for caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the code
COPY . .

# Set placeholder DATABASE_URL so build doesn't crash on any schema/db imports
ENV DATABASE_URL="postgresql://slotbook:slotbook@localhost:5432/slotbook"

# Build nextjs
RUN npm run build

# Start a fresh stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "run", "start"]
