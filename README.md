# BeniTrackPro - Application de Suivi de Véhicules

## 📋 Vue d'ensemble

**BeniTrackPro** est une plateforme complète de gestion et suivi de flotte de véhicules en temps réel, utilisant des balises GPS, RFID et IoT.

### ✨ Fonctionnalités principales

- 🗺️ **Localisation en temps réel** - Suivi GPS instantané des véhicules
- 📍 **Historique de trajets** - Enregistrement complet des déplacements
- 🚨 **Géofencing** - Alertes de zones géographiques
- 📊 **Statistiques de consommation** - Analyse de carburant et performances
- 🚗 **Gestion de flotte** - Administration centralisée des véhicules
- 🔐 **Authentification sécurisée** - JWT + OAuth2
- 📱 **Multi-plateforme** - Web et Mobile (React Native)

---

## 🏗️ Architecture

```
BeniTrackPro/
├── backend/               # API Node.js/Express
├── frontend-web/          # Application React Web
├── mobile/                # Application React Native
├── database/              # Scripts SQL et migrations
├── docker/                # Configurations Docker
├── docs/                  # Documentation
└── config/                # Configurations générales
```

---

## 🛠️ Stack technologique

### Frontend Web
- **React.js** + TypeScript
- **Redux** pour la gestion d'état
- **Leaflet/Mapbox** pour les cartes
- **Tailwind CSS** pour le design

### Frontend Mobile
- **React Native** + Expo
- **React Query** pour la synchronisation données
- **Geolocation API**

### Backend
- **Node.js** + Express + TypeScript
- **Socket.io** pour le temps réel
- **JWT** pour l'authentification
- **Swagger** pour la documentation API

### Base de données
- **PostgreSQL** - Données relationnelles
- **TimescaleDB** - Séries temporelles (GPS)
- **Redis** - Cache et temps réel

### Cloud
- **AWS** (EC2, RDS, S3, CloudFront)
- **Docker** + **Kubernetes** (optionnel)

---

## 🚀 Installation rapide

### Prérequis
- Node.js >= 16
- Docker & Docker Compose
- PostgreSQL >= 12
- Redis >= 6

### 1. Cloner le repository
```bash
git clone https://github.com/pepasse/BeniTrackPro.git
cd BeniTrackPro
```

### 2. Configuration
```bash
cp .env.example .env
```

### 3. Démarrage avec Docker
```bash
docker-compose up -d
```

### 4. Accès aux services
- **Frontend Web**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api/docs
- **Base de données**: localhost:5432
- **Redis**: localhost:6379

---

## 📚 Documentation détaillée

- [Backend API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Mobile App Guide](./docs/MOBILE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Architecture](./docs/ARCHITECTURE.md)

---

## 🔌 Intégration des balises

### GPS
- Connexion via MQTT ou HTTP
- Fréquence de mise à jour: configurable
- Stockage dans TimescaleDB

### RFID
- Lectures via API REST
- Identification des véhicules
- Validation des accès

### IoT (Capteurs)
- Temperature, pression, consommation
- Alertes en temps réel
- Webhooks pour notifications

---

## 🔐 Sécurité

- JWT avec refresh tokens
- OAuth2 intégré
- Chiffrement des données sensibles
- HTTPS obligatoire
- Rate limiting
- Validation CORS

---

## 📊 API Endpoints principaux

```
POST   /api/auth/register        - Créer un compte
POST   /api/auth/login            - Se connecter
GET    /api/vehicles              - Lister les véhicules
GET    /api/vehicles/:id/location - Localisation en temps réel
GET    /api/vehicles/:id/history  - Historique de trajet
POST   /api/geofences             - Créer une zone
GET    /api/fleet/stats           - Statistiques
POST   /api/alerts                - Configuration d'alertes
GET    /api/vehicles
POST   /api/vehicles
GET    /api/vehicles/:id
PUT    /api/vehicles/:id
DELETE /api/vehicles/:id
GET    /api/vehicles/:id/location

---

## 🤝 Contribution

Les contributions sont bienvenues! Veuillez suivre ces étapes:

1. Fork le repository
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les modifications (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour détails.

---

## 👨‍💻 Auteur

**pepasse** - [GitHub](https://github.com/pepasse)

---

## 📞 Support

Pour toute question ou problème:
- 📧 Email: support@benitrackpro.com
- 💬 Issues GitHub: [GitHub Issues](https://github.com/pepasse/BeniTrackPro/issues)
- 📖 Documentation: [Docs](./docs)

---

**Dernière mise à jour**: Juillet 2026
