import React from "react";
import { Box } from "@mui/material";

const MainHeaderButtonsWrapper = ({ children }) => {
	return <Box sx={{
		flex: "none",
		marginLeft: "auto",
		"& > *": {
			margin: (theme) => 8,
		},
	}}>{children}</Box>;
};

export default MainHeaderButtonsWrapper;
