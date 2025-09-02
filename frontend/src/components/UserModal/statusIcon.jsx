import React from "react";
import { Tooltip } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { UserX } from 'lucide-react';

const UserStatusIcon = ({ user }) => {
    return user.online ?
        <Tooltip title="Online" arrow>
            <CheckCircleIcon 
                sx={{ 
                    color: '#4caf50', // Verde direto
                    fontSize: '16px',
                    cursor: 'pointer'
                }} 
            />
        </Tooltip>
        :
        <Tooltip title="Offline" arrow>
            <UserX 
                size={16}
                style={{ 
                    color: '#f44336', // Vermelho direto
                    cursor: 'pointer'
                }} 
            />
        </Tooltip>
}

export default UserStatusIcon;