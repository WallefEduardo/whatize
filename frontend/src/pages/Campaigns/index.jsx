import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "../../components/ui/ToastProvider";
import { useHistory } from "react-router-dom";
import { green } from "@mui/material/colors";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Typography,
  Grid
} from "@mui/material";

import {
  DeleteOutline as DeleteOutlineIcon,
  Edit as EditIcon,
  Description as DescriptionIcon,
  PlayCircleOutline as PlayCircleOutlineIcon,
  PauseCircleOutline as PauseCircleOutlineIcon,
  Search as SearchIcon,
  AddCircleOutline
} from "@mui/icons-material";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import CampaignModal from "../../components/CampaignModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { isArray } from "lodash";
import { useDate } from "../../hooks/useDate";
import ForbiddenPage from "../../components/ForbiddenPage";
import usePlans from "../../hooks/usePlans";
import { AuthContext } from "../../context/Auth/AuthContext";

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
  tableContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  searchInput: {
    width: "300px",
    "& .MuiOutlinedInput-root": {
      borderRadius: 8,
    },
  },
  customTable: {
    "& .MuiTableCell-head": {
      fontWeight: 600,
      color: "#333",
      borderBottom: "2px solid #f5f5f5",
    },
    "& .MuiTableCell-body": {
      borderBottom: "1px solid #f5f5f5",
    },
    "& .MuiTableRow-root:hover": {
      backgroundColor: "#f9f9f9",
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
    "&.report": {
      color: "#4CAF50",
    },
    "&.play": {
      color: "#00C307",
    },
    "&.pause": {
      color: "#E57373",
    }
  },
});

