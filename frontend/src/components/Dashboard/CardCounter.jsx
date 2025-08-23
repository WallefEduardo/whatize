import React from "react";

import { Avatar, Card, CardHeader, Typography } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";
import { grey } from '@mui/material/colors';

export default function CardCounter(props) {
    const { icon, title, value, loading } = props;
    return ( !loading ? 
        <Card>
            <CardHeader
                avatar={
                    <Avatar sx={{
                        fontSize: '55px',
                        color: grey[500],
                        backgroundColor: '#ffffff',
                        width: (theme) => 8,
                        height: (theme) => 8
                    }}>
                        {icon}
                    </Avatar>
                }
                title={
                    <Typography 
                        variant="h6" 
                        component="h2" 
                        sx={{
                            fontSize: '18px',
                            color: 'text.primary'
                        }}
                    >
                        { title }
                    </Typography>
                }
                subheader={
                    <Typography 
                        variant="subtitle1" 
                        component="p" 
                        sx={{
                            color: grey[600],
                            fontSize: '14px'
                        }}
                    >
                        { value }
                    </Typography>
                }
            />
        </Card>
        : <Skeleton variant="rect" height={80} />
    )
    
}