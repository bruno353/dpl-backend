# Primeira Etapa: Construção (Builder)
FROM node:latest AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY src/xnodes/create_wallet.sh ./src/xnodes/

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
COPY --from=builder /app/src/xnodes/create_wallet.sh ./src/xnodes/create_wallet.sh

# Dar permissão de execução para o script
RUN chmod +x ./src/xnodes/create_wallet.sh
RUN ls -la /app/
RUN ls -la /app/src/
RUN ls -la /app/xnodes/



EXPOSE 3000
CMD [ "npm", "run", "start:prod" ]