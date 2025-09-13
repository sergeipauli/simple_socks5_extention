let dynamicDomains = new Set();
let currentConfig = {
    enabled: false,
    mode: "allow",
    host: "",
    list: "",
    listEnabled: false
};

let pacUpdateTimeout = null;

function normalizeDomain(domain) {
	try {
		const domainPattern = /^[a-z0-9.-]+$/;
		
		if (!domain) {
			return null;
		}

		domain = domain.trim().toLowerCase();
		domain = domain.replace(/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//, "");
		domain = domain.split("/")[0];

		if (!domainPattern.test(domain) || !domain.includes(".")) {
			return null;
		}
		
		return domain;
		
	}
	
	catch {
		return null;
	}
}

function updatePAC() {
    if (!currentConfig.enabled) {
        chrome.proxy.settings.clear({ scope: "regular" });
		
        return;
    }

    let domains = [];

    if (currentConfig.listEnabled && currentConfig.list.trim() !== "") {
        domains = currentConfig.list
            .split(/\s+/)
            .map(d => normalizeDomain(d))
            .filter(Boolean);
    }

    if (currentConfig.mode === "allow") {
        domains = [...new Set([...domains, ...dynamicDomains])];
    }

    if (domains.length > 300) {
        domains = domains.slice(-300);
    }

    const proxy = `SOCKS5 ${currentConfig.host}`;
    let pacScript = `
        function FindProxyForURL(url, host) {
            var proxy = "${proxy}";
    `;

    if (domains.length > 0) {
        const listVar = currentConfig.mode === "allow" ? "allowed" : "bypass";
        pacScript += `
            var ${listVar} = ${JSON.stringify(domains)};
            for (var i = 0; i < ${listVar}.length; i++) {
                if (dnsDomainIs(host, ${listVar}[i]) || shExpMatch(host, "*." + ${listVar}[i])) {
                    return ${currentConfig.mode === "allow" ? "proxy" : '"DIRECT"'};
                }
            }
            return ${currentConfig.mode === "allow" ? '"DIRECT"' : "proxy"};
        `;
    }
	
	else {
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
            console.log(
                "PAC updated.",
                "Mode:", currentConfig.mode,
                "Host:", currentConfig.host,
                "Domains:", domains.length
            );
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

        let normalized;
		
        try {
            normalized = normalizeDomain(new URL(details.url).hostname);
        }
		
		catch {
            return;
        }

        let initiator_domain = null;
		
        if (details.initiator) {
            try {
                initiator_domain = normalizeDomain(new URL(details.initiator).hostname);
            } catch {}
        }

        const base_list = new Set(
            currentConfig.list.split(/\s+/).map(normalizeDomain).filter(Boolean)
        );

        const in_base = initiator_domain && Array.from(base_list).some(base =>
            initiator_domain === base || initiator_domain.endsWith("." + base)
        );

        if (in_base) {
            if (!dynamicDomains.has(normalized)) {
                dynamicDomains.add(normalized);

                if (pacUpdateTimeout) {
                    clearTimeout(pacUpdateTimeout);
                }
				
                pacUpdateTimeout = setTimeout(updatePAC, 2000);
            }
        }
    },
    { urls: ["<all_urls>"] }
);