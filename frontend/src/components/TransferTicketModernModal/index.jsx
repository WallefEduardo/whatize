import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import ModernModal from "../ModernModal";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { Autocomplete } from "../ui/Autocomplete";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import useQueues from "../../hooks/useQueues";
import UserStatusIcon from "../UserModal/statusIcon";
import { isNil } from "lodash";

const TransferTicketModernModal = ({ modalOpen, onClose, ticketid, ticket }) => {
  const history = useHistory();
  const [options, setOptions] = useState([]);
  const [queues, setQueues] = useState([]);
  const [allQueues, setAllQueues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState("");
  const { findAll: findAllQueues } = useQueues();
  const isMounted = useRef(true);
  const [msgTransfer, setMsgTransfer] = useState('');

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      const loadQueues = async () => {
        const list = await findAllQueues();
        setAllQueues(list);
        setQueues(list);
      };
      loadQueues();
    }
  }, []);

  // Buscar usuários quando abre o modal ou quando pesquisa
  useEffect(() => {
    if (!modalOpen) {
      setOptions([]);
      setSelectedQueue("");
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      const fetchUsers = async () => {
        try {
          const { data } = await api.get("/users/", {
            params: searchParam.length >= 3 ? { searchParam } : {},
          });
          setOptions(data.users);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };

      fetchUsers();
    }, searchParam.length === 0 ? 0 : 500); // Sem delay se não tem busca
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, modalOpen]);

  const handleClose = () => {
    onClose();
    setSearchParam("");
    setSelectedUser(null);
    setSelectedQueue("");
    setMsgTransfer("");
    setOptions([]); // Limpar opções também
  };

  const handleSaveTicket = async () => {
    if (!ticketid) return;
    if (!selectedQueue || selectedQueue === "") return;
    
    setLoading(true);
    try {
      let data = {};
      data.userId = !selectedUser ? null : selectedUser.id;
      data.status = !selectedUser ? "pending" : ticket.isGroup ? "group" : "open";
      data.queueId = selectedQueue;
      data.msgTransfer = msgTransfer ? msgTransfer : null;
      data.isTransfered = true;

      await api.put(`/tickets/${ticketid}`, data);
      setLoading(false);
      history.push(`/chat-moderno`);
      handleClose();
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
  };

  const actions = [
    {
      type: 'cancel',
      label: i18n.t("transferTicketModal.buttons.cancel"),
      onClick: handleClose,
      disabled: loading
    },
    {
      type: 'primary',
      label: i18n.t("transferTicketModal.buttons.ok"),
      onClick: handleSaveTicket,
      disabled: loading || selectedQueue === ""
    }
  ];

  return (
    <ModernModal
      open={modalOpen}
      onClose={handleClose}
      title={i18n.t("transferTicketModal.title")}
      size="lg"
      actions={actions}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Primeira linha: Usuário e Fila lado a lado */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          flexDirection: { xs: 'column', sm: 'row' } 
        }}>
          {/* Campo de Usuário */}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 1, 
                fontWeight: 600, 
                color: 'var(--text-primary)' 
              }}
            >
              {i18n.t("transferTicketModal.fieldLabel")}
            </Typography>
            <Autocomplete
              label={i18n.t("transferTicketModal.noOptions")}
              options={options}
              value={selectedUser}
              onChange={(newValue) => {
                setSelectedUser(newValue);
                if (newValue != null && Array.isArray(newValue.queues)) {
                  if (newValue.queues.length === 1) {
                    setSelectedQueue(newValue.queues[0].id);
                  }
                  setQueues(newValue.queues);
                } else {
                  setQueues(allQueues);
                  setSelectedQueue("");
                }
              }}
              onInputChange={(searchValue) => setSearchParam(searchValue)}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              renderOption={(option) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <UserStatusIcon user={option} />
                  <span>{option.name}</span>
                </Box>
              )}
              loading={loading}
              noOptionsText={i18n.t("transferTicketModal.noOptions")}
              size="md"
            />
          </Box>

          {/* Campo de Fila */}
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 1, 
                fontWeight: 600, 
                color: 'var(--text-primary)' 
              }}
            >
              {i18n.t("transferTicketModal.fieldQueueLabel")}
            </Typography>
            <Select
              value={selectedQueue}
              onChange={(e) => setSelectedQueue(e.target.value)}
              size="md"
              variant="bordered"
            >
              <option value="" disabled>
                Selecione uma fila
              </option>
              {queues.map((queue) => (
                <option key={queue.id} value={queue.id}>
                  {queue.name}
                </option>
              ))}
            </Select>
          </Box>
        </Box>

        {/* Segunda linha: Textarea ocupando toda largura */}
        <Box>
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 1, 
              fontWeight: 600, 
              color: 'var(--text-primary)' 
            }}
          >
            {i18n.t("transferTicketModal.msgTransfer")}
          </Typography>
          <Textarea
            value={msgTransfer}
            onChange={(e) => setMsgTransfer(e.target.value)}
            rows={5}
            size="md"
            variant="bordered"
          />
        </Box>
      </Box>
    </ModernModal>
  );
};

export default TransferTicketModernModal;