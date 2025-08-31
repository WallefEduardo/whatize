import React, { useState, useContext, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { User, Settings, Lock, Shield, ArrowLeft } from 'lucide-react';

// Nossos componentes CVA
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ModernTabs, ModernTabsList, ModernTabsTrigger, ModernTabsContent } from '../ui/ModernTabs';
import { AuthContext } from '../../context/Auth/AuthContext';

// Componentes internos
import CoverBanner from './CoverBanner';
import UserMeta from './UserMeta';
import Portfolio from './Portfolio';  
import Skills from './Skills';
import PersonalDetails from './PersonalDetails';
import ChangePassword from './ChangePassword';
import Permissions from './Permissions';
import UserSettings from './Settings';

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
      <Box sx={{ 
        width: '100%',
        height: '100%',
        backgroundColor: 'var(--bg-primary)',
        minHeight: '100vh',
        p: 3,
        textAlign: 'center'
      }}>
        <Typography>Carregando perfil...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      minHeight: '100vh'
    }}>
      <Box sx={{ padding: 3 }}>
        {/* Botão Voltar */}
        <Button
          onClick={onClose}
          sx={{
            mb: 3,
            backgroundColor: '#6b7280',
            color: 'white',
            '&:hover': {
              backgroundColor: '#4b5563'
            }
          }}
        >
          <ArrowLeft size={16} style={{ marginRight: 8 }} />
          Voltar para Usuários
        </Button>

        {/* Container Superior - Header do Perfil */}
        <Card sx={{ 
          marginBottom: 3, 
          overflow: 'hidden',
          borderRadius: '16px'
        }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-green-hover, #00e608) 100%)',
            color: 'white',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 3
          }}>
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              <User size={32} color="white" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '28px', mb: 1 }}>
                Perfil do Usuário
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '16px' }}>
                Visualize e edite as informações do seu perfil
              </Typography>
            </Box>
          </Box>
        </Card>

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
              <PersonalDetails user={userData} onUpdate={setUserData} />
            </ModernTabsContent>

            <ModernTabsContent value="password">
              <ChangePassword user={userData} />
            </ModernTabsContent>

            <ModernTabsContent value="permissions">
              <Permissions user={userData} />
            </ModernTabsContent>

            <ModernTabsContent value="settings">
              <UserSettings user={userData} onUpdate={setUserData} />
            </ModernTabsContent>
          </ModernTabs>
        </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default UserProfile;