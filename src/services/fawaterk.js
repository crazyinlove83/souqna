/* Provider adapter. Field mapping and signature verification must be configured from the merchant account's current Fawaterk documentation before production use. */
async function getAccessToken() {
  if (!process.env.FAWATERK_TOKEN_URL || !process.env.FAWATERK_CLIENT_ID || !process.env.FAWATERK_CLIENT_SECRET) throw new Error('Fawaterk OAuth is not configured');
  const response = await fetch(process.env.FAWATERK_TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.FAWATERK_CLIENT_ID, client_secret: process.env.FAWATERK_CLIENT_SECRET }) });
  if (!response.ok) throw new Error(`Fawaterk token request failed (${response.status})`);
  const data = await response.json(); return data.access_token;
}
async function createCheckout({ orderNumber, amount, customer }) {
  if (!process.env.FAWATERK_BASE_URL) throw new Error('Fawaterk checkout endpoint is not configured');
  const token = process.env.FAWATERK_API_KEY || await getAccessToken();
  // Replace only this mapper once the merchant account provides its documented checkout payload/endpoint.
  const response = await fetch(`${process.env.FAWATERK_BASE_URL}/CHECKOUT_ENDPOINT_FROM_DOCS`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ merchant_reference: orderNumber, amount, currency: 'EGP', customer }) });
  if (!response.ok) throw new Error(`Fawaterk checkout request failed (${response.status})`);
  return response.json();
}
function verifyWebhook(_req) { return false; /* Fail closed. Implement Fawaterk's exact current signature algorithm and header name from the merchant documentation, then return true only for a verified request. */ }
module.exports = { getAccessToken, createCheckout, verifyWebhook };
