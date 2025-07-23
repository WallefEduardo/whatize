import { WASocket } from "@whiskeysockets/baileys";
import { getIO } from "../../libs/socket";
import logger from "../../utils/logger";

interface PresenceData {
  jid: string;
  presence: string;
  lastSeen?: number;
  companyId: number;
}

class PresenceService {
  private subscribedContacts = new Map<string, Set<string>>(); // companyId -> Set<jid>
  private presenceCache = new Map<string, PresenceData>(); // jid -> PresenceData

  async subscribeToPresence(sock: WASocket, contactNumber: string, companyId: number) {
    try {
      // Gerar JID do contato
      const contactJid = `${contactNumber.replace(/\D/g, '')}@s.whatsapp.net`;
      
      // Verificar se já está subscrito
      const companyKey = companyId.toString();
      if (!this.subscribedContacts.has(companyKey)) {
        this.subscribedContacts.set(companyKey, new Set());
      }
      
      const companyContacts = this.subscribedContacts.get(companyKey)!;
      
      if (companyContacts.has(contactJid)) {
        return; // Já subscrito
      }

      // Subscrever ao presence
      await sock.presenceSubscribe(contactJid);
      companyContacts.add(contactJid);

      logger.info(`Subscribed to presence for ${contactJid} - Company ${companyId}`);

      // Configurar listener se ainda não existe
      this.setupPresenceListener(sock, companyId);

    } catch (error) {
      logger.error(`Error subscribing to presence: ${error}`);
    }
  }

  setupPresenceListener(sock: WASocket, companyId: number) {
    // Remove listener anterior se existir
    sock.ev.removeAllListeners('presence.update');

    sock.ev.on('presence.update', (presenceUpdate) => {
      try {
        Object.keys(presenceUpdate).forEach(jid => {
          const presence = presenceUpdate[jid];
          
          if (presence) {
            const presenceData: PresenceData = {
              jid,
              presence: presence.lastKnownPresence || 'unavailable',
              lastSeen: presence.lastSeen,
              companyId
            };

            // Cache do presence
            this.presenceCache.set(jid, presenceData);

            // Emitir via Socket.IO para frontend
            const io = getIO();
            io.to(`company-${companyId}`).emit('presence-update', {
              contactJid: jid,
              presence: presenceData.presence,
              lastSeen: presenceData.lastSeen,
              timestamp: new Date()
            });

            logger.debug(`Presence update: ${jid} -> ${presenceData.presence}`);
          }
        });
      } catch (error) {
        logger.error(`Error processing presence update: ${error}`);
      }
    });
  }

  async getContactPresence(contactNumber: string): Promise<PresenceData | null> {
    const contactJid = `${contactNumber.replace(/\D/g, '')}@s.whatsapp.net`;
    return this.presenceCache.get(contactJid) || null;
  }

  async unsubscribeFromPresence(contactNumber: string, companyId: number) {
    const contactJid = `${contactNumber.replace(/\D/g, '')}@s.whatsapp.net`;
    const companyKey = companyId.toString();
    
    const companyContacts = this.subscribedContacts.get(companyKey);
    if (companyContacts) {
      companyContacts.delete(contactJid);
      this.presenceCache.delete(contactJid);
    }
  }

  // Método para enviar presence update (quando usuário está digitando)
  async sendPresenceUpdate(sock: WASocket, toJid: string, type: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused') {
    try {
      await sock.sendPresenceUpdate(type, toJid);
      logger.debug(`Sent presence update: ${type} to ${toJid}`);
    } catch (error) {
      logger.error(`Error sending presence update: ${error}`);
    }
  }

  // Limpar cache da empresa
  clearCompanyCache(companyId: number) {
    const companyKey = companyId.toString();
    const companyContacts = this.subscribedContacts.get(companyKey);
    
    if (companyContacts) {
      companyContacts.forEach(jid => {
        this.presenceCache.delete(jid);
      });
      this.subscribedContacts.delete(companyKey);
    }
  }
}

export default new PresenceService(); 