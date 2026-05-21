# Specification securite API front/back

Objectif : securiser les appels entre `library-ihm` et `library-ws` dans le deploiement Docker/LXC, sans exposer de secret applicatif dans le navigateur.

## Contexte

Architecture actuelle :

- `library-ihm` est une SPA React servie par Nginx.
- Le navigateur appelle `/api/*` sur le meme domaine que le front.
- Le Nginx du conteneur front proxifie `/api/*` vers `library-ws` via `NGINX_API_URL` et `NGINX_API_HOST`.
- Le deploiement final est gere dans le repo prive `Nespouique/docker`, sur un LXC avec Docker Compose.

Point critique : une SPA React ne peut pas garder un `client_secret`. Tout secret present dans le front, dans le bundle JS, dans une variable `VITE_*`, ou dans le stockage navigateur doit etre considere public.

## Decision recommandee

Utiliser OAuth2/OIDC avec un fournisseur d'identite interne et un proxy serveur qui porte le compte applicatif.

Architecture cible recommandee :

```text
Browser
  -> library-front Nginx (/)
  -> library-front Nginx (/api/*)
  -> auth proxy / token injector cote serveur
  -> library-ws
  -> MySQL
```

Le navigateur ne connait pas le secret applicatif. Le secret est stocke uniquement dans l'environnement Docker du proxy/Nginx/backend, via le repo `Nespouique/docker` ou des secrets Docker.

## Options et choix

### Option A - Client credentials cote proxy, recommandee pour compte applicatif

Le front Nginx ou un petit proxy serveur obtient un token OAuth2 en `client_credentials`, puis ajoute `Authorization: Bearer <access_token>` aux requetes vers `library-ws`.

Avantages :

- Correspond au besoin : un compte applicatif pour que le front tape les API.
- Aucun secret dans le navigateur.
- Peu d'impact sur le code React.
- Compatible avec le proxy `/api` existant.

Inconvenients :

- Tous les utilisateurs du front partagent les memes droits applicatifs.
- Ne permet pas d'identifier l'utilisateur final, seulement l'application.

### Option B - OIDC Authorization Code + PKCE cote front

Le navigateur redirige l'utilisateur vers un provider OIDC, recupere un token via Authorization Code + PKCE, puis appelle `/api` avec ce token.

Avantages :

- Authentification utilisateur reelle.
- Possibilite de roles/scopes par utilisateur.

Inconvenients :

- Plus complexe.
- Necessite gestion session/token cote front.
- Ce n'est pas un compte applicatif, mais une authentification utilisateur.

### Option C - API key statique injectee par Nginx

Nginx ajoute un header secret statique vers `library-ws`.

Avantages :

- Simple.

Inconvenients :

- Moins robuste qu'OAuth2.
- Rotation et audit moins propres.
- A eviter si OAuth2 est faisable.

Choix propose : Option A en premier, avec une evolution possible vers Option B si l'application doit gerer de vrais utilisateurs.

## Composants a ajouter

### Fournisseur OAuth2/OIDC

Choix possibles :

- Keycloak, recommande si tu veux une solution self-hosted complete.
- Authentik, alternative self-hosted plus moderne.
- Zitadel, possible mais plus oriente service externe/self-hosted avance.
- Authelia, utile en reverse proxy mais moins adapte si tu veux des JWT OAuth2 complets pour API.

Recommendation pragmatique : Keycloak dans le stack Docker, sauf si ton repo `Nespouique/docker` contient deja un provider d'identite.

### Auth proxy / token injector

Deux approches possibles :

1. Ajouter un petit service Node/Express `library-api-gateway`.
2. Etendre Nginx avec Lua/OpenResty pour recuperer et cacher le token.

Recommendation : petit service Node `library-api-gateway`, plus maintenable que Lua dans Nginx.

Responsabilites du gateway :

- Recevoir les appels `/api/*` depuis le front.
- Obtenir un access token via `client_credentials`.
- Cacher le token en memoire jusqu'a expiration.
- Ajouter `Authorization: Bearer <token>` vers `library-ws`.
- Forwarder method, path, query, body, headers utiles.
- Ne jamais exposer le token au navigateur.
- Retourner les erreurs API de maniere transparente.

## Flux OAuth2 client credentials

```text
library-api-gateway
  POST /realms/library/protocol/openid-connect/token
    grant_type=client_credentials
    client_id=library-ihm
    client_secret=<secret serveur>
  <- access_token JWT, expires_in

Browser
  GET /api/books
  -> Nginx front
  -> library-api-gateway
  -> GET http://library-ws:3000/books
       Authorization: Bearer <access_token>
```

## Changements `library-ws`

### Middleware JWT

Ajouter un middleware d'authentification sur toutes les routes API, sauf :

- `/health` ou endpoint equivalent a creer.
- `/api-docs` selon choix. En production, idealement proteger ou desactiver Swagger.

Le middleware doit :

