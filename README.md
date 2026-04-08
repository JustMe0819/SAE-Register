# SAé Register

Application de gestion des SAé du BUT MMI – IUT Gustave Eiffel, Meaux.  
Permet d'importer des fichiers XLSX/PDF de notes et de consulter les groupes, classements et statistiques.

## Déploiement actuel

Le front est hébergé sur Vercel, le back sur Railway et la base de données sur Aiven.

Aucune installation locale n’est nécessaire pour l’utilisateur final.

> Ce README décrit la version hébergée. Les instructions locales seront ajoutées ultérieurement.

## Utilisation

Aller sur **Importer** → choisir un fichier XLSX ou PDF → choisir une image d'illustration → remplir les infos → valider.
Vous pourrez voir ensuite les élèves, leurs notes, leur classement ainsi que le lien de leur site hébergé et leur répo github s'ils sont ajouter.
Vous pourrez aussi chercher directement un élève via l'onglet **Recherche**.

### Format accepté

| Format | Colonnes |
|--------|----------|
| A | `Nom` · `Note` |
| B | `Nom` · `Prénom` · `Note` |

## Auteur

Thylia Brouillard — BUT MMI3, IUT Gustave Eiffel Meaux
