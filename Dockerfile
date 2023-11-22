# Primeira Etapa: Construção (Builder)
FROM node:16 AS builder

WORKDIR /app

# Instalar ferramentas de compilação para módulos nativos
RUN apt-get update && apt-get install -y python make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Segunda Etapa: Imagem Final
FROM node:16

WORKDIR /app

# Instalar o dfx
RUN curl -fsSL https://internetcomputer.org/install.sh | sh

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 3000
CMD [ "npm", "run", "start:prod" ]