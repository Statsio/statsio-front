# On prend la version Node souhaitée (variante slim : pas d'outils/libs OS inutiles
# pour une app Node comme ImageMagick, MariaDB/Postgres client, etc. — moins de
# surface de vulnérabilités, image plus légère)
FROM node:20-slim

# Applique les correctifs de sécurité OS (CVE sur les paquets Debian de l'image de base)
RUN apt-get update && apt-get upgrade --no-install-recommends -y \
    && rm -rf /var/lib/apt/lists/*

# Met à jour le CLI npm lui-même : la version embarquée dans l'image de base
# vendorise de vieilles versions de tar/cross-spawn/etc. avec des CVE connues
# (npm 12+ nécessite Node >=22, on reste donc sur la dernière 11.x compatible Node 20)
RUN npm install -g npm@11

# Crée le dossier de travail
WORKDIR /app

# Exécute le conteneur en utilisateur non-root (image node:20 fournit déjà "node", uid 1000)
RUN chown node:node /app
USER node

# Copie seulement package.json + package-lock.json pour installer les dépendances d'abord
COPY --chown=node:node package*.json ./

# Installer les dépendances (npm ci : installation propre et reproductible à partir du lockfile)
RUN npm ci

# Copier le reste du projet
COPY --chown=node:node . .

# Expose le port de Nuxt
EXPOSE 3000

# Commande par défaut pour lancer Nuxt en mode dev
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]