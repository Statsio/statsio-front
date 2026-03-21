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

# Expose le port de Vite
EXPOSE 5173

# Commande par défaut pour lancer Vite en mode dev
CMD ["npm", "run", "dev", "--", "--host"]