import { makeStyles } from "@material-ui/styles";
import React from "react";
import { Tooltip } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
    tag: {
        padding: "2px 5px",
        borderRadius: "3px",
        fontSize: "0.7em",
        fontWeight: "bold",
        color: "#FFF",
        marginRight: "2px",
        marginBottom: "2px",
        whiteSpace: "nowrap",
        maxWidth: "100%",
        width: "auto",
        minWidth: "auto",
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center"
    },
    container: {
        display: "inline-block",
        maxWidth: "100%",
        width: "100%"
    }
}));

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
                <div className={classes.tag} style={{ backgroundColor: tag.color }}>
                    {displayName.toUpperCase()}
                </div>
            </Tooltip>
        </div>
    );
};

export default ContactTag;