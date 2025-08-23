import React, { useContext } from "react";

import MomentsUser from "../../components/MomentsUser";
// import MomentsQueues from "../../components/MomentsQueues";

import MainHeader from "../../components/MainHeader";
import { Grid, Paper } from "@mui/material";
import Title from "../../components/Title";
import ForbiddenPage from "../../components/ForbiddenPage";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = () => ({
  container: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: "5px",
    maxWidth: "100%"
  },
  mainPaper: {
    display: "flex",
    padding: 8,
    overflowY: "scroll",
    
    alignItems: "center"
  },
  fixedHeightPaper: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    height: 100,
  },
  chatPapper: {
    display: "flex",
    height: "100%",
  },
  contactsHeader: {
    display: "flex",
    flexWrap: "wrap",
    padding: "0px 6px 6px 6px",
  },
  titleContainer: {
    textAlign: 'center',
    paddingTop: 24,
    paddingBottom: 24,
    marginBottom: 16,
    '& .MuiTypography-root': {
      color: '#000',
      fontWeight: 600,
      fontSize: '1.5rem',
    },
  },
});

const ChatMoments = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext)
  return (

    user.profile === "user" && user.allowRealTime === "disabled" ?
      <ForbiddenPage />
      :
      <MainHeader>
        <Grid style={{ width: "99.6%" }} container justifyContent="center" alignItems="flex-start">
          <Grid xs={12} sm={8} xl={4} item >
            <div className={classes.titleContainer}>
              <Title>{"Painel de Atendimentos"}</Title>
            </div>
          </Grid>
          <Grid style={{ width: "100%", height: "100vh" }} item >
            <Paper
              className={classes.mainPaper}
              variant="outlined"
              style={{ maxWidth: "100%" }}
            >
              <MomentsUser />
            </Paper>
          </Grid>
        </Grid>
      </MainHeader>
  );
};

export default ChatMoments;
