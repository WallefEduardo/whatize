import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { 
  validateAllConfigurations,
  generateConfigReport,
  getFacebookConfig
} from '../config/facebookConfig';

/**
 * Script interativo para configuração da integração Facebook/Instagram
 * Execute com: npx ts-node src/scripts/setupFacebookIntegration.ts
 */

interface SetupConfiguration {
  facebookAppId: string;
  facebookAppSecret: string;
  facebookAccessToken: string;
  verifyToken: string;
  instagramEnabled: boolean;
  instagramBusinessAccountId?: string;
  instagramAccessToken?: string;
  environment: 'development' | 'production';
  monitoringEnabled: boolean;
  alertsEnabled: boolean;
  emailAlertsEnabled: boolean;
  emailConfig?: {
    host: string;
    user: string;
    password: string;
    to: string;
  };
  webhookURL?: string;
}

class FacebookSetupWizard {
  private rl: readline.Interface;
  private config: Partial<SetupConfiguration> = {};

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Inicia o assistente de configuração
   */
  async run(): Promise<void> {
    console.log('🚀 Assistente de Configuração Facebook/Instagram Integration');
    console.log('===================================================\n');
    
    try {
      await this.welcomeScreen();
      await this.checkExistingConfig();
      await this.collectBasicInfo();
      await this.collectFacebookConfig();
      await this.collectInstagramConfig();
      await this.collectMonitoringConfig();
      await this.collectAlertConfig();
      await this.generateEnvironmentFile();
      await this.validateSetup();
      await this.showNextSteps();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Tela de boas-vindas
   */
  private async welcomeScreen(): Promise<void> {
    console.log('Este assistente irá guiá-lo através da configuração completa da');
    console.log('integração Facebook/Instagram para o sistema Whatize.\n');
    
    console.log('📋 O que será configurado:');
    console.log('• Credenciais do Facebook App');
    console.log('• Configurações do Instagram Business');
    console.log('• Sistema de monitoramento e alertas');
    console.log('• Webhook de verificação');
    console.log('• Configurações de segurança\n');
    
    await this.askQuestion('Pressione Enter para continuar...');
  }

  /**
   * Verifica configuração existente
   */
  private async checkExistingConfig(): Promise<void> {
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      console.log('📁 Arquivo .env existente encontrado.');
      const overwrite = await this.askQuestion('Deseja sobrescrever as configurações Facebook/Instagram? (s/n): ');
      
      if (overwrite.toLowerCase() !== 's') {
        console.log('✅ Mantendo configurações existentes. Use --force para sobrescrever.');
        process.exit(0);
      }
    }
  }

  /**
   * Coleta informações básicas
   */
  private async collectBasicInfo(): Promise<void> {
    console.log('\n🔧 Configurações Básicas');
    console.log('========================\n');
    
    const environments = ['development', 'production'];
    console.log('Ambientes disponíveis: development, production');
    
    let environment: string;
    do {
      environment = await this.askQuestion('Ambiente (development/production): ');
    } while (!environments.includes(environment));
    
    this.config.environment = environment as 'development' | 'production';
    
    if (environment === 'development') {
      this.config.webhookURL = await this.askQuestion('URL do webhook (ngrok/túnel): ') || undefined;
    } else {
      this.config.webhookURL = await this.askQuestion('URL do webhook (produção): ') || undefined;
    }
  }

  /**
   * Coleta configurações do Facebook
   */
  private async collectFacebookConfig(): Promise<void> {
    console.log('\n📱 Configurações do Facebook');
    console.log('============================\n');
    
    console.log('ℹ️  Dados já configurados para desenvolvimento:');
    console.log('   App ID: 1443021550275833');
    console.log('   Access Token: c1ef9d5fae9c5f8eb517a5c527acff0a\n');
    
    const useExisting = await this.askQuestion('Usar configurações existentes? (s/n): ');
    
    if (useExisting.toLowerCase() === 's') {
      this.config.facebookAppId = '1443021550275833';
      this.config.facebookAccessToken = 'c1ef9d5fae9c5f8eb517a5c527acff0a';
      console.log('✅ Usando configurações pré-definidas');
    } else {
      this.config.facebookAppId = await this.askQuestion('Facebook App ID: ');
      this.config.facebookAccessToken = await this.askQuestion('Facebook Access Token: ');
    }
    
    this.config.facebookAppSecret = await this.askQuestion('Facebook App Secret (obrigatório): ');
    
    if (!this.config.facebookAppSecret) {
      throw new Error('Facebook App Secret é obrigatório');
    }
    
    this.config.verifyToken = await this.askQuestion('Verify Token (webhook): ') || 'whatize_webhook_verify_token_2024';
  }

  /**
   * Coleta configurações do Instagram
   */
  private async collectInstagramConfig(): Promise<void> {
    console.log('\n📸 Configurações do Instagram');
    console.log('=============================\n');
    
    const enableInstagram = await this.askQuestion('Habilitar integração Instagram? (s/n): ');
    this.config.instagramEnabled = enableInstagram.toLowerCase() === 's';
    
    if (this.config.instagramEnabled) {
      console.log('\nℹ️  Para configurar o Instagram você precisa:');
      console.log('   • Uma conta Instagram Business');
      console.log('   • Conta vinculada a uma Página do Facebook');
      console.log('   • Instagram Business Account ID');
      console.log('   • Access Token com permissões Instagram\n');
      
      this.config.instagramBusinessAccountId = await this.askQuestion('Instagram Business Account ID: ') || undefined;
      this.config.instagramAccessToken = await this.askQuestion('Instagram Access Token: ') || undefined;
      
      if (!this.config.instagramBusinessAccountId || !this.config.instagramAccessToken) {
        console.log('⚠️  Instagram será habilitado mas não funcionará sem as credenciais');
      }
    }
  }

  /**
   * Coleta configurações de monitoramento
   */
  private async collectMonitoringConfig(): Promise<void> {
    console.log('\n📊 Configurações de Monitoramento');
    console.log('==================================\n');
    
    const enableMonitoring = await this.askQuestion('Habilitar sistema de monitoramento? (s/n): ');
    this.config.monitoringEnabled = enableMonitoring.toLowerCase() === 's';
    
    if (this.config.monitoringEnabled) {
      console.log('✅ Sistema de monitoramento será habilitado com:');
      console.log('   • Logs estruturados');
      console.log('   • Métricas de performance');
      console.log('   • Health checks automáticos');
      console.log('   • Telemetria de uso');
    }
  }

  /**
   * Coleta configurações de alertas
   */
  private async collectAlertConfig(): Promise<void> {
    console.log('\n🚨 Configurações de Alertas');
    console.log('===========================\n');
    
    if (!this.config.monitoringEnabled) {
      console.log('⚠️  Alertas requerem monitoramento habilitado');
      return;
    }
    
    const enableAlerts = await this.askQuestion('Habilitar sistema de alertas? (s/n): ');
    this.config.alertsEnabled = enableAlerts.toLowerCase() === 's';
    
    if (this.config.alertsEnabled) {
      const enableEmailAlerts = await this.askQuestion('Habilitar alertas por email? (s/n): ');
      this.config.emailAlertsEnabled = enableEmailAlerts.toLowerCase() === 's';
      
      if (this.config.emailAlertsEnabled) {
        console.log('\n📧 Configuração de Email');
        console.log('=======================\n');
        
        this.config.emailConfig = {
          host: await this.askQuestion('SMTP Host (ex: smtp.gmail.com): '),
          user: await this.askQuestion('Email usuário: '),
          password: await this.askQuestion('Senha/App Password: '),
          to: await this.askQuestion('Email(s) para alertas (separados por vírgula): ')
        };
      }
      
      const webhookAlert = await this.askQuestion('URL do webhook para alertas (Slack/Discord): ') || undefined;
      if (webhookAlert) {
        // Adicionar à configuração se necessário
      }
    }
  }

  /**
   * Gera o arquivo .env
   */
  private async generateEnvironmentFile(): Promise<void> {
    console.log('\n📝 Gerando arquivo de configuração');
    console.log('===================================\n');
    
    const envPath = path.join(process.cwd(), '.env');
    const envExamplePath = path.join(process.cwd(), '.env.example');
    
    let envContent = '';
    
    // Ler .env.example se existir
    if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
    }
    
    // Atualizar/adicionar configurações Facebook
    envContent = this.updateEnvContent(envContent);
    
    // Escrever arquivo .env
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Arquivo .env criado/atualizado com sucesso');
    console.log(`📍 Localização: ${envPath}`);
  }

