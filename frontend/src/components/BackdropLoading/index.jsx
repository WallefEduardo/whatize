import React from "react";

import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";

const BackdropLoading = () => {
	return (
		<Backdrop 
			sx={{
				zIndex: 9999,
				color: "#fff",
			}}
			open={true}
		>
			<CircularProgress color="inherit" />
		</Backdrop>
	);
};

export default BackdropLoading;
