import React, { useState } from "react";

import { CssBaseline, IconButton } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

const DarkMode = (props) => {

    const [theme, setTheme] = useState("light");

    const themeToggle = () => {
        theme === "light" ? setTheme("dark") : setTheme("light");
    };

    const handleClick = () => {
        props.themeToggle();
        themeToggle();
    };

    return (
        <>
            {theme === "light" ? (
                <>
                    <CssBaseline />
                    <IconButton
                        sx={{ color: "#fff" }}
                        onClick={handleClick}
                        // ref={anchorEl}
                        aria-label="Dark Mode"
                        color="inherit"
                    >
                        <Brightness4Icon />
                    </IconButton>
                </>
            ) : (
                <>
                    <CssBaseline />
                    <IconButton
                        sx={{ color: "#fff" }}
                        onClick={handleClick}
                        // ref={anchorEl}
                        aria-label="Dark Mode"
                        color="inherit"
                    >
                        <Brightness7Icon />
                    </IconButton>
                </>
            )}
        </>
    );
};

export default DarkMode;
