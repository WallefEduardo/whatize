import React, { useState, useEffect, useRef } from "react";

// Limpo: Formik/Yup removidos - componente já migrado para useState
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
import Compressor from "compressorjs";
import Box from "@mui/material/Box";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { Stack } from "@mui/material";

// MIGRAÇÃO: makeStyles → sx prop (preservando Formik + funcionalidade imagem)
const flowBuilderImgStyles = {
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


const FlowBuilderAddImgModal = ({ open, onSave, onUpdate, data, close }) => {
  // MIGRAÇÃO: usando objeto de estilos direto (preservando funcionalidade imagem)
  const isMounted = useRef(true);

  const [activeModal, setActiveModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const [preview, setPreview] = useState();

  const [oldImage, setOldImage] = useState();

  const [labels, setLabels] = useState({
    title: "Adicionar imagem ao fluxo",
    btn: "Adicionar"
  });

  const [medias, setMedias] = useState([]);

  useEffect(() => {
    if (open === "edit") {
      setLabels({
        title: "Editar imagem",
        btn: "Salvar"
      });
      setOldImage(data.data.url)
      setPreview(process.env.REACT_APP_BACKEND_URL + '/public/' + data.data.url)
      setActiveModal(true);
    } else if (open === "create") {
      setLabels({
        title: "Adicionar imagem ao fluxo",
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
        data: { url: "" }
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
        console.log(formData);
        await api.post("/flowbuilder/img", formData).then(res => {
          handleClose();
          onSave({
            url: res.data.name
          });
          toast.success("Imagem adicionada com sucesso!");
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

    if(e.target.files[0].size > 2000000){
      toast.error("Arquivo é muito grande! 2MB máximo")
      return
    }

    const selectedMedias = Array.from(e.target.files);
    setPreview(URL.createObjectURL(e.target.files[0]));
    setMedias(selectedMedias);
  };

  return (
    <Box sx={flowBuilderImgStyles.root}>
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
              {preview && <img src={preview} style={{ width: "552px" }} />}
              {!loading && open !== "edit" && (
                <Button variant="contained" component="label">
                  Enviar imagem
                  <input
                    type="file"
                    accept="image/png, image/jpg, image/jpeg"
                    disabled={loading}
                    hidden
                    onChange={handleChangeMedias}
                  />
                </Button>
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
                {open !== "edit" && (<Button
                  type="submit"
                  disabled={loading}
                  color="primary"
                  variant="contained"
                  sx={flowBuilderImgStyles.btnWrapper}
                  onClick={() => handleSaveContact()}
                >
                  {`${labels.btn}`}
                </Button>)}
              </>
            )}
          </DialogActions>
        </Stack>
      </Dialog>
    </Box>
  );
};

export default FlowBuilderAddImgModal;
