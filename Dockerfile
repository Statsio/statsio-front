# On prend la version Node souhaitée
FROM node:20

# Crée le dossier de travail
WORKDIR /app

# Copie seulement package.json + package-lock.json pour installer les dépendances d'abord
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du projet
COPY . .

# Expose le port de Nuxt
EXPOSE 3000

# Commande par défaut pour lancer Nuxt en mode dev
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]