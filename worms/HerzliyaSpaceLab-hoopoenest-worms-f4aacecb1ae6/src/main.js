import "../node_modules/materialize-css/dist/css/materialize.css";
import "../node_modules/materialize-css/dist/js/materialize";
import App from "./App.svelte";

const app = new App({
	target: document.body,
});

// init material plugins
M.AutoInit();

export default app;
