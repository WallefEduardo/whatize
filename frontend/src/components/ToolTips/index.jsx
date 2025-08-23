import React from 'react';
import {
	Tooltip,
	Typography,
} from "@mui/material";

const ToolTip = ({ title, content, children }) => {
	return (
		<Tooltip
			arrow
      // placement="bottom"
			slotProps={{
				tooltip: {
					sx: {
						backgroundColor: "#f5f5f9",
						color: "rgba(0, 0, 0, 0.87)",
						fontSize: 14,
						border: "1px solid #dadde9",
						maxWidth: 450,
					}
				},
				popper: {
					sx: {
						textAlign: "center",
					}
				}
			}}
			title={
				<React.Fragment>
					<Typography gutterBottom color="inherit">
						{title}
					</Typography>
					{content && <Typography>{content}</Typography>}
				</React.Fragment>
			}
		>
			{children}
		</Tooltip>
	);
};

export default ToolTip