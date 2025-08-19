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

	// Auto-download removido - agora usa lógica simples no useEffect

	// Removido useEffect complicado - agora usa lógica simples

	// Effect para atualizar imagem quando contact.urlPicture muda
	useEffect(() => {
		if (contact?.urlPicture && contact.urlPicture !== currentImageUrl) {
			setCurrentImageUrl(contact.urlPicture);
			setImageKey(Date.now());
			setImageLoadError(false); // Reset error state
		} else if (!contact?.urlPicture && contact?.id && !autoDownloadAttempted && !refreshingImage && contact?.channel === 'whatsapp') {
			// ✅ Auto-download APENAS UMA VEZ e apenas para WhatsApp
			console.log('🔍 [AUTO-REFRESH] Contato WhatsApp sem imagem local, fazendo auto-download (tentativa única):', {
				contactId: contact?.id,
				urlPicture: contact?.urlPicture,
				channel: contact?.channel
			});
			
			setAutoDownloadAttempted(true);
			setCurrentImageUrl("");
			setImageKey(Date.now());
			
			// Usar a mesma lógica do refresh manual após delay menor
			setTimeout(() => {
				handleRefreshImage({ stopPropagation: () => {} });
			}, 1000);
		}
	}, [contact?.urlPicture, contact?.id, autoDownloadAttempted, refreshingImage, contact?.channel]);

	// Effect para resetar estado quando contato muda
	useEffect(() => {
		setAutoDownloadAttempted(false);
		setImageLoadError(false);
		setCurrentImageUrl(contact?.urlPicture || "");
		setImageKey(Date.now());
		console.log('🔄 [CONTACT-CHANGE] Estado resetado para novo contato:', contact?.id);
	}, [contact?.id]);

	// Função para lidar com erro de carregamento da imagem
	const handleImageError = useCallback(() => {
		console.log('❌ [IMAGE-ERROR] Erro ao carregar imagem para contato:', contact?.id);
		setImageLoadError(true);
		// Não faz auto-download em caso de erro - usuário deve usar o botão refresh
	}, [contact?.id]);

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
				
				// Verificar se é erro de sessão
				if (error.response?.data?.sessionError) {
					toast.warn("Conexão WhatsApp indisponível. Verifique se o WhatsApp está conectado.");
				} else {
					toast.error(errorMsg);
				}
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
			<Grid container alignItems="center" spacing={1}>
				{/* Conteúdo do contato com responsividade melhorada */}
				<Grid item xs={12} sm={8} md={6}>
					{renderCardReader()}
				</Grid>
			</Grid>
		</React.Fragment>
	);
};

export default TicketInfo;
