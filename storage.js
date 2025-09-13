document.addEventListener('DOMContentLoaded', () => {
	const enableSwitch = document.getElementById('enable_switch');
	const listSwitch = document.getElementById('list_switch');
	const addressInput = document.querySelector('input[type="text"]');
	const textarea = document.querySelector('textarea');
	const radioInputs = document.querySelectorAll('.radio_container input');

	const themeClass = document.documentElement;

	chrome.storage.sync.get(
		{
			enableSwitch: false,
			listSwitch: false,
			address: '',
			listText: '',
			mode: 'allow',
			darkTheme: false
		},
		
		(items) => {
			enableSwitch.checked = items.enableSwitch;
			listSwitch.checked = items.listSwitch;
			addressInput.value = items.address;
			textarea.value = items.listText;
			radioInputs.forEach(input => input.checked = input.value === items.mode);
			
			if (items.darkTheme) {
				themeClass.classList.add('dark');
			}
			
			else {
				themeClass.classList.remove('dark');
			}

			updateRadioHighlight();
		}
	);

	function saveState() {
		let mode = 'allow';
		
		radioInputs.forEach(input => {
			if (input.checked) mode = input.value;
		});

		chrome.storage.sync.set({
			enableSwitch: enableSwitch.checked,
			listSwitch: listSwitch.checked,
			address: addressInput.value,
			listText: textarea.value,
			mode: mode,
			darkTheme: themeClass.classList.contains('dark')
		});
	}

	enableSwitch.addEventListener('change', saveState);
	listSwitch.addEventListener('change', saveState);
	addressInput.addEventListener('input', saveState);
	textarea.addEventListener('input', saveState);
	radioInputs.forEach(input => input.addEventListener('change', saveState));

	const overlayContent = document.querySelector('#about_overlay .content');
	
	if (overlayContent) {
		overlayContent.addEventListener('click', saveState);
	}
});
