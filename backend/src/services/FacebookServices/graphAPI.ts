import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "fs";
import logger from "../../utils/logger";
import { createCompatibleApiBase, getFacebookClient } from "./FacebookClientWrapper";
import { handleFacebookAPIError } from "./FacebookErrorHandler";

const formData: FormData = new FormData();

// Versão da API configurável via variável de ambiente (padrão v22.0)
const API_VERSION = process.env.META_API_VERSION || "v22.0";
const API_BASE_URL = process.env.META_API_BASE_URL || "https://graph.facebook.com";

// Log da versão da API sendo usada
logger.info(`Facebook Graph API: Usando versão ${API_VERSION} com retry automático`);

/**
 * Função compatível que agora usa o novo client com retry
 * Mantém a mesma interface para não quebrar código existente
 */
const apiBase = (token: string, companyId?: number) => {
  // Usar o novo wrapper que implementa retry e error handling
  return createCompatibleApiBase(token, companyId);
};

export const getAccessToken = async (): Promise<string> => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/${API_VERSION}/oauth/access_token`,
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          grant_type: "client_credentials"
        },
        timeout: parseInt(process.env.FACEBOOK_API_TIMEOUT || "30000"),
        headers: {
          'User-Agent': `Whatize-Backend/2.2.2 (Facebook-Graph-API/${API_VERSION})`
        }
      }
    );

    return data.access_token;
  } catch (error) {
    const fbError = handleFacebookAPIError(error);
    logger.error('Erro ao obter access token do app Facebook', fbError.toLogData());
    throw fbError;
  }
};

export const markSeen = async (id: string, token: string): Promise<void> => {
  await apiBase(token).post(`${id}/messages`, {
    recipient: {
      id
    },
    sender_action: "mark_seen"
  });
};

export const showTypingIndicator = async (
  id: string, 
  token: string,
  action: string
): Promise<void> => {

  try {
    const { data } = await apiBase(token).post("me/messages", {
      recipient: {
        id: id
      },
      sender_action: action
    })

    return data;
  } catch (error) {
    //console.log(error);
  }

}


export const sendText = async (
  id: string | number,
  text: string,
  token: string,
): Promise<void> => {
  try {
    const { data } = await apiBase(token).post("me/messages", {
      recipient: {
        id
      },
      message: {
        text: `${text}`,
      }
    });
    return data;
  } catch (error) {
    console.error('Erro ao enviar texto Facebook:', error);
  }
};

export const sendAttachmentFromUrl = async (
  id: string,
  url: string,
  type: string,
  token: string
): Promise<void> => {
  try {
    const { data } = await apiBase(token).post("me/messages", {
      recipient: {
        id
      },
      message: {
        attachment: {
          type,
          payload: {
            url
          }
        }
      }
    });

    return data;
  } catch (error) {
    //console.log(error);
  }
};

export const sendAttachment = async (
  id: string,
  file: Express.Multer.File,
  type: string,
  token: string
): Promise<void> => {
  formData.append(
    "recipient",
    JSON.stringify({
      id
    })
  );

  formData.append(
    "message",
    JSON.stringify({
      attachment: {
        type,
        payload: {
          is_reusable: true
        }
      }
    })
  );

  const fileReaderStream = createReadStream(file.path);

  formData.append("filedata", fileReaderStream);

  try {
    await apiBase(token).post("me/messages", formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
  } catch (error) {
    throw new Error(error);
  }
};

export const genText = (text: string): any => {
  const response = {
    text
  };

  return response;
};

export const getProfile = async (id: string, token: string): Promise<any> => {
  try {
    const { data } = await apiBase(token).get(id);

    return data;
  } catch (error) {
    console.error('Erro ao buscar perfil Facebook:', error);
    throw new Error("ERR_FETCHING_FB_USER_PROFILE_2");
  }
};

export const getPageProfile = async (
  id: string,
  token: string
): Promise<any> => {
  try {
    const { data } = await apiBase(token).get(
      `${id}/accounts?fields=name,access_token,instagram_business_account{id,username,profile_picture_url,name}`
    );
    return data;
  } catch (error) {
    console.error('Erro ao buscar páginas Facebook:', error);
    throw new Error("ERR_FETCHING_FB_PAGES");
  }
};

export const profilePsid = async (id: string, token: string): Promise<any> => {
  try {
    const { data } = await axios.get(
      `${API_BASE_URL}/${API_VERSION}/${id}?fields=first_name,last_name,name,profile_pic&access_token=${token}`,
      {
        timeout: parseInt(process.env.FACEBOOK_API_TIMEOUT || "30000"),
        headers: {
          'User-Agent': `Whatize-Backend/2.2.2 (Facebook-Graph-API/${API_VERSION})`
        }
      }
    );
    return data;
  } catch (error) {
    console.error('Erro ao buscar PSID Facebook:', error);
    await getProfile(id, token);
  }
};

export const subscribeApp = async (id: string, token: string): Promise<any> => {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/${API_VERSION}/${id}/subscribed_apps?access_token=${token}`,
      {
        subscribed_fields: [
          "messages",
          "messaging_postbacks",
          "message_deliveries",
          "message_reads",
          "message_echoes"
        ]
      },
      {
        timeout: parseInt(process.env.FACEBOOK_API_TIMEOUT || "30000"),
        headers: {
          'User-Agent': `Whatize-Backend/2.2.2 (Facebook-Graph-API/${API_VERSION})`
        }
      }
    );
    return data;
  } catch (error) {
    console.error('Erro ao inscrever app Facebook:', error);
    throw new Error("ERR_SUBSCRIBING_PAGE_TO_MESSAGE_WEBHOOKS");
  }
};

