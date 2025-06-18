# Use official Playwright image with Chromium already installed
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# Set working directory
WORKDIR /app

# Copy files
COPY . .

# Install dependencies
RUN npm install

# Expose your web port
EXPOSE 3000

# Run your app
CMD ["node", "index.js"]
