import { facebookLogger, logCritical } from '../../utils/facebookLogger';
import { FacebookAPIError } from './FacebookErrorHandler';
import Company from '../../models/Company';
import User from '../../models/User';

/**
 * Interface para configuração de alertas
 */
interface AlertConfiguration {
  enabled: boolean;
  channels: AlertChannel[];
  thresholds: AlertThresholds;
  cooldownPeriod: number; // em milissegundos
  escalationRules: EscalationRule[];
}

/**
 * Interface para canais de alerta
 */
interface AlertChannel {
  type: 'email' | 'webhook' | 'slack' | 'internal' | 'sms';
  enabled: boolean;
  config: Record<string, any>;
  priority: number; // 1 = mais alto
}

/**
 * Interface para thresholds de alertas
 */
interface AlertThresholds {
  errorRate: number; // taxa de erro em %
  responseTime: number; // tempo de resposta em ms
  failedRequestsCount: number; // número de falhas consecutivas
  cacheHitRate: number; // taxa de cache hit mínima
  healthCheckFailures: number; // falhas consecutivas de health check
  quotaUsage: number; // uso de quota em %
}

/**
 * Interface para regras de escalação
 */
interface EscalationRule {
  condition: string; // condição que dispara a escalação
  delay: number; // tempo em ms antes de escalar
  channels: string[]; // canais para escalar
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Interface para alerta
 */
interface Alert {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  companyId: number;
  component: string;
  metadata: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  escalated: boolean;
  escalatedAt?: Date;
  sentChannels: string[];
}

/**
 * Tipos de alertas
 */
type AlertType = 
  | 'api_error_rate'
  | 'api_response_time'
  | 'api_failure'
  | 'health_check_failure'
  | 'cache_performance'
  | 'quota_exceeded'
  | 'rate_limit_exceeded'
  | 'client_disconnection'
  | 'webhook_failure'
  | 'system_critical';

/**
 * Sistema de alertas para monitoramento de APIs Facebook/Instagram
 * Gerencia alertas automáticos, escalação e notificações
 */
export class FacebookAlertSystem {
  private config: AlertConfiguration;
  private activeAlerts: Map<string, Alert>;
  private alertHistory: Alert[];
  private lastAlertTime: Map<string, number>; // para cooldown
  private escalationTimers: Map<string, NodeJS.Timeout>;

  constructor() {
    this.config = this.loadConfiguration();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.lastAlertTime = new Map();
    this.escalationTimers = new Map();

    this.setupDefaultChannels();
  }

  /**
   * Carrega configuração de alertas
   */
  private loadConfiguration(): AlertConfiguration {
    return {
      enabled: process.env.FACEBOOK_ALERTS_ENABLED !== 'false',
      channels: [],
      thresholds: {
        errorRate: parseFloat(process.env.FACEBOOK_ALERT_ERROR_RATE || '5'), // 5%
        responseTime: parseInt(process.env.FACEBOOK_ALERT_RESPONSE_TIME || '5000'), // 5s
        failedRequestsCount: parseInt(process.env.FACEBOOK_ALERT_FAILED_REQUESTS || '10'),
        cacheHitRate: parseFloat(process.env.FACEBOOK_ALERT_CACHE_HIT_RATE || '70'), // 70%
        healthCheckFailures: parseInt(process.env.FACEBOOK_ALERT_HEALTH_FAILURES || '3'),
        quotaUsage: parseFloat(process.env.FACEBOOK_ALERT_QUOTA_USAGE || '90') // 90%
      },
      cooldownPeriod: parseInt(process.env.FACEBOOK_ALERT_COOLDOWN || '300000'), // 5 minutos
      escalationRules: [
        {
          condition: 'unresolved_critical_15min',
          delay: 15 * 60 * 1000, // 15 minutos
          channels: ['email', 'webhook'],
          severity: 'critical'
        },
        {
          condition: 'unresolved_high_30min',
          delay: 30 * 60 * 1000, // 30 minutos
          channels: ['email'],
          severity: 'high'
        }
      ]
    };
  }

