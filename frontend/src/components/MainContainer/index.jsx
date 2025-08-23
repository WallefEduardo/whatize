import React from "react";

import Container from "@mui/material/Container";

const useStyles = () => ({
	mainContainer: {
		flex: 1,
		padding: `16px`,
		height: `calc(100% - 78px)`,
		maxWidth: `100%`,
		background: "#f5f5f5",
	},

	contentWrapper: {
		height: "100%",
		display: "flex",
		flexDirection: "column",
		borderRadius: `14px`,
		overflow: `hidden`
	},
});

const MainContainer = ({ children }) => {
	const classes = useStyles();

	return (
		<Container className={classes.mainContainer}>
			<div className={classes.contentWrapper}>{children}</div>
		</Container>
	);
};

export default MainContainer;
