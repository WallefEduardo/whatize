import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Chip
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Edit, Delete } from "@material-ui/icons";
import { toast } from "react-toastify";

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  form: {
    display: "flex",
    gap: theme.spacing(2),
    alignItems: "center",
    flexWrap: "wrap",
  },
  table: {
    marginTop: theme.spacing(2),
  },
  editButton: {
    color: "#1976d2",
  },
  deleteButton: {
    color: "#d32f2f",
  },
  statusChip: {
    minWidth: 80,
  },
}));

const LOOKUP_API_URL = "https://lookup.zmaxsys.com.br";

const InstanceManager = () => {
  const classes = useStyles();
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    backendUrl: "",
    companyName: "",
  });

  // Carregar instâncias
  const loadInstances = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${LOOKUP_API_URL}/companies`);
      if (!response.ok) throw new Error("Erro ao carregar instâncias");
      
      const data = await response.json();
      setInstances(data.companies || []);
    } catch (error) {
      console.error("Erro ao carregar instâncias:", error);
      toast.error("Erro ao carregar instâncias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstances();
  }, []);

  // Salvar edição da instância
  const handleSave = async () => {
    if (!formData.backendUrl) {
      toast.error("URL do backend é obrigatória");
      return;
    }

    try {
      setLoading(true);
      
      if (editingInstance) {
        // Editar instância existente
        const response = await fetch(`${LOOKUP_API_URL}/companies/${editingInstance.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            backendUrl: formData.backendUrl,
            companyName: formData.companyName,
            status: true
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao atualizar instância");
        }

        toast.success("Instância atualizada com sucesso!");
        handleCloseDialog();
        loadInstances();
      }
    } catch (error) {
      console.error("Erro ao salvar instância:", error);
      toast.error(error.message || "Erro ao salvar instância");
    } finally {
      setLoading(false);
    }
  };

  // Deletar instância
  const handleDelete = async (instanceId) => {
    if (!window.confirm("Tem certeza que deseja deletar esta instância?")) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${LOOKUP_API_URL}/companies/${instanceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao deletar instância");
      }

      toast.success("Instância deletada com sucesso!");
      loadInstances();
    } catch (error) {
      console.error("Erro ao deletar instância:", error);
      toast.error(error.message || "Erro ao deletar instância");
    } finally {
      setLoading(false);
    }
  };

  // Função removida - não criamos mais instâncias via interface

  // Abrir dialog para editar
  const handleEdit = (instance) => {
    setEditingInstance(instance);
    setFormData({
      code: instance.code,
      backendUrl: instance.backend_url,
      companyName: instance.company_name,
    });
    setDialogOpen(true);
  };

  // Fechar dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingInstance(null);
    setFormData({ code: "", backendUrl: "", companyName: "" });
  };

  // Testar conexão com backend
  const testConnection = async (backendUrl) => {
    try {
      const response = await fetch(`${backendUrl}/health`, { 
        method: "GET",
        timeout: 5000 
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  return (
    <div className={classes.root}>
      <Paper className={classes.paper}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Instâncias do Sistema
          </Typography>
        </Box>

        <Paper style={{ 
          padding: 16, 
          marginBottom: 16, 
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3'
        }}>
          <Typography variant="body2" style={{ color: '#1976d2' }}>
            <strong>ℹ️ Informação:</strong> As instâncias são registradas automaticamente pelos backends no startup. 
            Aqui você pode visualizar e editar as informações das instâncias ativas.
          </Typography>
        </Paper>

        <TableContainer component={Paper} className={classes.table}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Código</strong></TableCell>
                <TableCell><strong>Nome da Instância</strong></TableCell>
                <TableCell><strong>Backend URL</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Criado em</strong></TableCell>
                <TableCell><strong>Ações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {instances.map((instance) => (
                <TableRow key={instance.id}>
                  <TableCell>
                    <Chip 
                      label={instance.code} 
                      color="primary" 
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{instance.company_name}</TableCell>
                  <TableCell>{instance.backend_url}</TableCell>
                  <TableCell>
                    <Chip
                      label={instance.status ? "Ativa" : "Inativa"}
                      color={instance.status ? "primary" : "default"}
                      size="small"
                      className={classes.statusChip}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(instance.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      className={classes.editButton}
                      onClick={() => handleEdit(instance)}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      className={classes.deleteButton}
                      onClick={() => handleDelete(instance.id)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {instances.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Nenhuma instância cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog para editar instância */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Editar Instância
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Código da Instância"
              value={formData.code}
              disabled
              fullWidth
              helperText="O código não pode ser alterado (gerado automaticamente pelo backend)"
            />
            <TextField
              label="Nome da Instância"
              placeholder="Ex: Produção, Homologação"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              fullWidth
            />
            <TextField
              label="URL do Backend"
              placeholder="Ex: https://api1.seudominio.com"
              value={formData.backendUrl}
              onChange={(e) => setFormData({ ...formData, backendUrl: e.target.value })}
              helperText="URL completa do backend desta instância"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            color="primary" 
            variant="contained"
            disabled={loading}
          >
            Salvar Alterações
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default InstanceManager;