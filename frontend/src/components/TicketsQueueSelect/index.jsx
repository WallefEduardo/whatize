import React, { useContext, useEffect, useState } from "react";

import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Checkbox, ListItemText, Divider, Button } from "@mui/material";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = () => ({
  menuListItem: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  menuItem: {
    maxHeight: 30,
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#000000',
    borderRadius: '14px',
    margin: '8px 12px',
    cursor: 'pointer',
    fontSize: '0.7rem',
    color: '#ffffff',
    textTransform: 'none',
    fontWeight: 500,
    height: '28px',
    '&:hover': {
      backgroundColor: '#333333',
    },
  },
  alertDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#ff9800',
    marginLeft: '-145px',
    marginTop: '25px',
    animation: '$pulse 1.5s infinite',
  },
  '@keyframes pulse': {
    '0%': {
      opacity: 1,
      transform: 'scale(1)',
    },
    '50%': {
      opacity: 0.5,
      transform: 'scale(1.2)',
    },
    '100%': {
      opacity: 1,
      transform: 'scale(1)',
    },
  },
  containerWithDot: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
});

const TicketsQueueSelect = ({
  userQueues,
  selectedQueueIds = [],
  onChange,
}) => {
  const classes = useStyles();
  // Controla se devemos manter o menu aberto após uma interação
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, updateUser } = useContext(AuthContext);
  


  // Função para salvar no banco de dados
  const saveToDatabase = async (queueIds) => {
    if (!user?.id) return;
    
    try {
      const { data } = await api.put(`/users/${user.id}/selected-queues`, {
        selectedQueueIds: queueIds
      });
      
      // Atualiza o user no contexto com os dados completos
      if (updateUser && data) {
        updateUser(data);
      }
    } catch (err) {
      console.error('❌ Erro ao salvar filas:', err);
      toastError(err);
    }
  };


  // Função para lidar com a seleção/deseleção de uma fila individual
  const handleToggle = async (queueId, event) => {
    // Impede que o menu feche
    event.preventDefault();
    event.stopPropagation();
    
    let newSelectedQueueIds;
    if (selectedQueueIds.includes(queueId)) {
      newSelectedQueueIds = selectedQueueIds.filter(id => id !== queueId);
    } else {
      newSelectedQueueIds = [...selectedQueueIds, queueId];
    }
    
    onChange(newSelectedQueueIds);
    
    // Salvar no banco de dados sempre que houver mudança
    await saveToDatabase(newSelectedQueueIds);
    
    // Força o menu a permanecer aberto
    setMenuOpen(true);
  };

  const handleSelectAll = async (event) => {
    // Impede que o menu feche
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const allQueueIds = userQueues?.map(queue => queue.id) || [];
    console.log('🔘 Selecionando todas as filas:', {
      allQueueIds: allQueueIds,
      userQueuesLength: userQueues?.length || 0
    });
    
    onChange(allQueueIds);
    
    // Salvar no banco de dados
    await saveToDatabase(allQueueIds);
    
    // Força o menu a permanecer aberto
    setMenuOpen(true);
  };

  const handleClearAll = async (event) => {
    // Impede que o menu feche
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('🗑️ Desmarcando todas as filas');
    
    onChange([]);
    
    // Salvar no banco de dados
    await saveToDatabase([]);
    
    // Força o menu a permanecer aberto
    setMenuOpen(true);
  };

  // Manipula cliques no botão Selecionar/Desmarcar Todas
  const handleButtonClick = (event) => {
    console.log('🔘 Botão clicado:', {
      shouldShowSelectAll: shouldShowSelectAll,
      allQueuesSelected: allQueuesSelected,
      selectedQueueIds: selectedQueueIds,
      userQueues: userQueues?.length || 0
    });
    
    // Impede que o clique no botão seja tratado como seleção de item do menu
    event.preventDefault();
    event.stopPropagation();
    
    // Executar a ação diretamente
    if (shouldShowSelectAll) {
      console.log('➡️ Executando handleSelectAll');
      handleSelectAll(event);
    } else {
      console.log('➡️ Executando handleClearAll');
      handleClearAll(event);
    }
    
    // Impede que o evento se propague para o Select
    if (event.nativeEvent) {
      event.nativeEvent.stopImmediatePropagation();
    }
  };

  // Verifica se todas as filas estão selecionadas
  const allQueuesSelected = userQueues?.length > 0 && selectedQueueIds.length === userQueues.length;
  const showAlertDot = userQueues?.length > 0 && !allQueuesSelected;
  
  // Determina qual ação mostrar no botão
  const shouldShowSelectAll = !allQueuesSelected;

  return (
    <div className={classes.containerWithDot} style={{ width: 140, marginTop: -4 }}>
      <FormControl fullWidth margin="dense">
        <Select
          multiple
          displayEmpty
          variant="outlined"
          value={selectedQueueIds}
          open={menuOpen}
          onOpen={() => setMenuOpen(true)}
          onClose={() => setMenuOpen(false)}
          style={{
            borderRadius: 8,
            height: 30,
          }}
          MenuProps={{
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "center",
            },
            transformOrigin: {
              vertical: "top",
              horizontal: "center",
            },
            getContentAnchorEl: null,
            PaperProps: {
              style: {
                borderRadius: "0 0 8px 8px",
                minWidth: '180px',
              },
            },
            MenuListProps: {
              className: classes.menuListItem,
            },
          }}
          renderValue={() => i18n.t("ticketsQueueSelect.placeholder")}
        >
          {/* Botão dinâmico no topo */}
          <MenuItem
            dense
            style={{
              backgroundColor: '#000000',
              borderRadius: '14px',
              margin: '8px 12px',
              cursor: 'pointer',
              fontSize: '0.7rem',
              color: '#ffffff',
              fontWeight: 500,
              height: '28px',
              justifyContent: 'center',
              display: 'flex',
            }}
            onClick={handleButtonClick}
          >
            {shouldShowSelectAll ? "Selecionar Todas" : "Desmarcar Todas"}
          </MenuItem>
          <Divider />
          
          {/* Lista de filas com checkboxes */}
          {userQueues?.map((queue) => (
            <MenuItem
              key={queue.id}
              dense
              value={queue.id}
              className={classes.menuItem}
              onClick={(event) => handleToggle(queue.id, event)}
            >
              <Checkbox
                style={{
                  color: queue.color,
                }}
                size="small"
                color="primary"
                checked={selectedQueueIds.indexOf(queue.id) > -1}
                onChange={() => {}} // Controlado pelo onClick do MenuItem
              />
              <ListItemText
                primary={queue.name}
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {/* Bolinha de alerta piscante */}
      {showAlertDot && (
        <div className={classes.alertDot}></div>
      )}
    </div>
  );
};

export default TicketsQueueSelect;