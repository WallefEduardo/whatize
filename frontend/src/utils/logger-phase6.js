import { logger } from './logger';

// Logger específico para Fase 6 - Auditoria e Testes Finais
export const phase6Logger = {
  finalValidation: {
    testExecution: (testSuite, passed, failed, skipped) => {
      const message = `[TESTS] ${testSuite} - Passou: ${passed}, Falhou: ${failed}, Pulou: ${skipped}`;
      if (failed > 0) {
        logger.migration.warningPreservation(`Testes falharam em ${testSuite}: ${failed} falhas`);
        logger.production.error(`CRITICAL: Testes falharam em ${testSuite}`);
      }
      logger.development.build(message);
    },

    performanceOptimization: (metric, before, after, target) => {
      const improvement = ((before - after) / before * 100).toFixed(1);
      const targetMet = after <= target;
      const message = `[PERF-OPT] ${metric}: ${before} → ${after} (${improvement}% melhor) - Meta: ${targetMet ? 'ATINGIDA' : 'NÃO ATINGIDA'}`;
      
      if (!targetMet) {
        logger.migration.warningPreservation(`Meta de performance não atingida: ${metric}`);
      }
      
      logger.development.performance(message);
      logger.production.performance(metric, after);
    },

    compatibilityTest: (browser, version, working, issues = []) => {
      const message = `[COMPAT] ${browser} ${version} - ${working ? 'OK' : 'PROBLEMAS'}`;
      if (!working && issues.length > 0) {
        logger.migration.warningPreservation(`Compatibilidade falhou em ${browser}: ${issues.join(', ')}`);
      }
      logger.development.build(message);
    },

    accessibilityAudit: (component, wcagLevel, compliant, issues = []) => {
      const message = `[A11Y-AUDIT] ${component} - WCAG ${wcagLevel} - ${compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`;
      if (!compliant && issues.length > 0) {
        logger.migration.warningPreservation(`Acessibilidade falhou em ${component}: ${issues.join(', ')}`);
      }
      logger.development.build(message);
    },

    bundleAnalysis: (chunk, size, sizeLimit, optimized) => {
      const message = `[BUNDLE] ${chunk} - ${size}KB (Limite: ${sizeLimit}KB) - ${optimized ? 'OTIMIZADO' : 'PODE MELHORAR'}`;
      if (size > sizeLimit) {
        logger.migration.warningPreservation(`Bundle muito grande: ${chunk} - ${size}KB`);
      }
      logger.development.build(message);
    },

    regressionTest: (functionality, working, previouslyWorking) => {
      const isRegression = previouslyWorking && !working;
      const message = `[REGRESSION] ${functionality} - ${working ? 'OK' : 'QUEBRADO'} - ${isRegression ? 'REGRESSÃO DETECTADA' : 'STATUS MANTIDO'}`;
      
      if (isRegression) {
        logger.migration.warningPreservation(`REGRESSÃO CRÍTICA: ${functionality}`);
        logger.production.error(`CRITICAL REGRESSION: ${functionality}`);
      }
      
      logger.development.build(message);
    },

    migrationAudit: (file, usesOldAPI, needsMigration, priority) => {
      const message = `[MIGRATION-AUDIT] ${file} - Old API: ${usesOldAPI ? 'SIM' : 'NÃO'} - Needs Migration: ${needsMigration ? 'SIM' : 'NÃO'} - Priority: ${priority}`;
      
      if (needsMigration) {
        if (priority === 'high') {
          logger.migration.warningPreservation(`Migração crítica necessária: ${file}`);
        }
        logger.development.build(message);
      }
    }
  }
};

export default phase6Logger;