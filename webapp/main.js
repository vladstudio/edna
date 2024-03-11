import "../src/css/tailwind.css";
import "../src/css/application.sass";

import App from "../src/components/App.vue";
import { boot } from "../src/boot";
import { createApp } from "vue";
import { loadCurrencies } from "../src/currency";

loadCurrencies();
setInterval(loadCurrencies, 1000 * 3600 * 4);

boot().then(() => {
  console.log("booted");
  const app = createApp(App);
  app.mount("#app");
});
