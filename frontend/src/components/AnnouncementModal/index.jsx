import React, { useState, useEffect, useRef } from "react";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "../ui/ToastProvider";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";

import { i18n } from "../../translate/i18n";
import { head } from "lodash";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import ConfirmationModal from "../ConfirmationModal";

const announcementModalStyles = {
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  multFieldLine: {
    display: "flex",
    "& > *:not(:last-child)": {
      marginRight: 1,
    },
  },
  btnWrapper: {
    position: "relative",
  },
  buttonProgress: {
    color: "#4caf50",
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: "-12px",
    marginLeft: "-12px",
  },
  formControl: {
    margin: 1,
    minWidth: 120,
  },
  colorAdorment: {
    width: 20,
    height: 20,
  },
};

const announcementSchema = z.object({
  title: z.string().nonempty("Obrigatório"),
  text: z.string().nonempty("Obrigatório"),
  priority: z.number().optional(),
  status: z.boolean().optional(),
});

const AnnouncementModal = ({ open, onClose, announcementId, reload }) => {
  const initialState = {
    title: "",
    text: "",
    priority: 3,
    status: true,
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(announcementSchema),
    defaultValues: initialState,
  });

  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(initialState);
  const [attachment, setAttachment] = useState(null);
  const attachmentFile = useRef(null);

  useEffect(() => {
    try {
      (async () => {
        if (!announcementId) return;

        const { data } = await api.get(`/announcements/${announcementId}`);
        setAnnouncement((prevState) => {
          return { ...prevState, ...data };
        });
        reset(data);
      })();
    } catch (err) {
      toastError(err);
    }
  }, [announcementId, open, reset]);

  const handleClose = () => {
    setAnnouncement(initialState);
    setAttachment(null);
    reset(initialState);
    onClose();
  };

  const handleAttachmentFile = (e) => {
    const file = head(e.target.files);
    if (file) {
      setAttachment(file);
    }
  };

  const handleSaveAnnouncement = async (values) => {
    const announcementData = { ...values };
    try {
      if (announcementId) {
        await api.put(`/announcements/${announcementId}`, announcementData);
        if (attachment != null) {
          const formData = new FormData();
          formData.append("typeArch", "announcements");
          formData.append("file", attachment);
          await api.post(
            `/announcements/${announcementId}/media-upload`,
            formData
          );
        }
      } else {
        const { data } = await api.post("/announcements", announcementData);
        if (attachment != null) {
          const formData = new FormData();
          formData.append("typeArch", "announcements");
          formData.append("file", attachment);

          await api.post(`/announcements/${data.id}/media-upload`, formData);
        }
      }
      toast.success(i18n.t("announcements.toasts.success"));
      if (typeof reload == "function") {
        reload();
      }
    } catch (err) {
      toastError(err);
    }
    handleClose();
  };

  const deleteMedia = async () => {
    if (attachment) {
      setAttachment(null);
      attachmentFile.current.value = null;
    }

    if (announcement.mediaPath) {
      await api.delete(`/announcements/${announcement.id}/media-upload`);
      setAnnouncement((prev) => ({
        ...prev,
        mediaPath: null,
      }));
      toast.success(i18n.t("announcements.toasts.deleted"));
      if (typeof reload == "function") {
        reload();
      }
    }
  };

  return (
    <Box sx={announcementModalStyles.root}>
      <ConfirmationModal
        title={i18n.t("announcements.confirmationModal.deleteTitle")}
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={deleteMedia}
      >
        {i18n.t("announcements.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        scroll="paper"
      >
        <DialogTitle id="form-dialog-title">
          {announcementId
            ? `${i18n.t("announcements.dialog.edit")}`
            : `${i18n.t("announcements.dialog.add")}`}
        </DialogTitle>
        <div style={{ display: "none" }}>
          <input
            type="file"
            accept=".png,.jpg,.jpeg"
            ref={attachmentFile}
            onChange={(e) => handleAttachmentFile(e)}
          />
        </div>
        <Box component="form" onSubmit={handleSubmit(handleSaveAnnouncement)}>
          <DialogContent dividers>
            <Grid spacing={2} container>
              <Grid xs={12} item>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={i18n.t("announcements.dialog.form.title")}
                      error={Boolean(errors.title)}
                      helperText={errors.title?.message}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid xs={12} item>
                <Controller
                  name="text"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={i18n.t("announcements.dialog.form.text")}
                      error={Boolean(errors.text)}
                      helperText={errors.text?.message}
                      variant="outlined"
                      margin="dense"
                      multiline={true}
                      rows={7}
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid xs={12} item>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl variant="outlined" margin="dense" fullWidth>
                      <InputLabel id="status-selection-label">
                        {i18n.t("announcements.dialog.form.status")}
                      </InputLabel>
                      <Select
                        {...field}
                        label={i18n.t("announcements.dialog.form.status")}
                        labelId="status-selection-label"
                        id="status"
                        error={Boolean(errors.status)}
                      >
                        <MenuItem value={true}>{i18n.t("announcements.dialog.form.active")}</MenuItem>
                        <MenuItem value={false}>{i18n.t("announcements.dialog.form.inactive")}</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid xs={12} item>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <FormControl variant="outlined" margin="dense" fullWidth>
                      <InputLabel id="priority-selection-label">
                        {i18n.t("announcements.dialog.form.priority")}
                      </InputLabel>
                      <Select
                        {...field}
                        label={i18n.t("announcements.dialog.form.priority")}
                        labelId="priority-selection-label"
                        id="priority"
                        error={Boolean(errors.priority)}
                      >
                        <MenuItem value={1}>{i18n.t("announcements.dialog.form.high")}</MenuItem>
                        <MenuItem value={2}>{i18n.t("announcements.dialog.form.medium")}</MenuItem>
                        <MenuItem value={3}>{i18n.t("announcements.dialog.form.low")}</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              {(announcement.mediaPath || attachment) && (
                <Grid xs={12} item>
                  <Button startIcon={<AttachFileIcon />}>
                    {attachment ? attachment.name : announcement.mediaName}
                  </Button>
                  <IconButton
                    onClick={() => setConfirmationOpen(true)}
                    color="secondary"
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            {!attachment && !announcement.mediaPath && (
              <Button
                color="primary"
                onClick={() => attachmentFile.current.click()}
                disabled={isSubmitting}
                variant="outlined"
              >
                {i18n.t("announcements.dialog.buttons.attach")}
              </Button>
            )}
            <Button
              onClick={handleClose}
              color="secondary"
              disabled={isSubmitting}
              variant="outlined"
            >
              {i18n.t("announcements.dialog.buttons.cancel")}
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={isSubmitting}
              variant="contained"
              sx={announcementModalStyles.btnWrapper}
            >
              {announcementId
                ? `${i18n.t("announcements.dialog.buttons.edit")}`
                : `${i18n.t("announcements.dialog.buttons.add")}`}
              {isSubmitting && (
                <CircularProgress
                  size={24}
                  sx={announcementModalStyles.buttonProgress}
                />
              )}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default AnnouncementModal;
