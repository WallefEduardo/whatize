import React, { useState, useEffect, useRef } from "react";

// Removido: Yup/Formik já migrados para useState
import { toast } from "../ui/ToastProvider";
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
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

// MIGRAÇÃO: makeStyles → sx prop (preservando Formik + funcionalidade ticket)
const flowBuilderTicketStyles = {
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

const FlowBuilderTicketModal = ({
    open,
    onSave,
    data,
    onUpdate,
    close
}) => {
    // MIGRAÇÃO: usando objeto de estilos direto (preservando funcionalidade ticket)
    const isMounted = useRef(true);
    const [activeModal, setActiveModal] = useState(false)
    const [queues, setQueues] = useState([])
    const [selectedQueue, setQueueSelected] = useState()

    useEffect(() => {
        if (open === 'edit') {
            (async () => {
                try {
                    const { data: old } = await api.get("/queue");
                    setQueues(old)
                    const queue = old.find((item) => item.id === data.data.id)
                    console.log('queue', queue)
                    if (queue) {
                        setQueueSelected(queue.id)
                    }
                    setActiveModal(true)
                } catch (error) {
                    console.log(error)
                }
            })();

        } else if (open === 'create') {
            (async () => {
                try {
                    const { data } = await api.get("/queue");
                    setQueues(data)
                    setActiveModal(true)
                } catch (error) {
                    console.log(error)
                }
            })()
        }
        return () => {
            isMounted.current = false;
        };
    }, [open]);


    const handleClose = () => {
        close(null)
        setActiveModal(false)
    };

    const handleSaveContact = () => {
        if (!selectedQueue) {
            return toast.error('Adicione uma fila')
        }
        if (open === 'edit') {
            const queue = queues.find(item => item.id === selectedQueue)
            onUpdate({
                ...data,
                data: queue
            });
        } else if (open === 'create') {
            const queue = queues.find(item => item.id === selectedQueue)
            onSave({
                data: queue
            })
        }
        handleClose()

    };

    return (
        <Box sx={flowBuilderTicketStyles.root}>
            <Dialog open={activeModal} onClose={handleClose} fullWidth="md" scroll="paper">
                <DialogTitle id="form-dialog-title">
                    {open === 'create' ? `Adicionar um intervalo ao fluxo` : `Editar intervalo`}
                </DialogTitle>
                <Stack>
                    <DialogContent dividers>
                        <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            //   onChange={handleChange}
                            value={selectedQueue}
                            style={{ width: "95%" }}
                            onChange={(e) => { setQueueSelected(e.target.value) }}
                            MenuProps={{
                                anchorOrigin: {
                                    vertical: "bottom",
                                    horizontal: "left",
                                },
                                transformOrigin: {
                                    vertical: "top",
                                    horizontal: "left",
                                },
                                getContentAnchorEl: null,
                            }}
                            renderValue={() => {
                                if (selectedQueue === "") {
                                    return "Selecione uma Conexão"
                                }
                                const queue = queues.find(w => w.id === selectedQueue)
                                return queue.name
                            }}
                        >

                            {queues.length > 0 && (
                                queues.map((queue, index) => (
                                    <MenuItem dense key={index} value={queue.id}>{queue.name}</MenuItem>
                                ))
                            )}
                        </Select>
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
                            sx={flowBuilderTicketStyles.btnWrapper}
                            onClick={handleSaveContact}
                        >
                            {open === 'create' ? `Adicionar` : 'Editar'}
                        </Button>
                    </DialogActions>
                </Stack>
            </Dialog>
        </Box>
    );
};

export default FlowBuilderTicketModal;