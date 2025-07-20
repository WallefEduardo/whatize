import React, { useState, useEffect, useCallback } from "react";
import { i18n } from "../../translate/i18n";
import { Avatar, CardHeader, Grid, TextField, Input, InputAdornment, InputLabel, IconButton, Tooltip, makeStyles } from "@material-ui/core";
import { Refresh } from "@material-ui/icons";
import { TagsKanbanContainer } from "../TagsKanbanContainer";
import api from "../../services/api";
import { toast } from "react-toastify";

const useStyles = makeStyles({
	'@keyframes spin': {
		'0%': { transform: 'rotate(0deg)' },
		'100%': { transform: 'rotate(360deg)' }
	},
	refreshIcon: {
		'&.spinning': {
			animation: '$spin 1s linear infinite'
		}
	}
});

const TicketInfo = ({ contact, ticket, onClick }) => {
	const classes = useStyles();
	const [amount, setAmount] = useState("");
	const [refreshingImage, setRefreshingImage] = useState(false);
	const [currentImageUrl, setCurrentImageUrl] = useState(contact?.urlPicture || "");
	const [imageKey, setImageKey] = useState(Date.now()); // Para cache busting
	const [autoDownloadAttempted, setAutoDownloadAttempted] = useState(false);
	const [imageLoadError, setImageLoadError] = useState(false);

	// Auto-download inteligente de imagens ausentes
	const tryAutoDownload = useCallback(async () => {
		if (!contact?.id || autoDownloadAttempted || refreshingImage) return;
		
		const hasNoImage = !currentImageUrl || currentImageUrl.includes('nopicture.png') || currentImageUrl === "";
		
		// Só faz auto-download para números que parecem válidos do WhatsApp
		const isValidWhatsAppNumber = contact?.number && 
			contact.number.length >= 10 && 
			contact.number.length <= 15 &&
			!contact.number.includes('253725780217903'); // Evita números corrompidos conhecidos
		
		if (hasNoImage && isValidWhatsAppNumber) {
			setAutoDownloadAttempted(true);
			
			try {
				const response = await api.put(`/contacts/${contact.id}/refresh-image`);
				
				if (response.data.success && response.data.hasImage && response.data.contact?.urlPicture) {
					const newImageUrl = response.data.contact.urlPicture;
					setCurrentImageUrl(newImageUrl);
					setImageKey(Date.now());
					setImageLoadError(false);
				}
			} catch (error) {
				// Falha silenciosa no auto-download
			}
		} else if (!isValidWhatsAppNumber) {
			setAutoDownloadAttempted(true); // Evita tentar novamente
		}
	}, [contact?.id, contact?.number, currentImageUrl, autoDownloadAttempted, refreshingImage]);

	// Effect para auto-download quando componente monta
	useEffect(() => {
		// Delay maior para evitar muitas requisições simultâneas e dar tempo da página carregar
		const timer = setTimeout(() => {
			tryAutoDownload();
		}, 1500 + Math.random() * 1000); // 1.5-2.5s com aleatoriedade
		
		return () => clearTimeout(timer);
	}, [tryAutoDownload]);

	// Effect para atualizar imagem quando contact.urlPicture muda
	useEffect(() => {
		if (contact?.urlPicture && contact.urlPicture !== currentImageUrl) {
			setCurrentImageUrl(contact.urlPicture);
			setImageKey(Date.now());
			setImageLoadError(false); // Reset error state
		}
	}, [contact?.urlPicture]);

	// Effect para resetar estado quando contato muda
	useEffect(() => {
		setAutoDownloadAttempted(false);
		setImageLoadError(false);
		setCurrentImageUrl(contact?.urlPicture || "");
		setImageKey(Date.now());
	}, [contact?.id]);

	// Função para lidar com erro de carregamento da imagem
	const handleImageError = useCallback(() => {
		setImageLoadError(true);
		
		// Se não tentou auto-download ainda, tenta agora
		if (!autoDownloadAttempted && !refreshingImage) {
			tryAutoDownload();
		}
	}, [contact?.id, autoDownloadAttempted, refreshingImage, tryAutoDownload]);

	// Função para quando imagem carrega com sucesso
	const handleImageLoad = useCallback(() => {
		setImageLoadError(false);
	}, []);

	const renderCardReader = () => {
		const hasNoImage = !currentImageUrl || currentImageUrl.includes('nopicture.png') || currentImageUrl === "" || imageLoadError;
		
		// URL da imagem com cache busting
		const imageUrl = hasNoImage ? "" : `${currentImageUrl}?v=${imageKey}`;
		
		return (
			<CardHeader
				onClick={onClick}
				style={{ cursor: "pointer" }}
				titleTypographyProps={{ noWrap: true }}
				subheaderTypographyProps={{ noWrap: true }}
				avatar={
					<div style={{ position: 'relative', display: 'inline-block' }}>
						<Avatar 
							src={imageUrl} 
							alt="contact_image"
							onError={handleImageError}
							onLoad={handleImageLoad}
							imgProps={{
								onError: handleImageError,
								onLoad: handleImageLoad
							}}
						/>
						{(hasNoImage || refreshingImage || imageLoadError) && (
							<Tooltip title={
								refreshingImage ? "Atualizando imagem..." : 
								imageLoadError ? "Erro ao carregar - Clique para tentar novamente" :
								"Recarregar imagem do contato"
							}>
								<IconButton
									size="small"
									onClick={handleRefreshImage}
									disabled={refreshingImage}
									style={{
										position: 'absolute',
										bottom: -2,
										right: -2,
										backgroundColor: refreshingImage ? '#ffa726' : 
														imageLoadError ? '#f44336' : '#25d366',
										color: 'white',
										width: 20,
										height: 20,
										padding: 2,
										opacity: refreshingImage ? 0.8 : 1
									}}
								>
									<Refresh 
										className={`${classes.refreshIcon} ${refreshingImage ? 'spinning' : ''}`}
										style={{ fontSize: 12 }} 
									/>
								</IconButton>
							</Tooltip>
						)}
					</div>
				}
				title={`${contact?.name || '(sem contato)'} #${ticket.id}`}
				subheader={
					ticket.user &&
					`${i18n.t("messagesList.header.assignedTo")} ${ticket.user.name}`
				}

			/>
		);
	}

	const handleChange = (event) => {
		const value = event.target.value;

		setAmount(value);
	}

	// Função para recarregar a imagem do contato (uso manual)
	const handleRefreshImage = async (e) => {
		e.stopPropagation(); // Evita que o clique propague para o CardHeader
		
		if (!contact?.id || refreshingImage) return;
		
		setRefreshingImage(true);
		
		try {
			// Chamar endpoint para forçar atualização da imagem
			const response = await api.put(`/contacts/${contact.id}/refresh-image`);
			
			if (response.data.success && response.data.hasImage && response.data.contact?.urlPicture) {
				const newImageUrl = response.data.contact.urlPicture;
				
				// Atualizar imagem sem recarregar página
				setCurrentImageUrl(newImageUrl);
				setImageKey(Date.now()); // Force cache busting
				setImageLoadError(false); // Reset error state
				
				toast.success("Imagem atualizada com sucesso!");
				
			} else if (response.data.success === false && response.data.hasImage === false) {
				toast.info("Este contato não possui foto de perfil no WhatsApp.");
			} else {
				toast.warning("Não foi possível obter uma nova imagem para este contato.");
			}
			
		} catch (error) {
			console.error('Erro ao atualizar imagem:', error);
			
			// Tratamento específico para diferentes tipos de erro
			if (error.response?.status === 404) {
				toast.error("Contato não encontrado.");
			} else if (error.response?.status === 400) {
				const errorMsg = error.response?.data?.error || "Erro de validação.";
				toast.error(errorMsg);
			} else if (error.response?.status === 500) {
				toast.error("Erro interno do servidor. Contate o suporte.");
			} else {
				toast.error(`Erro ao atualizar imagem: ${error.response?.data?.error || error.message}`);
			}
		} finally {
			setRefreshingImage(false);
		}
	}


	return (
		<React.Fragment>
			<Grid container alignItems="center" spacing={10}>
				{/* Conteúdo do contato à esquerda */}
				<Grid item xs={6}>
					{renderCardReader()}
				</Grid>
			</Grid>
		</React.Fragment>
	);
};

export default TicketInfo;
