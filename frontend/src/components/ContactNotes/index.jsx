import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import Box from '@mui/material/Box';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import ContactNotesDialogListItem from '../ContactNotesDialogListItem';
import ConfirmationModal from '../ConfirmationModal';
import ContactNotesEditModal from '../ContactNotesEditModal';

import { toast } from "../ui/ToastProvider";

import { i18n } from "../../translate/i18n";

import ButtonWithSpinner from '../ButtonWithSpinner';

import useTicketNotes from '../../hooks/useTicketNotes';
import { Grid } from '@mui/material';

// MIGRAÇÃO: makeStyles + Formik → sx prop + React Hook Form + Zod
const contactNotesStyles = {
    root: {
        '& .MuiTextField-root': {
            margin: (theme) => 8,
            width: '350px',
        },
    },
    list: {
        width: '100%',
        maxWidth: '350px',
        maxHeight: '200px',
        backgroundColor: (theme) => "var(--color-primary)",
        overflow: 'auto'
    },
    inline: {
        width: '100%'
    }
};

const noteSchema = z.object({
    note: z.string()
        .min(2, "Too Short!")
        .min(1, "Required")
});
export function ContactNotes({ ticket }) {
    const { id: ticketId, contactId } = ticket
    // MIGRAÇÃO: usando objeto de estilos direto + React Hook Form
    const [loading, setLoading] = useState(false)
    const [showOnDeleteDialog, setShowOnDeleteDialog] = useState(false)
    const [selectedNote, setSelectedNote] = useState({})
    const [notes, setNotes] = useState([])
    const { saveNote, deleteNote, listNotes } = useTicketNotes()
    const [editingNote, setEditingNote] = useState(null);

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(noteSchema),
        defaultValues: { note: "" }
    });

    useEffect(() => {
        async function openAndFetchData() {
            handleResetState()
            await loadNotes()
        }
        openAndFetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleResetState = () => {
        reset({ note: "" })
        setLoading(false)
    }

    // MIGRAÇÃO: handleChangeComment removido - React Hook Form gerencia automaticamente

    const handleEdit = (note) => {
        console.log(note)
        setEditingNote(note);
    };

    const handleSave = async (values) => {
        setLoading(true)
        try {
            await saveNote({
                ...values,
                ticketId,
                contactId
            })
            await loadNotes()
            reset({ note: '' })
            toast.success('Observação adicionada com sucesso!')
        } catch (e) {
            toast.error(e)
        }
        setLoading(false)
    }

    const handleOpenDialogDelete = (item) => {
        setSelectedNote(item)
        setShowOnDeleteDialog(true)
    }

    const handleDelete = async () => {
        setLoading(true)
        try {
            await deleteNote(selectedNote.id)
            await loadNotes()
            setSelectedNote({})
            toast.success('Observação excluída com sucesso!')
        } catch (e) {
            toast.error(e)
        }
        setLoading(false)
    }

    const loadNotes = async () => {
        setLoading(true)
        try {
            const notes = await listNotes({ ticketId, contactId })
            setNotes(notes)
        } catch (e) {
            toast.error(e)
        }
        setLoading(false)
    }


    const renderNoteList = () => {
        return notes.map((note) => {
            return <ContactNotesDialogListItem
                note={note}
                key={note.id}
                deleteItem={handleOpenDialogDelete}
                editItem={() => handleEdit(note)}
            />
        })
    }

    return (
        <>
            <ContactNotesEditModal
                open={editingNote !== null}
                onClose={() => setEditingNote(null)}
                note={editingNote ? editingNote.note : ''}
                onSave={handleSave}
            />
            <ConfirmationModal
                title="Excluir Registro"
                open={showOnDeleteDialog}
                onClose={setShowOnDeleteDialog}
                onConfirm={handleDelete}
            >
                Deseja realmente excluir este registro?
            </ConfirmationModal>
            <Box component="form" onSubmit={handleSubmit(handleSave)}>
                <Grid container spacing={2}>
                    <Grid xs={12} item>
                        <Controller
                            name="note"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    rows={3}
                                    label={i18n.t("ticketOptionsMenu.appointmentsModal.textarea")}
                                    placeholder={i18n.t("ticketOptionsMenu.appointmentsModal.placeholder")}
                                    multiline={true}
                                    error={Boolean(errors.note)}
                                    helperText={errors.note?.message}
                                    variant="outlined"
                                    fullWidth
                                />
                            )}
                        />
                    </Grid>
                    <Grid xs={12} item>
                        <Grid container spacing={2}>
                            <Grid xs={6} item>
                                <Button
                                    onClick={() => {
                                        reset({ note: "" });
                                    }}
                                    color="primary"
                                    variant="outlined"
                                    fullWidth
                                >
                                    Cancelar
                                </Button>
                            </Grid>
                            <Grid xs={6} item>
                                <ButtonWithSpinner loading={loading} color="primary" type="submit" variant="contained" autoFocus fullWidth>
                                    Salvar
                                </ButtonWithSpinner>
                            </Grid>
                        </Grid>
                    </Grid>
                    {notes.length > 0 && (
                        <Grid xs={12} item>
                            <List sx={contactNotesStyles.list}>
                                {renderNoteList()}
                            </List>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </>
    );
}