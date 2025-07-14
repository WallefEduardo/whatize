import React, { useEffect, useState, useContext } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Drawer from "@material-ui/core/Drawer";
import Link from "@material-ui/core/Link";
import InputLabel from "@material-ui/core/InputLabel";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import CreateIcon from '@material-ui/icons/Create';
import formatSerializedId from '../../utils/formatSerializedId';
import { i18n } from "../../translate/i18n";
import ModalImageCors from "../ModalImageCors"
import ContactDrawerSkeleton from "../ContactDrawerSkeleton";
import MarkdownWrapper from "../MarkdownWrapper";
import { CardHeader, Chip, FormControl, MenuItem, Select, Switch, TextField, Tooltip } from "@material-ui/core";
import { ContactForm } from "../ContactForm";
import ContactModal from "../ContactModal";
import { ContactNotes } from "../ContactNotes";
import Autocomplete from "@material-ui/lab/Autocomplete";

import { AuthContext } from "../../context/Auth/AuthContext";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { toast } from "react-toastify";
import { TagsKanbanContainer } from "../TagsKanbanContainer";
import { TagsContainer } from "../TagsContainer";


const drawerWidth = 320;

const useStyles = makeStyles(theme => ({
	drawer: {
		width: drawerWidth,
		flexShrink: 0,
	},
	drawerPaper: {
		width: drawerWidth,
		display: "flex",
		borderTop: "1px solid rgba(0, 0, 0, 0.12)",
		borderRight: "1px solid rgba(0, 0, 0, 0.12)",
		borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
		borderTopRightRadius: 4,
		borderBottomRightRadius: 4,
	},
	header: {
		display: "flex",
		borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
		backgroundColor: theme.palette.inputBackground,
		alignItems: "center",
		padding: theme.spacing(0, 1),
		minHeight: "50px",
		justifyContent: "flex-start",
	},
	content: {
		display: "flex",
		backgroundColor: theme.palette.inputBackground,
		flexDirection: "column",
		padding: "8px 0px 8px 8px",
		// height: "100%",
		justifyContent: "center",
		overflowY: "scroll",
		...theme.scrollbarStyles,
	},

	contactAvatar: {
		margin: 15,
		width: 160,
		height: 160,
		borderRadius: 14,
	},

	contactHeader: {
		display: "flex",
		padding: 8,
		textAlign: 'center',
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		"& > *": {
			margin: 4,
		},
	},

	contactDetails: {
		marginTop: 8,
		padding: 8,
		display: "flex",
		flexDirection: "column",
	},
	contactExtraInfo: {
		marginTop: 4,
		padding: 6,
	},
}));

