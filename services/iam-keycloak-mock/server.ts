import express from 'express';

const app = express();
const PORT = 8080;

app.use(express.json());

console.log(`[IAM-OAUTH2] Simulation Active Directory / Keycloak OIDC Provider`);

// Route de simulation de login SSO Nigelec
app.post('/realms/nigelec/protocol/openid-connect/token', (req, res) => {
  const authHeader = req.headers.authorization;
  
  // Dans un vrai environnement, cela validerait avec LDAP/AD
  console.log(`[IAM-OAUTH2] Demande d'authentification reçue via interface : OAuth2 Client Credentials ou Resource Owner Password Credentials`);

  // Génération d'un JWT d'entreprise (SSO) Mocké
  const mockedIdToken = "eyJhb...mocked_tier1_enterprise_token...xyz";
  
  res.json({
    access_token: mockedIdToken,
    expires_in: 3600,
    refresh_expires_in: 1800,
    refresh_token: "mocked_refresh_token",
    token_type: "Bearer",
    "not-before-policy": 0,
    session_state: "c8e2bdc0-30ab-488f-a9cb-b0dfcde11ff8",
    scope: "openid profile email nigelec_operator_role"
  });
});

// Route OIDC Discovery
app.get('/realms/nigelec/.well-known/openid-configuration', (req, res) => {
  res.json({
    issuer: "http://iam-keycloak:8080/realms/nigelec",
    authorization_endpoint: "http://iam-keycloak:8080/realms/nigelec/protocol/openid-connect/auth",
    token_endpoint: "http://iam-keycloak:8080/realms/nigelec/protocol/openid-connect/token",
    jwks_uri: "http://iam-keycloak:8080/realms/nigelec/protocol/openid-connect/certs",
    response_types_supported: ["code", "token", "id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"]
  });
});

app.listen(PORT, () => {
  console.log(`[IAM-OAUTH2] Prêt et en écoute sur 0.0.0.0:${PORT} (Découverte OIDC exposée)`);
});
