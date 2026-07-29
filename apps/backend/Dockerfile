FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY prisma ./prisma/
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["npm", "start"]
