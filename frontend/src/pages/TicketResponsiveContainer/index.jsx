import React from "react";
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

import Tickets from "../TicketsCustom"
import TicketAdvanced from "../TicketsAdvanced";

function TicketResponsiveContainer () {
    const theme = useTheme();
    const isMdUp = useMediaQuery("(max-width:600px)");
    
    if (isMdUp) {
        return <Tickets />;    
    }
    return <TicketAdvanced />
}

export default TicketResponsiveContainer;