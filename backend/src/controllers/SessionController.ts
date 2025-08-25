import { Request, Response } from "express";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";
import dotenv from "dotenv";

import AuthUserService from "../services/UserServices/AuthUserService";
import { SendRefreshToken } from "../helpers/SendRefreshToken";
import { RefreshTokenService } from "../services/AuthServices/RefreshTokenService";
import FindUserFromToken from "../services/AuthServices/FindUserFromToken";
import User from "../models/User";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;
  
  console.log('[LOGIN] Tentativa de login para:', email);

  const { token, serializedUser, refreshToken } = await AuthUserService({
    email,
    password
  });
  
  console.log('[LOGIN] Login bem-sucedido, tokens gerados');
  console.log('[LOGIN] Refresh token será enviado no cookie e no body');
 
  SendRefreshToken(res, refreshToken);

  const io = getIO();

  io.of(serializedUser.companyId.toString())
  .emit(`company-${serializedUser.companyId}-auth`, {
    action: "update",
    user: {
      id: serializedUser.id,
      email: serializedUser.email,
      companyId: serializedUser.companyId,
      token: serializedUser.token
    }
  });
  

  return res.status(200).json({
    token,
    refreshToken, // Retornar também o refresh token para o frontend salvar
    user: serializedUser
  });
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  // Log detalhado para debug
  console.log('[AUTH] Refresh token request:', {
    cookies: req.cookies,
    body: req.body,
    headers: {
      cookie: req.headers.cookie,
      origin: req.headers.origin,
      referer: req.headers.referer
    }
  });

  // Tentar pegar token do cookie primeiro, depois do body
  let token: string = req.cookies.jrt || req.body?.refreshToken;

  if (!token) {
    console.log('[AUTH ERROR] Token JRT não encontrado nos cookies nem no body');
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  console.log('[AUTH] Token encontrado, origem:', req.cookies.jrt ? 'cookie' : 'body');

  const { user, newToken, refreshToken } = await RefreshTokenService(
    res,
    token
  );

  SendRefreshToken(res, refreshToken);

  console.log('[AUTH] Token renovado com sucesso para usuário:', user.id);

  // Retornar também o refresh token no body para o frontend salvar
  return res.json({ 
    token: newToken, 
    refreshToken,
    user 
  });
};

export const me = async (req: Request, res: Response): Promise<Response> => {
  const token: string = req.cookies.jrt;
  const user = await FindUserFromToken(token);
  const { id, profile, super: superAdmin } = user;

  if (!token) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  return res.json({ id, profile, super: superAdmin });
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.user;
  if (id) {
    const user = await User.findByPk(id);
    await user.update({ online: false });
  }
  res.clearCookie("jrt");

  return res.send();
};
