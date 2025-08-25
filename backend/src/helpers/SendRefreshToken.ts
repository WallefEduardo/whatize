import { Response } from "express";

export const SendRefreshToken = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Configuração robusta para cookies funcionarem com proxy
  const cookieOptions = {
    httpOnly: true,
    secure: false, // Desabilitar secure mesmo em produção se não tiver HTTPS
    sameSite: false as any, // Permitir cross-site em desenvolvimento
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    path: '/', // Cookie disponível em todo o site
  };

  // Em produção, aplicar configurações mais restritivas
  if (isProduction && process.env.USE_HTTPS === 'true') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'strict' as any;
  }
  
  res.cookie("jrt", token, cookieOptions);
  
  // Log detalhado para debug
  console.log('[AUTH] Cookie JRT configurado:', {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    maxAge: cookieOptions.maxAge,
    path: cookieOptions.path,
    tokenLength: token?.length
  });
};
