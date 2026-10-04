/**
 * Obfuscation des secrets échangés avec l'API (même convention que les autres fronts maison).
 * Ce n'est pas du chiffrement : le transport reste protégé par HTTPS.
 */
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function makeid(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) {
    out += ALPHABET[b % ALPHABET.length];
  }
  return out;
}

/** base64 d'une chaîne UTF-8 (btoa seul échoue sur les accents). */
export function encode64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = '';
  for (const b of bytes) {
    bin += String.fromCharCode(b);
  }
  return btoa(bin);
}

/** Mot de passe tel qu'attendu par l'API (User::decodePassword) : sel(18) + base64(mdp) + sel(9). */
export function obfuscatePassword(password: string): string {
  return makeid(18) + encode64(password) + makeid(9);
}

/** Valeur du Bearer attendue par Header::getBearerToken() : base64(sel7 + token + sel4). */
export function obfuscateToken(token: string): string {
  return btoa(makeid(7) + token + makeid(4));
}