  /**
   * Atualiza conteúdo do arquivo .env
   */
  private updateEnvContent(content: string): string {
    const updates: Record<string, string> = {
      'FACEBOOK_APP_ID': this.config.facebookAppId!,
      'FACEBOOK_APP_SECRET': this.config.facebookAppSecret!,
      'FACEBOOK_ACCESS_TOKEN': this.config.facebookAccessToken!,
      'VERIFY_TOKEN': this.config.verifyToken!,
      'META_API_VERSION': 'v22.0',
      'META_API_BASE_URL': 'https://graph.facebook.com',
      'INSTAGRAM_API_ENABLED': this.config.instagramEnabled ? 'true' : 'false'
    };
    
    if (this.config.instagramEnabled && this.config.instagramBusinessAccountId) {
      updates['INSTAGRAM_BUSINESS_ACCOUNT_ID'] = this.config.instagramBusinessAccountId;
    }
    
    if (this.config.instagramEnabled && this.config.instagramAccessToken) {
      updates['INSTAGRAM_ACCESS_TOKEN'] = this.config.instagramAccessToken;
    }
    
    // Configurações de monitoramento
    if (this.config.monitoringEnabled) {
      updates['FACEBOOK_TELEMETRY_ENABLED'] = 'true';
      updates['FACEBOOK_HEALTH_CHECK_ENABLED'] = 'true';
      updates['FACEBOOK_LOG_LEVEL'] = this.config.environment === 'development' ? 'debug' : 'info';
    }
    
    // Configurações de alertas
    if (this.config.alertsEnabled) {
      updates['FACEBOOK_ALERTS_ENABLED'] = 'true';
      
      if (this.config.emailAlertsEnabled && this.config.emailConfig) {
        updates['FACEBOOK_ALERT_EMAIL_ENABLED'] = 'true';
        updates['FACEBOOK_ALERT_SMTP_HOST'] = this.config.emailConfig.host;
        updates['FACEBOOK_ALERT_SMTP_USER'] = this.config.emailConfig.user;
        updates['FACEBOOK_ALERT_SMTP_PASS'] = this.config.emailConfig.password;
        updates['FACEBOOK_ALERT_EMAIL_TO'] = this.config.emailConfig.to;
      }
    }
    
    // Configurações de ambiente
    if (this.config.environment === 'development') {
      updates['FACEBOOK_DEBUG_MODE'] = 'true';
      updates['SKIP_WEBHOOK_SIGNATURE'] = 'true';
    }
    
    // Aplicar updates
    Object.entries(updates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (content.match(regex)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += `\n${key}=${value}`;
      }
    });
    
