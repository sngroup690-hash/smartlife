let tokenCache: { value: string; expiresAt: number } | null = null;

export function cinetpayBaseUrl(apiKey: string) {
  return apiKey.startsWith("sk_live_")
    ? "https://api.cinetpay.co"
    : "https://api.cinetpay.net";
}

export async function getCinetpayToken(apiKey: string, apiPassword: string): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.value;
  const res = await fetch(`${cinetpayBaseUrl(apiKey)}/v1/oauth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, api_password: apiPassword }),
  });
  const json = await res.json();
  const token: string | undefined = json.token ?? json.data?.token ?? json.access_token;
  if (!token) throw new Error("Auth CinetPay échouée: " + JSON.stringify(json));
  tokenCache = { value: token, expiresAt: Date.now() + 22 * 3_600_000 };
  return token;
}
