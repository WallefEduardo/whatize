import React, { useState, useEffect, createContext } from "react";
import { useHistory, useLocation } from "react-router-dom";

const TicketsContext = createContext();

const TicketsContextProvider = ({ children }) => {
	const [currentTicket, setCurrentTicket] = useState({ id: null, code: null });
	const [tabOpen, setTabOpen] = useState("open");
	const history = useHistory();
	const location = useLocation();

	useEffect(() => {
		if (currentTicket && currentTicket.id !== null && currentTicket.uuid) {
			// Não redirecionar se estivermos no chat moderno
			if (location.pathname.startsWith('/chat-moderno')) {
				return;
			}
			
			history.push(`/tickets/${currentTicket.uuid}`);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentTicket, location.pathname])

	return (
		<TicketsContext.Provider
			value={{ currentTicket, setCurrentTicket, tabOpen, setTabOpen }}
		>
			{children}
		</TicketsContext.Provider>
	);
};

export { TicketsContext, TicketsContextProvider };
