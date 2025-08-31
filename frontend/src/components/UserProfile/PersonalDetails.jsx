import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { Save, User, Briefcase, MapPin, FileText } from 'lucide-react';
import { CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { DatePicker } from '../ui/DatePicker';
import FormButtons from '../ui/FormButtons';
import { toast } from '../ui/ToastProvider';
import api from '../../services/api';

const PersonalDetails = ({ user, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    telefone: user?.telefone || '',
    cargo: user?.cargo || '',
    departamento: user?.departamento || '',
    dataAdmissao: user?.dataAdmissao || null,
    sobre: user?.sobre || '',
    // Endereço
    cep: user?.cep || '',
    endereco: user?.endereco || '',
    numero: user?.numero || '',
    complemento: user?.complemento || '',
    bairro: user?.bairro || '',
    cidade: user?.cidade || '',
    estado: user?.estado || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Atualizar formData quando user prop mudar
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        telefone: user.telefone || '',
        cargo: user.cargo || '',
        departamento: user.departamento || '',
        dataAdmissao: user.dataAdmissao || null,
        sobre: user.sobre || '',
        // Endereço
        cep: user.cep || '',
        endereco: user.endereco || '',
        numero: user.numero || '',
        complemento: user.complemento || '',
        bairro: user.bairro || '',
        cidade: user.cidade || '',
        estado: user.estado || '',
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await api.put(`/users/${user.id}`, formData);
      
      if (onUpdate) {
        onUpdate({ ...user, ...formData });
      }
      
      toast.success('Dados atualizados com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar os dados. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <CardContent className="rounded-t-none pt-6">
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
        
        {/* Dados Básicos */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <User size={20} color="var(--text-gray-medium)" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-gray-medium)' }}>
              Dados Básicos
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3, 
            mb: 3 
          }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Nome Completo
              </Typography>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Email
              </Typography>
              <Input
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                type="email"
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Telefone
              </Typography>
              <Input
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Data de Admissão
              </Typography>
              <DatePicker
                value={formData.dataAdmissao}
                onChange={(date) => handleInputChange('dataAdmissao', date)}
              />
            </Box>
          </Box>
        </Box>

        {/* Dados Profissionais */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Briefcase size={20} color="var(--text-gray-medium)" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-gray-medium)' }}>
              Dados Profissionais
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: 3, 
            mb: 3 
          }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Cargo
              </Typography>
              <Input
                value={formData.cargo}
                onChange={(e) => handleInputChange('cargo', e.target.value)}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Departamento
              </Typography>
              <Input
                value={formData.departamento}
                onChange={(e) => handleInputChange('departamento', e.target.value)}
              />
            </Box>
          </Box>
        </Box>

        {/* Endereço */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <MapPin size={20} color="var(--text-gray-medium)" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-gray-medium)' }}>
              Endereço
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr 1fr', md: '1fr 2fr 1fr' }, 
            gap: 3, 
            mb: 3 
          }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                CEP
              </Typography>
              <Input
                value={formData.cep}
                onChange={(e) => handleInputChange('cep', e.target.value)}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Endereço
              </Typography>
              <Input
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Número
              </Typography>
              <Input
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Complemento
              </Typography>
              <Input
                value={formData.complemento}
                onChange={(e) => handleInputChange('complemento', e.target.value)}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Bairro
              </Typography>
              <Input
                value={formData.bairro}
                onChange={(e) => handleInputChange('bairro', e.target.value)}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Cidade
              </Typography>
              <Input
                value={formData.cidade}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
              />
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-gray-medium)' }}>
                Estado
              </Typography>
              <Select
                value={formData.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="AC">Acre</option>
                <option value="AL">Alagoas</option>
                <option value="AP">Amapá</option>
                <option value="AM">Amazonas</option>
                <option value="BA">Bahia</option>
                <option value="CE">Ceará</option>
                <option value="DF">Distrito Federal</option>
                <option value="ES">Espírito Santo</option>
                <option value="GO">Goiás</option>
                <option value="MA">Maranhão</option>
                <option value="MT">Mato Grosso</option>
                <option value="MS">Mato Grosso do Sul</option>
                <option value="MG">Minas Gerais</option>
                <option value="PA">Pará</option>
                <option value="PB">Paraíba</option>
                <option value="PR">Paraná</option>
                <option value="PE">Pernambuco</option>
                <option value="PI">Piauí</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="RN">Rio Grande do Norte</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="RO">Rondônia</option>
                <option value="RR">Roraima</option>
                <option value="SC">Santa Catarina</option>
                <option value="SP">São Paulo</option>
                <option value="SE">Sergipe</option>
                <option value="TO">Tocantins</option>
              </Select>
            </Box>
          </Box>
        </Box>


        {/* Sobre */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <FileText size={20} color="var(--text-gray-medium)" />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-gray-medium)' }}>
              Sobre você
            </Typography>
          </Box>
          <Textarea
            value={formData.sobre}
            onChange={(e) => handleInputChange('sobre', e.target.value)}
            rows={4}
          />
        </Box>

        {/* Action Buttons */}
        <FormButtons
          showSave={true}
          showCancel={true}
          showBack={false}
          saveText="Salvar Alterações"
          cancelText="Cancelar"
          onSave={handleSave}
          onCancel={() => {
            if (onCancel) {
              onCancel(); // Chama função para voltar à listagem de usuários
            } else {
              // Reset form se não houver onCancel
              setFormData({
                name: user?.name || '',
                email: user?.email || '',
                telefone: user?.telefone || '',
                cargo: user?.cargo || '',
                departamento: user?.departamento || '',
                dataAdmissao: user?.dataAdmissao || null,
                sobre: user?.sobre || '',
                cep: user?.cep || '',
                endereco: user?.endereco || '',
                numero: user?.numero || '',
                complemento: user?.complemento || '',
                bairro: user?.bairro || '',
                cidade: user?.cidade || '',
                estado: user?.estado || '',
              });
            }
          }}
          saveLoading={isSaving}
          justifyContent="flex-end"
          gap={2}
        />
      </Box>
    </CardContent>
  );
};

export default PersonalDetails;