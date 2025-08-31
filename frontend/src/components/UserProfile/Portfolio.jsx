import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Globe, Linkedin, Github, Twitter, X, Plus, Link as LinkIcon } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import ModernButton from '../ui/ModernButton';
import api from '../../services/api';
import { toast } from '../ui/ToastProvider';

const Portfolio = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newLink, setNewLink] = useState({ type: '', url: '' });

  // Links do usuário (sem dados padrão)
  const [links, setLinks] = useState(user?.portfolio || []);

  // Atualizar links quando user prop mudar
  useEffect(() => {
    setLinks(user?.portfolio || []);
  }, [user]);

  const linkTypes = [
    { value: 'website', label: 'Website', icon: Globe },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin }, 
    { value: 'github', label: 'GitHub', icon: Github },
    { value: 'twitter', label: 'Twitter', icon: Twitter },
    { value: 'portfolio', label: 'Portfólio', icon: LinkIcon },
    { value: 'other', label: 'Outro', icon: LinkIcon },
  ];

  const getLinkIcon = (type) => {
    const linkType = linkTypes.find(t => t.value === type);
    return linkType ? linkType.icon : LinkIcon;
  };

  const savePortfolio = async (updatedPortfolio) => {
    try {
      await api.put(`/users/${user.id}`, { portfolio: updatedPortfolio });
      toast.success('Portfolio atualizado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao salvar portfolio:', error);
      toast.error('Erro ao salvar portfolio');
      return false;
    }
  };

  const handleAddLink = async () => {
    if (newLink.url && newLink.type) {
      const link = {
        id: Date.now(),
        type: newLink.type,
        url: newLink.url,
      };
      const updatedLinks = [...links, link];
      
      // Optimistic update
      setLinks(updatedLinks);
      setNewLink({ type: '', url: '' });
      setIsEditing(false);
      
      // Atualizar usuário local
      if (onUpdate) {
        onUpdate({ ...user, portfolio: updatedLinks });
      }
      
      // Salvar no backend
      const saved = await savePortfolio(updatedLinks);
      if (!saved) {
        // Rollback on error
        setLinks(links);
        setIsEditing(true);
        if (onUpdate) {
          onUpdate({ ...user, portfolio: links });
        }
      }
    }
  };

  const handleRemoveLink = async (id) => {
    const previousLinks = [...links];
    const updatedLinks = links.filter(link => link.id !== id);
    
    // Optimistic update
    setLinks(updatedLinks);
    
    // Atualizar usuário local
    if (onUpdate) {
      onUpdate({ ...user, portfolio: updatedLinks });
    }
    
    // Salvar no backend
    const saved = await savePortfolio(updatedLinks);
    if (!saved) {
      // Rollback on error
      setLinks(previousLinks);
      if (onUpdate) {
        onUpdate({ ...user, portfolio: previousLinks });
      }
    }
  };

  const formatUrl = (url) => {
    if (url.length > 35) {
      return url.substring(0, 35) + '...';
    }
    return url;
  };

  const openLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <CardHeader sx={{ borderBottom: 'none', paddingBottom: '12px' }}>
        <CardTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          fontSize: '18px', 
          fontWeight: 500, 
          color: 'var(--text-gray-medium)' 
        }}>
          <LinkIcon size={18} />
          Portfolio & Links
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Links Existentes */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {links.map((link) => {
            const IconComponent = getLinkIcon(link.type);
            return (
              <Box 
                key={link.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-primary)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)'
                  }
                }}
              >
                {/* Icon */}
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComponent size={16} color="white" />
                </Box>

                {/* URL */}
                <Box 
                  sx={{ 
                    flex: 1, 
                    cursor: 'pointer',
                    '&:hover .url-text': {
                      color: '#3b82f6',
                      textDecoration: 'underline'
                    }
                  }}
                  onClick={() => openLink(link.url)}
                >
                  <Typography 
                    className="url-text"
                    variant="body2" 
                    sx={{ 
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: 400,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {formatUrl(link.url)}
                  </Typography>
                </Box>

                {/* Remove Button */}
                <IconButton
                  size="small"
                  onClick={() => handleRemoveLink(link.id)}
                  sx={{
                    width: 24,
                    height: 24,
                    color: 'var(--text-secondary)',
                    '&:hover': {
                      backgroundColor: '#fee2e2',
                      color: '#dc2626'
                    }
                  }}
                >
                  <X size={14} />
                </IconButton>
              </Box>
            );
          })}
        </Box>

        {/* Add New Link Form */}
        {isEditing ? (
          <Box sx={{ 
            p: 3, 
            backgroundColor: 'var(--bg-secondary)', 
            borderRadius: '8px',
            border: '1px solid var(--border-primary)'
          }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: 'var(--text-gray-medium)' }}>
              Adicionar Novo Link
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Type Select */}
              <Select
                value={newLink.type}
                onChange={(e) => setNewLink({...newLink, type: e.target.value})}
              >
                <option value="">Selecione o tipo</option>
                {linkTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>

              {/* URL Input */}
              <Input
                value={newLink.url}
                onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                type="url"
              />

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <ModernButton
                  variant="primary"
                  size="sm"
                  onClick={handleAddLink}
                  disabled={!newLink.type || !newLink.url}
                  className="flex-1"
                >
                  Adicionar
                </ModernButton>
                <ModernButton
                  variant="secondary"  
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setNewLink({ type: '', url: '' });
                  }}
                  className="flex-1"
                >
                  Cancelar
                </ModernButton>
              </Box>
            </Box>
          </Box>
        ) : null}

        {/* Show button when has links or empty state */}
        {!isEditing && (
          links.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Globe size={32} className="mx-auto text-gray-400 mb-2" />
              <Typography variant="body2" sx={{ color: 'var(--text-gray-medium)', mb: 2 }}>
                Nenhum link adicionado
              </Typography>
              <ModernButton
                variant="primary"
                size="sm"
                onClick={() => setIsEditing(true)}
                sx={{
                  color: '#3b82f6',
                  borderColor: '#3b82f6',
                  border: '1px solid #3b82f6',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: '#eff6ff',
                    color: '#3b82f6',
                    borderColor: '#3b82f6'
                  }
                }}
              >
                Adicionar Primeiro Link
              </ModernButton>
            </Box>
          ) : (
            <ModernButton
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(true)}
              sx={{
                width: 'auto',
                minWidth: '140px',
                color: '#3b82f6',
                borderColor: '#3b82f6',
                border: '1px solid #3b82f6',
                '&:hover': {
                  backgroundColor: '#eff6ff',
                  color: '#3b82f6',
                  borderColor: '#3b82f6'
                }
              }}
            >
              <Plus size={16} />
              Adicionar Link
            </ModernButton>
          )
        )}
      </CardContent>
    </>
  );
};

export default Portfolio;