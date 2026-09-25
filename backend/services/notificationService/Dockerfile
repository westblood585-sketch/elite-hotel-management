FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm","start"]
# no EXPOSE, because it doesn’t serve HTTP