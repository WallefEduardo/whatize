import React from "react";
import {
  makeStyles,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Chip,
  Box
} from "@material-ui/core";
import { PlayCircleOutline } from "@material-ui/icons";

const useStyles = makeStyles(theme => ({
  card: {
    display: "flex",
    flexDirection: "row",
    marginBottom: theme.spacing(2),
    cursor: "pointer",
    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.shadows[8]
    },
    [theme.breakpoints.down('md')]: {
      flexDirection: "column",
      maxWidth: 320,
    }
  },
  media: {
    width: 200,
    height: 120,
    position: "relative",
    flexShrink: 0,
    [theme.breakpoints.down('md')]: {
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
    padding: theme.spacing(1.5),
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(2),
      gap: theme.spacing(1),
      height: 140,
      overflow: "hidden",
      justifyContent: "flex-start"
    }
  },
  title: {
    fontWeight: "bold",
    marginBottom: theme.spacing(1),
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
    wordWrap: "break-word",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    hyphens: "auto",
    [theme.breakpoints.down('md')]: {
      fontSize: "1rem",
      marginBottom: 0,
      lineHeight: 1.3
    }
  },
  description: {
    color: theme.palette.text.secondary,
    display: "-webkit-box",
    "-webkit-line-clamp": 3,
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
    marginBottom: theme.spacing(1),
    wordWrap: "break-word",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    hyphens: "auto",
    [theme.breakpoints.down('md')]: {
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
}));

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