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

# Instalar o dfx globalmente na imagem final
RUN npm install -g dfx

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD [ "npm", "run", "start:prod" ]