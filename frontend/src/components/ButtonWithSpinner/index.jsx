import React from "react";

import { green } from "@mui/material/colors";
import { CircularProgress, Button } from "@mui/material";

const ButtonWithSpinner = ({ loading, children, ...rest }) => {
	return (
		<Button sx={{ position: "relative" }} disabled={loading} {...rest}>
			{children}
			{loading && (
				<CircularProgress 
					size={24} 
					sx={{
						color: green[500],
						position: "absolute",
						top: "50%",
						left: "50%",
						marginTop: -1.5,
						marginLeft: -1.5,
					}} 
				/>
			)}
		</Button>
	);
};

export default ButtonWithSpinner;