- Lire `Authorization: Bearer <token>`.
- Verifier signature JWT via JWKS du provider OIDC.
- Verifier `iss` attendu.
- Verifier `aud` attendu, par exemple `library-ws`.
- Verifier expiration.
- Verifier scopes/roles.
- Retourner `401` si token absent/invalide.
- Retourner `403` si token valide mais scope insuffisant.

Scopes recommandes :

- `library:read` pour GET.
- `library:write` pour POST/PUT/PATCH/DELETE.
- Optionnel : `library:kubes` pour upload/suppression SVG.

Mapping minimal :

| Methode   | Scope requis    |
| --------- | --------------- |
| GET       | `library:read`  |
| POST      | `library:write` |
| PUT/PATCH | `library:write` |
| DELETE    | `library:write` |

Variables d'environnement `library-ws` :

```env
AUTH_ENABLED=true
OIDC_ISSUER_URL=https://auth.example.com/realms/library
OIDC_JWKS_URI=https://auth.example.com/realms/library/protocol/openid-connect/certs
OIDC_AUDIENCE=library-ws
OIDC_REQUIRED_READ_SCOPE=library:read
OIDC_REQUIRED_WRITE_SCOPE=library:write
```

Libs Node possibles :

- `jose` pour verifier les JWT/JWKS, recommande.
- `express-oauth2-jwt-bearer` si tu veux une integration Express plus directe.

Recommendation : `jose`, explicite et standard.

### CORS et exposition reseau

Apres securisation :

- En production, `library-ws` ne devrait pas etre expose publiquement si seul le front/gateway l'appelle.
- Dans Docker Compose, eviter `ports: "3000:3000"` pour `library-ws` si pas necessaire.
- Utiliser `expose: ["3000"]` et un network Docker interne.
- Si un reverse proxy externe doit joindre `library-ws`, il doit aussi transmettre l'auth.

## Changements `library-ihm`

### React

Avec l'Option A, aucun token n'est gere dans React.

Changements probables :

- Aucun changement dans `src/services/api.js`, car les appels restent sur `/api`.
- Ameliorer la gestion des erreurs `401`/`403` pour afficher un message clair : API non autorisee ou configuration du compte applicatif invalide.

### Nginx front

Modifier `nginx.conf` pour proxifier `/api/*` vers le gateway au lieu de `library-ws` directement.

Variables :

```env
NGINX_API_URL=http://library-api-gateway:8080
NGINX_API_HOST=library-api-gateway:8080
```

Le navigateur continue d'appeler `/api/*`.

## Nouveau service `library-api-gateway`

Deux options d'implementation :

- Nouveau repo dedie.
- Sous-dossier dans `library-ws` ou `library-ihm`.

Recommendation : nouveau petit service dedie ou sous-dossier du repo Docker si tu veux centraliser l'infra. Pour la maintenance applicative, un repo dedie est plus propre.

Endpoints :

- `GET /health` : healthcheck gateway.
- `/*` : proxy transparent vers `library-ws`.

Variables d'environnement :

```env
PORT=8080
TARGET_API_URL=http://library-ws:3000
OIDC_TOKEN_URL=https://auth.example.com/realms/library/protocol/openid-connect/token
OIDC_CLIENT_ID=library-ihm
OIDC_CLIENT_SECRET=<secret serveur uniquement>
OIDC_SCOPE=library:read library:write
TOKEN_REFRESH_MARGIN_SECONDS=30
```

Contraintes gateway :

- Timeout explicite.
- Taille maximale de body compatible avec uploads existants.
- Support `multipart/form-data` pour jaquettes et SVG kubes.
- Ne pas forcer `Content-Type: application/json` sur les uploads.
- Forwarder `X-Request-ID` ou en generer un.
- Logs sans token ni secret.

## Changements repo `Nespouique/docker`

Le compose prive devra porter les secrets et le reseau.

Exemple cible simplifie :

```yaml
services:
    library-front:
        image: nespouique/library-front:latest
        environment:
            - NGINX_API_URL=http://library-api-gateway:8080
            - NGINX_API_HOST=library-api-gateway:8080
        depends_on:
            - library-api-gateway
        networks:
            - library-network

    library-api-gateway:
        image: nespouique/library-api-gateway:latest
        environment:
            - PORT=8080
            - TARGET_API_URL=http://library-ws:3000
            - OIDC_TOKEN_URL=https://auth.example.com/realms/library/protocol/openid-connect/token
            - OIDC_CLIENT_ID=library-ihm
            - OIDC_SCOPE=library:read library:write
            - TOKEN_REFRESH_MARGIN_SECONDS=30
        secrets:
            - library_ihm_client_secret
        depends_on:
            - library-ws
        networks:
            - library-network

    library-ws:
        image: nespouique/library-ws:latest
        expose:
            - '3000'
        environment:
            - AUTH_ENABLED=true
            - OIDC_ISSUER_URL=https://auth.example.com/realms/library
            - OIDC_JWKS_URI=https://auth.example.com/realms/library/protocol/openid-connect/certs
            - OIDC_AUDIENCE=library-ws
            - OIDC_REQUIRED_READ_SCOPE=library:read
            - OIDC_REQUIRED_WRITE_SCOPE=library:write
        networks:
            - library-network

secrets:
    library_ihm_client_secret:
        file: ./secrets/library_ihm_client_secret.txt
```

