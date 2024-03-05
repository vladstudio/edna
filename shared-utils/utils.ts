
export let platform
export let platformName : string

// @ts-ignore
const uaPlatform : string = window.navigator?.userAgentData?.platform || window.navigator.platform
if (uaPlatform.indexOf("Win") !== -1) {
    platform = {
        isMac: false,
        isWindows: true,
        isLinux: false,
    }
    platformName = "windows"
}  else if (uaPlatform.indexOf("Linux") !== -1) {
    platform = {
        isMac: false,
        isWindows: false,
        isLinux: true,
    }
    platformName = "linux"
} else {
    platform = {
        isMac: true,
        isWindows: false,
        isLinux: false,
    }
    platformName = "darwin"
}
platform.isWebApp = true
