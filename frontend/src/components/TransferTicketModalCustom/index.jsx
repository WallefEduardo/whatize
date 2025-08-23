import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import { Grid } from "@mui/material";

import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Autocomplete, {
  createFilterOptions,
} from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import useQueues from "../../hooks/useQueues";
import UserStatusIcon from "../UserModal/statusIcon";
import { isNil } from "lodash";

const filterOptions = createFilterOptions({
  trim: true,
});

const TransferTicketModalCustom = ({ modalOpen, onClose, ticketid, ticket }) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (!modalOpen || searchParam.length < 3) {
      setLoading(false);
      setSelectedQueue("");
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      const fetchUsers = async () => {
        try {
          const { data } = await api.get("/users/", {
            params: { searchParam },
          });
          setOptions(data.users);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          toastError(err);
        }
      };

      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, modalOpen]);

  const handleMsgTransferChange = (event) => {
    setMsgTransfer(event.target.value);
  };

  const handleClose = () => {
    onClose();
    setSearchParam("");
    setSelectedUser(null);
  };

  const handleSaveTicket = async (e) => {
    // e.preventDefault();
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
      history.push(`/tickets/`);
      handleClose();
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
  };


  return (
    <Dialog open={modalOpen} onClose={handleClose} maxWidth="md" fullWidth scroll="paper">
      {/* <form onSubmit={handleSaveTicket}> */}
      <DialogTitle id="form-dialog-title">
        {i18n.t("transferTicketModal.title")}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} xl={6}>
            <Autocomplete
              fullWidth
              getOptionLabel={(option) => `${option.name}`}
              onChange={(e, newValue) => {
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
              options={options}
              filterOptions={filterOptions}
              freeSolo
              autoHighlight
              noOptionsText={i18n.t("transferTicketModal.noOptions")}
              loading={loading}
              renderOption={option => (<span> <UserStatusIcon user={option} /> {option.name}</span>)}
              PaperComponent={({ children, ...props }) => (
                <div {...props} style={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e0e0e0',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  borderRadius: '4px'
                }}>
                  {children}
                </div>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={i18n.t("transferTicketModal.fieldLabel")}
                  variant="outlined"
                  autoFocus
                  onChange={(e) => setSearchParam(e.target.value)}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {loading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          <Grid xs={12} sm={6} xl={6} item >
            <FormControl variant="outlined" fullWidth>
              <InputLabel>
                {i18n.t("transferTicketModal.fieldQueueLabel")}
              </InputLabel>
              <Select
                value={selectedQueue}
                onChange={(e) => setSelectedQueue(e.target.value)}
                label={i18n.t("transferTicketModal.fieldQueuePlaceholder")}
              >
                {queues.map((queue) => (
                  <MenuItem key={queue.id} value={queue.id}>
                    {queue.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} xl={12} >
            <TextField
              label={i18n.t("transferTicketModal.msgTransfer")}
              value={msgTransfer}
              onChange={handleMsgTransferChange}
              variant="outlined"
              multiline
              maxRows={5}
              minRows={5}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          color="secondary"
          disabled={loading}
          variant="outlined"
        >
          {i18n.t("transferTicketModal.buttons.cancel")}
        </Button>
        <ButtonWithSpinner
          variant="contained"
          type="submit"
          color="primary"
          loading={loading}
          disabled={selectedQueue === ""}
          onClick={() => handleSaveTicket(selectedQueue)}

        >
          {i18n.t("transferTicketModal.buttons.ok")}
        </ButtonWithSpinner>
      </DialogActions>
      {/* </form> */}
    </Dialog>
  );
};

export default TransferTicketModalCustom;
