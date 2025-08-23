import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import moment from 'moment';
import EditIcon from "@mui/icons-material/Edit";

export default function ContactNotesDialogListItem(props) {
    const { note, deleteItem, editItem } = props;

    const handleDelete = (item) => {
        deleteItem(item);
    }

    const handleEdit = (item) => {
        editItem(item);
    }
    return (
        <ListItem alignItems="flex-start">
            <ListItemAvatar>
                <Avatar alt={note.user.name} src="/static/images/avatar/1.jpg" />
            </ListItemAvatar>
            <ListItemText
                primary={
                    <>
                        <Typography
                            component="span"
                            variant="body2"
                            sx={{ width: '100%' }}
                            color="textPrimary"
                        >
                            {note.note}
                        </Typography>
                    </>
                }
                secondary={
                    <>
                        {note.user.name}, {moment(note.createdAt).format('DD/MM/YY HH:mm')}
                    </>
                }
            />
            <ListItemSecondaryAction style={{ display: 'flex', flexDirection: 'column' }}>
                {/* <IconButton onClick={() => handleEdit(note)} edge="end" aria-label="edit">
                    <EditIcon />
                </IconButton> */}
                <IconButton onClick={() => handleDelete(note)} edge="end" aria-label="delete">
                    <DeleteIcon />
                </IconButton>
            </ListItemSecondaryAction>

        </ListItem>
    )
}

ContactNotesDialogListItem.propTypes = {
    note: PropTypes.object.isRequired,
    deleteItem: PropTypes.func.isRequired
}