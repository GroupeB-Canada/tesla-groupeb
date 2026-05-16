# Déploiement tesla.groupeb.ca — AWS Amplify

## Prérequis
- Repo GitHub: `GroupeB-Canada/tesla-groupeb`
- AWS CLI configuré (ca-central-1)
- Compte Stripe live actif
- Tesla Fleet API app créée (Client ID: 4f772719-6fac-4cd1-9e34-eb476886bc60)

---

## 1. DynamoDB — Table des réservations

```bash
aws dynamodb create-table \
  --table-name tesla-groupeb-bookings \
  --attribute-definitions AttributeName=bookingId,AttributeType=S \
  --key-schema AttributeName=bookingId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ca-central-1
```

## 2. AWS Secrets Manager

```bash
# Tesla
aws secretsmanager create-secret \
  --name groupeb/tesla/api \
  --secret-string '{"CLIENT_ID":"4f772719-6fac-4cd1-9e34-eb476886bc60","CLIENT_SECRET":"ta-secret.iSLQq6Y_Je*W_5_R","REFRESH_TOKEN":"AFTER_AUTH","VIN":"YOUR_VIN"}' \
  --region ca-central-1

# Stripe
aws secretsmanager create-secret \
  --name groupeb/tesla/stripe \
  --secret-string '{"SK":"sk_live_...","WH":"whsec_..."}' \
  --region ca-central-1
```

## 3. GitHub → Push

```bash
cd /Users/monsi/Documents/Claude/Projects/location\ de\ voiture/tesla-site
git init
git remote add origin https://github.com/GroupeB-Canada/tesla-groupeb.git
git add .
git commit -m "feat: tesla.groupeb.ca — Fleet API full site"
git push -u origin main
```

## 4. AWS Amplify

```bash
# Créer l'app Amplify
aws amplify create-app \
  --name tesla-groupeb \
  --repository https://github.com/GroupeB-Canada/tesla-groupeb \
  --platform WEB_COMPUTE \
  --region ca-central-1

# Connecter la branche main (récupérer APP_ID depuis la commande précédente)
aws amplify create-branch \
  --app-id APP_ID \
  --branch-name main \
  --stage PRODUCTION

# Variables d'environnement
aws amplify update-app --app-id APP_ID --environment-variables \
  TESLA_CLIENT_ID=4f772719-6fac-4cd1-9e34-eb476886bc60 \
  TESLA_CLIENT_SECRET=ta-secret.iSLQq6Y_Je*W_5_R \
  TESLA_AUDIENCE=https://fleet-api.prd.na.vn.cloud.tesla.com \
  TESLA_VEHICLE_VIN=YOUR_VIN \
  TESLA_REFRESH_TOKEN=YOUR_REFRESH_TOKEN \
  ADMIN_SECRET_TOKEN=Admin7594124 \
  NEXT_PUBLIC_ADMIN_TOKEN=Admin7594124 \
  AWS_REGION=ca-central-1 \
  DYNAMODB_TABLE=tesla-groupeb-bookings \
  NEXT_PUBLIC_APP_URL=https://tesla.groupeb.ca
```

## 5. Route53 — CNAME vers Amplify

```bash
# Récupérer le domain Amplify
aws amplify list-domain-associations --app-id APP_ID

# Dans la console Route53 (groupeb.ca hosted zone)
# Ajouter: tesla.groupeb.ca CNAME → d1234.amplifyapp.com
# OU via CLI:
aws route53 change-resource-record-sets \
  --hosted-zone-id Z_GROUPEB_CA_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "tesla.groupeb.ca",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "d1234.amplifyapp.com"}]
      }
    }]
  }'
```

## 6. Stripe Webhook

Dans dashboard.stripe.com → Webhooks → Ajouter un endpoint:
- URL: `https://tesla.groupeb.ca/api/webhook`
- Événements: `checkout.session.completed`, `checkout.session.expired`

## 7. Tesla Fleet API — Obtenir le Refresh Token

1. Déployer d'abord le site
2. Visiter: `https://groupeb.ca/api/tesla/authorize`
   (redirect vers Tesla OAuth)
3. Autoriser l'application "Location Groupe B"
4. Récupérer le `refresh_token` affiché
5. Mettre à jour dans Amplify: `TESLA_REFRESH_TOKEN=eyJ...`
6. Mettre à jour dans Secrets Manager

## 8. Mettre à jour l'URL de callback Tesla

Dans developer.tesla.com → Application → Modifier:
- Redirect URI: `https://tesla.groupeb.ca/api/tesla/callback`
  (était: `https://groupeb.ca/api/tesla/callback`)

---

## URLs finales

| Page           | URL                                      |
|----------------|------------------------------------------|
| Accueil        | https://tesla.groupeb.ca                |
| Live dashboard | https://tesla.groupeb.ca/live            |
| Réserver       | https://tesla.groupeb.ca/book            |
| Portail client | https://tesla.groupeb.ca/portal          |
| Admin control  | https://tesla.groupeb.ca/admin           |

---

## Vérification post-déploiement

```bash
# Health check
curl https://tesla.groupeb.ca/api/tesla/state

# Commande test (wake up)
curl -X POST https://tesla.groupeb.ca/api/tesla/command \
  -H "Content-Type: application/json" \
  -H "x-admin-token: Admin7594124" \
  -d '{"command":"wake"}'
```

Critère "FIXÉ" = JP teste sur son téléphone réel → portail /portal charge → déverrouillage fonctionne.
