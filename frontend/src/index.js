import React from "react";
import ReactDOM from "react-dom";
import CssBaseline from "@material-ui/core/CssBaseline";
import * as serviceworker from './serviceWorker'

// Importar Tailwind CSS
import "./styles/tailwind.css";

import App from "./App";

ReactDOM.render(
	<CssBaseline>
		<App />
	</CssBaseline>,
	document.getElementById("root"),
	() => {
		window.finishProgress();
	}
);

serviceworker.register()