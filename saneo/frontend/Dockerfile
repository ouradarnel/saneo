FROM node:20-alpine

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code
COPY . .

# Exposition du port
EXPOSE 4200

# Commande par défaut
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--poll", "1000"]
