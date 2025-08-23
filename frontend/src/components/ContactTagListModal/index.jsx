import React, { useContext, useEffect, useState } from "react";
import {
  Modal,
  Backdrop,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";

const handleRemoveContactTag = async (contactId, tagId) => {
  await api.delete(`/tags-contacts/${tagId}/${contactId}`);
}

const ContactTagListModal = ({ open, onClose, tag }) => {
  const [tagList, setTagList] = useState(tag.contacts);
  const { user, socket } = useContext(AuthContext);

  useEffect(() => {
    console.log("tagList", tagList)
  }, [tagList])

  useEffect(() => {
    // const socket = socketManager.GetSocket(user.companyId, user.id);

    const onCompanyTags = (data) => {
      if (data.action === "update" || data.action === "create") {
        if (data.tag.id === tag.id && data.tag?.contacts?.length > 0) {
          setTagList(data.tag.contacts);
        }
        if (data.tag.id === tag.id && data.tag?.contacts?.length === 0) {
          setTagList([]);
          onClose();
        }
      }
    };
    if (socket && socket.on && typeof socket.on === 'function') {

      socket.on(`company${user.companyId}-tag`, onCompanyTags);

    }

    return () => {
      socket.off(`company${user.companyId}-tag`, onCompanyTags);
    };
  }, [socket]); // Dependência do estado auxiliar updateFlag

  return tagList.length > 0 ? (
    <Modal
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={open}>
        <Box sx={{
          backgroundColor: (theme) => "var(--color-primary)",
          boxShadow: (theme) => theme.shadows[5],
          padding: (theme) => 8,
          borderRadius: "8px",
          overflow: "auto",
          maxHeight: "80vh",
        }}>
          <IconButton sx={{
            position: "absolute",
            top: (theme) => 8,
            right: (theme) => 8,
          }} onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <h2 id="transition-modal-title">{tag.name} - Contatos</h2>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nome</TableCell>
                  <TableCell>Nmero</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tagList?.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>{contact.id}</TableCell>
                    <TableCell>{contact.name}</TableCell>
                    <TableCell>{contact.number}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleRemoveContactTag(contact.id, tag.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Fade>
    </Modal>
  ) : (
    <></>
  )
};

export default ContactTagListModal;
