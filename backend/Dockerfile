FROM node:18-slim

RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app


COPY package*.json ./


RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 8000

CMD ["npm", "run", "dev"]
