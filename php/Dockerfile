# ── Stage 1: install dependencies ─────────────────────────────────────────
FROM composer:2 AS composer

WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-interaction --optimize-autoloader --no-scripts

# ── Stage 2: runtime image ────────────────────────────────────────────────
FROM php:8.2-apache

RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Patch the vhost to allow .htaccess overrides
RUN sed -i '/<\/VirtualHost>/i\\t<Directory /var/www/html>\n\t\tAllowOverride All\n\t\tRequire all granted\n\t</Directory>' \
    /etc/apache2/sites-enabled/000-default.conf

WORKDIR /var/www/html

COPY . .
COPY --from=composer /app/vendor ./vendor

EXPOSE 80