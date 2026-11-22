FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install

FROM node:20-alpine AS builder
WORKDIR /app
ARG API_INTERNAL_URL=http://api:3001
ARG NEXT_PUBLIC_MTX_HLS_URL=http://localhost:8888
ARG NEXT_PUBLIC_MTX_WEBRTC_URL=http://localhost:8889
ENV API_INTERNAL_URL=$API_INTERNAL_URL
ENV NEXT_PUBLIC_MTX_HLS_URL=$NEXT_PUBLIC_MTX_HLS_URL
ENV NEXT_PUBLIC_MTX_WEBRTC_URL=$NEXT_PUBLIC_MTX_WEBRTC_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]