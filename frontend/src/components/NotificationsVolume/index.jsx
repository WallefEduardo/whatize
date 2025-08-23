import React, { useState, useRef } from "react";

import Popover from "@mui/material/Popover";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
//newicons
// // import { Sound, VolumeHigh } from "iconsax-react"; // Biblioteca removida durante migração // Biblioteca removida durante migração

import { Grid, Slider } from "@mui/material";

const NotificationsVolume = ({ volume, setVolume }) => {

    const anchorEl = useRef();
    const [isOpen, setIsOpen] = useState(false);

    const handleClick = () => {
        setIsOpen((prevState) => !prevState);
    };

    const handleClickAway = () => {
        setIsOpen(false);
    };

    const handleVolumeChange = (value) => {
        setVolume(value);
        localStorage.setItem("volume", value);
    };

    return (
        <>
            <IconButton
                sx={{ color: "#fff" }}
                onClick={handleClick}
                ref={anchorEl}
                aria-label="Open Notifications"
            >
                <VolumeUpIcon color="inherit" />
            </IconButton>
            <Popover
                disableScrollLock
                open={isOpen}
                anchorEl={anchorEl.current}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                slotProps={{ 
                    paper: {
                        sx: {
                            width: "100%",
                            maxWidth: 350,
                            marginLeft: (theme) => 16,
                            marginRight: (theme) => 8,
                            "@media (max-width:600px)": {
                                maxWidth: 270,
                            },
                        }
                    }
                }}
                onClose={handleClickAway}
            >
                <List dense sx={{
                    padding: (theme) => 16,
                }}>
                    <Grid container spacing={2}>
                        <Grid item>
                            {/* <VolumeDownIcon /> */}
                        </Grid>
                        <Grid item xs>
                            <Slider
                                value={Number(volume)}
                                aria-labelledby="continuous-slider"
                                step={0.1}
                                min={0}
                                max={1}
                                onChange={(e, value) =>
                                    handleVolumeChange(value)
                                }
                            />
                        </Grid>
                        <Grid item>
                            <VolumeUpIcon />
                        </Grid>
                    </Grid>
                </List>
            </Popover>
        </>
    );
};

export default NotificationsVolume;
