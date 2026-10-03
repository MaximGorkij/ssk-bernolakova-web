FROM node:20-alpine

WORKDIR /app

# Zavislosti najprv samostatne, aby sa vyuzil Docker layer cache
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Zvysok aplikacie
COPY . .

# Data a uploady sa mountuju ako volumes
RUN mkdir -p data public/uploads/gallery public/uploads/news public/uploads/logo

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
