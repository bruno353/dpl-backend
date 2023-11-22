# Primeira Etapa: Construção (Builder)
FROM node:16 AS builder

WORKDIR /app

# Copiar arquivos de definição de pacotes e instalar dependências
COPY package*.json ./
RUN npm install

# Copiar outros arquivos necessários para a construção
COPY prisma ./prisma/
COPY src ./src

# Realizar a construção
RUN npm run build

# Copiar o script de shell para o diretório 'dist'
COPY src/xnodes/create_wallet.sh dist/xnodes/create_wallet.sh

# Segunda Etapa: Imagem Final
FROM node:16

# Definir o diretório de trabalho para /app
WORKDIR /app

# Instalar o dfx
RUN curl -fsSL https://internetcomputer.org/install.sh | sh

# Instalar dependências de compilação para node-gyp
RUN apt-get update && apt-get install -y python make g++ && rm -rf /var/lib/apt/lists/*

# Copiar os arquivos necessários da primeira etapa
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Dar permissão de execução para o script (que agora está em /app/dist/xnodes)
RUN chmod +x /app/dist/xnodes/create_wallet.sh

# Expõe a porta em que a aplicação vai rodar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD [ "npm", "run", "start:prod" ]