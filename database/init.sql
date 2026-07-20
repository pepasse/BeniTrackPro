-- Script d'initialisation de la base BeniTrackPro
-- Exécuté automatiquement au premier démarrage du conteneur Postgres

-- Extension pour la génération d'UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TimescaleDB est déjà activé par l'image timescale/timescaledb,
-- mais on s'assure qu'elle est bien présente sur la base applicative.
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Les tables seront créées automatiquement par TypeORM (synchronize)
-- en développement. En production, on utilisera les migrations
-- dans le dossier database/migrations/.