const reducer = (state, action) => {
  if (action.type === "LOAD_CAMPAIGNS") {
    const campaigns = action.payload;
    const newCampaigns = [];

    if (isArray(campaigns)) {
      campaigns.forEach((campaign) => {
        const campaignIndex = state.findIndex((u) => u.id === campaign.id);
        if (campaignIndex !== -1) {
          state[campaignIndex] = campaign;
        } else {
          newCampaigns.push(campaign);
        }
      });
    }

    return [...state, ...newCampaigns];
  }

  if (action.type === "UPDATE_CAMPAIGNS") {
    const campaign = action.payload;
    const campaignIndex = state.findIndex((u) => u.id === campaign.id);

    if (campaignIndex !== -1) {
      state[campaignIndex] = campaign;
      return [...state];
    } else {
      return [campaign, ...state];
    }
  }

  if (action.type === "DELETE_CAMPAIGN") {
    const campaignId = action.payload;
    const campaignIndex = state.findIndex((u) => u.id === campaignId);
    if (campaignIndex !== -1) {
      state.splice(campaignIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};
const Campaigns = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);
  const { datetimeToClient } = useDate();
  const { getPlanCompany } = usePlans();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [campaigns, dispatch] = useReducer(reducer, []);

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useCampaigns) {
        toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
        setTimeout(() => {
          history.push(`/`)
        }, 1000);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchCampaigns();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = user.companyId;
    const onCompanyCampaign = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_CAMPAIGNS", payload: data.record });
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_CAMPAIGN", payload: +data.id });
      }
    }

    if (socket && socket.on && typeof socket.on === 'function') {


      socket.on(`company-${companyId}-campaign`, onCompanyCampaign);


    }
    return () => {
      if (socket && socket.off && typeof socket.off === 'function') {

        socket.off(`company-${companyId}-campaign`, onCompanyCampaign);

      }
    };
  }, [user, socket]);

  const fetchCampaigns = async () => {
    try {
      const { data } = await api.get("/campaigns/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CAMPAIGNS", payload: data.records });
      setHasMore(data.hasMore);
      setLoading(false);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenCampaignModal = () => {
    setSelectedCampaign(null);
    setCampaignModalOpen(true);
  };

  const handleCloseCampaignModal = () => {
    setSelectedCampaign(null);
    setCampaignModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setCampaignModalOpen(true);
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      await api.delete(`/campaigns/${campaignId}`);
      toast.success(i18n.t("campaigns.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingCampaign(null);
    setSearchParam("");
    setPageNumber(1);
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const formatStatus = (val) => {
    switch (val) {
      case "INATIVA":
        return "Inativa";
      case "PROGRAMADA":
        return "Programada";
      case "EM_ANDAMENTO":
        return "Em Andamento";
      case "CANCELADA":
        return "Cancelada";
      case "FINALIZADA":
        return "Finalizada";
      default:
        return val;
    }
  };

  const cancelCampaign = async (campaign) => {
    try {
      await api.post(`/campaigns/${campaign.id}/cancel`);
      toast.success(i18n.t("campaigns.toasts.cancel"));
      setPageNumber(1);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const restartCampaign = async (campaign) => {
    try {
      await api.post(`/campaigns/${campaign.id}/restart`);
      toast.success(i18n.t("campaigns.toasts.restart"));
      setPageNumber(1);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <MainContainer>
      <ConfirmationModal
        title={
          deletingCampaign &&
          `${i18n.t("campaigns.confirmationModal.deleteTitle")} ${deletingCampaign.name}?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteCampaign(deletingCampaign.id)}
      >
        {i18n.t("campaigns.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      {campaignModalOpen && (
        <CampaignModal
          resetPagination={() => {
            setPageNumber(1);
            fetchCampaigns();
          }}
          open={campaignModalOpen}
          onClose={handleCloseCampaignModal}
          aria-labelledby="form-dialog-title"
          campaignId={selectedCampaign && selectedCampaign.id}
        />
      )}

      {user.profile === "user" ? (
        <ForbiddenPage />
      ) : (
        <>
          <div className={classes.searchContainer}>
            <div style={{
              display: "flex",
              gap: "16px",
              alignItems: "center"
            }}>
              <Typography variant="h6" style={{ color: '#333' }}>
                {i18n.t("campaigns.title")}
              </Typography>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <TextField
                className={classes.searchInput}
                placeholder={i18n.t("campaigns.searchPlaceholder")}
                type="search"
                value={searchParam}
                onChange={handleSearch}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon style={{ color: "#00C307" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                className={classes.actionButtons}
                startIcon={<AddCircleOutline />}
                onClick={handleOpenCampaignModal}
              >
                {i18n.t("Nova campanha")}
              </Button>
            </div>
          </div>

          <Paper className={classes.mainPaper} onScroll={handleScroll}>
            <div className={classes.tableContainer}>
              <Table size="small" className={classes.customTable}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">{i18n.t("campaigns.table.name")}</TableCell>
                    <TableCell align="center">{i18n.t("campaigns.table.status")}</TableCell>
                    <TableCell align="center">{i18n.t("campaigns.table.contactList")}</TableCell>
                    <TableCell align="center">{i18n.t("campaigns.table.whatsapp")}</TableCell>
                    <TableCell align="center">{i18n.t("campaigns.table.scheduledAt")}</TableCell>
                    <TableCell align="center">{i18n.t("campaigns.table.completedAt")}</TableCell>
                    <TableCell align="center">{i18n.t("campaigns.table.confirmation")}</TableCell>
                    <TableCell align="center">{i18n.t("campaigns.table.actions")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell align="center">{campaign.name}</TableCell>
                      <TableCell align="center">{formatStatus(campaign.status)}</TableCell>
                      <TableCell align="center">
                        {campaign.contactListId ? campaign.contactList.name : "Não definida"}
                      </TableCell>
                      <TableCell align="center">
                        {campaign.whatsappId ? campaign.whatsapp.name : "Não definido"}
                      </TableCell>
                      <TableCell align="center">
                        {campaign.scheduledAt ? datetimeToClient(campaign.scheduledAt) : "Sem agendamento"}
                      </TableCell>
                      <TableCell align="center">
                        {campaign.completedAt ? datetimeToClient(campaign.completedAt) : "Não concluída"}
                      </TableCell>
                      <TableCell align="center">
                        {campaign.confirmation ? "Habilitada" : "Desabilitada"}
                      </TableCell>
                      <TableCell align="center">
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          {campaign.status === "EM_ANDAMENTO" && (
                            <IconButton
                              size="small"
                              onClick={() => cancelCampaign(campaign)}
                              title="Parar Campanha"
                              className={`${classes.iconButton} pause`}
                            >
                              <PauseCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          )}
                          {campaign.status === "CANCELADA" && (
                            <IconButton
                              size="small"
                              onClick={() => restartCampaign(campaign)}
                              title="Reiniciar Campanha"
                              className={`${classes.iconButton} play`}
                            >
                              <PlayCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => history.push(`/campaign/${campaign.id}/report`)}
                            title="Ver Relatório"
                            className={`${classes.iconButton} report`}
                          >
                            <DescriptionIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEditCampaign(campaign)}
                            title="Editar"
                            className={`${classes.iconButton} edit`}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setConfirmModalOpen(true);
                              setDeletingCampaign(campaign);
                            }}
                            title="Excluir"
                            className={`${classes.iconButton} delete`}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && <TableRowSkeleton columns={8} />}
                </TableBody>
              </Table>
            </div>
          </Paper>
        </>
      )}
    </MainContainer>
  );
};

export default Campaigns;