    return content;
  }

  /**
   * Valida a configuração criada
   */
  private async validateSetup(): Promise<void> {
    console.log('\n🔍 Validando configuração');
    console.log('=========================\n');
    
    try {
      // Recarregar variáveis de ambiente
      require('dotenv').config();
      
      const validation = validateAllConfigurations();
      
      if (validation.valid) {
        console.log('✅ Validação passou com sucesso!');
        
        if (validation.warnings.length > 0) {
          console.log('\n⚠️  Avisos encontrados:');
          validation.warnings.forEach(warning => {
            console.log(`   • ${warning}`);
          });
        }
      } else {
        console.log('❌ Validação falhou:');
        validation.errors.forEach(error => {
          console.log(`   • ${error}`);
        });
        
        throw new Error('Configuration validation failed');
      }
      
    } catch (error) {
      console.log(`❌ Erro na validação: ${error.message}`);
      console.log('   Você pode corrigir manualmente o arquivo .env');
    }
  }

  /**
   * Mostra próximos passos
   */
  private async showNextSteps(): Promise<void> {
    console.log('\n🎉 Configuração Concluída!');
    console.log('==========================\n');
    
    console.log('📋 Próximos passos:');
    console.log('');
    
    console.log('1. 🔧 Instalar dependências:');
    console.log('   npm install');
    console.log('');
    
    console.log('2. 🗄️  Executar migrações do banco:');
    console.log('   npm run db:migrate');
    console.log('');
    
    console.log('3. 🌐 Configurar webhook no Facebook:');
    console.log(`   URL: ${this.config.webhookURL || 'https://seu-dominio.com'}/webhooks/facebook`);
    console.log(`   Verify Token: ${this.config.verifyToken}`);
    console.log('   Eventos: messages, messaging_postbacks, message_deliveries');
    console.log('');
    
    console.log('4. 🚀 Iniciar aplicação:');
    console.log('   npm run dev');
    console.log('');
    
    console.log('5. 🔍 Testar configuração:');
    console.log('   curl http://localhost:4035/api/configuration/health');
    console.log('');
    
    if (this.config.monitoringEnabled) {
      console.log('6. 📊 Acessar dashboard de monitoramento:');
      console.log('   http://localhost:4035/api/facebook-monitoring/dashboard');
      console.log('');
    }
    
    console.log('📚 Documentação completa:');
    console.log('   Consulte: FACEBOOK_INSTAGRAM_SETUP.md');
    console.log('');
    
    console.log('🆘 Suporte:');
    console.log('   Logs: tail -f logs/application.log');
    console.log('   Validação: npx ts-node src/scripts/validateConfig.ts');
    console.log('   Health check: /api/configuration/health');
    console.log('');
    
    console.log('✅ Setup concluído com sucesso!');
  }

  /**
   * Helper para fazer perguntas
   */
  private askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Executar o assistente se for chamado diretamente
if (require.main === module) {
  const wizard = new FacebookSetupWizard();
  wizard.run().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export { FacebookSetupWizard };