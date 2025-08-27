import React, { useState, useCallback, useContext, useEffect } from "react";
import { toast } from "../../components/ui/ToastProvider";
import { add, format, parseISO } from "date-fns";

import { styled } from "@mui/material/styles";
import { green } from "@mui/material/colors";
import {
  Button,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Table,
  TableHead,
  Paper,
  Tooltip,
  Typography,
  CircularProgress,
  Box,
  Card,
  CardContent,
} from "@mui/material";
import {
  Edit,
  CheckCircle,
  SignalCellularConnectedNoInternet2Bar,
  SignalCellularConnectedNoInternet0Bar,
  SignalCellular4Bar,
  CropFree,
  DeleteOutline,
  Facebook,
  Instagram,
  WhatsApp,
  AddCircleOutline
} from "@mui/icons-material";

import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";

import PageLayout from "../../components/PageLayout";
import { Network, RefreshCw, Phone, Plus, LayoutDashboard, Wifi, BarChart3 } from "lucide-react";
import BaseTable, { ActionButton, ActionGroup } from "../../components/BaseTable";
import GradientButton from "../../components/GradientButton";
import SearchInput from "../../components/SearchInput";
import ConnectionTypeModal from "../../components/ConnectionTypeModal";
import api from "../../services/api";
import WhatsAppForm from "../WhatsAppForm";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import formatSerializedId from '../../utils/formatSerializedId';
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import ForbiddenPage from "../../components/ForbiddenPage";
import { Can } from "../../components/Can";

const useStyles = () => ({
  searchContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    display: "flex !important",
    alignItems: "center !important",
    justifyContent: "space-between !important",
    gap: "16px !important",
    marginBottom: 16,
    flexWrap: "nowrap !important",
    width: "100%",
    flexDirection: "row !important",
    // Responsividade específica
    "@media (max-width: 1600px)": {
      padding: 12,
      gap: "12px !important",
    },
    "@media (max-width: 1440px)": {
      padding: 10,
      gap: "10px !important",
    },
    "@media (max-width: 1366px)": {
      padding: 8,
      gap: "8px !important",
    },
    "@media (max-width: 1280px)": {
      padding: 8,
      gap: "6px !important",
    },
  },
  actionButtons: {
    backgroundColor: "#00C307",
    color: "white",
    "&:hover": {
      backgroundColor: "#029907",
    },
  },
  customTableCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tooltip: {
    backgroundColor: "#f5f5f9",
    color: "rgba(0, 0, 0, 0.87)",
    fontSize: "14px",
    border: "1px solid #dadde9",
    maxWidth: 450,
  },
  tooltipPopper: {
    textAlign: "center",
  },
  buttonProgress: {
    color: green[500],
  },
  statusCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  },
});