const ContactDrawer = ({ open, handleDrawerClose, contact, ticket, loading }) => {
	const classes = useStyles();

	const [modalOpen, setModalOpen] = useState(false);
	const [blockingContact, setBlockingContact] = useState(contact.active);
	const [openForm, setOpenForm] = useState(false);
	const { get } = useCompanySettings();
	const [hideNum, setHideNum] = useState(false);
	const { user } = useContext(AuthContext);
	const [acceptAudioMessage, setAcceptAudio] = useState(contact.acceptAudioMessage);
	const [funnels, setFunnels] = useState([]);
	const [selectedFunnels, setSelectedFunnels] = useState([]);
	const [isEtapaKanbanEnabled, setIsEtapaKanbanEnabled] = useState(false);

	useEffect(() => {
		async function fetchData() {
			const lgpdHideNumber = await get({
				"column": "lgpdHideNumber"
			});

			if (lgpdHideNumber === "enabled") setHideNum(true);
		}
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		setOpenForm(false);
	}, [open, contact]);

	useEffect(() => {
		async function fetchFunnels() {
			try {
				const { data } = await api.get("/funilkanban");
				const loadedFunnels = data.funilKanbans || [];
				setFunnels(loadedFunnels);
			} catch (err) {
				console.error("Erro ao carregar funis:", err);
			}
		}
		fetchFunnels();
	}, []);

	// Efeito para controlar se o campo Etapa Kanban deve estar habilitado
	useEffect(() => {
		setIsEtapaKanbanEnabled(selectedFunnels.length > 0);
	}, [selectedFunnels]);

	const handleFunnelsChange = (event, newValues) => {
		const previousFunnels = selectedFunnels.map(f => f.id);
		const newFunnels = newValues.map(f => f.id);
		
		// Se os funis mudaram, limpar a seleção de Etapa Kanban
		const funnelsChanged = JSON.stringify(previousFunnels.sort()) !== JSON.stringify(newFunnels.sort());
		
		setSelectedFunnels(newValues);
		
		// Se mudou os funis, resetar a etapa kanban (será implementado via context ou callback)
		if (funnelsChanged && ticket?.id) {
			// Aqui podemos adicionar uma callback para limpar a etapa kanban
			console.log('Funis alterados, etapa kanban deve ser resetada');
		}
	};

	// Função para gerar cores diferentes para cada funil
	const getFunnelColor = (index) => {
		const colors = [
			'#FFB300', // amarelo
			'#1E88E5', // azul
			'#43A047', // verde
			'#E53935', // vermelho
			'#8E24AA', // roxo
			'#F4511E', // laranja
			'#00ACC1', // ciano
			'#3949AB', // azul escuro
			'#6D4C41', // marrom
			'#757575', // cinza
		];
		return colors[index % colors.length];
	};

	const handleContactToggleAcceptAudio = async () => {
        try {
            const contact = await api.put(`/contacts/toggleAcceptAudio/${ticket.contact.id}`);
            setAcceptAudio(contact.data.acceptAudioMessage);
        } catch (err) {
            toastError(err);
        }
    };

	const handleBlockContact = async (contactId) => {
		try {
			await api.put(`/contacts/block/${contactId}`, { active: false });
			toast.success("Contato bloqueado");
		} catch (err) {
			toastError(err);
		}

		setBlockingContact(true);
	};

	const handleUnBlockContact = async (contactId) => {
		try {
			await api.put(`/contacts/block/${contactId}`, { active: true });
			toast.success("Contato desbloqueado");
		} catch (err) {
			toastError(err);
		}
		setBlockingContact(false);
	};

	if (loading) return null;

	return (
		<>
			<Drawer
				className={classes.drawer}
				variant="persistent"
				anchor="right"
				open={open}
				PaperProps={{ style: { position: "absolute" } }}
				BackdropProps={{ style: { position: "absolute" } }}
				ModalProps={{
					container: document.getElementById("drawer-container"),
					style: { position: "absolute" },
				}}
				classes={{
					paper: classes.drawerPaper,
				}}
			>
				<div className={classes.header}>
					<IconButton onClick={handleDrawerClose}>
						<CloseIcon />
					</IconButton>
					<Typography style={{ justifySelf: "center" }}>
						{i18n.t("contactDrawer.header")}
					</Typography>
				</div>
				<div>
					{!loading ? (
						<>
							{/*
								<Typography
									style={{ marginBottom: 8, marginTop: 12 }}
									variant="subtitle1"
								>
									<Switch
										size="small"
										checked={acceptAudioMessage}
										onChange={() => handleContactToggleAcceptAudio()}
										name="disableBot"
										color="primary"
									/>
									{i18n.t("ticketOptionsMenu.acceptAudioMessage")}								
								</Typography>
								*/}

						</>
					) : (<br />)}
				</div>
				{loading ? (
					<ContactDrawerSkeleton classes={classes} />
				) : (
					<div className={classes.content}>
						<Paper square elevation={0} className={classes.contactHeader}>
							{contact?.urlPicture && contact?.urlPicture.length > 0 ? (
								<ModalImageCors imageUrl={contact?.urlPicture} />
							):<Avatar/>}
							<CardHeader
								onClick={() => { }}
								style={{ cursor: "pointer", width: '100%' }}
								titleTypographyProps={{ noWrap: true }}
								subheaderTypographyProps={{ noWrap: true }}
								title={
									<>
										<Typography onClick={() => setOpenForm(true)}>
											{contact.name}
											<CreateIcon style={{ fontSize: 16, marginLeft: 5 }} />
										</Typography>
									</>
								}
								subheader={
									<>
										<Typography style={{ fontSize: 12 }}>
											{hideNum && user.profile === "user" ? formatSerializedId(contact.number).slice(0, -6) + "**-**" + contact.number.slice(-2) : formatSerializedId(contact.number)}
										</Typography>
										<Typography style={{ color: "primary", fontSize: 12 }}>
											<Link href={`mailto:${contact.email}`}>{contact.email}</Link>
										</Typography>
									</>
								}
							/>
							<Button
								variant="outlined"
								color="secondary"
								onClick={() => contact.active
									? handleBlockContact(contact.id)
									: handleUnBlockContact(contact.id)}
								disabled={loading}
							>
								{!contact.active ? "Desbloquear contato" : "Bloquear contato"}
							</Button>
							{(contact.id && openForm) && <ContactForm initialContact={contact} onCancel={() => setOpenForm(false)} />}
						</Paper>
						
						<Paper square variant="outlined" className={classes.contactDetails} style={{ marginBottom: 10 }}>
							<TagsContainer contact={contact} />
							
							<Autocomplete
								multiple
								size="small"
								options={funnels}
								value={selectedFunnels}
								onChange={handleFunnelsChange}
								getOptionLabel={(option) => option.name}
								style={{ marginTop: 10 }}
								renderTags={(value, getTagProps) =>
									value.map((option, index) => (
										<Chip
											variant="outlined"
											style={{
												backgroundColor: getFunnelColor(index),
												color: "#FFF",
												marginRight: 1,
												padding: 0,
												height: 20,
												fontWeight: 'bold',
												paddingLeft: 4,
												paddingRight: 4,
												borderRadius: 3,
												fontSize: "0.7em",
												whiteSpace: "nowrap"
											}}
											label={option.name}
											{...getTagProps({ index })}
											size="small"
										/>
									))
								}
								renderInput={(params) => (
									<TextField {...params} variant="outlined" label="Filtrar por Funil" />
								)}
							/>
							
							<TagsKanbanContainer 
								ticket={ticket} 
								funilIds={selectedFunnels.map(f => f.id)}
								isEnabled={isEtapaKanbanEnabled}
							/>
						</Paper>
						
						<Paper square variant="outlined" className={classes.contactDetails}>
							<Typography variant="subtitle1" style={{ marginBottom: 10 }}>
								{i18n.t("ticketOptionsMenu.appointmentsModal.title")}
							</Typography>
							<ContactNotes ticket={ticket} />
						</Paper>
						<Paper square variant="outlined" className={classes.contactDetails}>
							<ContactModal
								open={modalOpen}
								onClose={() => setModalOpen(false)}
								contactId={contact.id}
							></ContactModal>
							<Typography variant="subtitle1">
								{i18n.t("contactDrawer.extraInfo")}
							</Typography>
							{contact?.extraInfo?.map(info => (
								<Paper
									key={info.id}
									square
									variant="outlined"
									className={classes.contactExtraInfo}
								>
									<InputLabel>{info.name}</InputLabel>
									<Typography component="div" noWrap style={{ paddingTop: 2 }}>
										<MarkdownWrapper>{info.value}</MarkdownWrapper>
									</Typography>
								</Paper>
							))}
						</Paper>
					</div>
				)}
			</Drawer>
		</>
	);
};

export default ContactDrawer;
