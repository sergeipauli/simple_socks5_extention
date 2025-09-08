chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "setProxy") {
        const { host, list, mode, enabled, listEnabled } = message;

        if (!enabled) {
            chrome.proxy.settings.clear({ scope: 'regular' });
            sendResponse({ status: "disabled" });
			
            return true;
        }

        let pacScript = `
            function FindProxyForURL(url, host) {
                var proxy = "SOCKS5 ${host}";
        `;

        if (listEnabled && list.trim() !== "") {
            const domains = list.split(/\s+/).map(d => d.trim()).filter(Boolean);
			
            if (message.mode === "allow") {
                pacScript += `
                    var allowed = ${JSON.stringify(domains)};
                    for (var i = 0; i < allowed.length; i++) {
                        if (dnsDomainIs(host, allowed[i])) {
                            return proxy;
                        }
                    }
                    return "DIRECT";
                `;
            }
			
			else {
                pacScript += `
                    var bypass = ${JSON.stringify(domains)};
                    for (var i = 0; i < bypass.length; i++) {
                        if (dnsDomainIs(host, bypass[i])) {
                            return "DIRECT";
                        }
                    }
                    return proxy;
                `;
            }
        }
		
		else {
            pacScript += `return proxy;`;
        }

        pacScript += `
            }
        `;

        chrome.proxy.settings.set(
            {
                value: {
                    mode: "pac_script",
                    pacScript: {
                        data: pacScript
                    }
                },
                scope: "regular"
            },
            () => {
                sendResponse({ status: "enabled", host });
            }
        );

        return true;
    }
});
