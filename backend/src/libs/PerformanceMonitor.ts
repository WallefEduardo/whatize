import logger from "../utils/logger";

// Monitor de performance para comparar otimizações
class PerformanceMonitor {
  private connectionTimes = new Map<number, { start: number; end?: number }>();
  private metrics = {
    totalConnections: 0,
    successfulConnections: 0,
    failedConnections: 0,
    averageConnectionTime: 0,
    fastConnections: 0, // < 5s
    slowConnections: 0, // > 10s
    cleanupOperations: 0,
    unnecessaryCleanups: 0
  };

  // Iniciar medição de conexão
  startConnection(whatsappId: number) {
    this.connectionTimes.set(whatsappId, {
      start: Date.now()
    });
    this.metrics.totalConnections++;
    
    logger.info(`⏱️ [PERF-MONITOR] Iniciando medição de conexão: WhatsApp ${whatsappId}`);
  }

  // Finalizar medição de conexão
  endConnection(whatsappId: number, success: boolean) {
    const connectionData = this.connectionTimes.get(whatsappId);
    if (!connectionData) {
      logger.warn(`⚠️ [PERF-MONITOR] Tentativa de finalizar medição sem início: WhatsApp ${whatsappId}`);
      return;
    }

    const endTime = Date.now();
    const duration = endTime - connectionData.start;
    
    connectionData.end = endTime;
    
    if (success) {
      this.metrics.successfulConnections++;
    } else {
      this.metrics.failedConnections++;
    }

    // Categorizar conexão por velocidade
    if (duration < 5000) {
      this.metrics.fastConnections++;
      logger.info(`🚀 [PERF-MONITOR] Conexão RÁPIDA: WhatsApp ${whatsappId} em ${duration}ms`);
    } else if (duration > 10000) {
      this.metrics.slowConnections++;
      logger.warn(`🐌 [PERF-MONITOR] Conexão LENTA: WhatsApp ${whatsappId} em ${duration}ms`);
    } else {
      logger.info(`⏱️ [PERF-MONITOR] Conexão normal: WhatsApp ${whatsappId} em ${duration}ms`);
    }

    // Recalcular média
    this.updateAverageConnectionTime();
    
    // Limpar dados antigos
    this.connectionTimes.delete(whatsappId);
  }

  // Registrar operação de cleanup
  recordCleanup(whatsappId: number, reason: string, wasNecessary: boolean) {
    this.metrics.cleanupOperations++;
    
    if (!wasNecessary) {
      this.metrics.unnecessaryCleanups++;
      logger.warn(`⚠️ [PERF-MONITOR] Cleanup DESNECESSÁRIO: WhatsApp ${whatsappId} - ${reason}`);
    } else {
      logger.info(`🧹 [PERF-MONITOR] Cleanup necessário: WhatsApp ${whatsappId} - ${reason}`);
    }
  }

  // Recalcular tempo médio de conexão
  private updateAverageConnectionTime() {
    if (this.metrics.successfulConnections === 0) return;

    // Calcular média das conexões completadas
    const completedConnections = Array.from(this.connectionTimes.values())
      .filter(conn => conn.end)
      .map(conn => conn.end! - conn.start);

    if (completedConnections.length > 0) {
      const totalTime = completedConnections.reduce((sum, time) => sum + time, 0);
      this.metrics.averageConnectionTime = Math.round(totalTime / completedConnections.length);
    }
  }

  // Obter métricas atuais
  getMetrics() {
    const successRate = this.metrics.totalConnections > 0 
      ? Math.round((this.metrics.successfulConnections / this.metrics.totalConnections) * 100)
      : 0;

    const cleanupEfficiency = this.metrics.cleanupOperations > 0
      ? Math.round(((this.metrics.cleanupOperations - this.metrics.unnecessaryCleanups) / this.metrics.cleanupOperations) * 100)
      : 100;

    return {
      ...this.metrics,
      successRate,
      cleanupEfficiency,
      performanceGrade: this.calculatePerformanceGrade(),
      currentTime: new Date().toISOString()
    };
  }

  // Calcular grade de performance
  private calculatePerformanceGrade(): string {
    const metrics = this.metrics;
    
    // Critérios de avaliação
    const avgTime = metrics.averageConnectionTime;
    const successRate = metrics.totalConnections > 0 
      ? (metrics.successfulConnections / metrics.totalConnections) * 100
      : 100;
    const fastConnectionRate = metrics.totalConnections > 0
      ? (metrics.fastConnections / metrics.totalConnections) * 100
      : 0;
    const cleanupEfficiency = metrics.cleanupOperations > 0
      ? ((metrics.cleanupOperations - metrics.unnecessaryCleanups) / metrics.cleanupOperations) * 100
      : 100;

    // Sistema de pontuação
    let score = 0;

    // Tempo médio (40% do score)
    if (avgTime < 3000) score += 40;
    else if (avgTime < 5000) score += 30;
    else if (avgTime < 8000) score += 20;
    else if (avgTime < 12000) score += 10;

    // Taxa de sucesso (30% do score)
    if (successRate >= 95) score += 30;
    else if (successRate >= 90) score += 25;
    else if (successRate >= 80) score += 20;
    else if (successRate >= 70) score += 15;

    // Conexões rápidas (20% do score)
    if (fastConnectionRate >= 80) score += 20;
    else if (fastConnectionRate >= 60) score += 15;
    else if (fastConnectionRate >= 40) score += 10;
    else if (fastConnectionRate >= 20) score += 5;

    // Eficiência do cleanup (10% do score)
    if (cleanupEfficiency >= 95) score += 10;
    else if (cleanupEfficiency >= 80) score += 8;
    else if (cleanupEfficiency >= 60) score += 5;

    // Converter score para grade
    if (score >= 90) return 'A+ (Excelente)';
    if (score >= 80) return 'A (Ótimo)';
    if (score >= 70) return 'B+ (Bom)';
    if (score >= 60) return 'B (Regular)';
    if (score >= 50) return 'C (Precisa melhorar)';
    return 'D (Crítico)';
  }

  // Reset métricas (útil para testes)
  reset() {
    this.connectionTimes.clear();
    this.metrics = {
      totalConnections: 0,
      successfulConnections: 0,
      failedConnections: 0,
      averageConnectionTime: 0,
      fastConnections: 0,
      slowConnections: 0,
      cleanupOperations: 0,
      unnecessaryCleanups: 0
    };
    
    logger.info(`🔄 [PERF-MONITOR] Métricas resetadas`);
  }

  // Relatório detalhado
  generateReport() {
    const metrics = this.getMetrics();
    
    const report = `
🎯 RELATÓRIO DE PERFORMANCE - WhatsApp Sessions
================================================

📊 CONEXÕES:
  • Total: ${metrics.totalConnections}
  • Sucessos: ${metrics.successfulConnections} (${metrics.successRate}%)
  • Falhas: ${metrics.failedConnections}
  • Tempo médio: ${metrics.averageConnectionTime}ms

⚡ VELOCIDADE:
  • Rápidas (< 5s): ${metrics.fastConnections}
  • Lentas (> 10s): ${metrics.slowConnections}

🧹 CLEANUP:
  • Total operações: ${metrics.cleanupOperations}
  • Desnecessárias: ${metrics.unnecessaryCleanups}
  • Eficiência: ${metrics.cleanupEfficiency}%

📈 GRADE GERAL: ${metrics.performanceGrade}

⏰ Gerado em: ${metrics.currentTime}
================================================
`;
    
    logger.info(report);
    return report;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

export default PerformanceMonitor;