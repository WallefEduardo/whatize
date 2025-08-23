import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { Formik, FieldArray, Form, Field } from "formik";
import { toast } from "../ui/ToastProvider";

import { green } from "@mui/material/colors";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CircularProgress from "@mui/material/CircularProgress";
import { Box } from "@mui/material";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { Stack } from "@mui/material";

const FlowBuilderIntervalModal = ({
  open,
  onSave,
  data,
  onUpdate,
  close
}) => {
  const isMounted = useRef(true);

  const [timerSec, setTimerSec] = useState(0)
  const [activeModal, setActiveModal] = useState(false)

  useEffect(() => {
    if(open === 'edit'){
      setTimerSec(data.data.sec)
      setActiveModal(true)
    } else if(open === 'create'){
      setTimerSec(0)
      setActiveModal(true)
    }
    return () => {
      isMounted.current = false;
    };
  }, [open]);
  

  const handleClose = () => {
    close(null)
    setActiveModal(false)
  };

  const handleSaveContact = async values => {
    if(!timerSec || parseInt(timerSec)  <= 0){
      return toast.error('Adicione o valor de intervalo')
    }
    if(parseInt(timerSec) > 120){
      return toast.error('Máximo de tempo atingido 120 segundos')
    }
    if(open === 'edit'){
      onUpdate({
        ...data,
        data: { sec: timerSec }
      });
    } else if(open === 'create'){
      onSave({
        sec: timerSec
      })
    }
    handleClose()
    
  };

  return (
    <Box sx={{
      display: "flex",
      flexWrap: "wrap"
    }}>
      <Dialog open={activeModal} onClose={handleClose} fullWidth="md" scroll="paper">
        <DialogTitle id="form-dialog-title">
          {open === 'create' ? `Adicionar um intervalo ao fluxo`: `Editar intervalo`}
        </DialogTitle>        
            <Stack>
              <DialogContent dividers>
                <TextField
                  label={'Tempo em segundos'}
                  name="timer"
                  type="number"
                  value={timerSec}
                  onChange={(e) => setTimerSec(e.target.value)}
                  autoFocus
                  variant="outlined"
                  InputProps={{ inputProps: { min: 0 } }}
                  margin="dense"
                  sx={{
                    marginRight: (theme) => 8,
                    flex: 1
                  }}
                  style={{ width: "95%" }}
                />
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  variant="outlined"
                >
                  {i18n.t("contactModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  sx={{ position: "relative" }}
                  onClick={() => handleSaveContact()}
                >
                  {open === 'create' ? `Adicionar` : 'Editar'}                  
                </Button>
              </DialogActions>
            </Stack>
      </Dialog>
    </Box>
  );
};

export default FlowBuilderIntervalModal;
