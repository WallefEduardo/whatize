import React, { useState, useEffect, useContext } from "react";
import { toast } from "../../components/ui/ToastProvider";
import { useHistory } from "react-router-dom";

import {
  Button,
  Paper,
  IconButton,
  Typography,
  Grid,
  CircularProgress
} from "@mui/material";

import {
  Delete as DeleteOutlineIcon,
  Edit as EditIcon,
  TextFields,
  AddCircleOutline
} from "@mui/icons-material";

import { Stack } from "@mui/material";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { Can } from "../../components/Can";
import { AuthContext } from "../../context/Auth/AuthContext";
import CampaignModalPhrase from "../../components/CampaignModalPhrase";

const useStyles = () => ({
  mainPaper: {
    flex: 1,
    padding: 0,
    borderRadius: 0,
    boxShadow: "none",
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  contentContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  campaignItem: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
    "&:hover": {
      backgroundColor: "#eee",
    },
  },
  actionButtons: {
    backgroundColor: "#00C307",
    color: "white",
    "&:hover": {
      backgroundColor: "#029907",
    },
  },
  iconButton: {
    padding: 8,
    backgroundColor: "#f5f5f5",
    marginLeft: 8,
    "&.edit": {
      color: "#00C307",
    },
    "&.delete": {
      color: "#E57373",
    },
  },
  campaignName: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "#333",
    "& .MuiSvgIcon-root": {
      color: "#25b6e8",
    }
  },
  campaignStatus: {
    color: "#333",
    textAlign: "center"
  },
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "50vh",
  }
});
const CampaignsPhrase = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingContact, setDeletingContact] = useState(null);

  const [campaignflows, setCampaignFlows] = useState([]);
  const [ModalOpenPhrase, setModalOpenPhrase] = useState(false);
  const [campaignflowSelected, setCampaignFlowSelected] = useState();

  const handleDeleteCampaign = async campaignId => {
    try {
      await api.delete(`/flowcampaign/${campaignId}`);
      toast.success("Frase deletada");
      getCampaigns()
    } catch (err) {
      toastError(err);
    }
  };

  const getCampaigns = async () => {
    setLoading(true);
    await api.get("/flowcampaign").then(res => {
      setCampaignFlows(res.data.flow);
      setLoading(false);
    });
  };

  const onSaveModal = () => {
    getCampaigns()
  }

  const handleScroll = e => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
    }
  };

  useEffect(() => {
    getCampaigns();
  }, []);

  return (
    <MainContainer>
      <ConfirmationModal
        title={
          deletingCampaign &&
          `${i18n.t("campaigns.confirmationModal.deleteTitle")} ${deletingCampaign.name
          }?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteCampaign(deletingContact.id)}
      >
        {i18n.t("campaigns.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <CampaignModalPhrase
        open={ModalOpenPhrase}
        onClose={() => setModalOpenPhrase(false)}
        FlowCampaignId={campaignflowSelected}
        onSave={onSaveModal}
      />

      <div className={classes.searchContainer}>
        <div style={{
          display: "flex",
          gap: "16px",
          alignItems: "center"
        }}>
          <Typography variant="h6" style={{ color: '#333' }}>
            {i18n.t("Campanhas")}
          </Typography>
        </div>

        <Button
          variant="contained"
          className={classes.actionButtons}
          startIcon={<AddCircleOutline />}
          onClick={() => {
            setCampaignFlowSelected();
            setModalOpenPhrase(true);
          }}
        >
          Nova Campanha
        </Button>
      </div>

      <Paper className={classes.mainPaper} onScroll={handleScroll}>
        <div className={classes.contentContainer}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#333' }}>
                Nome
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
                Status
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="subtitle2" style={{ fontWeight: 'bold', color: '#333', textAlign: 'right' }}>
                {i18n.t("contacts.table.actions")}
              </Typography>
            </Grid>
          </Grid>

          {loading ? (
            <div className={classes.loading}>
              <CircularProgress style={{ color: "#25b6e8" }} />
            </div>
          ) : (
            campaignflows.map(flow => (
              <div key={flow.id} className={classes.campaignItem}>
                <Grid container alignItems="center">
                  <Grid item xs={4}>
                    <div className={classes.campaignName}>
                      <TextFields />
                      <Typography>{flow.name}</Typography>
                    </div>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography className={classes.campaignStatus}>
                      {flow.status ? "Ativo" : "Desativado"}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <IconButton
                        size="small"
                        className={`${classes.iconButton} edit`}
                        onClick={() => {
                          setCampaignFlowSelected(flow.id);
                          setModalOpenPhrase(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <Can
                        role={user.profile}
                        perform="contacts-page:deleteContact"
                        yes={() => (
                          <IconButton
                            size="small"
                            className={`${classes.iconButton} delete`}
                            onClick={() => {
                              setConfirmModalOpen(true);
                              setDeletingContact(flow);
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                      />
                    </div>
                  </Grid>
                </Grid>
              </div>
            ))
          )}
        </div>
      </Paper>
    </MainContainer>
  );
};

export default CampaignsPhrase;