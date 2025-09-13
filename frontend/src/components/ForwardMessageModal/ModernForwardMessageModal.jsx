import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";

import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Autocomplete, {
  createFilterOptions,
} from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import { styled } from '@mui/material/styles';
import { Box, Typography, IconButton } from "@mui/material";
import { FormControlLabel, Switch } from "@mui/material";
import { Send, X } from 'lucide-react';

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ContactModal from "../ContactModal";
import toastError from "../../errors/toastError"; 
import { AuthContext } from "../../context/Auth/AuthContext";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '12px',
    padding: '0',
    maxWidth: '500px',
    width: '100%',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 24px',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: '18px',
  fontWeight: 600,
  borderBottom: '1px solid var(--border-primary)',
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: '24px',
  backgroundColor: 'var(--bg-primary)',
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: '16px 24px',
  backgroundColor: 'var(--bg-primary)',
  borderTop: '1px solid var(--border-primary)',
  gap: '12px',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    '& fieldset': {
      borderColor: 'var(--border-primary)',
    },
    '&:hover fieldset': {
      borderColor: 'var(--color-accent)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--color-accent)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'var(--text-secondary)',
    '&.Mui-focused': {
      color: 'var(--color-accent)',
    },
  },
}));

const ModernForwardMessageModal = ({ messages, onClose, modalOpen }) => {
    const [optionsContacts, setOptionsContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [newContact, setNewContact] = useState({});
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const [sending, setSending] = useState(false);
  const [messageSending, setMessageSending] = useState('');
  const [signMessage, setSignMessage] = useState(true);

    useEffect(() => {
    if (!modalOpen || searchParam.length < 3) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("contacts", {
            params: { searchParam },
          });
          console.log('contacts', data.contacts);
          setOptionsContacts(data.contacts);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };

      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, modalOpen]);

  const history = useHistory();

  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

    const handleForwardMessage = async(contactL) => {
    const responseList = [];
    for (const message of messages) {
      setSending(true);
      try {
        setMessageSending(message.id);
        const response = await api.post('/message/forward', {
          messageId: message.id, 
          contactId: contactL.id, 
          signMessage: signMessage
        });
        responseList.push(response);
        await sleep(900);
      } catch (error) {
        toastError(error);
      }		
    }
    setSending(false);
    onClose(); // Fechar modal após envio
  }

    const handleSelectOption = (e, newValue) => {
    if (newValue?.number) {
      setSelectedContact(newValue);
    } else if (newValue?.name) {
      setNewContact({ name: newValue.name });
      setContactModalOpen(true);
    }
  };

    const handleClose = () => {
    onClose();
    setSearchParam("");
    setSelectedContact(null);
    setSending(false);
  };

    const handleCloseContactModal = () => {
    setContactModalOpen(false);
  };

    const renderOption = (props, optionL) => {
    if (optionL.number) {
      return (
        <li {...props}>
          <Box sx={{ color: 'var(--text-primary)' }}>
            {`${optionL.name} - ${optionL.number}`}
          </Box>
        </li>
      );
    } else {
      return (
        <li {...props}>
          <Box sx={{ color: 'var(--text-secondary)' }}>
            {`Nenhum contato encontrado com o nome ${optionL.name}`}
          </Box>
        </li>
      );
    }
  };

  const renderOptionLabel = optionL => {
    if (optionL.number) {
      return `${optionL.name} - ${optionL.number}`;
    } else {
      return `${optionL.name}`;
    }
  };

  const filter = createFilterOptions({
    trim: true,
  });

  const createAddContactOption = (filterOptions, params) => {
    const filtered = filter(filterOptions, params);

    if (params.inputValue !== "" && !loading && searchParam.length >= 3) {
      filtered.push({
        name: `${params.inputValue}`,
      });
    }

    return filtered;
  };

    return (
        <>
      <ContactModal
        open={contactModalOpen}
        initialValues={newContact}
        onClose={handleCloseContactModal}
      />
      
      <StyledDialog open={modalOpen} onClose={handleClose}>
        <StyledDialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Send size={20} color="var(--color-accent)" />
            Encaminhar mensagem
          </Box>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{ 
              color: 'var(--text-secondary)',
              '&:hover': { color: 'var(--text-primary)' }
            }}
          >
            <X size={18} />
          </IconButton>
        </StyledDialogTitle>

        <StyledDialogContent>
          <Autocomplete
            options={optionsContacts}
            loading={loading}
            style={{ width: '100%', marginBottom: '16px' }}
            clearOnBlur
            autoHighlight
            freeSolo
            clearOnEscape
            getOptionLabel={renderOptionLabel}
            renderOption={renderOption}
            filterOptions={createAddContactOption}
            onChange={(e, newValue) => handleSelectOption(e, newValue)}
            PaperComponent={({ children, ...props }) => (
              <Box
                {...props}
                sx={{
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-primary)',
                  '& .MuiAutocomplete-option': {
                    color: 'var(--text-primary)',
                    '&:hover': {
                      backgroundColor: 'var(--hover-bg-light)',
                    },
                  },
                }}
              >
                {children}
              </Box>
            )}
            renderInput={params => (
              <StyledTextField
                {...params}
                label={i18n.t("newTicketModal.fieldLabel")}
                variant="outlined"
                autoFocus
                onChange={e => setSearchParam(e.target.value)}
                onKeyPress={e => {
                  if (loading || !selectedContact) return;
                  else if (e.key === "Enter") {
                    handleForwardMessage(selectedContact);
                  }
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loading ? (
                        <CircularProgress 
                          color="inherit" 
                          size={20}
                          sx={{ color: 'var(--color-accent)' }}
                        />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />

          {sending && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              padding: '12px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              <CircularProgress size={20} sx={{ color: 'var(--color-accent)' }} />
              <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                Enviando mensagem {messageSending}...
              </Typography>
            </Box>
          )}
        </StyledDialogContent>

        <StyledDialogActions>
          <FormControlLabel
            style={{ color: 'var(--text-secondary)' }}
            label={i18n.t("messagesInput.signMessage")}
            labelPlacement="start"
            control={
              <Switch
                size="small"
                checked={signMessage}
                onChange={(e) => setSignMessage(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'var(--color-accent)',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'var(--color-accent)',
                  },
                }}
              />
            }
          />
          
          <ButtonWithSpinner
            variant="contained"
            type="button"
            disabled={!selectedContact || sending}
            onClick={() => handleForwardMessage(selectedContact)}
            sx={{
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'var(--color-green-dark)',
              },
              '&.Mui-disabled': {
                backgroundColor: 'var(--disabled-bg)',
                color: 'var(--disabled-text)',
              },
            }}
            loading={loading}
          >
            Encaminhar
          </ButtonWithSpinner>
        </StyledDialogActions>
      </StyledDialog>
    </>
    );
};

export default ModernForwardMessageModal;