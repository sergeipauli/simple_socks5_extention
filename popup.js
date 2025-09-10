document.addEventListener('DOMContentLoaded', async () => {
	const aboutBtn = document.querySelector('.about');
	const overlay = document.getElementById('about_overlay');
	const content = overlay.querySelector('.content');
	const enableSwitch = document.getElementById('enable_switch');
	const listSwitch = document.getElementById('list_switch');
	const addressInput = document.querySelector('input[type="text"]');
	const radioInputs = document.querySelectorAll('.radio_container input');
	const radioCircles = document.querySelectorAll('.radio_circle');
	
	function loadSettings() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 200);
        });
    }
	
	aboutBtn.addEventListener('click', () => {
		overlay.classList.toggle('active');
	});

	overlay.addEventListener('click', (e) => {
		if (e.target.id === 'about_overlay') {
			overlay.classList.remove('active');
		}
	});

	content.addEventListener('click', () => {
		document.documentElement.classList.toggle('dark');
		updateRadioHighlight();
		updateIconForTheme();
	});

	window.updateRadioHighlight = function() {
		radioInputs.forEach((input, i) => {
			if (input.checked && listSwitch.checked) {
				radioCircles[i].classList.add('active');
			}
			
			else {
				radioCircles[i].classList.remove('active');
			}

			if (!input.checked && listSwitch.checked) {
				radioCircles[i].classList.add('inactive-list-on');
			}
			
			else {
				radioCircles[i].classList.remove('inactive-list-on');
			}
		});
	}
	
	enableSwitch.addEventListener('change', () => {
		if (enableSwitch.checked) {
			if (!validateProxyAddress(addressInput.value.trim())) {
				flashInputRed(addressInput);
				enableSwitch.checked = false;
				
				return;
			}
		}

		applySettings();
	});

	listSwitch.addEventListener('change', updateRadioHighlight);
	radioInputs.forEach(input => input.addEventListener('change', updateRadioHighlight));

	updateRadioHighlight();
	
	await loadSettings();
	
	document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
});

function validateProxyAddress(address) {
    const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}:\d{1,5}$/;
    const ipv6Regex = /^\[([0-9a-fA-F:]+)\]:\d{1,5}$/;

    return ipv4Regex.test(address) || ipv6Regex.test(address);
}

function flashInputRed(input) {
    const originalBorder = getComputedStyle(input).getPropertyValue('border-color');
    const errorColor = getComputedStyle(document.documentElement).getPropertyValue('--error-color').trim();

    input.style.borderColor = errorColor;
	
    setTimeout(() => {
        input.style.borderColor = originalBorder;
    }, 500);
}

function applySettings() {
	const host = document.querySelector("input[type=text]").value;
	const list = document.querySelector("textarea").value;
	const mode = document.querySelector("input[name=mode]:checked").value;
	const enabled = document.getElementById("enable_switch").checked;
	const listEnabled = document.getElementById("list_switch").checked;

	chrome.runtime.sendMessage({
		type: "setProxy",
		host, 
		list, 
		mode, 
		enabled, 
		listEnabled
	}, (response) => {
		console.log("Proxy response:", response);
	});
}

document.getElementById("enable_switch").addEventListener("change", applySettings);
document.getElementById("list_switch").addEventListener("change", applySettings);
document.querySelectorAll("input, textarea").forEach(el => {el.addEventListener("input", applySettings);});

function updateIconForTheme() {
    const isDark = document.documentElement.classList.contains('dark');

    chrome.action.setIcon({
        path: isDark ? {
            "48": "logo/logo48_dark.png",
            "128": "logo/logo128_dark.png"
        } : {
            "48": "logo/logo48.png",
            "128": "logo/logo128.png"
        }
    });
}

function disableProxyOnChange() {
    const enableSwitch = document.getElementById("enable_switch");
	
    if (enableSwitch.checked) {
        enableSwitch.checked = false;
        applySettings();
    }
}

document.querySelector('input[type="text"]').addEventListener("input", disableProxyOnChange);
document.querySelector("textarea").addEventListener("input", disableProxyOnChange);
document.querySelectorAll('input[name="mode"]').forEach(radio => {radio.addEventListener("change", disableProxyOnChange);});