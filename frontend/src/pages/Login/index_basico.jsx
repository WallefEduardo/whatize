import React, { useState, useContext, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import ColorModeContext from "../../layout/themeContext";
import useSettings from "../../hooks/useSettings";
import IconButton from "@mui/material/IconButton";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { Helmet } from "react-helmet";

const useStyles = () => ({
	root: {
		width: "100vw",
		height: "100vh",
		background: "light" === "light" ? "#1976d2",
		backgroundRepeat: "no-repeat",
		backgroundSize: "100% 100%",
		backgroundPosition: "center",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		textAlign: "center",
	},
	paper: {
		backgroundColor: "light" === "light" ? "rgba(255, 255, 255, 0.7)" : "rgba(255, 255, 255, 0.2)",
		backdropFilter: "blur(10px)",
		boxShadow: "light" === "light" ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "0 4px 6px rgba(255, 255, 255, 0.2)",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		padding: "55px 30px",
		borderRadius: "12.5px",
	},
	avatar: {
		margin: 8,
		backgroundColor: "#1976d2",
	},
	form: {
		width: "100%",
		marginTop: 8,
	},
	submit: {
		margin: 8,
	},
	powered: {
		color: "white",
	},
	logoImg: {
		width: "100%",
		maxWidth: "350px",
		height: "auto",
		maxHeight: "120px",
		margin: "0 auto",
		content: "url(" + ("light" === "light" ? theme.calculatedLogoLight() : theme.calculatedLogoDark()) + ")",
	},
	iconButton: {
		position: "absolute",
		top: 10,
		right: 10,
		color: "light" === "light" ? "black" : "white",
	},
});

const Login = () => {
	const classes = useStyles();
	const { colorMode } = useContext(ColorModeContext);
	const { appLogoFavicon, appName, mode } = colorMode;
	const [user, setUser] = useState({ email: "", password: "" });
	const [allowSignup, setAllowSignup] = useState(false);
	const { getPublicSetting } = useSettings();
	const { handleLogin } = useContext(AuthContext);

	const handleChangeInput = (e) => {
		setUser({ ...user, [e.target.name]: e.target.value });
	};

	const handlSubmit = (e) => {
		e.preventDefault();
		handleLogin(user);
	};

	useEffect(() => {
		getPublicSetting("allowSignup")
			.then((data) => {
				setAllowSignup(data === "enabled");
			})
			.catch((error) => {
				console.log("Error reading setting", error);
			});
	}, []);

	return (
		<>
			<Helmet>
				<title>{appName || "Ojos Chat"}</title>
				<link rel="icon" href={appLogoFavicon || "/default-favicon.ico"} />
			</Helmet>
			<div className={classes.root}>
				<Container component="main" maxWidth="xs">
					<CssBaseline />
					<div className={classes.paper}>
						<IconButton className={classes.iconButton} onClick={colorMode.toggleColorMode}>
							{mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
						</IconButton>
						<div>
							<img className={classes.logoImg} alt="logo" />
						</div>
						<form className={classes.form} noValidate onSubmit={handlSubmit}>
							<TextField
								variant="outlined"
								margin="normal"
								required
								fullWidth
								id="email"
								label={i18n.t("login.form.email")}
								name="email"
								value={user.email}
								onChange={handleChangeInput}
								autoComplete="email"
								autoFocus
							/>
							<TextField
								variant="outlined"
								margin="normal"
								required
								fullWidth
								name="password"
								label={i18n.t("login.form.password")}
								type="password"
								id="password"
								value={user.password}
								onChange={handleChangeInput}
								autoComplete="current-password"
							/>
							<Button type="submit" fullWidth variant="contained" color="primary" className={classes.submit}>
								{i18n.t("login.buttons.submit")}
							</Button>
							{allowSignup && (
								<Grid container>
									<Grid item>
										<Link href="#" variant="body2" component={RouterLink} to="/signup">
											{i18n.t("login.buttons.register")}
										</Link>
									</Grid>
								</Grid>
							)}
						</form>
					</div>
				</Container>
			</div>
		</>
	);
};

export default Login;