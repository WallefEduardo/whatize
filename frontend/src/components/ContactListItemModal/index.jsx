import React, { useState, useEffect, useRef, useContext } from "react";

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
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/Auth/AuthContext";

const contactListItemStyles = {
  root: {
    display: "flex",
    flexWrap: "wrap",
  },
  textField: {
    marginRight: 1,
    flex: 1,
  },
  extraAttr: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
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
};

const contactSchema = z.object({
  name: z.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .nonempty("Required"),
  number: z.string().min(8, "Too Short!").max(50, "Too Long!").optional().or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
});

const ContactListItemModal = ({
  open,
  onClose,
  contactId,
  initialValues,
  onSave,
}) => {
  const isMounted = useRef(true);

  const {
    user: { companyId },
  } = useContext(AuthContext);
  const { contactListId } = useParams();

  const initialState = {
    name: "",
    number: "",
    email: "",
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: initialState,
  });

  const [contact, setContact] = useState(initialState);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchContact = async () => {
      if (initialValues) {
        setContact((prevState) => {
          return { ...prevState, ...initialValues };
        });
        reset(initialValues);
      }

      if (!contactId) return;

      try {
        const { data } = await api.get(`/contact-list-items/${contactId}`);
        if (isMounted.current) {
          setContact(data);
          reset(data);
        }
      } catch (err) {
        toastError(err);
      }
    };

    fetchContact();
  }, [contactId, open, initialValues, reset]);

  const handleClose = () => {
    onClose();
    setContact(initialState);
    reset(initialState);
  };

  const handleSaveContact = async (values) => {
    try {
      if (contactId) {
        await api.put(`/contact-list-items/${contactId}`, {
          ...values,
          companyId,
          contactListId,
        });
        handleClose();
      } else {
        const { data } = await api.post("/contact-list-items", {
          ...values,
          companyId,
          contactListId,
        });
        if (onSave) {
          onSave(data);
        }
        handleClose();
      }
      toast.success(i18n.t("contactModal.success"));
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <Box sx={contactListItemStyles.root}>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" scroll="paper">
        <DialogTitle id="form-dialog-title">
          {contactId
            ? `${i18n.t("contactModal.title.edit")}`
            : `${i18n.t("contactModal.title.add")}`}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleSaveContact)}>
          <DialogContent dividers>
            <Typography variant="subtitle1" gutterBottom>
              {i18n.t("contactModal.form.mainInfo")}
            </Typography>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={i18n.t("contactModal.form.name")}
                  autoFocus
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                  variant="outlined"
                  margin="dense"
                  sx={contactListItemStyles.textField}
                />
              )}
            />
            <Controller
              name="number"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={i18n.t("contactModal.form.number")}
                  error={Boolean(errors.number)}
                  helperText={errors.number?.message}
                  placeholder="5513912344321"
                  variant="outlined"
                  margin="dense"
                />
              )}
            />
            <Box>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={i18n.t("contactModal.form.email")}
                    error={Boolean(errors.email)}
                    helperText={errors.email?.message}
                    placeholder="Email address"
                    fullWidth
                    margin="dense"
                    variant="outlined"
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleClose}
              color="secondary"
              disabled={isSubmitting}
              variant="outlined"
            >
              {i18n.t("contactModal.buttons.cancel")}
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={isSubmitting}
              variant="contained"
              sx={contactListItemStyles.btnWrapper}
            >
              {contactId
                ? `${i18n.t("contactModal.buttons.okEdit")}`
                : `${i18n.t("contactModal.buttons.okAdd")}`}
              {isSubmitting && (
                <CircularProgress
                  size={24}
                  sx={contactListItemStyles.buttonProgress}
                />
              )}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default ContactListItemModal;
