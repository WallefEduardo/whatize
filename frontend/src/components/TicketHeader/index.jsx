import React, { useEffect } from "react";

import { Card, Button } from "@mui/material";
import TicketHeaderSkeleton from "../TicketHeaderSkeleton";
import ArrowBackIos from "@mui/icons-material/ArrowBackIos";
import { useHistory } from "react-router-dom";

const TicketHeader = ({ loading, children }) => {
	const history = useHistory();

	const handleBack = () => {

		history.push("/tickets");
	};

	// useEffect(() => {
	// 	const handleKeyDown = (event) => {
	// 		if (event.key === "Escape") {
	// 			handleBack();
	// 		}
	// 	};
	// 	document.addEventListener("keydown", handleKeyDown);
	// 	return () => {
	// 		document.removeEventListener("keydown", handleKeyDown);
	// 	};
	// }, [history]);

	return (
		<>
			{loading ? (
				<TicketHeaderSkeleton />
			) : (
				<Card
					square
					sx={{
						display: "flex",
						background: "var(--color-primary)",
						flex: "none",
						borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
						height: "65px",
						alignItems: "center",
						padding: 1,
						"@media (max-width:600px)": {
							flexWrap: "wrap",
							height: 'auto',
							minHeight: "65px",
							padding: 1
						}
					}}
				>
					<Button color="primary" onClick={handleBack}>
						<ArrowBackIos />
					</Button>
					{children}
				</Card>
			)}
		</>
	);
};

export default TicketHeader;
