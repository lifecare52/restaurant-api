export interface CorsConfig {
  allowedOrigins: string[];
  allowCredentials: boolean;
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
}

const toList = (value: string | undefined, fallback: string): string[] =>
  (value ?? fallback)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

export const getCorsConfig = (): CorsConfig => {
  const allowedOrigins = toList(process.env.CORS_ORIGINS, '*');
  const allowCredentials = ['true', '1', 'yes'].includes(
    (process.env.CORS_ALLOW_CREDENTIALS ?? '').toLowerCase(),
  );
  const allowedMethods = toList(
    process.env.CORS_ALLOWED_METHODS,
    'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  );
  const allowedHeaders = toList(process.env.CORS_ALLOWED_HEADERS, 'Content-Type, Authorization');
  const exposedHeaders = toList(process.env.CORS_EXPOSED_HEADERS, '');
  return { allowedOrigins, allowCredentials, allowedMethods, allowedHeaders, exposedHeaders };
};

export default getCorsConfig;
