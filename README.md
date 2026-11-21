# Lizy 📱✨

> **L'application mobile Pronote moderne, 100% locale, privée et sans publicité.**  
> Conçue avec **Expo SDK 58**, **React Native** et un design **Apple Glass (Liquid Glassmorphism)** ultra fluide.

---

## 🌟 Points Forts

* 🔒 **100% Zero-Trust & Local :** Aucun serveur intermédiaire, aucun tracker, aucune télémétrie. Tout le protocole s'exécute directement entre votre téléphone et votre établissement scolaire.
* 📲 **Connexion Officielle par QR Code :** Protocole mobile Pronote rétro-conçu (AES-128-CBC + challenge MD5) sans mot de passe ENT nécessaire.
* 🏫 **Détection GPS des Établissements :** Détecte automatiquement les collèges et lycées aux alentours via la géolocalisation et configure l'URL de votre établissement.
* 🌐 **Support ENT & ÉduConnect :** Navigateur WebView in-app intégré avec sniffer RPC pour les académies utilisant le SSO ÉduConnect.
* 📊 **Notes & Moyennes Temps Réel :** Calcul automatique de la moyenne générale (y compris si masquée par le serveur), points forts, points faibles et barres de progression.
* 📅 **Planning Hebdomadaire Dynamique :** Emploi du temps chronologique filtrable par jour, résolution des salles, professeurs et matières, créneaux d'étude personnalisés.
* 📝 **Devoirs Nettoyés :** Assainissement automatique du HTML brut Pronote (`<div>`, entités unescaped) avec sous-tâches interactives et suivi de progression.
* 🛡️ **Sécurité Avancée :**
  * Verrouillage de l'application par **code PIN** (hash SHA-256 salé dans le Keystore matériel).
  * **Bouclier Anti-Regard Multitâche :** Floutage opaque instantané dans le sélecteur d'applications récentes.
  * Stockage matériel chiffré (`expo-secure-store` avec protection `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`).
* 🎮 **Gamification & Focus Pomodoro :** Niveaux, points d'expérience (XP), séries de connexions et minuteur de concentration intégré.
* 🎨 **Thèmes Apple Glass :** 6 ambiances immersives (Midnight, Ocean, Sakura, Forest, Gold, Minimal) avec flous d'arrière-plan haute performance.

---

## 🚀 Installation & Développement

### Prérequis
* [Node.js](https://nodejs.org/) (v18+)
* [Expo Go](https://expo.dev/go) sur votre smartphone (Android / iOS)

### Démarrage local
```bash
# Cloner le dépôt
git clone https://github.com/CameleonGamer/Lizy.git
cd Lizy

# Installer les dépendances
npm install --legacy-peer-deps

# Lancer le serveur de développement Expo
npx expo start
```

Scannez le QR Code affiché dans votre terminal avec l'application **Expo Go** (Android) ou l'appareil photo (iOS).

---

## 📦 Générer le fichier .APK (Android Standalone)

Pour installer et utiliser Lizy directement sur votre smartphone Android sans passer par Expo Go :

### Méthode 1 : EAS Build dans le Cloud (Recommandé)
1. Installez le CLI EAS :
   ```bash
   npx eas-cli@latest login
   ```
2. Lancez la compilation de l'APK (profil `preview`) :
   ```bash
   npx eas-cli@latest build -p android --profile preview
   ```
3. Une fois la compilation terminée, téléchargez le fichier `.apk` via le lien fourni dans le terminal ou scannez le QR code de téléchargement directement sur votre téléphone.

---

## 🔐 Confidentialité & Sécurité

* **Aucune base de données centrale :** Lizy ne possède aucun serveur backend. Vos notes et devoirs restent strictement entre votre appareil et votre établissement.
* **Chiffrement au repos :** Vos identifiants de session sont conservés dans le Keychain sécurisé d'iOS ou le Keystore matériel d'Android.
* **Destruction des données :** Une option *"Détruire toutes les données locales"* dans le Profil efface instantanément et définitivement tous les caches, jetons et clés de chiffrement de votre téléphone.

---

## 📄 Licence
Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.
