import path from "path";

// Nome do arquivo do certificado SEM extensão, ex: producao-687747-WHATIZECRM
// No .env: GERENCIANET_PIX_CERT=producao-687747-WHATIZECRM
const certName = process.env.GERENCIANET_PIX_CERT || "producao-687747-WHATIZECRM";

// Se o usuário já colocar .p12 no .env, não duplica a extensão
const certFile = certName.endsWith('.p12') ? certName : certName + '.p12';

// Monta o caminho absoluto do certificado na pasta certa
const certPath = path.join(__dirname, '../../certs', certFile);

export = {
  sandbox: process.env.GERENCIANET_SANDBOX === "true",
  client_id: process.env.GERENCIANET_CLIENT_ID as string,
  client_secret: process.env.GERENCIANET_CLIENT_SECRET as string,
  certificate: certPath
};