Si Docker secrets n'est pas pratique hors Swarm, utiliser un `.env` non versionne dans `Nespouique/docker`, mais jamais dans `library-ihm` ou `library-ws` publics.

## Configuration Keycloak proposee

Realm : `library`

Client API :

- Client ID : `library-ws`
- Type : bearer-only ou audience cible selon version Keycloak.
- Audience attendue : `library-ws`.

Client applicatif :

- Client ID : `library-ihm`
- Client authentication : enabled.
- Service accounts : enabled.
- Standard flow : disabled si uniquement client credentials.
- Direct access grants : disabled.
- Valid redirect URIs : aucun pour client credentials.
- Scopes assignes : `library:read`, `library:write`.

Scopes :

- `library:read`
- `library:write`

Token :

- Access token lifespan court, par exemple 5 a 15 minutes.
- Rotation du client secret documentee.

## Plan d'implementation

### Phase 1 - Provider OIDC

1. Ajouter Keycloak/Auth provider au compose prive ou utiliser un provider existant.
2. Creer realm/client/scopes.
3. Verifier qu'un `client_credentials` retourne un JWT avec `iss`, `aud`, `scope` corrects.

### Phase 2 - Securiser `library-ws`

1. Ajouter dependance JWT/JWKS.
2. Ajouter middleware auth configurable par `AUTH_ENABLED`.
3. Ajouter verification scopes par methode HTTP.
4. Ajouter endpoint `/health` non protege.
5. Adapter Swagger ou le proteger.
6. Tests unitaires middleware : token absent, invalide, expire, scope insuffisant, scope OK.

### Phase 3 - Ajouter gateway applicatif

1. Creer service gateway.
2. Implementer recuperation token client credentials avec cache.
3. Implementer proxy transparent incluant uploads multipart.
4. Ajouter logs sans secrets.
5. Ajouter healthcheck.
6. Publier image Docker du gateway.

### Phase 4 - Adapter deployment Docker

1. Modifier compose prive `Nespouique/docker`.
2. `library-front` pointe vers gateway.
3. `library-ws` n'expose plus le port publiquement si possible.
4. Ajouter secrets/env non versionnes.
5. Tester sur LXC.

### Phase 5 - Front UX erreurs auth

1. Dans `src/services/api.js`, distinguer `401` et `403`.
2. Afficher un toast/message clair : configuration API non autorisee.
3. Ne jamais afficher token, secret, ou details internes.

## Tests d'acceptation

### Tests locaux

- `library-ws` avec `AUTH_ENABLED=false` fonctionne comme avant.
- `library-ws` avec `AUTH_ENABLED=true` refuse les appels sans token.
- Appel avec token valide et `library:read` accepte GET.
- Appel avec token read-only refuse POST/PUT/DELETE.
- Appel avec token `library:write` accepte mutations.
- Upload jaquette fonctionne via gateway.
- Upload/suppression SVG kubes fonctionne via gateway.

### Tests deploiement LXC

- Le front charge correctement.
- Les appels `/api/*` passent par le gateway.
- `library-ws:3000` n'est pas accessible depuis l'exterieur si non necessaire.
- Les secrets ne sont pas visibles dans le bundle front.
- Les logs ne contiennent pas `Authorization`, `access_token`, `client_secret`.

## Anti-patterns interdits

- Mettre `client_secret` dans React, `VITE_*`, `localStorage`, `sessionStorage` ou le bundle.
- Ajouter un header secret depuis le navigateur.
- Desactiver TLS en public.
- Laisser Swagger public en production avec endpoints executables non proteges.
- Logger les tokens OAuth2.
- Exposer `library-ws` publiquement sans auth.

## Questions a trancher avant implementation

1. Le provider OAuth2 existe-t-il deja dans `Nespouique/docker`, ou faut-il ajouter Keycloak/AuthentiK ?
2. Veux-tu seulement un compte applicatif, ou aussi une authentification utilisateur plus tard ?
3. `library-ws` doit-il rester accessible directement depuis le reseau local, ou uniquement via `library-front/gateway` ?
4. Souhaites-tu proteger Swagger en production ou le desactiver ?
5. Faut-il publier une image dediee `nespouique/library-api-gateway` ?

## Definition of done

- Aucun secret n'est present dans `library-ihm`.
- `library-ws` refuse les appels non authentifies en production.
- `library-ihm` continue d'appeler `/api` sans connaitre OAuth2.
- Le compte applicatif est stocke uniquement cote serveur/deploiement.
- Le compose prive de production gere les secrets.
- Les tests read/write/upload passent via gateway.
