import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Globe, Linkedin, Github, Twitter, X, Plus, Link as LinkIcon } from 'lucide-react';
import { CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import ModernButton from '../ui/ModernButton';

const Portfolio = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newLink, setNewLink] = useState({ type: '', url: '' });

  // Links padrão ou do usuário
  const [links, setLinks] = useState(user?.portfolio || [
    { id: 1, type: 'website', url: 'https://meusite.com.br', icon: Globe },
    { id: 2, type: 'linkedin', url: 'https://linkedin.com/in/usuario', icon: Linkedin },
    { id: 3, type: 'github', url: 'https://github.com/usuario', icon: Github },
  ]);

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

  const handleAddLink = () => {
    if (newLink.url && newLink.type) {
      const link = {
        id: Date.now(),
        type: newLink.type,
        url: newLink.url,
      };
      const updatedLinks = [...links, link];
      setLinks(updatedLinks);
      setNewLink({ type: '', url: '' });
      
      // Atualizar usuário
      if (onUpdate) {
        onUpdate({ ...user, portfolio: updatedLinks });
      }
    }
  };

  const handleRemoveLink = (id) => {
    const updatedLinks = links.filter(link => link.id !== id);
    setLinks(updatedLinks);
    
    // Atualizar usuário
    if (onUpdate) {
      onUpdate({ ...user, portfolio: updatedLinks });
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
        <CardTitle sx={{ fontSize: '18px', fontWeight: 500, color: '#374151' }}>
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
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#f1f5f9',
                    borderColor: '#cbd5e1'
                  }
                }}
              >
                {/* Icon */}
                <Box sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
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
                      color: '#475569',
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
                    color: '#64748b',
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
            backgroundColor: '#f8fafc', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: '#374151' }}>
              Adicionar Novo Link
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Type Select */}
              <Select
                value={newLink.type}
                onChange={(e) => setNewLink({...newLink, type: e.target.value})}
                placeholder="Selecione o tipo"
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
                placeholder="https://exemplo.com"
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
        ) : (
          <ModernButton
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="w-full flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200"
          >
            <Plus size={16} />
            Adicionar Link
          </ModernButton>
        )}

        {/* Empty State */}
        {links.length === 0 && !isEditing && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Globe size={32} className="mx-auto text-gray-400 mb-2" />
            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
              Nenhum link adicionado
            </Typography>
            <ModernButton
              variant="primary"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Adicionar Primeiro Link
            </ModernButton>
          </Box>
        )}
      </CardContent>
    </>
  );
};

export default Portfolio;