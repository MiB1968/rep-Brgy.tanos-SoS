import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// FIX: removed the hardcoded "brgy-tanod-sos-secret-2024" fallback.
// A missing secret means the server was misconfigured — failing loudly at
// startup is far safer than silently signing tokens with a public string
// that any attacker can find in this source file.
const JWT_SECRET = process.env.JWT_SECRET ?? process.env.SESSION_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET (or SESSION_SECRET) environment variable must be set. " +
      "Refusing to start with an empty signing key.",
  );
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET!) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
