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

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD [ "npm", "run", "start:prod" ]