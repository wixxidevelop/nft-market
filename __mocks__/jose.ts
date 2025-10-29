import { sign, verify } from 'jsonwebtoken';

class SignJWT {
  private payload: any;
  private options: any = {};

  constructor(payload: any) {
    this.payload = payload;
  }

  setProtectedHeader(_header: any) {
    return this;
  }

  setIssuedAt() {
    return this;
  }

  setExpirationTime(exp: string) {
    this.options.expiresIn = exp;
    return this;
  }

  setIssuer(iss: string) {
    this.options.issuer = iss;
    return this;
  }

  setAudience(aud: string) {
    this.options.audience = aud;
    return this;
  }

  setJti(jti: string) {
    this.options.jwtid = jti;
    return this;
  }

  async sign(secret: Uint8Array | string): Promise<string> {
    const secretStr = typeof secret === 'string' ? secret : (process.env.JWT_SECRET || 'test-secret');
    return sign(this.payload, secretStr, this.options as any);
  }
}

async function jwtVerify(token: string, secret: Uint8Array | string, options?: any): Promise<{ payload: any }> {
  const secretStr = typeof secret === 'string' ? secret : (process.env.JWT_SECRET || 'test-secret');
  const payload = verify(token, secretStr, options as any);
  return { payload };
}

export { SignJWT, jwtVerify };