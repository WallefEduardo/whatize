import React, { useState, useContext, useEffect, useMemo } from "react";
import clsx from "clsx";
// import moment from "moment";
import { useLocation } from "react-router-dom";

// import { isNill } from "lodash";
// import SoftPhone from "react-softphone";
// import { WebSocketInterface } from "jssip";

import {
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery,
  Avatar,
  Badge,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import CachedIcon from "@mui/icons-material/Cached";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import NotificationsVolume from "../components/NotificationsVolume";
import UserModal from "../components/UserModal";
import ErrorBoundary from "../components/ErrorBoundary";
import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import { i18n } from "../translate/i18n";
import toastError from "../errors/toastError";
import AnnouncementsPopover from "../components/AnnouncementsPopover";

import logo from "../assets/logo.png";
import logoDark from "../assets/logo-black.png";
import ChatPopover from "../pages/Chat/ChatPopover";

import { useDate } from "../hooks/useDate";
import ColorModeContext from "./themeContext";
import BusinessIcon from '@mui/icons-material/Business';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import { getBackendUrl } from "../config";
// import useSettings from "../hooks/useSettings"; // Hook removido durante migração
// import VersionControl from "../components/VersionControl"; // Componente removido durante migração
// import { Refresh } from "iconsax-react"; // Biblioteca removida durante migração
import { Link as RouterLink } from "react-router-dom";
import api from "../services/api";

// import { SocketContext } from "../context/Socket/SocketContext";

const backendUrl = getBackendUrl();

const drawerWidth = 280;

// Styled Components
const RootContainer = styled('div')(() => ({
  display: "flex",
  height: "100vh",
  maxHeight: "100% !important",
  backgroundColor: "#f5f5f5",
  "& .MuiButton-outlinedPrimary": {
    color: "#1976d2",
    border: "1px solid rgba(0, 124, 102)",
    borderRadius: "50px",
  },
  "& .MuiTab-textColorPrimary.Mui-selected": {
    color: `#111416`,
  },
  "& .MuiButton-root": {
    borderRadius: "50px",
  },
}));

const StyledChip = styled(Chip)(() => ({
  background: "red",
  color: "white",
}));

const StyledToolbar = styled(Toolbar)(() => ({
  paddingRight: 52,
  color: "#1976d2",
  background: "#1976d2",
  minHeight: `76px`
}));

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'drawerOpen',
})(({ drawerOpen }) => ({
  zIndex: 9999,
  transition: "width 0.3s ease, margin 0.3s ease",
  ...(drawerOpen && {
    marginLeft: drawerWidth,
    width: `calc(100% - 275px)`,
    transition: "width 0.3s ease, margin 0.3s ease",
    "@media (max-width:600px)": {
      display: "none",
    },
  }),
}));

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'drawerOpen',
})(({ drawerOpen }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    overflowX: "hidden",
    padding: "0 !important",
    width: drawerWidth,
    transition: "width 0.3s ease",
    overflowY: "hidden",
    ...(!drawerOpen && {
      overflowX: "hidden",
      overflowY: "hidden",
      transition: "width 0.3s ease",
      width: 8,
      "@media (max-width:600px)": {
        width: 8,
      },
    }),
  },
}));

const MenuButtonHidden = styled(IconButton)(() => ({
  display: "none",
}));

const StyledTitle = styled(Typography)(() => ({
  flexGrow: 1,
  fontSize: 14,
  color: "white",
}));

const AppBarSpacer = styled('div')(() => ({
  minHeight: "78px",
}));

const ContentMain = styled('main')(() => ({
  flex: 1,
  overflow: "hidden auto", // Mudança para evitar flash de scrollbars
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    }
  },
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(0, 0, 0, 0.1) transparent',
}));

const ContainerWithScroll = styled(List)(() => ({
  flex: 1,
  overflowY: "auto", // Mudança de "scroll" para "auto" para evitar scrollbar sempre visível
  overflowX: "hidden",
  paddingTop: "28px !important",
  border: "2px solid transparent",
  backgroundColor: "#111416",
  // Scrollbar suave e consistente
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: "3px",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.3)",
    }
  },
  // Firefox
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(255, 255, 255, 0.2) transparent",
}));

