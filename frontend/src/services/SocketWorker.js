import io from "socket.io-client";

class SocketWorker {
  constructor(companyId , userId) {
    const instanceKey = `${companyId}_${userId}`;
    
    if (!SocketWorker.instance || SocketWorker.instanceKey !== instanceKey) {
      // Limpar instância anterior se existir
      if (SocketWorker.instance?.socket) {
        SocketWorker.instance.socket.disconnect();
      }
      
      this.companyId = companyId
      this.userId = userId
      this.socket = null;
      this.configureSocket();
      this.eventListeners = {};
      
      SocketWorker.instance = this;
      SocketWorker.instanceKey = instanceKey;
    }

    return SocketWorker.instance;
  }

  configureSocket() {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    const socketUrl = `${backendUrl}/${this?.companyId}`;
    
    this.socket = io(socketUrl , {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      query: { userId: this.userId }
    });

    this.socket.on("connect", () => {
      console.log(`✅ [SOCKET-WORKER] Conectado: ${socketUrl}`);
    });

    this.socket.on("connect_error", (error) => {
      console.error(`🚨 Socket.IO erro: ${error.message}`);
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`⚠️ Socket.IO desconectado: ${reason}`);
      this.reconnectAfterDelay();
    });
  }

  // Adiciona um ouvinte de eventos
  on(event, callback) {
    this.connect();
    this.socket.on(event, callback);

    // Armazena o ouvinte no objeto de ouvintes
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  // Emite um evento
  emit(event, data) {
    this.connect();
    this.socket.emit(event, data);
  }

  // Desconecta um ou mais ouvintes de eventos
  off(event, callback) {
    this.connect();
    if (this.eventListeners[event]) {
      // console.log("Desconectando do servidor Socket.IO:", event, callback);
      if (callback) {
        // Desconecta um ouvinte específico
        this.socket.off(event, callback);
        this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
      } else {
        // console.log("DELETOU EVENTOS DO SOCKET:", this.eventListeners[event]);

        // Desconecta todos os ouvintes do evento
        this.eventListeners[event].forEach(cb => this.socket.off(event, cb));
        delete this.eventListeners[event];
      }
      // console.log("EVENTOS DO SOCKET:", this.eventListeners);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null
      this.instance = null
      console.log("Socket desconectado manualmente");
    }
  }

  reconnectAfterDelay() {
    setTimeout(() => {
      if (!this.socket || !this.socket.connected) {
        console.log("Tentando reconectar após desconexão");
        this.connect();
      }
    }, 1000);
  }

  // Garante que o socket esteja conectado
  connect() {
    if (!this.socket) {
      this.configureSocket();
    }
  }

  forceReconnect() {

  }
}

// const instance = (companyId, userId) => new SocketWorker(companyId,userId);
const instance = (companyId, userId) => new SocketWorker(companyId, userId);

export default instance;