# Horizon HDV — PWA Google Drive (GitHub Pages)

**Application personnelle installable** : même présentation Premium Dark, AS332 illustré aux couleurs de l’Armée de Terre, saisie et statistiques en heures décimales (`1.5 h`, `2.25 h`). Contient le carnet, les qualifications, les échéances et l’export/import JSON.

## Confidentialité — IMPORTANT

- **L'archive publique ne contient aucun des 395 vols personnels.** Ne publiez jamais le classeur Excel ou le fichier de sauvegarde `Horizon_HDV_IMPORT_PRIVE_395_VOLS.json` sur GitHub.
- Les données locales d'une ancienne version Horizon HDV sur **le même navigateur et la même origine** sont conservées (`horizon_hdv_pwa_storage_v1`). **Aucune migration des sauvegardes Supabase n'est automatique.** Vous pouvez exporter vos données actuelles avant la mise à jour.
- Google Drive est un hébergeur externe : ne synchronisez **aucune donnée relative à une activité militaire sans l'autorisation correspondante**. Tester d'abord avec des vols fictifs. Ni ce code ni ces règles de péremption ne constituent une validation réglementaire.
- Le dossier `appDataFolder` de Drive est privé à cette application et masqué dans l'interface ordinaire de Drive, mais **il ne remplace pas une classification ou une autorisation de sécurité**.

## Étape 1 : publier sur GitHub Pages

1. Depuis https://github.com/Aigle-Noir/HDV-DCS, déposez à la racine le **contenu** de cette archive (dont `index.html`, `app.js`, `style.css`, `sw.js`, `manifest.webmanifest`, les icônes et l’image AS332). Remplacez les anciens fichiers homonymes.
2. GitHub → **Settings → Pages** → déployer la branche `main`, dossier `/ (root)` (si déjà activé, aucun changement).
3. Ouvrez https://aigle-noir.github.io/HDV-DCS/ sur téléphone ou tablette. Si une ancienne PWA reste visible, rechargez la page ou fermez/réouvrez l’application. Le cache est versionné.

## Étape 2 : configurer Google Cloud (une seule fois)

1. Ouvrez https://console.cloud.google.com/ et créez ou sélectionnez un projet dédié « Horizon HDV ».
2. **APIs et services → Bibliothèque** : activez **Google Drive API**.
3. Dans **Google Auth Platform** (ou l’écran de consentement OAuth), configurez l’application : nom Horizon HDV, type d’audience adaptée à votre compte (souvent **Externe**), adresse de contact. Si le projet reste en **Testing**, ajoutez votre propre compte Google dans **Test users**. Les applications en test peuvent expirer/requérir de se reconnecter selon la politique Google.
4. **Clients → Créer un client → Application Web**. Dans **Origines JavaScript autorisées**, ajoutez exactement `https://aigle-noir.github.io` (sans `/HDV-DCS/` ni slash final). Le modèle de jeton JavaScript ne nécessite pas d’URI de redirection pour la connexion en fenêtre.
5. Copiez l'**identifiant client OAuth**, qui se termine par `.apps.googleusercontent.com`. **Ce n’est pas une clé API, ni un mot de passe, ni un secret client**. Ne transmettez jamais de secret client.
6. Dans Horizon HDV : **Plus → Synchronisation** → collez l'identifiant OAuth → **Enregistrer l'identifiant** → **Se connecter avec Google**. Autorisez le scope `drive.appdata` si demandé.

## Étape 3 : synchroniser téléphone et tablette

1. Sur le téléphone : créez un **vol fictif** (`TEST`, `1.5 h`), puis **Plus → Synchronisation → Synchroniser**. Confirmez la **première sauvegarde Drive**. Le statut doit passer à **Synchronisé**.
2. Sur la tablette, ouvrez le même site. Saisissez **le même identifiant client OAuth** et choisissez **le même compte Google**. **N'ajoutez aucun vol** avant le premier téléchargement. Connectez-vous puis ouvrez le carnet ; le vol TEST devrait apparaître.
3. Supprimez le vol TEST et vérifiez le retour de la modification. **N'importez votre carnet réel qu'après confirmation du droit de stockage sur ce cloud.**

## Fonctionnement et limites

- Interface statique sur GitHub Pages, données locales dans `localStorage`, sauvegarde dans un **fichier JSON unique** dans `appDataFolder` de Drive (scope OAuth non sensible `https://www.googleapis.com/auth/drive.appdata`).
- PWA utilisable hors connexion **après première visite en ligne**. Connexion Google requise pour synchroniser. Les jetons sont en mémoire uniquement et expirent ; reconnectez-vous au besoin. Les mises à jour automatiques ne fonctionnent que pendant une session Google valide, au retour en ligne / à la reprise d'onglet / après une modification, selon restrictions du navigateur.
- Détection et blocage des divergences : si les appareils ont des changements locaux concurrents, une **résolution manuelle** est proposée. L'API Drive de cette implémentation n'offre **pas de compare-and-swap atomique** : une collision d'écriture au même instant reste possible. Conservez des exports JSON **indépendants** régulièrement.
- Si plusieurs fichiers de sauvegarde de même nom sont présents, l'application stoppe la synchronisation, sans effacer de fichier.
- **Supabase n'est plus utilisé** par cette version. L'ancien projet Supabase ne se supprime pas automatiquement : si vous souhaitez l'effacer, sauvegardez vos données d'abord.

Références officielles : https://developers.google.com/identity/oauth2/web/guides/use-token-model ; https://developers.google.com/workspace/drive/api/guides/appdata ; https://developers.google.com/workspace/drive/api/guides/manage-uploads