  /**
   * Configura canais padrão de alerta
   */
  private setupDefaultChannels(): void {
    // Canal interno (logs)
    this.config.channels.push({
      type: 'internal',
      enabled: true,
      config: {},
      priority: 1
    });

    // Canal de webhook se configurado
    if (process.env.FACEBOOK_ALERT_WEBHOOK_URL) {
      this.config.channels.push({
        type: 'webhook',
        enabled: true,
        config: {
          url: process.env.FACEBOOK_ALERT_WEBHOOK_URL,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.FACEBOOK_ALERT_WEBHOOK_TOKEN
          }
        },
        priority: 2
      });
    }

    // Canal de email se configurado
    if (process.env.FACEBOOK_ALERT_EMAIL_ENABLED === 'true') {
      this.config.channels.push({
        type: 'email',
        enabled: true,
        config: {
          smtp: {
            host: process.env.FACEBOOK_ALERT_SMTP_HOST,
            port: process.env.FACEBOOK_ALERT_SMTP_PORT,
            secure: process.env.FACEBOOK_ALERT_SMTP_SECURE === 'true',
            auth: {
              user: process.env.FACEBOOK_ALERT_SMTP_USER,
              pass: process.env.FACEBOOK_ALERT_SMTP_PASS
            }
          },
          from: process.env.FACEBOOK_ALERT_EMAIL_FROM,
          to: process.env.FACEBOOK_ALERT_EMAIL_TO?.split(',') || []
        },
        priority: 3
      });
    }
  }

  /**
   * Cria e dispara um alerta
   */
  async createAlert(
    type: AlertType,
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    message: string,
    companyId: number,
    component: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    
    if (!this.config.enabled) {
      return '';
    }

    // Verificar cooldown
    const alertKey = `${type}_${companyId}_${component}`;
    const lastAlert = this.lastAlertTime.get(alertKey);
    if (lastAlert && (Date.now() - lastAlert) < this.config.cooldownPeriod) {
      facebookLogger.debug({
        type: 'facebook_alert_cooldown',
        alertType: type,
        companyId,
        component
      }, 'Alert skipped due to cooldown period');
      return '';
    }

    // Criar alerta
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      title,
      message,
      companyId,
      component,
      metadata,
      timestamp: new Date(),
      resolved: false,
      escalated: false,
      sentChannels: []
    };

