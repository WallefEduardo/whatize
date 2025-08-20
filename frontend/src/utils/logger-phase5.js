import logger from './logger';

// Logger específico para Fase 5 - UX e Features Modernas
export const phase5Logger = {
  uxEnhancements: {
    animationImplementation: (component, animationType, performance) => {
      const message = `[ANIMATION] ${component} - ${animationType} - ${performance}ms`;
      if (performance > 16) { // 60fps = 16ms per frame
        logger.migration.warningPreservation(`Animação lenta em ${component}: ${performance}ms`);
      }
      logger.development.build(message);
    },

    toastMigration: (toastType, migrated, working) => {
      const message = `[TOAST] ${toastType} - Migrado: ${migrated}, Funcionando: ${working}`;
      if (!working) {
        logger.migration.warningPreservation(`Toast quebrado: ${toastType}`);
      }
      logger.development.build(message);
    },

    accessibilityImplementation: (component, feature, compliance) => {
      const message = `[A11Y] ${component}.${feature} - ${compliance ? 'COMPLIANT' : 'NON-COMPLIANT'}`;
      if (!compliance) {
        logger.migration.warningPreservation(`Acessibilidade falhou: ${component}.${feature}`);
      }
      logger.development.build(message);
    },

    loadingStateImplementation: (component, stateType, responsive) => {
      const message = `[LOADING] ${component} - ${stateType} - ${responsive ? 'RESPONSIVO' : 'LENTO'}`;
      logger.development.build(message);
    },

    microInteraction: (element, interaction, feedback) => {
      const message = `[MICRO-INTERACTION] ${element}.${interaction} - ${feedback ? 'OK' : 'SEM FEEDBACK'}`;
      logger.development.build(message);
    },

    userFlowPreservation: (flow, preserved, issues = []) => {
      const message = `[USER-FLOW] ${flow} - ${preserved ? 'PRESERVADO' : 'ALTERADO'}`;
      if (!preserved) {
        logger.migration.warningPreservation(`Fluxo alterado: ${flow} - ${issues.join(', ')}`);
        logger.production.error(`USER FLOW REGRESSION: ${flow}`);
      }
      logger.development.build(message);
    }
  }
};

export default phase5Logger;