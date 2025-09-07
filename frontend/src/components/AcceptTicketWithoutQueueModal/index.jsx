import React, { useState, useContext, useEffect } from "react";
import { useHistory } from "react-router-dom";

import {
    Box,
    Typography
} from "@mui/material";
import { MessageSquare } from "lucide-react";

import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import ModernModal from "../ModernModal";
import SimpleSelect from "../ui/SimpleSelect";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import ShowTicketOpen from "../ShowTicketOpenModal";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import { TicketsContext } from "../../context/Tickets/TicketsContext";

const AcceptTicketWithouSelectQueue = ({ modalOpen, onClose, ticketId, ticket }) => {
	const history = useHistory();
	const [selectedQueue, setSelectedQueue] = useState('');
	const [loading, setLoading] = useState(false);
	const [queues, setQueues] = useState([]);
	const [loadingQueues, setLoadingQueues] = useState(true);
	const { user } = useContext(AuthContext);
	const [openAlert, setOpenAlert] = useState(false);
	const [userTicketOpen, setUserTicketOpen] = useState("");
	const [queueTicketOpen, setQueueTicketOpen] = useState("");
	const { tabOpen, setTabOpen } = useContext(TicketsContext);

	const { get: getSetting } = useCompanySettings();

	// Buscar filas disponíveis
	useEffect(() => {
		const fetchQueues = async () => {
			try {
				setLoadingQueues(true);
				const response = await api.get("/queue");
				const availableQueues = response.data;
				setQueues(availableQueues);
				
				// Auto-selecionar se houver apenas uma fila
				if (availableQueues.length === 1) {
					setSelectedQueue(availableQueues[0].id.toString());
				}
			} catch (err) {
				console.error("Erro ao buscar filas:", err);
				toastError(err);
				// Fallback para user.queues se a API falhar
				if (user?.queues?.length > 0) {
					setQueues(user.queues);
					if (user.queues.length === 1) {
						setSelectedQueue(user.queues[0].id.toString());
					}
				}
			} finally {
				setLoadingQueues(false);
			}
		};

		if (modalOpen) {
			fetchQueues();
		}
	}, [modalOpen, user]);

	const handleClose = () => {
		onClose();
		setSelectedQueue("");
	};

	const handleCloseAlert = () => {
		setOpenAlert(false);
		setLoading(false)
	};

	const handleSendMessage = async (id) => {
		let isGreetingMessage = false;

		try {
			const setting = await getSetting({
				"column": "sendGreetingAccepted"
			});
			if (setting.sendGreetingAccepted === "enabled") isGreetingMessage = true;
		} catch (err) {
			toastError(err);
		}

		let settingMessage
		try {
			settingMessage = await getSetting({
				"column": "greetingAcceptedMessage"
			})
		} catch (err) {
			toastError(err);
		}

		if (isGreetingMessage && (!ticket.isGroup || ticket.whatsapp?.groupAsTicket === "enabled") && ticket.status === "pending") {
			const msg = `${settingMessage.greetingAcceptedMessage}`;
			const message = {
				read: 1,
				fromMe: true,
				mediaUrl: "",
				body: `${msg.trim()}`,
			};
			try {
				await api.post(`/messages/${id}`, message);
			} catch (err) {
				toastError(err);
			}
		}
	};

	const handleUpdateTicketStatus = async (queueId) => {
		setLoading(true);
		try {
			console.log('🎯 Atualizando status do ticket:', ticketId, 'para fila:', queueId);
			
			const otherTicket = await api.put(`/tickets/${ticketId}`, {
				status: ticket.isGroup && ticket.channel === 'whatsapp' ? "group" : "open",
				userId: user?.id || null,
				queueId: queueId
			});

			console.log('✅ Ticket atualizado com sucesso:', otherTicket.data);
			

			if (otherTicket.data.id !== ticket.id) {
				if (otherTicket.data.userId !== user?.id) {
					setOpenAlert(true)
					setUserTicketOpen(otherTicket.data.user.name)
					setQueueTicketOpen(otherTicket.data.queue.name)
				} else {
					setLoading(false);
					setTabOpen(otherTicket.isGroup ? "group" : "open");
					history.push(`/chat-moderno/${otherTicket.data.uuid}`);
				}
			} else {
				await handleSendMessage(ticket.id);
				setLoading(false);
				setTabOpen(ticket.isGroup ? "group" : "open");
				console.log('🔄 Navegando para:', `/chat-moderno/${ticket.uuid}`);
				history.push(`/chat-moderno/${ticket.uuid}`);
				handleClose();
			}
		} catch (err) {
			console.error('❌ Erro ao aceitar ticket:', err);
			setLoading(false);
			toastError(err);
		}
	};

	const handleStart = () => {
		handleUpdateTicketStatus(selectedQueue);
	};

	const actions = [
		{
			type: 'cancel',
			label: i18n.t("ticketsList.buttons.cancel"),
			onClick: handleClose,
			disabled: loading
		},
		{
			type: 'primary',
			label: i18n.t("ticketsList.buttons.start"),
			onClick: handleStart,
			disabled: selectedQueue === "" || loading || loadingQueues
		}
	];

	return (
		<>
			<ModernModal
				open={modalOpen}
				onClose={handleClose}
				title={
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
						<Box
							sx={{
								width: '36px',
								height: '36px',
								borderRadius: '8px',
								backgroundColor: 'var(--color-accent)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								color: 'white'
							}}
						>
							<MessageSquare size={18} />
						</Box>
						<Box>
							<Typography 
								variant="h6" 
								sx={{ 
									fontSize: '16px',
									fontWeight: 600,
									color: 'var(--text-primary)',
									mb: 0.5
								}}
							>
								Aceitar Conversa
							</Typography>
							<Typography 
								variant="body2" 
								sx={{ 
									color: 'var(--text-secondary)',
									fontSize: '13px',
									lineHeight: 1.4
								}}
							>
								Selecione uma fila para aceitar esta conversa e iniciar o atendimento
							</Typography>
						</Box>
					</Box>
				}
				size="md"
				actions={actions}
			>
				<Box sx={{ py: 1 }}>
					
					{/* Campo de seleção de fila */}
					<Box sx={{ mb: 2 }}>
						
						{loadingQueues ? (
							<Box 
								sx={{ 
									display: 'flex', 
									alignItems: 'center', 
									justifyContent: 'center', 
									py: 2,
									color: 'var(--text-secondary)'
								}}
							>
								Carregando filas...
							</Box>
						) : (
							<SimpleSelect
								options={queues}
								value={selectedQueue}
								onChange={(queueId, queue) => setSelectedQueue(queueId)}
								placeholder="Selecione uma fila..."
								displayKey="name"
								valueKey="id"
								size="md"
								disabled={loadingQueues || queues.length === 0}
							/>
						)}
					</Box>
					
					{/* Preview da fila selecionada */}
					{selectedQueue && queues.length > 0 && (
						<Box 
							sx={{ 
								mt: 2, 
								p: 2, 
								backgroundColor: 'var(--bg-secondary)', 
								borderRadius: '8px',
								border: '1px solid var(--border-primary)'
							}}
						>
							<Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
								Fila selecionada:
							</Typography>
							<Box
								sx={{ 
									color: 'var(--text-primary)', 
									fontWeight: 600,
									mt: 0.5,
									display: 'flex',
									alignItems: 'center',
									gap: 1,
									fontSize: '0.875rem',
									lineHeight: 1.43
								}}
							>
								<Box
									sx={{
										width: '8px',
										height: '8px',
										borderRadius: '50%',
										backgroundColor: queues.find(q => q.id.toString() === selectedQueue)?.color || 'var(--color-accent)',
									}}
								/>
								{queues.find(q => q.id.toString() === selectedQueue)?.name}
							</Box>
						</Box>
					)}

					{/* Mensagem quando não há filas */}
					{!loadingQueues && queues.length === 0 && (
						<Box 
							sx={{ 
								p: 2, 
								backgroundColor: 'var(--bg-secondary)', 
								borderRadius: '8px',
								border: '1px solid var(--border-primary)',
								textAlign: 'center'
							}}
						>
							<Typography 
								variant="body2" 
								sx={{ 
									color: 'var(--text-secondary)',
									fontSize: '13px'
								}}
							>
								Nenhuma fila disponível para este usuário.
							</Typography>
						</Box>
					)}
				</Box>
			</ModernModal>

			<ShowTicketOpen
				isOpen={openAlert}
				handleClose={handleCloseAlert}
				user={userTicketOpen}
				queue={queueTicketOpen}
			/>
		</>
	);
};

export default AcceptTicketWithouSelectQueue;