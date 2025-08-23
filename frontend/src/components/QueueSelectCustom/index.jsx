import React, { useEffect, useState } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import { Box } from "@mui/material";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";

const QueueSelectCustom = ({ selectedQueueIds, onChange }) => {
	const [queues, setQueues] = useState([]);

	useEffect(() => {
		(async () => {
			try {
				const { data } = await api.get("/queue");
				setQueues(data);
			} catch (err) {
				toastError(err);
			}
		})();
	}, []);

	const handleChange = e => {
		onChange(e.target.value);
	};

	return (
		<div style={{ marginTop: 6 }}>
			<FormControl fullWidth margin="dense" variant="outlined">
				<InputLabel>{i18n.t("queueSelect.inputLabel")}</InputLabel>
				<Select
					multiple
					labelWidth={60}
					value={selectedQueueIds}
					onChange={handleChange}
					MenuProps={{
						anchorOrigin: {
							vertical: "bottom",
							horizontal: "left",
						},
						transformOrigin: {
							vertical: "top",
							horizontal: "left",
						},
						getContentAnchorEl: null,
					}}
					renderValue={selected => (
						<Box sx={{
							display: "flex",
							flexWrap: "wrap",
						}}>
							{selected?.length > 0 &&
								selected.map(id => {
									if (id === "0") {
										return (
											<Chip
												key={id}
												size="small"
												label={i18n.t("queueSelect.withoutQueue")}
												sx={{ margin: 0.25 }}
											/>
										);
									}
									const queue = queues.find(q => q.id === id);
									return queue ? (
										<Chip
											key={id}
											style={{ backgroundColor: queue.color }}
											variant="outlined"
											label={queue.name}
											sx={{ margin: 0.25 }}
										/>
									) : null;
								})}
						</Box>
					)}
				>
					<MenuItem value="0">
						{i18n.t("queueSelect.withoutQueue")}
					</MenuItem>
					{queues.map(queue => (
						<MenuItem key={queue.id} value={queue.id}>
							{queue.name}
						</MenuItem>
					))}
				</Select>
			</FormControl>
		</div>
	);
};

export default QueueSelectCustom;
