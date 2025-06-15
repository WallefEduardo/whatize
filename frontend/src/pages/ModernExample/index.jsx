import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { 
  MessageCircle, 
  Users, 
  BarChart3, 
  Settings, 
  Search,
  Bell,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

// Importar componentes modernos
import { Button, Card, Input, cn, animations } from '../../components/modern';

const ModernExample = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log('Form data:', data);
  };

  const stats = [
    {
      title: 'Conversas Ativas',
      value: '1,234',
      change: '+12%',
      icon: MessageCircle,
      color: 'text-primary-500',
      bgColor: 'bg-primary-50 dark:bg-primary-900/20',
    },
    {
      title: 'Clientes Ativos',
      value: '856',
      change: '+8%',
      icon: Users,
      color: 'text-success-500',
      bgColor: 'bg-success-50 dark:bg-success-900/20',
    },
    {
      title: 'Taxa de Conversão',
      value: '68%',
      change: '+15%',
      icon: BarChart3,
      color: 'text-warning-500',
      bgColor: 'bg-warning-50 dark:bg-warning-900/20',
    },
    {
      title: 'Mensagens Enviadas',
      value: '12.5k',
      change: '+23%',
      icon: MessageCircle,
      color: 'text-whatsapp-500',
      bgColor: 'bg-whatsapp-50 dark:bg-whatsapp-900/20',
    },
  ];

  const recentContacts = [
    { id: 1, name: 'João Silva', message: 'Olá, preciso de ajuda...', time: '2 min', status: 'online' },
    { id: 2, name: 'Maria Santos', message: 'Obrigada pelo atendimento!', time: '5 min', status: 'away' },
    { id: 3, name: 'Pedro Costa', message: 'Quando posso receber?', time: '10 min', status: 'offline' },
    { id: 4, name: 'Ana Oliveira', message: 'Perfeito, muito obrigada!', time: '15 min', status: 'online' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header Moderno */}
      <header className="header-modern">
        <div className="container-modern">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Whatize Dashboard
              </h1>
              <span className="badge-primary">v2.2.2</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Buscar..."
                icon={<Search />}
                className="w-64"
                containerClassName="hidden md:block"
              />
              
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-modern py-8">
        {/* Tabs de Navegação */}
        <div className="flex space-x-1 mb-8 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'contacts', label: 'Contatos' },
            { id: 'campaigns', label: 'Campanhas' },
            { id: 'settings', label: 'Configurações' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo do Dashboard */}
        {activeTab === 'dashboard' && (
          <motion.div
            {...animations.fadeIn}
            className="space-y-8"
          >
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover className="relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stat.value}
                        </p>
                        <p className="text-sm text-success-600 dark:text-success-400 mt-1">
                          {stat.change} vs mês anterior
                        </p>
                      </div>
                      <div className={cn('p-3 rounded-lg', stat.bgColor)}>
                        <stat.icon className={cn('w-6 h-6', stat.color)} />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Grid Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contatos Recentes */}
              <div className="lg:col-span-2">
                <Card>
                  <Card.Header>
                    <div className="flex items-center justify-between">
                      <Card.Title>Conversas Recentes</Card.Title>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Filter className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card.Header>
                  
                  <Card.Body>
                    <div className="space-y-4">
                      {recentContacts.map((contact) => (
                        <motion.div
                          key={contact.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                                {contact.name.charAt(0)}
                              </div>
                              <div className={cn(
                                'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
                                contact.status === 'online' ? 'bg-success-500' :
                                contact.status === 'away' ? 'bg-warning-500' : 'bg-gray-400'
                              )} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {contact.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {contact.message}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {contact.time}
                            </span>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* Ações Rápidas */}
              <div>
                <Card>
                  <Card.Header>
                    <Card.Title>Ações Rápidas</Card.Title>
                  </Card.Header>
                  
                  <Card.Body>
                    <div className="space-y-3">
                      <Button variant="whatsapp" className="w-full justify-start">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Campanha
                      </Button>
                      
                      <Button variant="primary" className="w-full justify-start">
                        <Users className="w-4 h-4 mr-2" />
                        Adicionar Contato
                      </Button>
                      
                      <Button variant="secondary" className="w-full justify-start">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Ver Relatórios
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                      </Button>
                    </div>
                  </Card.Body>
                </Card>

                {/* Formulário de Exemplo */}
                <Card className="mt-6">
                  <Card.Header>
                    <Card.Title>Contato Rápido</Card.Title>
                  </Card.Header>
                  
                  <Card.Body>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <Input
                        label="Nome"
                        placeholder="Digite o nome..."
                        {...register('name', { required: 'Nome é obrigatório' })}
                        error={errors.name?.message}
                      />
                      
                      <Input
                        label="WhatsApp"
                        placeholder="(11) 99999-9999"
                        icon={<MessageCircle />}
                        {...register('phone', { required: 'Telefone é obrigatório' })}
                        error={errors.phone?.message}
                      />
                      
                      <Button type="submit" variant="whatsapp" className="w-full">
                        Adicionar Contato
                      </Button>
                    </form>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* Outros tabs podem ser implementados aqui */}
        {activeTab !== 'dashboard' && (
          <motion.div
            {...animations.fadeIn}
            className="text-center py-12"
          >
            <Card className="max-w-md mx-auto">
              <Card.Body>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Esta seção está em desenvolvimento. Os componentes modernos estão prontos para uso!
                </p>
              </Card.Body>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ModernExample; 