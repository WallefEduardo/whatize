import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Paper,
  InputBase,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Typography,
  Grid,
  Tooltip,
  Switch,
} from "@mui/material";
import {
  Group,
  MoveToInbox as MoveToInboxIcon,
  CheckBox as CheckBoxIcon,
  MessageSharp as MessageSharpIcon,
  AccessTime as ClockIcon,
  Search as SearchIcon,
  Add as AddIcon,
  TextRotateUp,
  TextRotationDown,
  ClearAll as ClearAllIcon,
} from "@mui/icons-material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ToggleButton from "@mui/material/ToggleButton";

import { FilterAltOff, FilterAlt, PlaylistAddCheckOutlined } from "@mui/icons-material";

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsListCustom";
import TabPanel from "../TabPanel";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
import { TagsFilter } from "../TagsFilter";
import { UsersFilter } from "../UsersFilter";
import { StatusFilter } from "../StatusFilter";
import { WhatsappsFilter } from "../WhatsappsFilter";
import { Button, Snackbar } from "@mui/material";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { QueueSelectedContext } from "../../context/QueuesSelected/QueuesSelectedContext";

import api from "../../services/api";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
// import { Filter, FilterSearch, SearchNormal1 } from "iconsax-react"; // Biblioteca removida durante migração

const useStyles = {
  ticketsWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },

  tabsHeader: {
    minWidth: "auto",
    width: "auto",
    borderRadius:50,
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 4,
    marginRight: 4,
    // backgroundColor: "#eee",
    // backgroundColor: "var(--color-primary)",
  },

  settingsIcon: {
    alignSelf: "center",
    marginLeft: "auto",
    padding: 8,
  },

  tab: {
    minWidth: "auto",
    width: "auto",
    padding: 8,
    borderRadius: 8,
    transition: "0.3s",
    borderColor: "#aaa",
    borderWidth: "1px",
    borderStyle: "solid",
    marginRight: 4,
    marginLeft: 4,

    "@media (max-width:600px)": {
      fontSize: "0.8rem",
      padding: 8,
      marginRight: 8,
      marginLeft: 8,
    },

    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.1)",
    },

    // "&$selected": {
    //   color: "#FFF",
    //   backgroundColor: "var(--color-primary)",
    // },
  },

  tabPanelItem: {
    minWidth: "33%",
    fontSize: 11,
    marginLeft: 0,
  },

  tabIndicator: {
    height: 6,
    bottom: 0,
    borderRadius: "0 0 8px 8px",
    backgroundColor: "var(--color-primary)",
  },
  tabsBadge: {
    top: "105%",
    right: "55%",
    transform: "translate(45%, 0)",
    whiteSpace: "nowrap",
    borderRadius: "12px",
    padding: "0 8px",
    backgroundColor: "var(--color-primary)",
    color: "#FFF",
  },
  ticketOptionsBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    // background: "#fafafa",
    background: "var(--color-primary)",
    borderRadius: 8,
    borderColor: "#aaa",
    borderWidth: "1px",
    borderStyle: "solid",
    marginTop: 8,
    marginBottom: 16,
    marginLeft: 8,
    marginRight: 8,
    padding: 4,
  },

  serachInputWrapper: {
    flex: 1,
    // background: "#fff",
    height: 40,
    minHeight: 40,
    maxHeight: 40,
    background: "var(--color-primary)",
    display: "flex",
    alignItems: "center",
    borderRadius: 40,
    padding: 8,
    borderColor: "#aaa",
    borderWidth: "1px",
    borderStyle: "solid",
    marginTop: 16,
    marginBottom: 16,
    marginLeft: 8,
    marginRight: 8,
  },

  searchIcon: {
    color: "grey",
    marginLeft: 6,
    marginRight: 6,
    alignSelf: "center",
  },

  searchInput: {
    flex: 1,
    border: "none",
    borderRadius: 30,
    height: "auto",
    minHeight: "auto",
    maxHeight: "24px",
    overflow: "hidden",
  },

  badge: {
    // right: "-10px",
  },
  // CORREÇÃO BOLINHA VERMELHA ALINHADA AO MENU DOS TICKET
  customBadge: {
    right: "0px", 
    backgroundColor: "#f44336",
    color: "#fff",
  },

  show: {
    display: "block",
  },

  hide: {
    display: "none !important",
  },

  closeAllFab: {
    backgroundColor: "red",
    marginBottom: "4px",
    "&:hover": {
      backgroundColor: "darkred",
    },
  },

  speedDial: {
    position: "absolute",
    bottom: 8,
    right: 8,
    "& .MuiFab-root": {
      width: "40px",
      height: "40px",
      marginTop: "4px",
    },
    "& .MuiFab-label": {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  },

  snackbar: {
    display: "flex",
    justifyContent: "space-between",
    backgroundColor: "var(--color-primary)",
    color: "white",
    borderRadius: 30,
    "@media (max-width:600px)": {
      fontSize: "0.8em",
    },
  },

  yesButton: {
    backgroundColor: "#FFF",
    color: "rgba(0, 100, 0, 1)",
    padding: "4px 4px",
    fontSize: "1em",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginRight: 8,
    "&:hover": {
      backgroundColor: "darkGreen",
      color: "#FFF",
    },
    borderRadius: 30,
  },
  noButton: {
    backgroundColor: "#FFF",
    color: "rgba(139, 0, 0, 1)",
    padding: "4px 4px",
    fontSize: "1em",
    fontWeight: "bold",
    textTransform: "uppercase",
    "&:hover": {
      backgroundColor: "darkRed",
      color: "#FFF",
    },
    borderRadius: 30,
  },
  filterIcon: {
    marginRight: 6,
    alignSelf: "center",
    color: "#25b6e8",
    cursor: "pointer",
  },
  button: {
    height: 30,
    width: 30,
    border: "1px solid",
    borderColor: "#aaa",
    borderRadius: 8,
    marginRight: 8,
    "&:hover": {
      borderColor: "var(--color-primary)",
    },
  },
  icon: {
    color: "#aaa",
    "&:hover": {
      color: "var(--color-primary)",
    },
  },
  buttonOpen: {
    "& $icon": {
      color: "var(--color-primary)",
    },
  },
};

