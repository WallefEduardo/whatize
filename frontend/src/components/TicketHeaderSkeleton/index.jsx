import React from "react";

import { Avatar, Card, CardHeader } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";

const TicketHeaderSkeleton = () => {
	return (
		<Card square sx={{
			display: "flex",
			background: (theme) => "#1976d2",
			flex: "none",
			borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
			height: "65px"
		}}>
			<CardHeader
				titleTypographyProps={{ noWrap: true }}
				subheaderTypographyProps={{ noWrap: true }}
				avatar={
					<Skeleton animation="wave" variant="circle">
						<Avatar alt="contact_image" />
					</Skeleton>
				}
				title={<Skeleton animation="wave" width={80} />}
				subheader={<Skeleton animation="wave" width={140} />}
			/>
		</Card>
	);
};

export default TicketHeaderSkeleton;
