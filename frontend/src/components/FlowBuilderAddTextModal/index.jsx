import React, { useState, useEffect, useRef } from "react";
import * as Yup from "yup";

import { toast } from "../ui/ToastProvider";

// Removido: makeStyles migrado para objeto de estilos
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
import Box from "@mui/material/Box";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { Stack } from "@mui/material";

// MIGRAÇÃO: makeStyles → sx prop (preservando Formik + funcionalidade texto)
const flowBuilderTextStyles = {
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  textField: {
    marginRight: 8,
    flex: 1
  },

  extraAttr: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  btnWrapper: {
    position: "relative"
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12
  }
};

const ContactSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Muito curto!")
    .max(50, "Muito longo!")
    .required("Digite um nome!"),
  text: Yup.string()
    .min(2, "Muito curto!")
    .max(50, "Muito longo!")
    .required("Digite uma mensagem!")
});

const FlowBuilderAddTextModal = ({ open, onSave, onUpdate, data, close }) => {
  // MIGRAÇÃO: usando objeto de estilos direto (preservando funcionalidade texto)
  const isMounted = useRef(true);

  const [activeModal, setActiveModal] = useState(false);

  const [labels, setLabels] = useState({
    title: "Adicionar mensagem ao fluxo",
    btn: "Adicionar"
  });

  const [textDig, setTextDig] = useState();

  useEffect(() => {
    if (open === "edit") {
      setLabels({
        title: "Editar mensagem ao fluxo",
        btn: "Salvar"
      });
      setTextDig(data.data.label);
      setActiveModal(true);
    } else if (open === "create") {
      setLabels({
        title: "Adicionar mensagem ao fluxo",
        btn: "Adicionar"
      });
      setTextDig("");
      setActiveModal(true);
    } else {
      setActiveModal(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleClose = () => {
    close(null)
    setActiveModal(false);
  };

  const handleSaveContact = async () => {
    if (open === "edit") {
      handleClose();
      onUpdate({
        ...data,
        data: { label: textDig }
      });
      return;
    } else if (open === "create") {
      handleClose();
      onSave({
        text: textDig
      });
    }
  };

  return (
    <Box sx={flowBuilderTextStyles.root}>
      <Dialog
        open={activeModal}
        onClose={handleClose}
        fullWidth="md"
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">{labels.title}</DialogTitle>
        <Stack>
          <DialogContent dividers>
            <TextField
              label={"Mensagem"}
              multiline
              rows={7}
              name="text"
              variant="outlined"
              value={textDig}
              margin="dense"
              onChange={e => setTextDig(e.target.value)}
              sx={flowBuilderTextStyles.textField}
              style={{ width: "95%" }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="secondary" variant="outlined">
              {i18n.t("contactModal.buttons.cancel")}
            </Button>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              sx={flowBuilderTextStyles.btnWrapper}
              onClick={() => handleSaveContact()}
            >
              {`${labels.btn}`}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Box>
  );
};

export default FlowBuilderAddTextModal;
