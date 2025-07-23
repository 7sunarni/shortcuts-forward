/* eslint-disable no-undef */
import './wasm_exec.js';

var lastItemTs = 0;
var loadButtonEvent = 0;

function fetchData() {
    if (loadButtonEvent == 0) {
        if (typeof document !== 'undefined') {
            document.getElementById("refresh").addEventListener("click", fetchData);
            loadButtonEvent = 1
        }
    }
    fetch('$YOUR_URL')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            response.json().then(items => {
                if (!items) {
                    return
                }
                console.log(items)
                var latest = items[0];
                if (!latest) {
                    return
                }
                if (lastItemTs >= latest.ts) {
                    return
                }
                console.log("decrypt msg", latest.data)
                decrypt(latest.data)
                lastItemTs = latest.ts
            });
        })
        .then(data => {
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
}

function decrypt(msg) {
    loadWasm(msg);
}

function isWorkdayAndWithinHours() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const isWorkday = day >= 1 && day <= 5;
    const isInTimeRange = hour >= 9 && hour < 21;
    return isWorkday && isInTimeRange;
}

function refresh() {
    if (!isWorkdayAndWithinHours()) {
        return
    }
    if (!chrome) {
        return
    }
    if (!chrome.windows) {
        return
    }
    chrome.windows.getLastFocused({ populate: false }, (window) => {
        if (!window.focused) {
            return
        }
        fetchData()
    });
}


async function loadWasm(data) {
    const go = new Go();
    var wasmPath = chrome.runtime.getURL("main.wasm");
    fetch(wasmPath).then(response =>
        response.arrayBuffer()
    ).then(bytes =>
        WebAssembly.instantiate(bytes, go.importObject)
    ).then(result => {
        go.run(result.instance);
        var decoded = aes256Decode("$YOUR_KEY", data);
        const code = decoded.match(/\d{6}/)?.[0];

        const options = {
            type: 'basic',
            iconUrl: './icon.png',
            title: 'SMS Code: ' + code,
            message: decoded,
        }
        // navigator.clipboard.writeText(code)

        const notificationId = crypto.randomUUID();
        const callback = notificationId => console.log('notificationId: ', notificationId)
        chrome.notifications.create(notificationId, options, callback)
    });
}


export function schedule() {
    refresh()
}