export const unsubscribeApp = async (
  id: string,
  token: string
): Promise<any> => {
  try {
    const { data } = await axios.delete(
      `${API_BASE_URL}/${API_VERSION}/${id}/subscribed_apps?access_token=${token}`,
      {
        timeout: parseInt(process.env.FACEBOOK_API_TIMEOUT || "30000"),
        headers: {
          'User-Agent': `Whatize-Backend/2.2.2 (Facebook-Graph-API/${API_VERSION})`
        }
      }
    );
    return data;
  } catch (error) {
    throw new Error("ERR_UNSUBSCRIBING_PAGE_TO_MESSAGE_WEBHOOKS");
  }
};


export const getSubscribedApps = async (
  id: string,
  token: string
): Promise<any> => {
  try {
    const { data } = await apiBase(token).get(`${id}/subscribed_apps`);
    return data;
  } catch (error) {
    throw new Error("ERR_GETTING_SUBSCRIBED_APPS");
  }
};

export const getAccessTokenFromPage = async (
  token: string
): Promise<string> => {
  try {

    if (!token) throw new Error("ERR_FETCHING_FB_USER_TOKEN");

    console.log('Tentando exchange token para:', token.substring(0, 20) + '...');
    console.log('App ID:', process.env.FACEBOOK_APP_ID);

    const data = await axios.get(
      `${API_BASE_URL}/${API_VERSION}/oauth/access_token`,
      {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          grant_type: "fb_exchange_token",
          fb_exchange_token: token
        },
        timeout: parseInt(process.env.FACEBOOK_API_TIMEOUT || "30000"),
        headers: {
          'User-Agent': `Whatize-Backend/2.2.2 (Facebook-Graph-API/${API_VERSION})`
        }
      }
    );

    console.log('Token exchange response:', data.data);
    return data.data.access_token;
  } catch (error) {
    const fbError = handleFacebookAPIError(error);
    logger.error('Erro ao obter token de página Facebook', fbError.toLogData());
    throw fbError;
  }
};

export const removeApplcation = async (
  id: string,
  token: string
): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/${API_VERSION}/${id}/permissions`, {
      params: {
        access_token: token
      },
      timeout: parseInt(process.env.FACEBOOK_API_TIMEOUT || "30000"),
      headers: {
        'User-Agent': `Whatize-Backend/2.2.2 (Facebook-Graph-API/${API_VERSION})`
      }
    });
  } catch (error) {
    logger.error("ERR_REMOVING_APP_FROM_PAGE");
  }
};