import { Paper } from "@mui/material";
import React from "react";
import ContactImport from "../../components/ContactImport";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";

const useStyles = () => ({
    mainPaper: {
        flex: 1,
        padding: 1,
        borderRadius: 0,
        overflowY: "scroll",
    },
});

const ContactImportPage = () => {
    const classes = useStyles();
    return <MainContainer className={classes.mainPaper}>
        <MainHeader>
            <Title>Importar contatos de arquivo</Title>
        </MainHeader>
        <Paper
            className={classes.mainPaper}
            variant="outlined">
            <ContactImport />
        </Paper>
    </MainContainer>
}

export default ContactImportPage;