# BeniTrackPro — Balise mobile (Expo)

App du chauffeur : envoie la position du téléphone toutes les 5 s à
`POST /api/devices/location` avec l'en-tête `X-API-Key`.

## Lancer
```
cd mobile
npx create-expo-app@latest . --template blank-typescript   (une seule fois, si le dossier est vide)
npx expo install expo-location expo-keep-awake @react-native-async-storage/async-storage
npx expo start
```
Scanner le QR code avec l'app Expo Go (Android). PC et téléphone sur le même Wi-Fi.
