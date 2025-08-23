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
import Compressor from "compressorjs";
import Box from "@mui/material/Box";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { Checkbox, Stack } from "@mui/material";

// MIGRAÇÃO: makeStyles → sx prop (preservando Formik + funcionalidade video)
const flowBuilderVideoStyles = {
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  textField: {
    marginRight: "8px", // 8 = 8px
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

const FlowBuilderAddVideoModal = ({ open, onSave, onUpdate, data, close }) => {
  // MIGRAÇÃO: usando objeto de estilos direto (preservando funcionalidade video)
  const isMounted = useRef(true);

  const [activeModal, setActiveModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const [record, setRecord] = useState(false);

  const [preview, setPreview] = useState();

  const [labels, setLabels] = useState({
    title: "Adicionar video ao fluxo",
    btn: "Adicionar"
  });

  const [medias, setMedias] = useState([]);

  useEffect(() => {
    if (open === "edit") {
      setLabels({
        title: "Editar video",
        btn: "Salvar"
      });
      setPreview(process.env.REACT_APP_BACKEND_URL + '/public/' + data.data.url)
      setRecord(data.data.record)
      setActiveModal(true);
    } else if (open === "create") {
      setLabels({
        title: "Adicionar video ao fluxo",
        btn: "Adicionar"
      });
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
        data: { url: data.data.url,
        record: record }
      });
      return;
    } else if (open === "create") {
      setLoading(true);
      const formData = new FormData();
      formData.append("fromMe", true);

      medias.forEach(async (media, idx) => {
        const file = media;

        if (!file) {
          return;
        }

        if (media?.type.split("/")[0] == "image") {
          new Compressor(file, {
            quality: 0.7,

            async success(media) {
              formData.append("medias", media);
              formData.append("body", media.name);
            },
            error(err) {
              alert("erro");
              console.log(err.message);
            }
          });
        } else {
          formData.append("medias", media);
          formData.append("body", media.name);
        }
      });

      setTimeout(async () => {
        await api.post("/flowbuilder/audio", formData).then(res => {
          handleClose();
          onSave({
            url: res.data.name,
          });
          toast.success("Audio adicionada com sucesso!");
          setLoading(false);
          setMedias([]);
          setPreview();
        });
      }, 1000);
    }
  };

  const handleChangeMedias = e => {
    if (!e.target.files) {
      return;
    }

    if(e.target.files[0].size > 20000000){
      toast.error("Arquivo é muito grande! 20MB máximo")
      return
    }

    const selectedMedias = Array.from(e.target.files);
    setPreview((URL.createObjectURL(e.target.files[0])));
    setMedias(selectedMedias);
  };

  return (
    <Box sx={flowBuilderVideoStyles.root}>
      <Dialog
        open={activeModal}
        onClose={handleClose}
        fullWidth="md"
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">{labels.title}</DialogTitle>
        <Stack>
          <DialogContent dividers>
            <Stack gap={"16px"}>
              {preview && (
                <Stack direction={'row'} justifyContent={'center'}>
                <video controls="controls" width="552px">
                  <source src={preview} type="video/mp4" />
                  seu navegador não suporta HTML5
                </video>
                </Stack>
              )}
              {!loading && open !== "edit" && !preview && (
                <>
                <Button variant="contained" component="label">
                  Enviar video
                  <input
                    type="file"
                    accept="video/mp4"
                    disabled={loading}
                    hidden
                    onChange={handleChangeMedias}
                  />
                </Button>
                <Typography>ATENÇÃO! Apenas videos em MP4!</Typography>
                </>
              )}
              {loading && (
                <>
                  <Stack justifyContent={"center"} alignSelf={"center"}>
                    <CircularProgress />
                  </Stack>
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            {!loading && (
              <>
                <Button
                  onClick={() => {
                    handleClose();
                    setMedias([]);
                    setPreview();
                  }}
                  color="secondary"
                  variant="outlined"
                >
                  {i18n.t("contactModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  color="primary"
                  variant="contained"
                  sx={flowBuilderVideoStyles.btnWrapper}
                  onClick={() => handleSaveContact()}
                >
                  {`${labels.btn}`}
                </Button>
              </>
            )}
          </DialogActions>
        </Stack>
      </Dialog>
    </Box>
  );
};

export default FlowBuilderAddVideoModal;
