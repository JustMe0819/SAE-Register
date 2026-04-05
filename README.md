# SAé Register

Application de gestion des SAé du BUT MMI – IUT Gustave Eiffel, Meaux.  
Permet d'importer des fichiers XLSX/PDF de notes et de consulter les groupes, classements et statistiques.

## Prérequis

- [Node.js](https://nodejs.org/) v18+
- [Java JDK 17](https://adoptium.net/fr/temurin/releases/?version=17)
- [XAMPP](https://www.apachefriends.org/fr/index.html)

## Installation

**1. Créer la base de données**

Démarrer XAMPP → ouvrir phpMyAdmin → créer une base `sae_register` en `utf8mb4_unicode_ci`.

**2. Lancer le back-end**

```bash
cd back-end/sae-register
.\mvnw.cmd spring-boot:run
```

Serveur disponible sur `http://localhost:8080`. Les tables sont créées automatiquement.

**3. Lancer le front-end**

```bash
npm install
npx expo start --web
```

Ouvrir `http://localhost:8081`.

## Utilisation

Aller sur **Importer** → choisir un fichier XLSX ou PDF → remplir les infos → envoyer.

### Format XLSX accepté

| Format | Colonnes |
|--------|----------|
| A | `Nom` · `Note` |
| B | `Nom` · `Prénom` · `Note` |

Les étudiants avec la même note sont automatiquement regroupés.

## Auteur

Thilya Brouillard — BUT MMI3, IUT Gustave Eiffel Meaux