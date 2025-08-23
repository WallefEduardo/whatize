import React, { useEffect, useRef } from "react";

import { green } from "@mui/material/colors";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { Box } from "@mui/material";
import CheckoutPage from "../CheckoutPage";

const ContactModal = ({ open, onClose, Invoice, contactId, initialValues, onSave }) => {
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleClose = () => {
    onClose();
  };

  return (
    <Box sx={{
      display: "flex",
      flexWrap: "wrap",
    }}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" scroll="paper">
        <DialogContent dividers>
          <CheckoutPage
            Invoice={Invoice}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ContactModal;
