import React, { useState, useContext, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { User, Settings, Lock, Shield } from 'lucide-react';

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
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Carregando perfil...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#EEF1F9'
    }}>
      {/* Cover Banner */}
      <Box sx={{ p: 3, pb: 0 }}>
        <CoverBanner user={userData} onUpdate={setUserData} />
      </Box>

      {/* Layout Grid */}
      <Box sx={{ 
        p: 3,
        pt: 0,
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
  );
};

export default UserProfile;