import { getVercelOidcToken } from "@vercel/oidc"

/**
 * RM20289 — on Vercel, sign in to Google Cloud with the deployment's short-lived
 * OIDC token (Workload Identity Federation) instead of a stored service-account
 * key. A leaked env var then grants nothing outside a running deployment.
 *
 * Returns an `external_account` credentials object. Firestore (google-gax) and
 * googleapis each bundle their own google-auth-library, and both GoogleAuth
 * classes build the federated client from this object.
 *
 * Enabled only when both env vars are set, so the key path keeps working until
 * the pool exists (munchies-rn docs/security/service-accounts-RM20289.md, B5):
 *   GCP_WORKLOAD_IDENTITY_PROVIDER    projects/<number>/locations/global/workloadIdentityPools/vercel/providers/vercel
 *   GCP_SERVICE_ACCOUNT_EMAIL         Firestore account for this environment
 *                                     (production: makan-website@, preview: makan-web-preview-reader@)
 *   GCP_SHEETS_SERVICE_ACCOUNT_EMAIL  Sheets account (makan-web-sheets@); optional
 */
export function federatedCredentials(serviceAccountEmail: string | undefined) {
  const provider = process.env.GCP_WORKLOAD_IDENTITY_PROVIDER
  if (!provider || !serviceAccountEmail) return null
  return {
    type: "external_account" as const,
    audience: `//iam.googleapis.com/${provider}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url:
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
  }
}
