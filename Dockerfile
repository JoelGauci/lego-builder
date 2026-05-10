FROM node:20-slim

WORKDIR /usr/src/app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source and assets
COPY src/ ./src/

EXPOSE 8080

# Required for Cloud Run
ENV PORT=8080

CMD [ "node", "src/server.js" ]
