#!/usr/bin/env node

// 🧪 SCRIPT DE TESTE: Enviar mensagem para LID específico e capturar logs
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Importar dependências
const SendWhatsAppMessage = require('./dist/services/WbotServices/SendWhatsAppMessage').default;
const Ticket = require('./dist/models/Ticket').default;
const Contact = require('./dist/models/Contact').default;
const Whatsapp = require('./dist/models/Whatsapp').default;

async function testSendMessage() {
  try {
    console.log('🧪 [TEST] Iniciando teste de envio de mensagem...');
    
    // 1. Buscar contact com LID específico para testar conversão LID->JID
    const contact = await Contact.findOne({
      where: {
        number: '253725780217903@lid'
      }
    });
    
    if (!contact) {
      console.error('❌ [TEST] Contact com LID não encontrado');
      return;
    }
    
    console.log(`✅ [TEST] Contact encontrado: { id: ${contact.id}, number: '${contact.number}', remoteJid: '${contact.remoteJid}' }`);
    
    // 2. Buscar ticket ativo para este contact
    const { Op } = require('sequelize');
    const ticket = await Ticket.findOne({
      where: {
        contactId: contact.id,
        status: { [Op.in]: ['open', 'pending'] }
      },
      include: [
        { model: Contact, as: 'contact' },
        { model: Whatsapp, as: 'whatsapp' }
      ],
      order: [['updatedAt', 'DESC']]
    });
    
    if (!ticket) {
      console.error('❌ [TEST] Ticket ativo não encontrado para este contact');
      return;
    }
    
    console.log(`✅ [TEST] Ticket encontrado: { id: ${ticket.id}, status: '${ticket.status}', whatsappId: ${ticket.whatsappId} }`);
    
    // 3. Verificar status da sessão antes do envio
    const { getWbot } = require('./dist/libs/wbot');
    
    try {
      const wbot = getWbot(1);
      console.log(`✅ [TEST] Sessão ativa encontrada: { readyState: ${wbot.readyState}, id: ${wbot.id} }`);
    } catch (error) {
      console.log(`❌ [TEST] Sessão não encontrada: ${error.message}`);
      console.log(`🔄 [TEST] Aguardando reconexão...`);
      
      // Aguardar um pouco para tentar reconexão
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
        const wbot = getWbot(1);
        console.log(`✅ [TEST] Sessão reconectada: { readyState: ${wbot.readyState} }`);
      } catch (error2) {
        console.log(`❌ [TEST] Ainda sem sessão após espera: ${error2.message}`);
        return;
      }
    }
    
    // 4. Tentar enviar mensagem de teste
    const testMessage = `🧪 TESTE: Mensagem enviada em ${new Date().toLocaleString('pt-BR')}`;
    
    console.log(`🚀 [TEST] Enviando mensagem: "${testMessage}"`);
    
    const result = await SendWhatsAppMessage({
      body: testMessage,
      ticket: ticket,
      isForwarded: false
    });
    
    console.log(`✅ [TEST] Mensagem enviada com sucesso! MessageId: ${result.key?.id}`);
    
  } catch (error) {
    console.error('❌ [TEST] Erro durante o teste:', {
      message: error.message,
      stack: error.stack
    });
  } finally {
    console.log('🧪 [TEST] Finalizando teste...');
    process.exit(0);
  }
}

// Aguardar um pouco para garantir que o banco está pronto
setTimeout(() => {
  testSendMessage();
}, 3000);