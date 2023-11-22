# Primeira Etapa: Construção (Builder)
FROM node:latest AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY src ./src

RUN npm install

COPY . .

RUN npm run build

# Copie seu script de shell para o diretório 'dist'
COPY src/xnodes/create_wallet.sh dist/xnodes/create_wallet.sh

# Segunda Etapa: Imagem Final
FROM node:latest

# Copie os conteúdos construídos e o script para a imagem final
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Instalar o dfx usando o script fornecido na documentação
RUN curl -fsSL https://internetcomputer.org/install.sh | sh

# Defina o diretório de trabalho para /dist, que é onde seu código transpilado está
WORKDIR /dist

# Dar permissão de execução para o script (que agora está em /dist/xnodes)
RUN chmod +x /dist/xnodes/create_wallet.sh

RUN ls -la /dist/xnodes/

EXPOSE 3000
CMD [ "npm", "run", "start:prod" ]