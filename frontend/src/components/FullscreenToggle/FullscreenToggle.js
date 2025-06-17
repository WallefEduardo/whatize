import React, { useState } from "react";
import { IconButton } from "@material-ui/core";
import FullscreenIcon from "@material-ui/icons/Fullscreen";
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

const FullscreenToggle = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen(); // Firefox
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen(); // Chrome, Safari e Opera
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen(); // IE/Edge
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

   return (
    <IconButton onClick={toggleFullscreen} style={{ marginRight: "6px" }}> {/* Adicionando margem à direita */}
      {isFullscreen ? (
        <FullscreenExitIcon style={{ color: "white", fontSize: "2rem" }} />
      ) : (
        <FullscreenIcon style={{ color: "white", fontSize: "2rem" }} />
      )}
    </IconButton>
  );
};

export default FullscreenToggle;
