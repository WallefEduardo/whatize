import React, { useState, useContext, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { User, Settings, Lock } from 'lucide-react';

// Nossos componentes CVA
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { AuthContext } from '../../context/Auth/AuthContext';

// Componentes internos
import UserMeta from './UserMeta';
import Portfolio from './Portfolio';  
import Skills from './Skills';
import PersonalDetails from './PersonalDetails';
import ChangePassword from './ChangePassword';

const UserProfile = ({ onClose }) => {
  const { user: loggedInUser } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Carregar dados do usuário atual
    if (loggedInUser) {
      setUserData(loggedInUser);
      setLoading(false);
    }
  }, [loggedInUser]);

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
      label: "Configurações",
      value: "settings",
      icon: <Settings size={16} />
    }
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Carregando perfil...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      p: 3
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
          Perfil do Usuário
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Gerencie suas informações pessoais, senha e configurações
        </Typography>
      </Box>

      {/* Layout Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' },
        gap: 3
      }}>
        {/* Sidebar Esquerda */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* UserMeta Container */}
          <Card>
            <UserMeta user={userData} onUpdate={setUserData} />
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
          <Tabs defaultValue="personal">
            <CardHeader>
              <TabsList 
                variant="line" 
                fullWidth 
                sx={{
                  backgroundColor: 'transparent',
                  borderBottom: '1px solid #e2e8f0',
                  borderRadius: 0,
                  padding: '24px 24px 0 24px',
                  height: 'auto',
                  gap: '32px'
                }}
              >
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    variant="line"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0 0 12px 0',
                      color: '#64748b',
                      borderBottom: '2px solid transparent',
                      '&[data-state="active"]': {
                        borderBottomColor: '#3b82f6',
                        color: '#3b82f6',
                      },
                      '&:hover': {
                        color: '#1e293b',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardHeader>

            <TabsContent value="personal" sx={{ marginTop: 0 }}>
              <PersonalDetails user={userData} onUpdate={setUserData} />
            </TabsContent>

            <TabsContent value="password" sx={{ marginTop: 0 }}>
              <ChangePassword user={userData} />
            </TabsContent>

            <TabsContent value="settings" sx={{ marginTop: 0 }}>
              <CardContent>
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <Settings size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
                  <Typography variant="h6" sx={{ color: '#64748b', mb: 2 }}>
                    Configurações em Desenvolvimento
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                    Esta seção estará disponível em breve
                  </Typography>
                </Box>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </Box>
    </Box>
  );
};

export default UserProfile;