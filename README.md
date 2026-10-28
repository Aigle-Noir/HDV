https://aigle-noir.github.io/HDV/
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
