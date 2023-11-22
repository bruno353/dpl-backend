# Primeira Etapa: Construção (Builder)
FROM node:latest AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build

# Segunda Etapa: Imagem Final
FROM node:latest

# Instalar o dfx usando o script fornecido na documentação
RUN curl -fsSL https://internetcomputer.org/install.sh | sh

# Copiar os arquivos necessários da primeira etapa
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Copiar o script create_wallet.sh para o container e dar permissão de execução
COPY xnodes/create_wallet.sh /app/xnodes/create_wallet.sh
RUN chmod +x /app/xnodes/create_wallet.sh

EXPOSE 3000
CMD [ "npm", "run", "start:prod" ]