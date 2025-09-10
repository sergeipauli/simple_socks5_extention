let dynamicDomains = [];
let currentConfig = {
    enabled: false,
    mode: "allow",
    host: "",
    list: "",
    listEnabled: false
};

let pacUpdateTimeout = null;

function updatePAC() {
    if (!currentConfig.enabled) {
        chrome.proxy.settings.clear({ scope: 'regular' });
        return;
    }

    let domains = [];
	
    if (currentConfig.listEnabled && currentConfig.list.trim() !== "") {
        domains = currentConfig.list.split(/\s+/).map(d => d.trim()).filter(Boolean);
    }

    if (currentConfig.mode === "allow") {
        domains = [...new Set([...domains, ...dynamicDomains])];
    }

    let pacScript = `
        function FindProxyForURL(url, host) {
            var proxy = "SOCKS5 ${currentConfig.host}";
    `;

    if (domains.length > 0) {
        if (currentConfig.mode === "allow") {
            pacScript += `
                var allowed = ${JSON.stringify(domains)};
                for (var i=0;i<allowed.length;i++){
                    if(dnsDomainIs(host, allowed[i]) || shExpMatch(host, "*." + allowed[i])) {
						return proxy;
					}
                }
				
                return "DIRECT";
            `;
        }
		
		else {
            pacScript += `
                var bypass = ${JSON.stringify(domains)};
                for (var i=0;i<bypass.length;i++){
                    if(dnsDomainIs(host, bypass[i]) || shExpMatch(host, "*." + bypass[i])) {
						return "DIRECT";
					}
                }
				
                return proxy;
            `;
        }
    } else {
        pacScript += `return proxy;`;
    }

    pacScript += ` }`;

    chrome.proxy.settings.set(
        {
            value: {
                mode: "pac_script",
                pacScript: { data: pacScript }
            },
            scope: "regular"
        },
        () => {
            console.log("PAC updated, mode:", currentConfig.mode, "host:", currentConfig.host);
        }
    );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "setProxy") {
        const { host, list, mode, enabled, listEnabled } = message;

        currentConfig = { host, list, mode, enabled, listEnabled };

        updatePAC();

        sendResponse({ status: enabled ? "enabled" : "disabled", host });
        return true;
    }
});

chrome.webRequest.onBeforeRequest.addListener(
    details => {
        if (!currentConfig.enabled || currentConfig.mode !== "allow") {
			return;
		}

        let domain;
		
        try {
            domain = new URL(details.url).hostname;
        } 
		
		catch (err) {
            return; 
        }

        if (!dynamicDomains.includes(domain)) {
            dynamicDomains.push(domain);

            if (pacUpdateTimeout) {
				clearTimeout(pacUpdateTimeout);
			}
			
            pacUpdateTimeout = setTimeout(updatePAC, 300);
        }
    },
    { urls: ["<all_urls>"] }
);
