import '../src/css/application.sass'

import { createApp } from 'vue'
import App from '../src/components/App.vue'
import { loadCurrencies } from '../src/currency'
import { getGitHubToken, apiGetPaginateAll } from "../src/githubapi";
import { startTimer } from "../src/utils"

const app = createApp(App)
app.mount('#app')
//console.log("test:", app.hej.test)

// load math.js currencies
loadCurrencies()
setInterval(loadCurrencies, 1000 * 3600 * 4)

let ghToken = getGitHubToken()
console.log("ghToken:", ghToken)
if (false && ghToken) {
    const durFn = startTimer()
    const gists = await apiGetPaginateAll("/gists?per_page=100")
    console.log("gists:", gists)
    console.log(`getting gists took ${durFn()} ms to get info about ${gists.length} gists`)
}
