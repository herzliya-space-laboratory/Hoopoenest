import "materialize-css/dist/js/materialize.min.js";
import "materialize-css/dist/css/materialize.min.css";

import App from "./App.svelte";

const app = new App({
	target: document.body,
	props: {},
});

// M.AutoInit();

export default app;
