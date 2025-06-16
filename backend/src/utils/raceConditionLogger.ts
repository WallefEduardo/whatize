import fs from "fs";
import path from "path";
import moment from "moment";

interface RaceConditionLogData {
  timestamp: string;
  type: 'CONSTRAINT_ERROR' | 'MUTEX_WAIT' | 'RETRY_ATTEMPT' | 'SUCCESS_AFTER_RETRY' | 'CONTACT_CREATION' | 'BAILEYS_EVENT';
  contactNumber: string;
  companyId: number;
  whatsappId?: number;
  error?: string;
  retryCount?: number;
  duration?: number;
  additionalData?: any;
}

class RaceConditionLogger {
  private logDir: string;
  private logFile: string;

  constructor() {
    this.logDir = path.resolve(__dirname, "..", "..", "..", "logs");
    this.logFile = path.join(this.logDir, "race_conditions.log");
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLogEntry(data: RaceConditionLogData): string {
    const logEntry = {
      timestamp: data.timestamp,
      type: data.type,
      contact: `${data.contactNumber}@company${data.companyId}`,
      whatsappId: data.whatsappId,
      error: data.error,
      retryCount: data.retryCount,
      duration: data.duration ? `${data.duration}ms` : undefined,
      additionalData: data.additionalData
    };

    return JSON.stringify(logEntry, null, 2) + '\n---\n';
  }

  public logConstraintError(
    contactNumber: string, 
    companyId: number, 
    error: string, 
    whatsappId?: number,
    additionalData?: any
  ): void {
    const logData: RaceConditionLogData = {
      timestamp: moment().format("DD/MM/YYYY HH:mm:ss.SSS"),
      type: 'CONSTRAINT_ERROR',
      contactNumber,
      companyId,
      whatsappId,
      error,
      additionalData
    };

    this.writeLog(logData);
    console.error(`🚨 CONSTRAINT ERROR: Contact ${contactNumber} Company ${companyId} - ${error}`);
  }

  public logMutexWait(
    contactNumber: string, 
    companyId: number, 
    duration: number,
    whatsappId?: number
  ): void {
    const logData: RaceConditionLogData = {
      timestamp: moment().format("DD/MM/YYYY HH:mm:ss.SSS"),
      type: 'MUTEX_WAIT',
      contactNumber,
      companyId,
      whatsappId,
      duration
    };

    this.writeLog(logData);
    
    if (duration > 1000) { // Log apenas se esperar mais de 1 segundo
      console.warn(`⏳ MUTEX WAIT: Contact ${contactNumber} Company ${companyId} waited ${duration}ms`);
    }
  }

  public logRetryAttempt(
    contactNumber: string, 
    companyId: number, 
    retryCount: number,
    error: string,
    whatsappId?: number
  ): void {
    const logData: RaceConditionLogData = {
      timestamp: moment().format("DD/MM/YYYY HH:mm:ss.SSS"),
      type: 'RETRY_ATTEMPT',
      contactNumber,
      companyId,
      whatsappId,
      retryCount,
      error
    };

    this.writeLog(logData);
    console.warn(`🔄 RETRY ATTEMPT ${retryCount}: Contact ${contactNumber} Company ${companyId} - ${error}`);
  }

  public logSuccessAfterRetry(
    contactNumber: string, 
    companyId: number, 
    retryCount: number,
    totalDuration: number,
    whatsappId?: number
  ): void {
    const logData: RaceConditionLogData = {
      timestamp: moment().format("DD/MM/YYYY HH:mm:ss.SSS"),
      type: 'SUCCESS_AFTER_RETRY',
      contactNumber,
      companyId,
      whatsappId,
      retryCount,
      duration: totalDuration
    };

    this.writeLog(logData);
    console.info(`✅ SUCCESS AFTER RETRY: Contact ${contactNumber} Company ${companyId} succeeded after ${retryCount} retries in ${totalDuration}ms`);
  }

  public logContactCreation(
    contactNumber: string, 
    companyId: number, 
    action: 'CREATE' | 'UPDATE',
    source: 'MESSAGE' | 'CONTACT_EVENT' | 'GROUP_EVENT' | 'MANUAL',
    whatsappId?: number,
    additionalData?: any
  ): void {
    const logData: RaceConditionLogData = {
      timestamp: moment().format("DD/MM/YYYY HH:mm:ss.SSS"),
      type: 'CONTACT_CREATION',
      contactNumber,
      companyId,
      whatsappId,
      additionalData: {
        action,
        source,
        ...additionalData
      }
    };

    this.writeLog(logData);
    console.info(`📝 CONTACT ${action}: ${contactNumber}@company${companyId} via ${source}`);
  }

  public logBaileysEvent(
    eventType: 'contacts.update' | 'groups.update' | 'messages.upsert',
    contactNumber: string,
    companyId: number,
    whatsappId: number,
    additionalData?: any
  ): void {
    const logData: RaceConditionLogData = {
      timestamp: moment().format("DD/MM/YYYY HH:mm:ss.SSS"),
      type: 'BAILEYS_EVENT',
      contactNumber,
      companyId,
      whatsappId,
      additionalData: {
        eventType,
        ...additionalData
      }
    };

    this.writeLog(logData);
    console.debug(`📡 BAILEYS EVENT: ${eventType} for ${contactNumber}@company${companyId}`);
  }

  private writeLog(data: RaceConditionLogData): void {
    try {
      const logEntry = this.formatLogEntry(data);
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error("Erro ao escrever log de race condition:", error);
    }
  }

  public getLogStats(): { totalErrors: number; todayErrors: number; lastError?: string } {
    try {
      if (!fs.existsSync(this.logFile)) {
        return { totalErrors: 0, todayErrors: 0 };
      }

      const logContent = fs.readFileSync(this.logFile, 'utf8');
      const entries = logContent.split('---\n').filter(entry => entry.trim());
      
      const today = moment().format("DD/MM/YYYY");
      let totalErrors = 0;
      let todayErrors = 0;
      let lastError: string | undefined;

      entries.forEach(entry => {
        try {
          const logData = JSON.parse(entry);
          if (logData.type === 'CONSTRAINT_ERROR') {
            totalErrors++;
            if (logData.timestamp.startsWith(today)) {
              todayErrors++;
            }
            lastError = logData.timestamp;
          }
        } catch (e) {
          // Ignorar entradas malformadas
        }
      });

      return { totalErrors, todayErrors, lastError };
    } catch (error) {
      console.error("Erro ao ler estatísticas de log:", error);
      return { totalErrors: 0, todayErrors: 0 };
    }
  }

  public cleanOldLogs(daysToKeep: number = 7): void {
    try {
      if (!fs.existsSync(this.logFile)) return;

      const logContent = fs.readFileSync(this.logFile, 'utf8');
      const entries = logContent.split('---\n').filter(entry => entry.trim());
      const cutoffDate = moment().subtract(daysToKeep, 'days');
      
      const recentEntries = entries.filter(entry => {
        try {
          const logData = JSON.parse(entry);
          const entryDate = moment(logData.timestamp, "DD/MM/YYYY HH:mm:ss.SSS");
          return entryDate.isAfter(cutoffDate);
        } catch (e) {
          return false; // Remove entradas malformadas
        }
      });

      const newContent = recentEntries.join('---\n') + (recentEntries.length > 0 ? '---\n' : '');
      fs.writeFileSync(this.logFile, newContent);
      
      console.info(`🧹 Logs limpos: mantidos ${recentEntries.length} entradas dos últimos ${daysToKeep} dias`);
    } catch (error) {
      console.error("Erro ao limpar logs antigos:", error);
    }
  }
}

// Singleton instance
const raceConditionLogger = new RaceConditionLogger();

export default raceConditionLogger; 