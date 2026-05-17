import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';

export interface JwtClaims {
  id: string;
  role: string;
  brandId?: string;
  outlets?: string[];
  permissions?: string[];
}

export const signToken = (
  claims: JwtClaims,
  expiresIn: SignOptions['expiresIn'] = '7d',
): string => {
  const secret = process.env.JWT_SECRET as Secret;
  return jwt.sign(claims, secret, { expiresIn });
};

export const verifyToken = (token: string): JwtClaims => {
  const secret = process.env.JWT_SECRET as Secret;
  return jwt.verify(token, secret) as JwtClaims;
};
