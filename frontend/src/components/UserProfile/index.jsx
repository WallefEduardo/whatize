import React, { useState, useContext, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { User, Settings, Lock, Shield, Users, Home } from 'lucide-react';

// Nossos componentes CVA
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ModernTabs, ModernTabsList, ModernTabsTrigger, ModernTabsContent } from '../ui/ModernTabs';
import PageLayout from '../PageLayout';
import { AuthContext } from '../../context/Auth/AuthContext';
import api from '../../services/api';

// Componentes internos
import CoverBanner from './CoverBanner';
import UserAvatar from './UserAvatar';
import ContactInfo from './ContactInfo';
import Portfolio from './Portfolio';  
import Skills from './Skills';
import PersonalDetails from './PersonalDetails';
import ChangePassword from './ChangePassword';
import Permissions from './Permissions';
import UserSettings from './Settings';

const UserProfile = ({ onClose, user: propUser }) => {
  const { user: loggedInUser } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Se há um usuário específico via prop (editando outro usuário)
        if (propUser && propUser.id) {
          console.log('Buscando dados completos do usuário:', propUser.id);
          const { data } = await api.get(`/users/${propUser.id}`);
          console.log('Dados completos recebidos:', data);
          setUserData(data);
        } 
        // Senão usar dados do usuário logado
        else if (loggedInUser) {
          console.log('Usando dados do usuário logado:', loggedInUser.id);
          const { data } = await api.get(`/users/${loggedInUser.id}`);
          console.log('Dados do usuário logado recebidos:', data);
          setUserData(data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        // Em caso de erro, usar os dados básicos disponíveis
        setUserData(propUser || loggedInUser);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [propUser, loggedInUser]);

  const tabs = [
    {
      label: "Dados Pessoais",
      value: "personal",
      icon: <User size={16} />
    },
    {
      label: "Alterar Senha", 
      value: "password",
      icon: <Lock size={16} />
    },
    {
      label: "Permissões",
      value: "permissions",
      icon: <Shield size={16} />
    },
    {
      label: "Configurações",
      value: "settings",
      icon: <Settings size={16} />
    }
  ];

  if (loading) {
    return (
      <PageLayout
        title="Carregando..."
        icon={<User size={20} />}
        breadcrumbs={[
          { href: "/", icon: <Home size={16} /> },
          { href: "/users", icon: <Users size={16} /> },
          { label: "Carregando..." }
        ]}
        showBreadcrumb={true}
      >
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Carregando perfil...</Typography>
        </Box>
      </PageLayout>
    );
  }

  // Definir breadcrumbs baseado no usuário
  const breadcrumbs = [
    { href: "/", icon: <Home size={16} /> },
    { href: "/users", icon: <Users size={16} /> },
    { label: propUser ? `Perfil de ${userData?.name || propUser.name}` : 'Meu Perfil' }
  ];

  return (
    <PageLayout
      title={propUser ? `Perfil de ${userData?.name || propUser.name}` : 'Meu Perfil'}
      icon={<User size={20} />}
      breadcrumbs={breadcrumbs}
      showBreadcrumb={true}
    >

      {/* Cover Banner */}
      <Box sx={{ mb: 3 }}>
        <CoverBanner user={userData} onUpdate={setUserData} />
      </Box>

      {/* Layout Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' },
        gap: 3
      }}>
        {/* Sidebar Esquerda */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* UserAvatar Container */}
          <Card>
            <UserAvatar user={userData} onUpdate={setUserData} />
          </Card>


          {/* Portfolio Container */}
          <Card>
            <Portfolio user={userData} onUpdate={setUserData} />
          </Card>

          {/* Skills Container */}
          <Card>
            <Skills user={userData} onUpdate={setUserData} />
          </Card>
        </Box>

        {/* Conteúdo Principal - Tabs */}
        <Card>
          <ModernTabs defaultValue="personal">
            <CardHeader sx={{ pb: 0 }}>
              <ModernTabsList>
                {tabs.map((tab) => (
                  <ModernTabsTrigger
                    key={tab.value}
                    value={tab.value}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tab.icon}
                      {tab.label}
                    </Box>
                  </ModernTabsTrigger>
                ))}
              </ModernTabsList>
            </CardHeader>

            <ModernTabsContent value="personal">
              <PersonalDetails 
                user={userData} 
                onUpdate={setUserData}
                onCancel={onClose}
              />
            </ModernTabsContent>

            <ModernTabsContent value="password">
              <ChangePassword 
                user={userData}
                onCancel={onClose}
              />
            </ModernTabsContent>

            <ModernTabsContent value="permissions">
              <Permissions 
                user={userData}
                onCancel={onClose}
              />
            </ModernTabsContent>

            <ModernTabsContent value="settings">
              <UserSettings 
                user={userData} 
                onUpdate={setUserData}
                onCancel={onClose}
              />
            </ModernTabsContent>
          </ModernTabs>
        </Card>
      </Box>
    </PageLayout>
  );
};

export default UserProfile;