    // Adicionar às listas
    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);
    this.lastAlertTime.set(alertKey, Date.now());

    // Enviar alerta
    await this.sendAlert(alert);

    // Configurar escalação se necessário
    this.setupEscalation(alert);

    facebookLogger.warn({
      type: 'facebook_alert_created',
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        companyId: alert.companyId,
        component: alert.component
      }
    }, `Alert created: ${alert.title}`);

    return alert.id;
  }

  /**
   * Envia alerta através dos canais configurados
   */
  private async sendAlert(alert: Alert): Promise<void> {
    const enabledChannels = this.config.channels
      .filter(channel => channel.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const channel of enabledChannels) {
      try {
        await this.sendToChannel(alert, channel);
        alert.sentChannels.push(channel.type);
      } catch (error) {
        facebookLogger.error({
          type: 'facebook_alert_send_error',
          alertId: alert.id,
          channel: channel.type,
          error: error.message
        }, `Failed to send alert to ${channel.type}`);
      }
    }
  }

  /**
   * Envia alerta para um canal específico
   */
  private async sendToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    switch (channel.type) {
      case 'internal':
        this.sendToInternal(alert);
        break;
      
      case 'webhook':
        await this.sendToWebhook(alert, channel.config);
        break;
      
      case 'email':
        await this.sendToEmail(alert, channel.config);
        break;
      
      case 'slack':
        await this.sendToSlack(alert, channel.config);
        break;
      
      default:
        facebookLogger.warn({
          type: 'facebook_alert_unknown_channel',
          channel: channel.type
        }, `Unknown alert channel: ${channel.type}`);
    }
  }

  /**
   * Envia alerta para logs internos
   */
  private sendToInternal(alert: Alert): void {
    const logLevel = alert.severity === 'critical' ? 'fatal' : 
                    alert.severity === 'high' ? 'error' : 'warn';

    facebookLogger[logLevel]({
      type: 'facebook_alert',
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        companyId: alert.companyId,
        component: alert.component,
        metadata: alert.metadata
      }
    }, `ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`);

    if (alert.severity === 'critical') {
      logCritical(alert.title, alert.metadata, alert.companyId);
    }
  }

  /**
   * Envia alerta via webhook
   */
  private async sendToWebhook(alert: Alert, config: any): Promise<void> {
    const payload = {
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        companyId: alert.companyId,
        component: alert.component,
        timestamp: alert.timestamp.toISOString(),
        metadata: alert.metadata
      },
      system: {
        service: 'whatize-facebook-api',
        environment: process.env.NODE_ENV || 'development'
      }
    };

    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: config.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Envia alerta via email
   */
  private async sendToEmail(alert: Alert, config: any): Promise<void> {
    // Implementação simplificada - em produção, usar biblioteca como nodemailer
    const emailData = {
      from: config.from,
      to: config.to,
      subject: `[ALERT ${alert.severity.toUpperCase()}] ${alert.title}`,
      html: this.generateEmailTemplate(alert)
    };

    facebookLogger.info({
      type: 'facebook_alert_email',
      alertId: alert.id,
      emailData: {
        ...emailData,
        html: '[HTML content]' // Não logar o HTML completo
      }
    }, 'Email alert prepared (actual sending not implemented)');

    // TODO: Implementar envio real de email
    // const transporter = nodemailer.createTransporter(config.smtp);
    // await transporter.sendMail(emailData);
  }

  /**
   * Envia alerta para Slack
   */
  private async sendToSlack(alert: Alert, config: any): Promise<void> {
    const payload = {
      text: `Alert: ${alert.title}`,
      attachments: [{
        color: this.getSeverityColor(alert.severity),
        fields: [
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Component', value: alert.component, short: true },
          { title: 'Company ID', value: alert.companyId.toString(), short: true },
          { title: 'Message', value: alert.message, short: false }
        ],
        ts: Math.floor(alert.timestamp.getTime() / 1000)
      }]
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack webhook returned ${response.status}`);
    }
  }

  /**
   * Gera template de email para alerta
   */
  private generateEmailTemplate(alert: Alert): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
          <div style="border-left: 4px solid ${this.getSeverityColor(alert.severity)}; padding-left: 15px;">
            <h2 style="color: ${this.getSeverityColor(alert.severity)}; margin-top: 0;">
              ${alert.severity.toUpperCase()} ALERT
            </h2>
            <h3>${alert.title}</h3>
            <p><strong>Message:</strong> ${alert.message}</p>
            <p><strong>Component:</strong> ${alert.component}</p>
            <p><strong>Company ID:</strong> ${alert.companyId}</p>
            <p><strong>Timestamp:</strong> ${alert.timestamp.toISOString()}</p>
            
            ${Object.keys(alert.metadata).length > 0 ? `
              <h4>Additional Details:</h4>
              <ul>
                ${Object.entries(alert.metadata).map(([key, value]) => 
                  `<li><strong>${key}:</strong> ${JSON.stringify(value)}</li>`
                ).join('')}
              </ul>
            ` : ''}
          </div>
          
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This alert was generated by Whatize Facebook API Monitoring System
          </p>
        </body>
      </html>
    `;
  }

  /**
   * Obtém cor baseada na severidade
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#FF0000';
      case 'high': return '#FF6600';
      case 'medium': return '#FFCC00';
      case 'low': return '#00CC00';
      default: return '#CCCCCC';
    }
  }

  /**
   * Configura escalação para um alerta
   */
  private setupEscalation(alert: Alert): void {
    const applicableRules = this.config.escalationRules.filter(rule => {
      return this.evaluateEscalationCondition(rule.condition, alert);
    });

    applicableRules.forEach(rule => {
      const timer = setTimeout(async () => {
        await this.escalateAlert(alert, rule);
      }, rule.delay);

      this.escalationTimers.set(`${alert.id}_${rule.condition}`, timer);
    });
  }

  /**
   * Avalia condição de escalação
   */
  private evaluateEscalationCondition(condition: string, alert: Alert): boolean {
    switch (condition) {
      case 'unresolved_critical_15min':
        return alert.severity === 'critical';
      case 'unresolved_high_30min':
        return alert.severity === 'high';
      default:
        return false;
    }
  }

  /**
   * Escala um alerta
   */
  private async escalateAlert(alert: Alert, rule: EscalationRule): Promise<void> {
    if (alert.resolved) {
      return; // Alerta já foi resolvido
    }

    alert.escalated = true;
    alert.escalatedAt = new Date();

    // Criar alerta de escalação
    const escalationAlert: Alert = {
      ...alert,
      id: `escalation_${alert.id}_${Date.now()}`,
      title: `ESCALATED: ${alert.title}`,
      message: `Alert escalated after ${rule.delay / 60000} minutes: ${alert.message}`,
      metadata: {
        ...alert.metadata,
        originalAlertId: alert.id,
        escalationRule: rule.condition
      }
    };

    // Enviar apenas para canais específicos da escalação
    const escalationChannels = this.config.channels.filter(channel => 
      rule.channels.includes(channel.type) && channel.enabled
    );

    for (const channel of escalationChannels) {
      try {
        await this.sendToChannel(escalationAlert, channel);
      } catch (error) {
        facebookLogger.error({
          type: 'facebook_alert_escalation_error',
          alertId: alert.id,
          channel: channel.type,
          error: error.message
        }, 'Failed to send escalation alert');
      }
    }

    facebookLogger.warn({
      type: 'facebook_alert_escalated',
      originalAlertId: alert.id,
      escalationAlertId: escalationAlert.id,
      rule: rule.condition
    }, `Alert escalated: ${alert.title}`);
  }

  /**
   * Resolve um alerta
   */
  resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.metadata.resolvedBy = resolvedBy;

    // Cancelar timers de escalação
    for (const [timerKey, timer] of this.escalationTimers.entries()) {
      if (timerKey.startsWith(alertId)) {
        clearTimeout(timer);
        this.escalationTimers.delete(timerKey);
      }
    }

    // Remover dos alertas ativos
    this.activeAlerts.delete(alertId);

    facebookLogger.info({
      type: 'facebook_alert_resolved',
      alertId,
      resolvedBy,
      duration: alert.resolvedAt.getTime() - alert.timestamp.getTime()
    }, `Alert resolved: ${alert.title}`);

    return true;
  }

  /**
   * Obtém alertas ativos
   */
  getActiveAlerts(companyId?: number): Alert[] {
    const alerts = Array.from(this.activeAlerts.values());
    return companyId ? alerts.filter(alert => alert.companyId === companyId) : alerts;
  }

  /**
   * Obtém histórico de alertas
   */
  getAlertHistory(limit: number = 100, companyId?: number): Alert[] {
    let history = this.alertHistory.slice(-limit);
    return companyId ? history.filter(alert => alert.companyId === companyId) : history;
  }

  /**
   * Obtém estatísticas de alertas
   */
  getAlertStatistics(companyId?: number): {
    total: number;
    active: number;
    resolved: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    averageResolutionTime: number;
  } {
    const alerts = companyId 
      ? this.alertHistory.filter(alert => alert.companyId === companyId)
      : this.alertHistory;

    const resolved = alerts.filter(alert => alert.resolved);
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    alerts.forEach(alert => {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      byType[alert.type] = (byType[alert.type] || 0) + 1;
    });

    const averageResolutionTime = resolved.length > 0
      ? resolved.reduce((sum, alert) => {
          const duration = alert.resolvedAt!.getTime() - alert.timestamp.getTime();
          return sum + duration;
        }, 0) / resolved.length
      : 0;

    return {
      total: alerts.length,
      active: this.getActiveAlerts(companyId).length,
      resolved: resolved.length,
      bySeverity,
      byType,
      averageResolutionTime
    };
  }

  /**
   * Atualiza configuração de alertas
   */
  updateConfiguration(newConfig: Partial<AlertConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
    
    facebookLogger.info({
      type: 'facebook_alert_config_updated',
      config: this.config
    }, 'Alert system configuration updated');
  }

  /**
   * Para sistema de alertas e limpa timers
   */
  shutdown(): void {
    // Cancelar todos os timers de escalação
    for (const timer of this.escalationTimers.values()) {
      clearTimeout(timer);
    }
    this.escalationTimers.clear();

    facebookLogger.info({
      type: 'facebook_alert_system_shutdown',
      activeAlerts: this.activeAlerts.size
    }, 'Alert system shutdown');
  }
}

// Instância global do sistema de alertas
export const facebookAlertSystem = new FacebookAlertSystem();