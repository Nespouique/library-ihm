# Spécification technique — Authentification (PRD)

Date: 2026-06-07

## Objectif

Fournir une spécification technique claire pour implémenter l'authentification dans l'application "library" (IHM + WS). Le but : sécuriser l'accès, permettre l'inscription / connexion / gestion de session, et fournir un plan d'implémentation réalisable et auditable.

## Contexte

- Frontend principal : projet `library-ihm` (React/Vite).
- Backend (service web) : projet `library-ws` (locally: C:\Users\halla\git\library-ws).
- Référence compose complète (exemples d'images/env) : https://github.com/Nespouique/docker/blob/main/compose/library-full/docker-compose.yml

## Principes et exigences

- Auth sécurisé basée sur JWT (access + refresh) ou sessions cookies sécurisées (option), en favorisant la compatibilité API-first pour `library-ws`.
- Mots de passe stockés avec un algorithme moderne (Argon2id recommandé, sinon bcrypt >= 12).
- Email verification lors de l'inscription.
- Refresh token rotatif et possibilité de revocation (blacklist/revocation table).
- CORS, CSRF, secure cookies, TLS obligatoire en production.
- RBAC minimal : `user`, `admin` (possibilité d'ajouter roles supplémentaires).
- Logs d'audit pour actions sensibles (login échec/réussite, reset mot de passe).

## API — Endpoints proposés

Base path pour auth : `/api/auth`

- POST `/api/auth/register`

    - Body: `{ "email": "...", "password": "...", "displayName"?: "..." }`
    - Réponses: 201 + `{ user: {...}, needsVerification: true }` ou 400/422.
    - Action: créer `user` (password hash), générer token de verification par mail.

- POST `/api/auth/login`

    - Body: `{ "email": "...", "password": "..." }`
    - Réponses: 200 + `{ accessToken, refreshToken, user: {...} }` ou 401.
    - Option cookie: set `refreshToken` en cookie `HttpOnly; Secure; SameSite=Strict`.

- POST `/api/auth/refresh`

    - Body or Cookie: `refreshToken`
    - Réponses: 200 + `{ accessToken, refreshToken }` (rotation)
    - Implémentation: vérifier rotation, stocker/revoquer anciens refresh tokens.

- POST `/api/auth/logout`

    - Body or Cookie: `refreshToken`
    - Réponse: 204
    - Action: révoquer refresh token (supprimer ou marquer invalide).

- GET `/api/auth/me`

    - Header: `Authorization: Bearer <accessToken>`
    - Réponse: 200 + `{user}`

- POST `/api/auth/request-password-reset`

    - Body: `{ "email" }` -> envoi mail avec token court.

- POST `/api/auth/reset-password`

    - Body: `{ "token", "newPassword" }` -> change password, invalide tokens existants.

- GET `/api/auth/verify-email?token=...`
    - Action: valider le user.email_verified_at

## Modèle de données (DB)

Table `users` (extrait)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  roles TEXT[] DEFAULT ARRAY['user']::TEXT[],
  email_verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT now(),
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT false,
  replaced_by_token TEXT NULL
);
```

## Sécurité et bonnes pratiques

- Password hashing: Argon2id (params documentés) ou bcrypt salt rounds >= 12.
- TLS partout; en dev, utiliser compose certs ou `traefik`/nginx proxy.
- Rate-limit endpoints sensibles (login, password-reset) par IP et par compte.
- CSRF: si vous utilisez cookies pour refresh tokens, protéger avec token CSRF (double submit cookie) ou SameSite=strict/lax.
- CORS: restreindre l'origine au domaine IHM en prod.
- HTTP security headers: `Strict-Transport-Security`, `X-Frame-Options`, `Content-Security-Policy`.
- Session invalidation: à la modification du mot de passe, invalider tous les refresh tokens.

## Configuration / Variables d'environnement

- JWT_SECRET: secret HMAC (ou clé privée pour JWT RS256)
- JWT_ACCESS_EXP: e.g. `15m`
- JWT_REFRESH_EXP: e.g. `30d`
- BCRYPT_ROUNDS / ARGON2_PARAMS
- SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
- COOKIE_SECURE=true/false
- CORS_ALLOWED_ORIGINS
- RATE_LIMIT_LOGIN

## Variables d'environnement détectées (audit `library-ws`)

Fichiers inspectés: `library-ws/.env.example`, `library-ws/docker-compose.yml`.

Principales variables observées:

- DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- NODE_ENV, PORT
- AUTH_ENABLED, AUTH_MODE (oidc|static)
- OIDC_ISSUER_URL, OIDC_JWKS_URI, OIDC_AUDIENCE, OIDC_REQUIRED_READ_SCOPE, OIDC_REQUIRED_WRITE_SCOPE
- API_CLIENT_ID, API_CLIENT_SECRET
- GATEWAY\_\* (TOKEN_URL, CLIENT_ID/SECRET, SCOPE, TIMEOUT, BODY_LIMIT)

Observations importantes:

- `docker-compose.yml` de `library-ws` contient des mots de passe en clair pour MySQL (`MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`). Ces secrets doivent être externalisés (Docker secrets, env files non commités, ou secret manager).
- Le repo supporte deux modes d'auth: OIDC (délégué à un provider) ou `static` (client/secret). Le choix impactera fortement l'implémentation: si OIDC est disponible, préférer déléguer l'auth et utiliser JWKS pour validation de tokens; sinon implémenter l'auth complète côté `library-ws` (JWT + refresh tokens).

## Actions recommandées pour `docker-compose` et déploiement

1. Externaliser les secrets: utiliser `secrets:` dans `docker-compose` ou un `.env` hors dépôt. Exemple minimal:

```yaml
services:
    library-ws:
        environment:
            - DB_HOST=mysql
            - DB_USER=library_user
            - DB_PASSWORD_FILE=/run/secrets/mysql_password
secrets:
    mysql_password:
        file: ./secrets/mysql_password
```

2. Ajouter les variables d'auth nécessaires pour la spécification (si implémentation interne):

- `JWT_SECRET` (ou clé privée RS256 + `JWT_PRIVATE_KEY_FILE` / `JWT_PUBLIC_KEY_FILE`)
- `JWT_ACCESS_EXP`, `JWT_REFRESH_EXP`
- `REFRESH_TOKEN_ROTATION=true`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (ou `RESEND_API_KEY`)
- `COOKIE_SECURE=true` (en prod), `COOKIE_SAMESITE=Strict`
- `CORS_ALLOWED_ORIGINS` (front-end domain)

3. Si on utilise OIDC (mode recommandé si vous avez un IdP): ajouter `AUTH_ENABLED=true`, `AUTH_MODE=oidc` et configurer `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID` (gateway and API clients) et secrets via Docker secrets.

4. Mettre en place une variable `ENV=production|staging|development` et ajuster le comportement (rate-limits, SMTP mock en dev).

5. Documenter `.env.example` et ajouter un `docker-compose.override.yml` pour dev afin de ne pas exposer secrets en repo.

## Docker / Déploiement

- Le fichier `docker-compose` utilisé par le workspace complet se trouve ici:
  https://github.com/Nespouique/docker/blob/main/compose/library-full/docker-compose.yml
- Ajouter/mettre à jour les variables d'environnement pour `library-ws` service (JWT, SMTP, DB credentials).
- Veiller à un service SMTP (ou un container de mock en dev) et un store persistent pour la DB.

## Intégration Frontend (`library-ihm`)

- Auth flow côté client:

    - Formulaire d'inscription -> POST `/api/auth/register`.
    - Connexion -> POST `/api/auth/login` ; stocker `accessToken` en mémoire (non persistent) et `refreshToken` en cookie HttpOnly (préféré), ou utiliser `localStorage` seulement si cookies non souhaités (moins sûr).
    - Intercepteur HTTP (fetch/axios): ajouter header `Authorization` pour les calls; si 401 -> tenter `/api/auth/refresh` puis rejouer la requête.
    - Afficher états: connecté / role admin.

- Fichiers frontend à modifier: util auth (ex: `src/services/api.js`) et composants `Login`, `Register`, `Profile`.

## Tests & Validation

- Tests unitaires pour les services d'auth (hashing, token generation).
- Tests d'intégration pour endpoints auth (happy path & erreurs).
- Test E2E: inscription/login/refresh/logout/password-reset.

## Migration & rollout

1. Préparer migration DB (ajout tables / colonnes).
2. Déployer `library-ws` en mode read-only (routes non-auth encore ouvertes) et migrer DB.
3. Déployer backend avec feature flag auth activé et tests internes.
4. Mettre à jour IHM pour consommer endpoints et tester en staging.
5. Basculer production (forcer HTTPS, vérifier SMTP et env vars).

## Checklist d'implémentation

- [ ] Schema DB appliqué
- [ ] Endpoints créés et testés
- [ ] Email verification + SMTP configuré
- [ ] Refresh token rotation + revocation table en place
- [ ] Frontend flows (register/login/refresh/logout) implémentés
- [ ] Tests automatisés (unit/integration/e2e)
- [ ] Documentation développeur + variables d'env

## Annexes — exemples de payloads

- `accessToken` (JWT) payload minimal:

```json
{
  "sub": "user-id-uuid",
  "email": "user@example.com",
  "roles": ["user"],
  "iat": 168...,
  "exp": 168...
}
```

- Réponse login (JSON):

```json
{
    "accessToken": "ey...",
    "refreshToken": "rftkn...",
    "user": { "id": "...", "email": "...", "roles": ["user"] }
}
```

## Prochaines étapes proposées

1. Valider ce document (portée & choix JWT vs session cookie).
2. Je peux ouvrir `library-ws` et proposer les changements code/PR (migrations, routes) si tu veux.
3. Optionnel: je peux générer des exemples de code pour `library-ws` (Express/Koa/Fastify) et patchs frontend (`src/services/api.js`).

## Contact et références

- Compose référence: https://github.com/Nespouique/docker/blob/main/compose/library-full/docker-compose.yml
- Repo WS local: C:\Users\halla\git\library-ws

---

Fin de la spécification initiale.

## Référence — implémentation Momentum

Le repo `Nespouique/momentum` contient une implémentation complète d'auth qui peut servir de modèle :

- Backend: `apps/api` — bcrypt (12 rounds), JWT (jsonwebtoken), Zod pour validation, Prisma pour DB.
- Frontend: `apps/web` — Next.js, React Hook Form + Zod, Zustand `auth` store, pages `/(auth)/login`, `/(auth)/register`, `/(auth)/forgot-password`, `/(auth)/reset-password`.
- Password reset: génération d'un token aléatoire (crypto.randomBytes), stockage du hash (SHA-256) et délai d'expiration (1h), envoi via Resend (ou SMTP), endpoint `POST /auth/reset-password` qui vérifie le token hashé.
- Middleware d'API: extraction du JWT depuis `Authorization: Bearer`, vérification et injection de `req.userId`.

Points réutilisables pour `library`:

- Schémas Zod et patterns de validation côté client et serveur.
- Flow de reset mot de passe (token plain -> hash en DB -> validation -> clear fields après reset).
- Structure d'endpoints et codes d'erreur uniformes (EXPIRED_RESET_TOKEN, INVALID_RESET_TOKEN, INVALID_CREDENTIALS).

## Recommandations détaillées — État de l'art pour SaaS

Les pratiques suivantes reflètent l'état actuel du marché SaaS et vont au-delà d'une simple implémentation basique :

- Hashing des mots de passe : préférer Argon2id si possible (meilleure résistance GPU/ASIC). Si on reste sur bcrypt, utiliser >= 12 rounds et documenter les paramètres.
- Tokens : utiliser des access tokens courts (ex: 15 minutes) et des refresh tokens persistants plus longs (ex: 30 jours) avec rotation (rotate on refresh) et détection de réutilisation (compromised token reuse detection).
- Stockage des refresh tokens : stocker un identifiant / hash côté serveur (table `refresh_tokens`) pour permettre révocation et gestion multi-device/session.
- Cookies vs localStorage : stocker `refreshToken` en cookie `HttpOnly; Secure; SameSite=Strict` et `accessToken` en mémoire. Eviter `localStorage` pour les tokens critiques.
- CSRF : si on utilise des cookies, appliquer une stratégie anti-CSRF (double submit cookie ou header CSRF pour les requêtes mutatives).
- JWT signing : utiliser une clé secrète robuste (>= 32 bytes) ou adopter RS256 (clé privée/publique) pour rotation plus facile. Prévoir un mécanisme de rotation des clés (kid header).
- Password reset tokens : envoyer un token non-hashé par e-mail mais stocker uniquement son hash (SHA-256) en DB; tokens single-use, expiration courte (1h), supprimer/clear après usage.
- Email enumeration : endpoints `forgot-password` doivent toujours répondre 200 avec message générique.
- Rate limiting & protection bruteforce : appliquer rate limits sur `login`, `forgot-password` et endpoints critiques; implémenter lockout progressif / captcha après X échecs.
- MFA (optionnel mais recommandé) : prévoir TOTP (RFC6238) ou WebAuthn pour comptes à privilèges.
- Session management : interface d'administration pour révoquer sessions utilisateur (logout-all), et endpoint `POST /auth/logout` qui révoque refresh token courant.
- Logging & monitoring : logs d'audit pour tentatives de connexion, échecs, réinitialisations de mot de passe; exporter métriques (login success/fail rates) et alertes sur anomalies.
- Sécurité infra : forcer TLS, HSTS, helmet headers, CSP adapté; stocker secrets dans un secret manager (Vault, AWS Secrets Manager) et ne pas exposer `.env` en clair.

## Concrètement pour `library` (liste d'actions)

1. Choix du modèle : JWT short-lived + refresh tokens rotatifs stockés en DB.
2. Schéma DB : ajouter `refresh_tokens` + champs reset token hashed sur `users` (ou table dédiée).
3. Implémenter services backend : `auth.service` (hash/compare, generate/verify token), `password-reset.service` (generate plain, hash store, validate), `refresh-token.service` (issue, rotate, revoke).
4. Endpoints : conformer à la spec proposée plus endpoints pour `POST /auth/refresh` et `POST /auth/revoke`.
5. Frontend : intercepteur HTTP pour gérer refresh automatique; stocker accessToken en mémoire; stocker refreshToken en cookie HttpOnly; UX pour expired sessions.
6. Tests : unitaires pour services, intégration pour endpoints, E2E pour flows (register/login/forgot/reset/logout/refresh).
7. Déploiement : ajouter variables env dans `docker-compose` (`JWT_SECRET`, `RESEND_API_KEY`/SMTP, DB creds); vérifier `docker-compose` de référence pour bonnes pratiques de secrets et services annexes.

## Checklist étendue

- [ ] Choix Argon2id vs bcrypt validé
- [ ] Table `refresh_tokens` et migration ready
- [ ] Endpoints `refresh` et `revoke` implémentés
- [ ] Reset token hashed + mailer (Resend/SMTP) configuré
- [ ] Rate limiting et lockout configurés
- [ ] Tests automatisés pour tous les flows
- [ ] Documentation développeur mise à jour (`.env.example`, README)
