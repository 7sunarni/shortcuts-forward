import { schedule } from "./index.js";


let intervalId = 0;


chrome.windows.onFocusChanged.addListener(() => {
    chrome.windows.getLastFocused({ populate: false }, (window) => {
        if (!window.focused) {
            if (intervalId !== 0) {
                // fetch('http://localhost/stop')
                clearInterval(intervalId);
                intervalId = 0;
            }
            return
        } else {
            if (intervalId !== 0) {
                return
            }
            // fetch('http://localhost/start')
            intervalId = setInterval(() => {
                schedule()
            }, 1000 * 5);
        }
    })
})