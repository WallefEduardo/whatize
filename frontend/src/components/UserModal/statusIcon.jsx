import React from "react";
import { Tooltip } from "@mui/material";
import { green, grey } from '@mui/material/colors';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

const useStyles = () => ({
    on: {
        color: green[600],
        fontSize: '20px'
    },
    off: {
        color: grey[600],
        fontSize: '20px'
    }
});

const UserStatusIcon = ({ user }) => {
    const classes = useStyles();
    return user.online ?
        <Tooltip title="Online">
            <CheckCircleIcon className={classes.on} />
        </Tooltip>
        :
        <Tooltip title="Offline">
            <ErrorIcon className={classes.off} />
        </Tooltip>
}

export default UserStatusIcon;