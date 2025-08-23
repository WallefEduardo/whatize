import React from "react";
import {
  makeStyles,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Box
} from "@mui/material";
import { PlayCircleOutline } from "@mui/icons-material";

const useStyles = () => ({
  card: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 16,
    cursor: "pointer",
    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.shadows[8]
    },
    "@media (max-width:600px)": {
      flexDirection: "column",
      maxWidth: 320,
    }
  },
  media: {
    width: 200,
    height: 120,
    position: "relative",
    flexShrink: 0,
    "@media (max-width:600px)": {
      width: "100%",
      height: 180,
    }
  },
  playIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "white",
    fontSize: 40,
    opacity: 0.9
  },
  content: {
    flex: 1,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    "@media (max-width:600px)": {
      padding: 16,
      gap: 8,
      height: 140,
      overflow: "hidden",
      justifyContent: "flex-start"
    }
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    hyphens: "auto",
    "@media (max-width:600px)": {
      fontSize: "1rem",
      marginBottom: 0,
      lineHeight: 1.3
    }
  },
  description: {
    color: "#1976d2",
    display: "-webkit-box",
    "-webkit-line-clamp": 3,
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
    marginBottom: 8,
    wordWrap: "break-word",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    hyphens: "auto",
    "@media (max-width:600px)": {
      fontSize: "0.875rem",
      "-webkit-line-clamp": 2,
      lineHeight: 1.4,
      flex: 1,
      marginBottom: 0
    }
  },
  categoryChip: {
    alignSelf: "flex-start",
    marginTop: "auto"
  }
});

const HelpVideoCard = ({ video, onClick }) => {
  const classes = useStyles();

  const handleClick = () => {
    if (onClick) {
      onClick(video);
    }
  };

  return (
    <Card className={classes.card} onClick={handleClick}>
      <CardMedia
        className={classes.media}
        image={`https://img.youtube.com/vi/${video.video}/mqdefault.jpg`}
        title={video.title}
      >
        <PlayCircleOutline className={classes.playIcon} />
      </CardMedia>
      
      <CardContent className={classes.content}>
        <Box>
          <Typography variant="h6" className={classes.title}>
            {video.title}
          </Typography>
          
          {video.description && (
            <Typography variant="body2" className={classes.description}>
              {video.description}
            </Typography>
          )}
        </Box>
        
        {video.category && (
          <Chip 
            label={video.category}
            size="small"
            variant="outlined"
            className={classes.categoryChip}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default HelpVideoCard; 