import React from "react";

import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

const useStyles = () => ({
	backdrop: {
		zIndex: 9999,
		color: "#fff",
	},
});

const BackdropLoading = () => {
	const classes = useStyles();
	return (
		<Backdrop className={classes.backdrop} open={true}>
			<CircularProgress color="inherit" />
		</Backdrop>
	);
};

export default BackdropLoading;
