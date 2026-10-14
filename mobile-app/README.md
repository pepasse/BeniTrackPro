# BeniTrackPro — App mobile (Expo)

Connexion, carte et liste des véhicules, positions en direct (Socket.io).

## Installation
```
cd C:\Users\pepas\BeniTrackPro
npx create-expo-app@latest mobile-app --template blank-typescript
```
Puis copie `App.tsx` et le dossier `src/` de ce dépôt dans `mobile-app` (remplace `App.tsx`), et :
```
cd mobile-app
npx expo install expo-secure-store react-native-maps socket.io-client
npx expo start
```
Scanne le QR code avec Expo Go (Android). PC et téléphone sur le même Wi-Fi.

Avant de lancer, mets l'IP de ton PC dans `src/config.ts`.
