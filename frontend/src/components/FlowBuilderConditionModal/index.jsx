import React, { useState, useEffect, useRef } from "react";
import * as Yup from "yup";

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
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack
} from "@mui/material";

const selectFieldStyles = {
  ".MuiOutlinedInput-notchedOutline": {
    borderColor: "#909090"
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#000000",
    borderWidth: "thin"
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#111416",
    borderWidth: "thin"
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

const FlowBuilderConditionModal = ({ open, onSave, onUpdate, data, close }) => {
  const isMounted = useRef(true);

  const [activeModal, setActiveModal] = useState(false);

  const [rule, setRule] = useState();

  const [textDig, setTextDig] = useState();

  const [valueCondition, setValueCondition] = useState();

  const [labels, setLabels] = useState({
    title: "Adicionar condição ao fluxo",
    btn: "Adicionar"
  });

  useEffect(() => {
    if (open === "edit") {
      setLabels({
        title: "Editar condição",
        btn: "Salvar"
      });
      setTextDig(data.data.key);
      setRule(data.data.condition);
      setValueCondition(data.data.value);
      setActiveModal(true);
    } else if (open === "create") {
      setLabels({
        title: "Adicionar condição ao fluxo",
        btn: "Adicionar"
      });
      setTextDig();
      setRule();
      setValueCondition();
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
    close(null);
    setActiveModal(false);
  };

  const handleSaveContact = async () => {
    if (open === "edit") {
      handleClose();
      onUpdate({
        ...data,
        data: { key: textDig, condition: rule, value: valueCondition }
      });
      return;
    } else if (open === "create") {
      handleClose();
      onSave({
        key: textDig,
        condition: rule,
        value: valueCondition
      });
    }
  };

  return (
    <Box sx={{
      display: "flex",
      flexWrap: "wrap"
    }}>
      <Dialog
        open={activeModal}
        onClose={handleClose}
        fullWidth="md"
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">{labels.title}</DialogTitle>
        <Stack>
          <Stack
            dividers
            style={{ height: "250px", gap: "8px", padding: "16px" }}
          >
            <TextField
              label={"Campo da condição (Digiter apenas 1 chave)"}
              rows={7}
              name="text"
              variant="outlined"
              value={textDig}
              onChange={e => setTextDig(e.target.value)}
              sx={{
                marginRight: "8px", // 8 = 8px
                flex: 1
              }}
              style={{ width: "95%" }}
            />
            <FormControl sx={{ width: "95%" }} size="medium">
              <InputLabel sx={selectFieldStyles} id="demo-simple-select-label">
                Regra de validação
              </InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={rule}
                label="Regra de validação"
                onChange={e => setRule(e.target.value)}
                variant="outlined"
                color="primary"
                sx={selectFieldStyles}
              >
                <MenuItem value={1}> {"=="} </MenuItem>
                <MenuItem value={2}> {">="} </MenuItem>
                <MenuItem value={3}> {"<="} </MenuItem>
                <MenuItem value={4}> {" < "} </MenuItem>
                <MenuItem value={5}> {" > "} </MenuItem>
              </Select>
            </FormControl>
            <TextField
              label={"Valor da condição a ser analisada"}
              rows={7}
              name="text"
              variant="outlined"
              value={valueCondition}
              onChange={e => setValueCondition(e.target.value)}
              sx={{
                marginRight: "8px", // 8 = 8px
                flex: 1
              }}
              style={{ width: "95%", marginTop: "11px" }}
            />
          </Stack>
          <DialogActions>
            <Button onClick={handleClose} color="secondary" variant="outlined">
              {i18n.t("contactModal.buttons.cancel")}
            </Button>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              sx={{ position: "relative" }}
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

export default FlowBuilderConditionModal;