const LogoImage = styled('img', {
  shouldForwardProp: (prop) => prop !== 'drawerOpen',
})(({ drawerOpen }) => ({
  width: "100%",
  height: "45px",
  maxWidth: 180,
  "@media (max-width:600px)": {
    width: "auto",
    height: "100%",
    maxWidth: 180,
  },
  content: "url(" + logoDark + ")",
  ...((!drawerOpen) && {
    display: "none",
  }),
}));

const StyledAvatar = styled(Avatar)(() => ({
  width: 8,
  height: 8,
  cursor: "pointer",
  borderRadius: "50%",
  border: "1px solid #ccc",
}));

const UpdateDiv = styled('div')(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledBadge = styled(Badge)(() => ({
  "& .MuiBadge-badge": {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${"#1976d2"}`,
    "&::after": {
      position: "absolute",
      top: -10,
      left: -10,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "14px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

const SmallAvatar = styled(Avatar)(() => ({
  width: 22,
  height: 22,
  border: `2px solid ${"#1976d2"}`,
}));

const LoggedInLayout = ({ children, themeToggle }) => {
  // Styled components used instead of makeStyles
  const [userToken, setUserToken] = useState("disabled");
  const [loadingUserToken, setLoadingUserToken] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { handleLogout, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  // const [dueDate, setDueDate] = useState("");
  //   const socketManager = useContext(SocketContext);
  const { user, socket } = useContext(AuthContext);
  const [currentUser, setCurrentUser] = useState(user);
  const location = useLocation();
  const isFinanceiroAberto = location.pathname === "/financeiro-aberto" || 
                            localStorage.getItem("assinaturaVencida") === "true";

  const theme = useTheme();
  const { colorMode } = useContext(ColorModeContext);
  const greaterThenSm = useMediaQuery("(max-width:600px)");

  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);

  const { dateToClient } = useDate();
  const [profileUrl, setProfileUrl] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mainListItems = useMemo(
    () => <MainListItems drawerOpen={drawerOpen} collapsed={!drawerOpen} />,
    [user, drawerOpen]
  );

  // const settings = useSettings(); // Hook removido durante migração

  useEffect(() => {
    // Configuração temporária durante migração
    setUserToken("disabled");
  }, []);

  // Atualiza o usuário sempre que user mudar
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Função para atualizar os dados do usuário
  const refreshUserData = async () => {
    try {
      const { data } = await api.get('/users/me');
      setCurrentUser(data);
    } catch (err) {
      console.error('Erro ao atualizar dados do usuário:', err);
    }
  };

  useEffect(() => {
    // if (localStorage.getItem("public-token") === null) {
    //   handleLogout()
    // }

    if (document.body.offsetWidth > 600) {
      if (user.defaultMenu === "closed") {
        setDrawerOpen(false);
      } else {
        setDrawerOpen(true);
      }
    }
    if (user.defaultTheme === "dark" && "light" === "light") {
      colorMode.toggleColorMode();
    }
  }, [user.defaultMenu, document.body.offsetWidth]);

  useEffect(() => {
    if (document.body.offsetWidth < 600) {
      setDrawerVariant("temporary");
    } else {
      setDrawerVariant("permanent");
    }
  }, [drawerOpen]);

  useEffect(() => {

    const companyId = user.companyId;
    const userId = user.id;
    if (companyId) {
      //    const socket = socketManager.GetSocket();

      const ImageUrl = user.profileImage;
      if (ImageUrl !== undefined && ImageUrl !== null)
        setProfileUrl(
          `${backendUrl}/public/company${companyId}/user/${ImageUrl}`
        );
      else setProfileUrl(`/nopicture.png`);

      const onCompanyAuthLayout = (data) => {
        if (data.user.id === +userId) {
          toastError("Sua conta foi acessada em outro computador.");
          setTimeout(() => {
            localStorage.clear();
            window.location.reload();
          }, 1000);
        }
      }

      // Escuta eventos de pagamento para atualizar os dados do usuário
      const onCompanyPayment = (data) => {
        if (data.action === "CONCLUIDA") {
          console.log("Pagamento concluído. Atualizando dados do usuário.");
          refreshUserData();
        }
      };

      // Escuta eventos de fatura para atualizar os dados do usuário
      const onCompanyInvoices = (data) => {
        if (data.action === 'update') {
          console.log("Fatura atualizada. Atualizando dados do usuário.");
          refreshUserData();
        }
      };

      if (socket && socket.on && typeof socket.on === 'function') {
        socket.on(`company-${companyId}-auth`, onCompanyAuthLayout);
        socket.on(`company-${companyId}-payment`, onCompanyPayment);
        socket.on(`company-${companyId}-invoices`, onCompanyInvoices);

        if (socket.emit && typeof socket.emit === 'function') {
          socket.emit("userStatus");
          // Reduzir frequência de 5min para 10min para evitar re-renders desnecessários
          const interval = setInterval(() => {
            socket.emit("userStatus");
          }, 1000 * 60 * 10);

          return () => {
            if (socket.off && typeof socket.off === 'function') {
              socket.off(`company-${companyId}-auth`, onCompanyAuthLayout);
              socket.off(`company-${companyId}-payment`, onCompanyPayment);
              socket.off(`company-${companyId}-invoices`, onCompanyInvoices);
            }
            clearInterval(interval);
          };
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseMenu();
  };

  const handleClickLogout = () => {
    handleCloseMenu();
    handleLogout();
  };

  const drawerClose = () => {
    if (document.body.offsetWidth < 600 || user.defaultMenu === "closed") {
      setDrawerOpen(false);
    }
  };

  const handleRefreshPage = () => {
    window.location.reload(false);
  };

  const handleMenuItemClick = () => {
    const { innerWidth: width } = window;
    if (width <= 600) {
      setDrawerOpen(false);
    }
  };

  if (loading) {
    return <BackdropLoading />;
  }

  return (
    <RootContainer>
      <StyledDrawer
        variant={drawerVariant}
        drawerOpen={drawerOpen}
        open={drawerOpen}
      >
        {/* <div className={classes.toolbarIcon}>
          <img className={drawerOpen ? classes.logo : classes.hideLogo}
            style={{
              display: "block",
              margin: "0 auto",
              height: "50px",
              width: "100%",
            }}
            alt="logo" />
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
            <ChevronLeftIcon style={{ color: "#25b6e8" }} />
          </IconButton>
        </div> */}
        <ContainerWithScroll>
        {!isFinanceiroAberto ? (
          <>
            <LogoImage drawerOpen={drawerOpen}
                style={{
                  display: "block",
                  margin: "0 auto",
                  height: "50px",
                  width: "100%",
                }}
                alt="logo" />
            <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
                <ChevronLeftIcon style={{ color: "#00c307" }} />
            </IconButton>
          </>
        ) : (
          <>
            <LogoImage drawerOpen={drawerOpen}
                style={{
                  display: "block",
                  margin: "0 auto",
                  height: "50px",
                  width: "100%",
                }}
                alt="logo" />
          </>
        )}
          {/* {mainListItems} */}
          <MainListItems collapsed={!drawerOpen} />
        </ContainerWithScroll>
        {/* <Divider /> */}
      </StyledDrawer>

      <StyledAppBar
        position="absolute"
        drawerOpen={drawerOpen}
        color="primary"
      >
        <StyledToolbar variant="dense">
          <IconButton
            edge="start"
            variant="contained"
            aria-label="open drawer"
            style={{ color: "white" }}
            onClick={() => setDrawerOpen(!drawerOpen)}
            {...(drawerOpen && { component: MenuButtonHidden })}
          >
            <MenuIcon />
          </IconButton>

          <StyledTitle
            component="h2"
            variant="h6"
            color="inherit"
            noWrap
          >
            {/* {greaterThenSm && user?.profile === "admin" && getDateAndDifDays(user?.company?.dueDate).difData < 7 ? ( */}
            {greaterThenSm &&
              currentUser?.profile === "admin" &&
              currentUser?.company?.dueDate ? (
              <>
                {i18n.t("mainDrawer.appBar.user.message")} <b>{currentUser.name}</b>{" | "}
                <b>{currentUser?.company?.name}</b> (
                {i18n.t("mainDrawer.appBar.user.active")} {dateToClient(currentUser?.company?.dueDate)}){" - "}
                <RouterLink to="/financeiro" style={{ textDecoration: 'none', color: 'inherit' }}><b>Ver faturas</b></RouterLink>
              </>
            ) : (
              <>
                {i18n.t("mainDrawer.appBar.user.message")} <b>{currentUser.name}</b>{" | "}
                {currentUser?.company?.name}
              </>
            )}
          </StyledTitle>

          {userToken === "enabled" && currentUser?.companyId === 1 && (
            <Chip
              component={StyledChip}
              label={i18n.t("mainDrawer.appBar.user.token")}
            />
          )}
          {/* <VersionControl /> Componente removido durante migração */}

          {/* DESABILITADO POIS TEM BUGS */}
          {/* <UserLanguageSelector /> */}
          {/* <SoftPhone
            callVolume={33} //Set Default callVolume
            ringVolume={44} //Set Default ringVolume
            connectOnStart={false} //Auto connect to sip
            notifications={false} //Show Browser Notification of an incoming call
            config={config} //Voip config
            setConnectOnStartToLocalStorage={setConnectOnStartToLocalStorage} // Callback function
            setNotifications={setNotifications} // Callback function
            setCallVolume={setCallVolume} // Callback function
            setRingVolume={setRingVolume} // Callback function
            timelocale={'UTC-3'} //Set time local for call history
          /> */}
          {/* <IconButton edge="start" onClick={colorMode.toggleColorMode}>
            {"light" === "dark" ? (
              <Brightness7Icon style={{ color: "white" }} />
            ) : (
              <Brightness4Icon style={{ color: "white" }} />
            )}
          </IconButton> */}

          <NotificationsVolume setVolume={setVolume} volume={volume} />

          <IconButton
            onClick={handleRefreshPage}
            aria-label={i18n.t("mainDrawer.appBar.refresh")}
            color="inherit"
          >
            <CachedIcon style={{ color: "white" }} />
          </IconButton>

          {/* <DarkMode themeToggle={themeToggle} /> */}

          {currentUser.id && <NotificationsPopOver volume={volume} />}

          <AnnouncementsPopover />

          <ChatPopover />

          <div>
            <StyledBadge
              overlap="circular"
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              variant="dot"
              onClick={handleMenu}
            >
              <Avatar
                //alt="Multi100"
                //alt=<ChevronLeftIcon/>
                component={StyledAvatar}
                src={profileUrl}
              />
            </StyledBadge>

            <ErrorBoundary fallbackMessage="Erro no perfil do usuário. Tente recarregar a página.">
              <UserModal
                open={userModalOpen}
                onClose={() => setUserModalOpen(false)}
                onImageUpdate={(newProfileUrl) => setProfileUrl(newProfileUrl)}
                userId={currentUser?.id}
              />
            </ErrorBoundary>

            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={menuOpen}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleOpenUserModal}>
                {i18n.t("mainDrawer.appBar.user.profile")}
              </MenuItem>
              <MenuItem onClick={handleClickLogout}>
                {i18n.t("mainDrawer.appBar.user.logout")}
              </MenuItem>
            </Menu>
          </div>
        </StyledToolbar>
      </StyledAppBar>

      <ContentMain>
        <AppBarSpacer />

        {children ? children : null}
      </ContentMain>
    </RootContainer>
  );
};

export default LoggedInLayout;
