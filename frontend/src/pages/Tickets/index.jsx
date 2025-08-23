import React from "react";
import { useParams } from "react-router-dom";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";

import TicketsManager from "../../components/TicketsManager";
import Ticket from "../../components/Ticket";

import { i18n } from "../../translate/i18n";

// Styled components
const ChatContainer = styled('div')(({ theme }) => ({
	flex: 1,
	backgroundColor: "#eee",
	padding: 32,
	height: `calc(100% - 100px)`,
	overflowY: "hidden",
});

const ChatPaper = styled(Paper)(() => ({
	display: "flex",
	height: "100%",
	boxShadow: `rgba(149, 157, 165, 0.5) 0px 8px 24px`
});

const ContactsWrapper = styled(Grid)(() => ({
	display: "flex",
	height: "100%",
	flexDirection: "column",
	overflowY: "hidden",
});

const MessagesWrapper = styled(Grid)(() => ({
	display: "flex",
	height: "100%",
	flexDirection: "column",
});

const WelcomeMsg = styled(Paper)(({ theme }) => ({
	background: "var(--color-primary)",
	display: "flex",
	justifyContent: "space-evenly",
	alignItems: "center",
	height: "100%",
	textAlign: "center",
});

const Chat = () => {
	const { ticketId } = useParams();

	return (
		<ChatContainer>
			<ChatPaper>
				<Grid container spacing={0}>
					<ContactsWrapper item xs={4}>
						<TicketsManager />
					</ContactsWrapper>
					<MessagesWrapper item xs={8}>
						{ticketId ? (
							<>
								<Ticket />
							</>
						) : (
							<WelcomeMsg square>
								<span>
									<center>
										{i18n.t("chat.noTicketMessage")}
									</center>
								</span>
							</WelcomeMsg>
						)}
					</MessagesWrapper>
				</Grid>
			</ChatPaper>
		</ChatContainer>
	);
};

export default Chat;