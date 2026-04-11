FROM node:20-slim

# Instalar dependências do sistema para o Puppeteer (Chrome)
RUN apt-get update && apt-get install -y \
    procps \
    libnss3 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    lsb-release \
    xdg-utils \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
RUN npm install

# Copiar o restante do código e o Prisma
COPY . .
RUN npx prisma generate

# Criar pasta de uploads se não existir
RUN mkdir -p uploads

EXPOSE 3333

# Comando para rodar as migrações e iniciar o servidor
CMD npx prisma db push && npm run dev