const TicketsManagerTabs = () => {
  const classes = useStyles;
  const history = useHistory();

  const [searchParam, setSearchParam] = useState("");
  const [tab, setTab] = useState("open");
  // const [tabOpen, setTabOpen] = useState("open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [sortTickets, setSortTickets] = useState(false);

  const searchInputRef = useRef();
  const [searchOnMessages, setSearchOnMessages] = useState(false);

  const { user } = useContext(AuthContext);
  const { profile } = user;
  const { setSelectedQueuesMessage } = useContext(QueueSelectedContext);
  const { tabOpen, setTabOpen } = useContext(TicketsContext);

  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [groupingCount, setGroupingCount] = useState(0);

  const [selectedQueueIds, setSelectedQueueIds] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedWhatsapp, setSelectedWhatsapp] = useState([]);
  const [forceSearch, setForceSearch] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [filter, setFilter] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [isHoveredAll, setIsHoveredAll] = useState(false);
  const [isHoveredNew, setIsHoveredNew] = useState(false);
  const [isHoveredResolve, setIsHoveredResolve] = useState(false);
  const [isHoveredOpen, setIsHoveredOpen] = useState(false);
  const [isHoveredClosed, setIsHoveredClosed] = useState(false);
  const [isHoveredSort, setIsHoveredSort] = useState(false);

  const [isFilterActive, setIsFilterActive] = useState(false);

  useEffect(() => {
    setSelectedQueuesMessage(selectedQueueIds);
  }, [selectedQueueIds]);

  // Efeito para sincronizar showAllTickets com selectedQueueIds
  useEffect(() => {
    // Remove a sincronização automática que estava causando conflito
    // Agora o usuário pode usar "Todos" junto com filtros de fila
  }, []);

  // Carregar preferências do usuário ao inicializar
  useEffect(() => {
    const loadUserPreferences = () => {
      const userQueueIds = user?.queues?.map((q) => q.id) || [];
      
      if (user && user.selectedQueueIds && user.selectedQueueIds.length > 0) {
        // Se o usuário tem preferências salvas, usar elas
        setSelectedQueueIds(user.selectedQueueIds);
      } else {
        // Se não tem preferências salvas, usar todas as filas do usuário
        setSelectedQueueIds(userQueueIds);
      }
    };

    if (user && user.queues) {
      loadUserPreferences();
    }
  }, [user?.id]); // Só depende do ID do usuário

  useEffect(() => {
    if (user.profile.toUpperCase() === "ADMIN" || user.allUserChat.toUpperCase() === "ENABLED") {
      setShowAllTickets(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "search") {
      searchInputRef.current.focus();
    }
    setForceSearch(!forceSearch);
  }, [tab]);

  const searchTimeoutRef = useRef(null);

  const handleSearch = (e) => {
    const searchedTerm = e.target.value.toLowerCase();

    clearTimeout(searchTimeoutRef.current);

    if (searchedTerm === "") {
      setSearchParam("");
      setForceSearch(prev => !prev);
      setTab("open");
      return;
    } else if (tab !== "search") {
      handleFilter();
      setTab("search");
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchParam(searchedTerm);
      setForceSearch(prev => !prev);
    }, 200);
  };

  const handleBack = () => {

    history.push("/tickets");
  };

  const handleChangeTab = (e, newValue) => {
    setTab(newValue);
  };

  const handleChangeTabOpen = (e, newValue) => {
    // if (newValue === "pending" || newValue === "group") {
    handleBack();
    // }

    setTabOpen(newValue);
  };

  const applyPanelStyle = (status) => {
    if (tabOpen !== status) {
      return { width: 0, height: 0 };
    }
  };

  const handleSnackbarOpen = () => {
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const CloseAllTicket = async () => {
    try {
      const { data } = await api.post("/tickets/closeAll", {
        status: tabOpen,
        selectedQueueIds,
      });
      handleSnackbarClose();
    } catch (err) {
      console.log("Error: ", err);
    }
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const handleSelectedTags = (selecteds) => {
    const tags = selecteds.map((t) => t.id);

    // Aplicar filtros imediatamente sem debounce
      setSelectedTags(tags);
      setForceSearch(!forceSearch);
  };

  const handleSelectedUsers = (selecteds) => {
    const users = selecteds.map((t) => t.id);

    // Aplicar filtros imediatamente sem debounce
      setSelectedUsers(users);
      setForceSearch(!forceSearch);
  };

  const handleSelectedWhatsapps = (selecteds) => {
    const whatsapp = selecteds.map((t) => t.id);

    // Aplicar filtros imediatamente sem debounce
      setSelectedWhatsapp(whatsapp);
      setForceSearch(!forceSearch);
  };

  const handleSelectedStatus = (selecteds) => {
    const statusFilter = selecteds.map((t) => t.status);

    // Aplicar filtros imediatamente sem debounce
      setSelectedStatus(statusFilter);
      setForceSearch(!forceSearch);
  };

  const handleFilter = () => {
    if (filter) {
      setFilter(false);
    } else {
      setFilter(true);
    }
  };

  const [open, setOpen] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);

  const handleVisibility = () => {
    setHidden((prevHidden) => !prevHidden);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClosed = () => {
    setOpen(false);
  };

  const clearAllFilters = () => {
    // Limpar todos os filtros
    setSelectedTags([]);
    setSelectedUsers([]);
    setSelectedWhatsapp([]);
    setSelectedStatus([]);
    setSearchParam("");
    setSearchOnMessages(false);
    setForceSearch(!forceSearch);
    
    // Limpar campo de busca
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    
    // Desativar filtros se estiverem ativos
    if (filter) {
      setFilter(false);
      setIsFilterActive(false);
    }
    
    console.log("🧹 Todos os filtros foram limpos");
  };

  const tooltipTitleStyle = {
    fontSize: "10px",
  };

  return (
    <Paper elevation={0} style={classes.ticketsWrapper}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        onClose={(ticket) => {
          handleCloseOrOpenTicket(ticket);
        }}
      />
      <div style={classes.serachInputWrapper}>
        <SearchIcon sx={classes.searchIcon} />
        <InputBase
          sx={classes.searchInput}
          inputRef={searchInputRef}
          placeholder={i18n.t("tickets.search.placeholder")}
          type="search"
          onChange={handleSearch}
        />
        <Tooltip placement="top" title="Marque para pesquisar também nos conteúdos das mensagens (mais lento)">
          <div>
            <Switch
              size="small"
              checked={searchOnMessages}
              onChange={(e) => { setSearchOnMessages(e.target.checked) }}
            />
          </div>
        </Tooltip>
        {/* <IconButton
          className={classes.filterIcon}
          color="primary"
          aria-label="upload picture"
          component="span"
          onClick={handleFilter}
        >
          <FilterListIcon />
        </IconButton> */}
        {/* <FilterListIcon
          className={classes.filterIcon}
          color="primary"
          aria-label="upload picture"
          component="span"
          onClick={handleFilter}
        /> */}
        <Badge
          color="primary"
          variant="dot"
          invisible={!(
            selectedTags.length > 0 || 
            selectedUsers.length > 0 || 
            selectedWhatsapp.length > 0 || 
            selectedStatus.length > 0 || 
            searchParam
          )}
        >
          <IconButton
            style={{
              backgroundColor: "transparent",
              boxShadow: "none",
              border: "none",
              borderRadius: "50%",
              justifyContent: "flex-end",
              alignItems: "center",
              ...classes.filterIcon
            }}
            variant="contained"
            aria-label="filter"
            onClick={() => {
              setIsFilterActive((prevState) => !prevState);
              handleFilter();
            }}
          >
            {isFilterActive ? (
              <FilterAlt sx={classes.icon} />
            ) : (
              <FilterAltOff sx={classes.icon} />
            )}
          </IconButton>
        </Badge>
        
        {/* Botão Limpar Filtros - só aparece quando há filtros ativos */}
        {(isFilterActive && (
          selectedTags.length > 0 || 
          selectedUsers.length > 0 || 
          selectedWhatsapp.length > 0 || 
          selectedStatus.length > 0 || 
          searchParam
        )) && (
          <Tooltip title="Limpar todos os filtros">
            <IconButton
              style={{
                backgroundColor: "transparent",
                boxShadow: "none",
                border: "none",
                borderRadius: "50%",
                justifyContent: "flex-end",
                alignItems: "center",
                marginLeft: 4,
                ...classes.filterIcon
              }}
              variant="contained"
              aria-label="clear-filters"
              onClick={clearAllFilters}
            >
              <ClearAllIcon sx={{...classes.icon, color: "#f44336"}} />
            </IconButton>
          </Tooltip>
        )}
      </div>

      {filter === true && (
        <>
          <TagsFilter onFiltered={handleSelectedTags} />
          <WhatsappsFilter onFiltered={handleSelectedWhatsapps} />
          <StatusFilter onFiltered={handleSelectedStatus} />
          {profile === "admin" && (
            <>
              <UsersFilter onFiltered={handleSelectedUsers} />
            </>
          )}
        </>
      )}

      {/* <Paper elevation={0} square className={classes.tabsHeader}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          variant="fullWidth"
          textColor="primary"
          aria-label="icon label tabs example"
          classes={{ indicator: classes.tabIndicator }}
        >
          <Tab
            value={"open"}
            icon={<MoveToInboxIcon />}
            label={i18n.t("tickets.tabs.open.title")}
            classes={{ root: classes.tab }}
          />
          <Tab
            value={"closed"}
            icon={<CheckBoxIcon />}
            label={i18n.t("tickets.tabs.closed.title")}
            classes={{ root: classes.tab }}
          />
          <Tab
            value={"search"}
            icon={<SearchIcon />}
            label={i18n.t("tickets.tabs.search.title")}
            classes={{ root: classes.tab }}
          />
        </Tabs>
      </Paper> */}
      <Paper square elevation={0} style={classes.ticketOptionsBox}>
        <Grid container alignItems="center" justifyContent="space-between">
          <Grid item>
            <Can
              role={user.allUserChat === 'enabled' && user.profile === 'user' ? 'admin' : user.profile}
              perform="tickets-manager:showall"
              yes={() => (
                <Badge
                  color="primary"
                  invisible={
                    !isHoveredAll ||
                    isHoveredNew ||
                    isHoveredResolve ||
                    isHoveredOpen ||
                    isHoveredClosed
                  }
                  badgeContent={"Todos"}
                  classes={{ badge: classes.tabsBadge }}
                >
                  <ToggleButton
                    onMouseEnter={() => setIsHoveredAll(true)}
                    onMouseLeave={() => setIsHoveredAll(false)}
                    sx={classes.button}
                    value="uncheck"
                    selected={showAllTickets}
                    onChange={() => {
                      // Apenas alterna o estado do "Todos", sem mexer nas filas
                      setShowAllTickets(!showAllTickets);
                    }}
                  >
                    {showAllTickets ? (
                      <VisibilityIcon sx={classes.icon} />
                    ) : (
                      <VisibilityOffIcon sx={classes.icon} />
                    )}
                  </ToggleButton>
                </Badge>
              )}
            />
            <Snackbar
              open={snackbarOpen}
              onClose={handleSnackbarClose}
              message={i18n.t("tickets.inbox.closedAllTickets")}
              ContentProps={{
                className: classes.snackbar,
              }}
              action={
                <>
                  <Button
                    sx={classes.yesButton}
                    size="small"
                    onClick={CloseAllTicket}
                  >
                    {i18n.t("tickets.inbox.yes")}
                  </Button>
                  <Button
                    sx={classes.noButton}
                    size="small"
                    onClick={handleSnackbarClose}
                  >
                    {i18n.t("tickets.inbox.no")}
                  </Button>
                </>
              }
            />
            <Badge
              color="primary"
              invisible={
                isHoveredAll ||
                !isHoveredNew ||
                isHoveredResolve ||
                isHoveredOpen ||
                isHoveredClosed
              }
              badgeContent={i18n.t("tickets.inbox.newTicket")}
              classes={{ badge: classes.tabsBadge }}
            >
              <IconButton
                onMouseEnter={() => setIsHoveredNew(true)}
                onMouseLeave={() => setIsHoveredNew(false)}
                sx={classes.button}
                onClick={() => {
                  setNewTicketModalOpen(true);
                }}
              >
                <AddIcon sx={classes.icon} />
              </IconButton>
            </Badge>
            {user.profile === "admin" && (
              <Badge
                color="primary"
                invisible={
                  isHoveredAll ||
                  isHoveredNew ||
                  !isHoveredResolve ||
                  isHoveredOpen ||
                  isHoveredClosed
                }
                badgeContent={i18n.t("tickets.inbox.closedAll")}
                classes={{ badge: classes.tabsBadge }}
              >
                <IconButton
                  onMouseEnter={() => setIsHoveredResolve(true)}
                  onMouseLeave={() => setIsHoveredResolve(false)}
                  sx={classes.button}
                  onClick={handleSnackbarOpen}
                >
                  <PlaylistAddCheckOutlined style={{ color: "green" }} />
                </IconButton>
              </Badge>
            )}
            <Badge
              // color="primary"
              invisible={
                !(
                  tab === "open" &&
                  !isHoveredAll &&
                  !isHoveredNew &&
                  !isHoveredResolve &&
                  !isHoveredClosed &&
                  !isHoveredSort
                ) && !isHoveredOpen
              }
              badgeContent={i18n.t("tickets.inbox.open")}
              classes={{ badge: classes.tabsBadge }}
            >
              <IconButton
                onMouseEnter={() => {
                  setIsHoveredOpen(true);
                  setHoveredButton("open");
                }}
                onMouseLeave={() => {
                  setIsHoveredOpen(false);
                  setHoveredButton(null);
                }}
                style={{
                  height: 30,
                  width: 30,
                  border: isHoveredOpen
                    ? "1px solid var(--color-primary)"
                    : tab === "open"
                      ? "1px solid var(--color-primary)"
                      : "1px solid #aaa",
                  borderRadius: 8,
                  marginRight: 8,
                }}
                onClick={() => handleChangeTab(null, "open")}
              >
                <MoveToInboxIcon
                  style={{
                    color: isHoveredOpen
                      ? "var(--color-primary)"
                      : tab === "open"
                        ? "var(--color-primary)"
                        : "#aaa",
                  }}
                />
              </IconButton>
            </Badge>

            <Badge
              color="primary"
              invisible={
                !(
                  tab === "closed" &&
                  !isHoveredAll &&
                  !isHoveredNew &&
                  !isHoveredResolve &&
                  !isHoveredOpen &&
                  !isHoveredSort
                ) && !isHoveredClosed
              }
              badgeContent={i18n.t("tickets.inbox.resolverd")}
              classes={{ badge: classes.tabsBadge }}
            >
              <IconButton
                onMouseEnter={() => {
                  setIsHoveredClosed(true);
                  setHoveredButton("closed");
                }}
                onMouseLeave={() => {
                  setIsHoveredClosed(false);
                  setHoveredButton(null);
                }}
                style={{
                  height: 30,
                  width: 30,
                  border: isHoveredClosed
                    ? "1px solid var(--color-primary)"
                    : tab === "closed"
                      ? "1px solid var(--color-primary)"
                      : "1px solid #aaa",
                  borderRadius: 8,
                  marginRight: 8,
                }}
                onClick={() => handleChangeTab(null, "closed")}
              >
                <CheckBoxIcon
                  style={{
                    color: isHoveredClosed
                      ? "var(--color-primary)"
                      : tab === "closed"
                        ? "var(--color-primary)"
                        : "#aaa",
                  }}
                />
              </IconButton>
            </Badge>
            {tab !== "closed" && (
              <Badge
                color="primary"
                invisible={
                  !isHoveredSort ||
                  isHoveredAll ||
                  isHoveredNew ||
                  isHoveredResolve ||
                  isHoveredOpen ||
                  isHoveredClosed
                }
                badgeContent={!sortTickets ? "Crescente" : "Decrescente"}
                classes={{ badge: classes.tabsBadge }}
              >
                <ToggleButton
                  onMouseEnter={() => setIsHoveredSort(true)}
                  onMouseLeave={() => setIsHoveredSort(false)}
                  sx={classes.button}
                  value="uncheck"
                  selected={sortTickets}
                  onChange={() =>
                    setSortTickets((prevState) => !prevState)
                  }
                >
                  {!sortTickets ? (
                    <TextRotateUp style={{
                      color: sortTickets
                        ? "var(--color-primary)"
                        : "#aaa",
                    }} />
                  ) : (
                    <TextRotationDown style={{
                      color: sortTickets
                        ? "var(--color-primary)"
                        : "#aaa",
                    }} />
                  )}
                </ToggleButton>
              </Badge>
            )}
          </Grid>
          <Grid item>
            <TicketsQueueSelect
              selectedQueueIds={selectedQueueIds}
              userQueues={user?.queues}
              onChange={(values) => {
                setSelectedQueueIds(values);
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      <TabPanel value={tab} name="open" style={classes.ticketsWrapper}>
        <Tabs
          value={tabOpen}
          onChange={handleChangeTabOpen}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          {/* ATENDENDO */}
          <Tab
            label={
              <Grid container alignItems="center" justifyContent="center">
                <Grid item>
                  <Badge
                    overlap="rectangular"
                    classes={{ badge: classes.customBadge }}
                    badgeContent={openCount}
                    color="primary"
                  >
                    <MessageSharpIcon
                      style={{
                        fontSize: 18,
                      }}
                    />
                  </Badge>
                </Grid>
                <Grid item>
                  <Typography
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {i18n.t("ticketsList.assignedHeader")}
                  </Typography>
                </Grid>
              </Grid>
            }
            value={"open"}
            name="open"
            classes={{ root: classes.tabPanelItem }}
          />

          {/* AGUARDANDO */}
          <Tab
            label={
              <Grid container alignItems="center" justifyContent="center">
                <Grid item>
                  <Badge
                    overlap="rectangular"
                    classes={{ badge: classes.customBadge }}
                    badgeContent={pendingCount}
                    color="primary"
                  >
                    <ClockIcon
                      style={{
                        fontSize: 18,
                      }}
                    />
                  </Badge>
                </Grid>
                <Grid item>
                  <Typography
                    style={{
                      marginLeft: 8,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {i18n.t("ticketsList.pendingHeader")}
                  </Typography>
                </Grid>
              </Grid>
            }
            value={"pending"}
            name="pending"
            classes={{ root: classes.tabPanelItem }}
          />

          {/* GRUPOS */}
          {user.allowGroup && (
            <Tab
              label={
                <Grid container alignItems="center" justifyContent="center">
                  <Grid item>
                    <Badge
                      overlap="rectangular"
                      classes={{ badge: classes.customBadge }}
                      badgeContent={groupingCount}
                      color="primary"
                    >
                      <Group
                        style={{
                          fontSize: 18,
                        }}
                      />
                    </Badge>
                  </Grid>
                  <Grid item>
                    <Typography
                      style={{
                        marginLeft: 8,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {i18n.t("ticketsList.groupingHeader")}
                    </Typography>
                  </Grid>
                </Grid>
              }
              value={"group"}
              name="group"
              classes={{ root: classes.tabPanelItem }}
            />
          )}
        </Tabs>

        <Paper elevation={0} style={classes.ticketsWrapper}>
          <TicketsList
            status="open"
            showAll={showAllTickets}
            sortTickets={sortTickets ? "ASC" : "DESC"}
            selectedQueueIds={selectedQueueIds}
            updateCount={(val) => setOpenCount(val)}
            style={applyPanelStyle("open")}
            setTabOpen={setTabOpen}
            tags={selectedTags.length > 0 ? selectedTags : undefined}
            users={selectedUsers.length > 0 ? selectedUsers : undefined}
            whatsappIds={selectedWhatsapp.length > 0 ? selectedWhatsapp : undefined}
            statusFilter={selectedStatus.length > 0 ? selectedStatus : undefined}
            searchParam={searchParam || undefined}
            forceSearch={forceSearch}
            searchOnMessages={searchOnMessages}
          />
          <TicketsList
            status="pending"
            selectedQueueIds={selectedQueueIds}
            sortTickets={sortTickets ? "ASC" : "DESC"}
            showAll={showAllTickets}
            updateCount={(val) => setPendingCount(val)}
            style={applyPanelStyle("pending")}
            setTabOpen={setTabOpen}
            tags={selectedTags.length > 0 ? selectedTags : undefined}
            users={selectedUsers.length > 0 ? selectedUsers : undefined}
            whatsappIds={selectedWhatsapp.length > 0 ? selectedWhatsapp : undefined}
            statusFilter={selectedStatus.length > 0 ? selectedStatus : undefined}
            searchParam={searchParam || undefined}
            forceSearch={forceSearch}
            searchOnMessages={searchOnMessages}
          />
          {user.allowGroup && (
            <TicketsList
              status="group"
              showAll={showAllTickets}
              sortTickets={sortTickets ? "ASC" : "DESC"}
              selectedQueueIds={selectedQueueIds}
              updateCount={(val) => setGroupingCount(val)}
              style={applyPanelStyle("group")}
              setTabOpen={setTabOpen}
              tags={selectedTags.length > 0 ? selectedTags : undefined}
              users={selectedUsers.length > 0 ? selectedUsers : undefined}
              whatsappIds={selectedWhatsapp.length > 0 ? selectedWhatsapp : undefined}
              statusFilter={selectedStatus.length > 0 ? selectedStatus : undefined}
              searchParam={searchParam || undefined}
              forceSearch={forceSearch}
              searchOnMessages={searchOnMessages}
            />
          )}
        </Paper>
      </TabPanel>
      <TabPanel value={tab} name="closed" style={classes.ticketsWrapper}>
        <TicketsList
          status="closed"
          showAll={showAllTickets}
          selectedQueueIds={selectedQueueIds}
          setTabOpen={setTabOpen}
          tags={selectedTags.length > 0 ? selectedTags : undefined}
          users={selectedUsers.length > 0 ? selectedUsers : undefined}
          whatsappIds={selectedWhatsapp.length > 0 ? selectedWhatsapp : undefined}
          statusFilter={selectedStatus.length > 0 ? selectedStatus : undefined}
          searchParam={searchParam || undefined}
          forceSearch={forceSearch}
          searchOnMessages={searchOnMessages}
        />
      </TabPanel>
      {filter && (
        <TabPanel value={tab} name="search" style={classes.ticketsWrapper}>
          {profile === "admin" && (
            <>
              <TicketsList
                statusFilter={selectedStatus}
                searchParam={searchParam}
                showAll={showAllTickets}
                tags={selectedTags}
                users={selectedUsers}
                selectedQueueIds={selectedQueueIds}
                whatsappIds={selectedWhatsapp}
                forceSearch={forceSearch}
                searchOnMessages={searchOnMessages}
                status="search"
              />
            </>
          )}

          {profile === "user" && (
            <TicketsList
              statusFilter={selectedStatus}
              searchParam={searchParam}
              showAll={false}
              tags={selectedTags}
              selectedQueueIds={selectedQueueIds}
              whatsappIds={selectedWhatsapp}
              forceSearch={forceSearch}
              searchOnMessages={searchOnMessages}
              status="search"
            />
          )}
        </TabPanel>
      )}
    </Paper >
  );
};

export default TicketsManagerTabs;
