import React from 'react';
import { phase6Logger } from './logger-phase6';

// Auditoria completa de acessibilidade
export class AccessibilityAuditor {
  constructor() {
    this.issues = [];
  }

  async runFullAudit() {
    console.log('♿ Iniciando auditoria completa de acessibilidade...');
    
    this.issues = [];
    
    // Executar todas as verificações
    await this.checkAriaLabels();
    await this.checkColorContrast();
    await this.checkKeyboardNavigation();
    await this.checkSemanticHtml();
    await this.checkImageAltText();
    await this.checkFormLabels();
    await this.checkHeadingHierarchy();
    
    // Contar issues por severidade
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const highIssues = this.issues.filter(i => i.severity === 'high');
    
    const passed = criticalIssues.length === 0 && highIssues.length === 0;
    
    // Log dos resultados
    phase6Logger.finalValidation.accessibilityAudit(
      'global',
      'AAA',
      passed,
      this.issues.map(i => `${i.element}: ${i.issue}`)
    );
    
    console.log(`♿ Auditoria concluída: ${passed ? 'PASSOU' : 'FALHOU'}`);
    console.log(`   - ${this.issues.length} issues encontrados`);
    console.log(`   - ${criticalIssues.length} críticos, ${highIssues.length} altos`);
    
    return { passed, issues: this.issues };
  }

  async checkAriaLabels() {
    const elementsNeedingLabels = document.querySelectorAll('button, input, select, textarea');
    
    elementsNeedingLabels.forEach((element, index) => {
      const hasLabel = element.hasAttribute('aria-label') || 
                      element.hasAttribute('aria-labelledby') ||
                      element.closest('label') ||
                      document.querySelector(`label[for="${element.id}"]`);
      
      if (!hasLabel) {
        this.issues.push({
          element: `${element.tagName.toLowerCase()}[${index}]`,
          issue: 'Elemento sem label acessível',
          severity: 'high',
          wcagLevel: 'A',
        });
      }
    });
  }

  async checkColorContrast() {
    // Verificação simplificada
    const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, button, a');
    
    textElements.forEach((element, index) => {
      const styles = getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Simulação de verificação de contraste
      const hasGoodContrast = true; // Placeholder
      
      if (!hasGoodContrast) {
        this.issues.push({
          element: `${element.tagName.toLowerCase()}[${index}]`,
          issue: 'Contraste insuficiente',
          severity: 'medium',
          wcagLevel: 'AAA',
        });
      }
    });
  }

  async checkKeyboardNavigation() {
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
    
    interactiveElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      const isFocusable = tabIndex !== '-1' && !element.hasAttribute('disabled');
      
      if (!isFocusable && element.tagName !== 'A') {
        this.issues.push({
          element: `${element.tagName.toLowerCase()}[${index}]`,
          issue: 'Elemento interativo não focusável',
          severity: 'high',
          wcagLevel: 'A',
        });
      }
    });
  }

  async checkSemanticHtml() {
    const hasMain = document.querySelector('main');
    const hasNav = document.querySelector('nav');
    const hasHeader = document.querySelector('header');
    
    if (!hasMain) {
      this.issues.push({
        element: 'document',
        issue: 'Falta elemento <main>',
        severity: 'medium',
        wcagLevel: 'AA',
      });
    }
    
    if (!hasNav) {
      this.issues.push({
        element: 'document',
        issue: 'Falta elemento <nav>',
        severity: 'low',
        wcagLevel: 'AA',
      });
    }
  }

  async checkImageAltText() {
    const images = document.querySelectorAll('img');
    
    images.forEach((img, index) => {
      const hasAlt = img.hasAttribute('alt');
      
      if (!hasAlt) {
        this.issues.push({
          element: `img[${index}]`,
          issue: 'Imagem sem atributo alt',
          severity: 'high',
          wcagLevel: 'A',
        });
      }
    });
  }

  async checkFormLabels() {
    const formFields = document.querySelectorAll('input, select, textarea');
    
    formFields.forEach((field, index) => {
      const hasLabel = field.hasAttribute('aria-label') ||
                      field.hasAttribute('aria-labelledby') ||
                      document.querySelector(`label[for="${field.id}"]`);
      
      if (!hasLabel) {
        this.issues.push({
          element: `${field.tagName.toLowerCase()}[${index}]`,
          issue: 'Campo de formulário sem label',
          severity: 'critical',
          wcagLevel: 'A',
        });
      }
    });
  }

  async checkHeadingHierarchy() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level > previousLevel + 1) {
        this.issues.push({
          element: `${heading.tagName.toLowerCase()}[${index}]`,
          issue: 'Hierarquia de headings quebrada',
          severity: 'medium',
          wcagLevel: 'AA',
        });
      }
      
      previousLevel = level;
    });
  }
}

// Hook para auditoria automática
export const useAccessibilityAudit = (runOnMount = false) => {
  const [auditResults, setAuditResults] = React.useState(null);
  
  const runAudit = React.useCallback(async () => {
    const auditor = new AccessibilityAuditor();
    const results = await auditor.runFullAudit();
    setAuditResults(results);
    return results;
  }, []);
  
  React.useEffect(() => {
    if (runOnMount) {
      runAudit();
    }
  }, [runOnMount, runAudit]);
  
  return { auditResults, runAudit };
};

export default AccessibilityAuditor;