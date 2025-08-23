import React from "react";
import { Tooltip } from "@mui/material";
import { ViewColumn } from "@mui/icons-material";

const useStyles = () => ({
    tag: {
        marginRight: 1, // Reduzido para 1px
        marginLeft: 0,
        marginBottom: 1,
        padding: "2px 5px", // Reduzido padding
        fontWeight: 600,
        borderRadius: 3, // Reduzido borderRadius
        fontSize: "0.55em", // Reduzido fontSize
        display: "flex",
        alignItems: "center",
        gap: "2px", // Reduzido gap
        minHeight: "16px", // Reduzido minHeight
        whiteSpace: "nowrap",
        flexShrink: 0,
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
            transform: "scale(1.05)",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        }
    },
    container: {
        display: "inline-block",
        maxWidth: "100%",
        width: "100%"
    }
});

const ContactTag = ({ tag }) => {
    const classes = useStyles();
    
    if (!tag) {
        return null;
    }
    
    // Verifica se a tag tem informações de funil
    const displayName = tag.funilName 
        ? `${tag.funilName} - ${tag.name}`
        : tag.name;

    return (
        <div className={classes.container}>
            <Tooltip title={displayName.toUpperCase()} placement="top">
                <div 
                    className={classes.tag} 
                    style={{ 
                        backgroundColor: `${tag.color}20`, // 20% opacidade
                        color: tag.color // Cor sólida para o texto
                    }}
                >
                    <ViewColumn style={{ fontSize: "10px" }} />
                    {displayName.toUpperCase()}
                </div>
            </Tooltip>
        </div>
    );
};

export default ContactTag;