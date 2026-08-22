FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY . .

RUN npm run build

EXPOSE 3000

ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
