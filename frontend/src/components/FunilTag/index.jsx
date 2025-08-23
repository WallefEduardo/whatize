import React from "react";
import { Tooltip, Box } from "@mui/material";
import { ViewColumn } from "@mui/icons-material";

const FunilTag = ({ tag }) => {
    
    if (!tag) {
        return null;
    }
    
    // Verifica se a tag tem informações de funil
    const displayName = tag.funilName 
        ? `${tag.funilName} - ${tag.name}`
        : tag.name;

    return (
        <Box sx={{
            display: "inline-block",
            maxWidth: "100%",
            width: "100%"
        }}>
            <Tooltip title={displayName.toUpperCase()} placement="top">
                <Box 
                    sx={{
                        marginRight: 0.125,
                        marginLeft: 0,
                        marginBottom: 0.125,
                        padding: "2px 5px",
                        fontWeight: 600,
                        borderRadius: 0.375,
                        fontSize: "0.55em",
                        display: "flex",
                        alignItems: "center",
                        gap: "2px",
                        minHeight: "16px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            transform: "scale(1.05)",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                        },
                        backgroundColor: `${tag.color}20`,
                        color: tag.color
                    }}
                >
                    <ViewColumn style={{ fontSize: "10px" }} />
                    {displayName.toUpperCase()}
                </Box>
            </Tooltip>
        </Box>
    );
};

export default FunilTag; 