function CircularProgressWithLabel(props) {
  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress variant="determinate" {...props} />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography
          variant="caption"
          component="div"
          color="textSecondary"
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

const CustomToolTip = ({ title, content, children }) => {
  const classes = useStyles();

  return (
    <Tooltip
      arrow
      classes={{
        tooltip: classes.tooltip,
        popper: classes.tooltipPopper,
      }}
      title={
        <React.Fragment>
          <Typography gutterBottom color="inherit">
            {title}
          </Typography>
          {content && <Typography>{content}</Typography>}
        </React.Fragment>
      }
    >
      {children}
    </Tooltip>
  );
};

const IconChannel = (channel) => {
  switch (channel) {
    case "facebook":
      return <Facebook style={{ color: "#3b5998" }} />;
    case "instagram":
      return <Instagram style={{ color: "#e1306c" }} />;
    case "whatsapp":
      return <WhatsApp style={{ color: "#25d366" }} />;
    default:
      return "error";
  }
};
const Connections = () => {
  const classes = useStyles();
  const [hasMore, setHasMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const { whatsApps, loading } = useContext(WhatsAppsContext);
  const [statusImport, setStatusImport] = useState([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const history = useHistory();
  const confirmationModalInitialState = {
    action: "",
    title: "",
    message: "",
    whatsAppId: "",
    open: false,
  };
  const [confirmModalInfo, setConfirmModalInfo] = useState(confirmationModalInitialState);
  const [planConfig, setPlanConfig] = useState({
    plan: {
      useWhatsapp: true,
      useFacebook: true,
      useInstagram: true
    }
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [connectionTypeModalOpen, setConnectionTypeModalOpen] = useState(false);
  const [whatsappFormOpen, setWhatsappFormOpen] = useState(false);
  const { user, socket } = useContext(AuthContext);
  const companyId = user.companyId;
  const { getPlanCompany } = usePlans();

  useEffect(() => {
    async function fetchData() {
      if (companyId) {
        try {
          const planConfigs = await getPlanCompany(undefined, companyId);
          setPlanConfig(planConfigs);
        } catch (error) {
          console.error('Erro ao carregar plano da empresa:', error);
          // Se der erro, vamos liberar como se fosse plano completo para não bloquear
          setPlanConfig({
            plan: {
              useWhatsapp: true,
              useFacebook: true,
              useInstagram: true
            }
          });
        }
      }
    }
    fetchData();
  }, [companyId]);

  useEffect(() => {
    if (socket && socket.on && typeof socket.on === 'function') {
      socket.on(`importMessages-${user.companyId}`, (data) => {
        if (data.action === "refresh") {
          setStatusImport([]);
          history.go(0);
        }
        if (data.action === "update") {
          setStatusImport(data.status);
        }
      });
    }
  }, [whatsApps, user.companyId, socket, history]);

  const handleStartWhatsAppSession = async (whatsAppId) => {
    try {
      await api.post(`/whatsappsession/${whatsAppId}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleRequestNewQrCode = async (whatsAppId) => {
    try {
      await api.put(`/whatsappsession/${whatsAppId}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenWhatsAppModal = () => {
    setSelectedWhatsApp(null);
    setWhatsappFormOpen(true);
    setConnectionTypeModalOpen(false);
  };


  const handleCloseWhatsAppForm = () => {
    setWhatsappFormOpen(false);
    // Refresh the connections list after form submission
    loadWhatsApps();
  };

  const handleOpenConnectionTypeModal = () => {
    setConnectionTypeModalOpen(true);
  };

  const handleCloseConnectionTypeModal = () => {
    setConnectionTypeModalOpen(false);
  };

  const handleSelectFacebook = (response) => {
    responseFacebook(response);
    setConnectionTypeModalOpen(false);
  };

  const handleSelectInstagram = (response) => {
    responseInstagram(response);
    setConnectionTypeModalOpen(false);
  };

  const handleOpenQrModal = (whatsApp) => {
    setSelectedWhatsApp(whatsApp);
    setQrModalOpen(true);
  };

  const handleCloseQrModal = useCallback(() => {
    setSelectedWhatsApp(null);
    setQrModalOpen(false);
  }, [setQrModalOpen, setSelectedWhatsApp]);

  const handleEditWhatsApp = (whatsApp) => {
    setSelectedWhatsApp(whatsApp);
    setWhatsAppModalOpen(true);
  };

  const openInNewTab = url => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };


  const handleOpenConfirmationModal = (action, whatsAppId) => {
    if (action === "disconnect") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.disconnectTitle"),
        message: i18n.t("connections.confirmationModal.disconnectMessage"),
        whatsAppId: whatsAppId,
      });
    }

    if (action === "delete") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.deleteTitle"),
        message: i18n.t("connections.confirmationModal.deleteMessage"),
        whatsAppId: whatsAppId,
      });
    }
    if (action === "closedImported") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.closedImportedTitle"),
        message: i18n.t("connections.confirmationModal.closedImportedMessage"),
        whatsAppId: whatsAppId,
      });
    }
    setConfirmModalOpen(true);
  };

  const handleSubmitConfirmationModal = async () => {
    if (confirmModalInfo.action === "disconnect") {
      try {
        await api.delete(`/whatsappsession/${confirmModalInfo.whatsAppId}`);
      } catch (err) {
        toastError(err);
      }
    }

    if (confirmModalInfo.action === "delete") {
      try {
        await api.delete(`/whatsapp/${confirmModalInfo.whatsAppId}`);
        toast.success(i18n.t("connections.toasts.deleted"));
      } catch (err) {
        toastError(err);
      }
    }
    if (confirmModalInfo.action === "closedImported") {
      try {
        await api.post(`/closedimported/${confirmModalInfo.whatsAppId}`);
        toast.success(i18n.t("connections.toasts.closedimported"));
      } catch (err) {
        toastError(err);
      }
    }

    setConfirmModalInfo(confirmationModalInitialState);
  };

  const renderImportButton = (whatsApp) => {
    if (whatsApp?.statusImportMessages === "renderButtonCloseTickets") {
      return (
        <Button
          style={{ marginLeft: 12 }}
          size="small"
          variant="outlined"
          color="primary"
          onClick={() => {
            handleOpenConfirmationModal("closedImported", whatsApp.id);
          }}
        >
          {i18n.t("connections.buttons.closedImported")}
        </Button>
      );
    }

    if (whatsApp?.importOldMessages) {
      let isTimeStamp = !isNaN(
        new Date(Math.floor(whatsApp?.statusImportMessages)).getTime()
      );

      if (isTimeStamp) {
        const ultimoStatus = new Date(
          Math.floor(whatsApp?.statusImportMessages)
        ).getTime();
        const dataLimite = +add(ultimoStatus, { seconds: +35 }).getTime();
        if (dataLimite > new Date().getTime()) {
          return (
            <>
              <Button
                disabled
                style={{ marginLeft: 12 }}
                size="small"
                endIcon={
                  <CircularProgress
                    size={12}
                    className={classes.buttonProgress}
                  />
                }
                variant="outlined"
                color="primary"
              >
                {i18n.t("connections.buttons.preparing")}
              </Button>
            </>
          );
        }
      }
    }
  };

  const renderActionButtons = (whatsApp) => {
    return (
      <>
        {whatsApp.status === "qrcode" && (
          <Can
            role={user.profile === "user" && user.allowConnections === "enabled" ? "admin" : user.profile}
            perform="connections-page:addConnection"
            yes={() => (
              <Button
                size="small"
                variant="contained"
                className={classes.actionButtons}
                onClick={() => handleOpenQrModal(whatsApp)}
              >
                {i18n.t("connections.buttons.qrcode")}
              </Button>
            )}
          />
        )}
        {whatsApp.status === "DISCONNECTED" && (
          <Can
            role={user.profile === "user" && user.allowConnections === "enabled" ? "admin" : user.profile}
            perform="connections-page:addConnection"
            yes={() => (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  className={classes.actionButtons}
                  style={{ marginRight: 8 }}
                  onClick={() => handleStartWhatsAppSession(whatsApp.id)}
                >
                  {i18n.t("connections.buttons.tryAgain")}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  className={classes.actionButtons}
                  onClick={() => handleRequestNewQrCode(whatsApp.id)}
                >
                  {i18n.t("connections.buttons.newQr")}
                </Button>
              </>
            )}
          />
        )}
        {(whatsApp.status === "CONNECTED" ||
          whatsApp.status === "PAIRING" ||
          whatsApp.status === "TIMEOUT") && (
            <Can
              role={user.profile}
              perform="connections-page:addConnection"
              yes={() => (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    className={classes.actionButtons}
                    onClick={() => {
                      handleOpenConfirmationModal("disconnect", whatsApp.id);
                    }}
                  >
                    {i18n.t("connections.buttons.disconnect")}
                  </Button>
                  {renderImportButton(whatsApp)}
                </>
              )}
            />
          )}
        {whatsApp.status === "OPENING" && (
          <Button
            size="small"
            variant="outlined"
            disabled
            className={classes.actionButtons}
          >
            {i18n.t("connections.buttons.connecting")}
          </Button>
        )}
      </>
    );
  };

  const renderStatusToolTips = (whatsApp) => {
    return (
      <div className={classes.customTableCell}>
        {whatsApp.status === "DISCONNECTED" && (
          <CustomToolTip
            title={i18n.t("connections.toolTips.disconnected.title")}
            content={i18n.t("connections.toolTips.disconnected.content")}
          >
            <SignalCellularConnectedNoInternet0Bar style={{ color: "#E57373" }} />
          </CustomToolTip>
        )}
        {whatsApp.status === "OPENING" && (
          <CircularProgress size={24} className={classes.buttonProgress} />
        )}
        {whatsApp.status === "qrcode" && (
          <CustomToolTip
            title={i18n.t("connections.toolTips.qrcode.title")}
            content={i18n.t("connections.toolTips.qrcode.content")}
          >
            <CropFree />
          </CustomToolTip>
        )}
        {whatsApp.status === "CONNECTED" && (
          <CustomToolTip title={i18n.t("connections.toolTips.connected.title")}>
            <SignalCellular4Bar style={{ color: green[500] }} />
          </CustomToolTip>
        )}
        {(whatsApp.status === "TIMEOUT" || whatsApp.status === "PAIRING") && (
          <CustomToolTip
            title={i18n.t("connections.toolTips.timeout.title")}
            content={i18n.t("connections.toolTips.timeout.content")}
          >
            <SignalCellularConnectedNoInternet2Bar style={{ color: "#E57373" }} />
          </CustomToolTip>
        )}
      </div>
    );
  };

  const responseFacebook = (response) => {
    if (response.status !== "unknown") {
      const { accessToken, id } = response;
      api.post("/facebook", {
        facebookUserId: id,
        facebookUserToken: accessToken,
      })
        .then(() => {
          toast.success(i18n.t("connections.facebook.success"));
        })
        .catch((error) => {
          toastError(error);
        });
    }
  };

  const responseInstagram = (response) => {
    if (response.status !== "unknown") {
      const { accessToken, id } = response;
      api.post("/facebook", {
        addInstagram: true,
        facebookUserId: id,
        facebookUserToken: accessToken,
      })
        .then(() => {
          toast.success(i18n.t("connections.facebook.success"));
        })
        .catch((error) => {
          toastError(error);
        });
    }
  };

  const restartWhatsapps = async () => {
    try {
      await api.post(`/whatsapp-restart/`);
      toast.success(i18n.t("connections.waitConnection"));
    } catch (err) {
      toastError(err);
    }
  }

  const loadMore = () => {
    setPageNumber((prevPageNumber) => prevPageNumber + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  // Filtrar conexões baseado no termo de busca
  const filteredWhatsApps = whatsApps.filter(whatsApp => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      whatsApp.name?.toLowerCase().includes(searchLower) ||
      whatsApp.number?.toLowerCase().includes(searchLower) ||
      whatsApp.channel?.toLowerCase().includes(searchLower)
    );
  });

  // Definição das colunas para BaseTable
  const columns = [
    {
      accessor: 'channel',
      title: 'Channel',
      textAlignment: 'center',
      width: '80px',
      render: (whatsApp) => IconChannel(whatsApp.channel)
    },
    {
      accessor: 'name',
      title: i18n.t("connections.table.name"),
      textAlignment: 'center',
      sortable: true
    },
    {
      accessor: 'number',
      title: i18n.t("connections.table.number"),
      textAlignment: 'center',
      render: (whatsApp) => whatsApp.number && whatsApp.channel === 'whatsapp' 
        ? formatSerializedId(whatsApp.number) 
        : whatsApp.number
    },
    {
      accessor: 'status',
      title: i18n.t("connections.table.status"),
      textAlignment: 'center',
      render: (whatsApp) => renderStatusToolTips(whatsApp)
    },
    {
      accessor: 'session',
      title: i18n.t("connections.table.session"),
      textAlignment: 'center',
      render: (whatsApp) => renderActionButtons(whatsApp)
    },
    {
      accessor: 'updatedAt',
      title: i18n.t("connections.table.lastUpdate"),
      textAlignment: 'center',
      sortable: true,
      render: (whatsApp) => format(parseISO(whatsApp.updatedAt), "dd/MM/yy HH:mm")
    },
    {
      accessor: 'isDefault',
      title: i18n.t("connections.table.default"),
      textAlignment: 'center',
      render: (whatsApp) => whatsApp.isDefault && (
        <div className={classes.customTableCell}>
          <CheckCircle style={{ color: green[500] }} />
        </div>
      )
    },
    {
      accessor: 'actions',
      title: i18n.t("connections.table.actions"),
      textAlignment: 'center',
      sortable: false,
      render: (whatsApp) => (
        <Can
          role={user.profile}
          perform="connections-page:addConnection"
          yes={() => (
            <ActionGroup>
              <ActionButton
                onClick={() => handleEditWhatsApp(whatsApp)}
                icon={Edit}
                tooltip="Editar conexão"
                color="var(--color-success)"
                hoverColor="var(--color-success)"
              />
              <ActionButton
                onClick={() => handleOpenConfirmationModal("delete", whatsApp.id)}
                icon={DeleteOutline}
                tooltip="Excluir conexão"
                color="var(--color-danger)"
                hoverColor="var(--color-danger)"
              />
            </ActionGroup>
          )}
        />
      )
    }
  ];

  // Função para renderizar cards personalizados
  const renderConnectionCard = (whatsApp) => {
    return (
      <Card sx={{ 
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 3,
        width: '100%',
        height: 280,
        minHeight: 280,
        maxHeight: 280,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: 'var(--color-accent)',
          boxShadow: `
            0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04),
            0 0 0 1px var(--color-accent-alpha, rgba(59, 130, 246, 0.1))
          `,
        }
      }}>
        <CardContent sx={{ 
          p: 3, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Header do Card */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {IconChannel(whatsApp.channel)}
              <Typography variant="h6" sx={{ 
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '1.1rem'
              }}>
                {whatsApp.name}
              </Typography>
            </Box>
            {whatsApp.isDefault && (
              <CheckCircle style={{ color: 'var(--color-success)', fontSize: 20 }} />
            )}
          </Box>

          {/* Informações principais */}
          <Box sx={{ flex: 1, mb: 2 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ 
                color: 'var(--text-secondary)',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '0.5px'
              }}>
                Número
              </Typography>
              <Typography variant="body1" sx={{ 
                color: 'var(--text-primary)',
                fontWeight: 500,
                fontSize: '0.9rem',
                mt: 0.5
              }}>
                {whatsApp.number && whatsApp.channel === 'whatsapp' 
                  ? formatSerializedId(whatsApp.number) 
                  : whatsApp.number || 'N/A'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ 
                color: 'var(--text-secondary)',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '0.5px'
              }}>
                Status
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mt: 0.5
              }}>
                {renderStatusToolTips(whatsApp)}
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ 
                color: 'var(--text-secondary)',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                letterSpacing: '0.5px'
              }}>
                Última Atualização
              </Typography>
              <Typography variant="body2" sx={{ 
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                mt: 0.5
              }}>
                {format(parseISO(whatsApp.updatedAt), "dd/MM/yy HH:mm")}
              </Typography>
            </Box>
          </Box>

          {/* Ações da sessão */}
          <Box sx={{ mb: 2 }}>
            {renderActionButtons(whatsApp)}
          </Box>

          {/* Ações do card */}
          <Can
            role={user.profile}
            perform="connections-page:addConnection"
            yes={() => (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 1.5,
                pt: 2,
                borderTop: '1px solid var(--border-primary)'
              }}>
                <ActionButton
                  onClick={() => handleEditWhatsApp(whatsApp)}
                  icon={Edit}
                  tooltip="Editar conexão"
                  color="var(--color-success)"
                  hoverColor="var(--color-success)"
                />
                <ActionButton
                  onClick={() => handleOpenConfirmationModal("delete", whatsApp.id)}
                  icon={DeleteOutline}
                  tooltip="Excluir conexão"
                  color="var(--color-danger)"
                  hoverColor="var(--color-danger)"
                />
              </Box>
            )}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <PageLayout
      title="Conexões"
      icon={<Network />}
      breadcrumbs={[
        { href: "/", icon: <BarChart3 size={16} /> },
        { label: "Conexões", icon: <Wifi size={16} /> }
      ]}
    >
      <ConfirmationModal
        title={confirmModalInfo.title}
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleSubmitConfirmationModal}
      >
        {confirmModalInfo.message}
      </ConfirmationModal>

      <ConnectionTypeModal
        open={connectionTypeModalOpen}
        onClose={handleCloseConnectionTypeModal}
        onSelectWhatsApp={handleOpenWhatsAppModal}
        onSelectFacebook={handleSelectFacebook}
        onSelectInstagram={handleSelectInstagram}
        planConfig={planConfig}
      />

      {qrModalOpen && (
        <QrcodeModal
          open={qrModalOpen}
          onClose={handleCloseQrModal}
          whatsAppId={selectedWhatsApp?.id}
        />
      )}


      {whatsappFormOpen ? (
        <WhatsAppForm
          onClose={handleCloseWhatsAppForm}
        />
      ) : user.profile === "user" && user.allowConnections === "disabled" ? (
        <ForbiddenPage />
      ) : (
        <>
          <div 
            className={classes.searchContainer}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: "row",
              flexWrap: "nowrap",
              gap: "16px"
            }}
          >
            {/* SearchInput do lado esquerdo - Responsivo */}
            <Box sx={{
              // Responsividade baseada na largura da tela
              flex: {
                xs: "0 0 280px",  // Mobile
                sm: "0 0 300px",  // Tablet
                md: "0 0 320px",  // Desktop pequeno (1280x720)
                lg: "0 0 350px",  // Desktop médio (1366x768, 1600x900) 
                xl: "0 0 400px"   // Full HD+
              },
              maxWidth: {
                xs: "280px",
                sm: "300px", 
                md: "320px",
                lg: "350px",
                xl: "400px"
              },
              minWidth: {
                xs: "250px",
                sm: "280px",
                md: "300px", 
                lg: "320px",
                xl: "350px"
              }
            }}>
              <SearchInput
                placeholder="Buscar conexões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={(value) => setSearchTerm(value)}
                size="medium"
                fullWidth={true}
              />
            </Box>

            {/* Botões do lado direito - Responsivos */}
            <Box sx={{ 
              display: "flex", 
              gap: {
                xs: "6px",   // Mobile - gap menor
                sm: "8px",   // Tablet
                md: "8px",   // Desktop pequeno (1280x720)
                lg: "10px",  // Desktop médio (1366x768, 1600x900)
                xl: "12px"   // Full HD+
              }, 
              alignItems: "center",
              flexShrink: 0,
              marginLeft: "auto"
            }}>
              {/* Botão Reiniciar Conexões - Azul outline */}
              <GradientButton
                icon={<RefreshCw size={16} />}
                onClick={restartWhatsapps}
                size="small"
                sx={{
                  background: 'transparent',
                  color: '#3B82F6',
                  border: '2px solid #3B82F6',
                  boxShadow: 'none',
                  fontSize: {
                    xs: '0.75rem',  // Mobile
                    sm: '0.8rem',   // Tablet  
                    md: '0.85rem',  // Desktop pequeno (1280x720)
                    lg: '0.9rem',   // Desktop médio (1366x768, 1600x900)
                    xl: '0.95rem'   // Full HD+
                  },
                  px: {
                    xs: 1.5,    // Mobile
                    sm: 2,      // Tablet
                    md: 2.5,    // Desktop pequeno (1280x720)
                    lg: 2.5,    // Desktop médio (1366x768, 1600x900)
                    xl: 3       // Full HD+
                  },
                  py: {
                    xs: 0.5,    // Mobile
                    sm: 0.75,   // Tablet
                    md: 0.75,   // Desktop pequeno (1280x720)
                    lg: 1,      // Desktop médio (1366x768, 1600x900)
                    xl: 1       // Full HD+
                  },
                  minWidth: {
                    xs: 'auto',  // Mobile
                    sm: '100px', // Tablet
                    md: '120px', // Desktop pequeno (1280x720)
                    lg: '130px', // Desktop médio (1366x768, 1600x900)
                    xl: '140px'  // Full HD+
                  },
                  '&:hover': {
                    background: 'rgba(59, 130, 246, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.2)'
                  }
                }}
              >
                {i18n.t("connections.restartConnections")}
              </GradientButton>

              {/* Botão Chamar Suporte - Vermelho outline */}
              <GradientButton
                icon={<Phone size={16} />}
                onClick={() => openInNewTab(`https://wa.me/5588998309323?text=Ol%C3%A1,%20poderia%20me%20ajudar%20com%20o%20Whatize?`)}
                size="small"
                sx={{
                  background: 'transparent',
                  color: '#DC2626',
                  border: '2px solid #DC2626',
                  boxShadow: 'none',
                  fontSize: {
                    xs: '0.75rem',  // Mobile
                    sm: '0.8rem',   // Tablet  
                    md: '0.85rem',  // Desktop pequeno (1280x720)
                    lg: '0.9rem',   // Desktop médio (1366x768, 1600x900)
                    xl: '0.95rem'   // Full HD+
                  },
                  px: {
                    xs: 1.5,    // Mobile
                    sm: 2,      // Tablet
                    md: 2.5,    // Desktop pequeno (1280x720)
                    lg: 2.5,    // Desktop médio (1366x768, 1600x900)
                    xl: 3       // Full HD+
                  },
                  py: {
                    xs: 0.5,    // Mobile
                    sm: 0.75,   // Tablet
                    md: 0.75,   // Desktop pequeno (1280x720)
                    lg: 1,      // Desktop médio (1366x768, 1600x900)
                    xl: 1       // Full HD+
                  },
                  minWidth: {
                    xs: 'auto',  // Mobile
                    sm: '100px', // Tablet
                    md: '120px', // Desktop pequeno (1280x720)
                    lg: '130px', // Desktop médio (1366x768, 1600x900)
                    xl: '140px'  // Full HD+
                  },
                  '&:hover': {
                    background: 'rgba(220, 38, 38, 0.1)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(220, 38, 38, 0.2)'
                  }
                }}
              >
                {i18n.t("connections.callSupport")}
              </GradientButton>

              <Can
                      role={user.profile}
                      perform="connections-page:addConnection"
                      yes={() => (
                        <>
                          <GradientButton
                            icon={<Plus size={16} />}
                            size="small"
                            variant="primary"
                            sx={{
                              fontSize: {
                                xs: '0.75rem',  // Mobile
                                sm: '0.8rem',   // Tablet  
                                md: '0.85rem',  // Desktop pequeno (1280x720)
                                lg: '0.9rem',   // Desktop médio (1366x768, 1600x900)
                                xl: '0.95rem'   // Full HD+
                              },
                              px: {
                                xs: 1.5,    // Mobile
                                sm: 2,      // Tablet
                                md: 2.5,    // Desktop pequeno (1280x720)
                                lg: 2.5,    // Desktop médio (1366x768, 1600x900)
                                xl: 3       // Full HD+
                              },
                              py: {
                                xs: 0.5,    // Mobile
                                sm: 0.75,   // Tablet
                                md: 0.75,   // Desktop pequeno (1280x720)
                                lg: 1,      // Desktop médio (1366x768, 1600x900)
                                xl: 1       // Full HD+
                              },
                              minWidth: {
                                xs: 'auto',  // Mobile
                                sm: '100px', // Tablet
                                md: '120px', // Desktop pequeno (1280x720)
                                lg: '130px', // Desktop médio (1366x768, 1600x900)
                                xl: '140px'  // Full HD+
                              }
                            }}
                            onClick={handleOpenConnectionTypeModal}
                          >
                            {i18n.t("connections.newConnection")}
                          </GradientButton>
                        </>
                      )}
              />
            </Box>
          </div>

          {statusImport?.all && (
            <Card className={classes.statusCard}>
              <CardContent>
                <Typography component="h5" variant="h5">
                  {statusImport?.this === -1 ?
                    i18n.t("connections.buttons.preparing") :
                    i18n.t("connections.buttons.importing")}
                </Typography>
                {statusImport?.this === -1 ? (
                  <Typography component="h6" variant="h6" align="center">
                    <CircularProgress size={24} />
                  </Typography>
                ) : (
                  <>
                    <Typography component="h6" variant="h6" align="center">
                      {`${i18n.t(`connections.typography.processed`)} ${statusImport?.this} ${i18n.t(`connections.typography.in`)} ${statusImport?.all}  ${i18n.t(`connections.typography.date`)}: ${statusImport?.date} `}
                    </Typography>
                    <Typography align="center">
                      <CircularProgressWithLabel
                        style={{ margin: "auto" }}
                        value={(statusImport?.this / statusImport?.all) * 100}
                      />
                    </Typography>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <BaseTable
            records={filteredWhatsApps}
            columns={columns}
            loading={loading}
            noRecordsTitle="Nenhuma conexão encontrada"
            noRecordsText="Crie uma nova conexão para começar a usar o sistema"
            noRecordsIcon={<Network size={48} />}
            enableSorting={true}
            enableViewToggle={true}
            defaultView="table"
            renderCard={renderConnectionCard}
            initialSortBy="name"
            initialSortOrder="asc"
            showPagination={false}
            minHeight={500}
          />
        </>
      )}
    </PageLayout>
  );
};

export default Connections;