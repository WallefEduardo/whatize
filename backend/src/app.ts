import "./bootstrap";
import "reflect-metadata";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import * as Sentry from "@sentry/node";
import { config as dotenvConfig } from "dotenv";
import bodyParser from 'body-parser';

import "./database";
import uploadConfig from "./config/upload";
import AppError from "./errors/AppError";
import routes from "./routes";
import logger from "./utils/logger";
import { messageQueue, sendScheduledMessages } from "./queues";
import BullQueue from "./libs/queue"
import BullBoard from 'bull-board';
import basicAuth from 'basic-auth';
import { sanitizeFileName } from "./utils/sanitizeFileName";

// Função de middleware para autenticação básica
export const isBullAuth = (req, res, next) => {
  const user = basicAuth(req);

  if (!user || user.name !== process.env.BULL_USER || user.pass !== process.env.BULL_PASS) {
    res.set('WWW-Authenticate', 'Basic realm="example"');
    return res.status(401).send('Authentication required.');
  }
  next();
};

// Carregar variáveis de ambiente
dotenvConfig();

// Inicializar Sentry
Sentry.init({ dsn: process.env.SENTRY_DSN });

const app = express();

// Configuração para evitar problemas de decodificação de parâmetros
app.set('query parser', 'simple');
app.set('strict routing', false);
app.set('case sensitive routing', false);

// Configuração de filas
app.set("queues", {
  messageQueue,
  sendScheduledMessages
});

// Configuração dinâmica de CORS para suportar desenvolvimento e produção
const allowedOrigins = [
  process.env.FRONTEND_URL, // URL principal do frontend
  process.env.BACKEND_URL,  // URL do próprio backend
  // Portas comuns para desenvolvimento
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:5173', // Porta padrão do Vite
  'http://localhost:5174',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3000'
].filter(Boolean); // Remove valores undefined

// Configuração do BullBoard
if (String(process.env.BULL_BOARD).toLocaleLowerCase() === 'true' && process.env.REDIS_URI_ACK !== '') {
  BullBoard.setQueues(BullQueue.queues.map(queue => queue && queue.bull));
  app.use('/admin/queues', isBullAuth, BullBoard.UI);
}

// Middlewares
// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'", "http://localhost:8080"],
//       imgSrc: ["'self'", "data:", "http://localhost:8080"],
//       scriptSrc: ["'self'", "http://localhost:8080"],
//       styleSrc: ["'self'", "'unsafe-inline'", "http://localhost:8080"],
//       connectSrc: ["'self'", "http://localhost:8080"]
//     }
//   },
//   crossOriginResourcePolicy: false, // Permite recursos de diferentes origens
//   crossOriginEmbedderPolicy: false, // Permite incorporação de diferentes origens
//   crossOriginOpenerPolicy: false, // Permite abertura de diferentes origens
//   // crossOriginResourcePolicy: {
//   //   policy: "cross-origin" // Permite carregamento de recursos de diferentes origens
//   // }
// }));

app.use(compression()); // Compressão HTTP
app.use(bodyParser.json({ limit: '5mb' })); // Aumentar o limite de carga para 5 MB
app.use(bodyParser.urlencoded({ 
  limit: '5mb', 
  extended: true,
  parameterLimit: 1000,
  type: 'application/x-www-form-urlencoded'
}));
app.use((req, res, next) => {
    next();
});
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requisições sem origin (ex: Postman, mobile apps)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Verificar se origin está na lista de permitidos
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // Em desenvolvimento, permitir qualquer localhost
      if (process.env.NODE_ENV === 'development') {
        const url = new URL(origin);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          callback(null, true);
          return;
        }
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Cookie'],
    exposedHeaders: ['Authorization', 'Set-Cookie']
  })
);
app.options('*', cors()); 
app.use(cookieParser());

// ✅ Webhook signature verification configurado corretamente

app.use(express.json());
app.use(Sentry.Handlers.requestHandler());

// Middleware global para capturar erros de decodificação
app.use((req, res, next) => {
  try {
    // Tenta decodificar a URL para detectar problemas antecipadamente
    if (req.url.includes('%')) {
      const originalUrl = req.url;
      try {
        decodeURIComponent(req.url);
      } catch (decodeError) {
        // Se a decodificação falhar, sanitiza a URL
        req.url = req.url
          .replace(/%20/g, '_')     // Substitui espaços codificados
          .replace(/%\(/g, '_')     // Substitui parênteses codificados
          .replace(/%\)/g, '_')     // Substitui parênteses codificados
          .replace(/%/g, '')        // Remove % restantes
          .replace(/[<>:"/\\|?*]/g, '_'); // Remove caracteres especiais
        
        logger.warn(`URL sanitized due to decode error: ${originalUrl} -> ${req.url}`);
      }
    }
  } catch (error) {
    logger.warn(`Error in URL sanitization middleware: ${error.message}`);
  }
  next();
});


app.use("/public", express.static(uploadConfig.directory));

// Middleware removido para evitar poluição de logs

// Rotas
app.use(routes);

// Manipulador de erros do Sentry
app.use(Sentry.Handlers.errorHandler());

// Middleware de tratamento de erros
app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
  // Tratamento específico para erros de decodificação de URI
  if (err.name === 'URIError' || err.message.includes('Failed to decode param')) {
    logger.warn(`URI decode error handled: ${err.message} for URL: ${req.url}`);
    
    // Tenta sanitizar a URL e redirecionar
    try {
      const sanitizedUrl = req.url
        .replace(/%20/g, '_')     // Substitui espaços codificados
        .replace(/%\(/g, '_')     // Substitui parênteses codificados
        .replace(/%\)/g, '_')     // Substitui parênteses codificados
        .replace(/%/g, '')        // Remove % restantes
        .replace(/[<>:"/\\|?*]/g, '_'); // Remove caracteres especiais
      
      return res.redirect(sanitizedUrl);
    } catch (sanitizeError) {
      return res.status(400).json({ error: "Invalid file name" });
    }
  }

  if (err instanceof AppError) {
    logger.warn(err);
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

export default app;
