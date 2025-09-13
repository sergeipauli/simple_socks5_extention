# Simple SOCKS5 Extention

<h1 align="center">
  <img src="https://interface.sergeipauli.ru/simple_socks_5_banner_gh.jpg" style="max-width:100%; height:auto;">
</h1>

Simple Chrome extension to enable **SOCKS5 proxy** in your browser with support for domain lists and dynamic content detection.

**Version 1.0.0.1**

## Features

Enable/disable SOCKS5 proxy with a single toggle.
Use **Allow** or **Bypass** lists for domains.
Dynamic detection of domains used by websites (including XHR/Fetch requests).
Dark and light themes.
Real-time validation of proxy address input.

## Usage

1. Enter your SOCKS5 proxy address (IPv4 or IPv6, e.g., `127.0.0.1:9150`).
2. Toggle the **Enable** switch to activate the proxy.
3. Use **Allow** or **Bypass** mode to control which domains go through the proxy.
4. Add domains to the list if necessary.

## Notes

Only Chrome v88+ is supported (Manifest V3).
Invalid proxy addresses are rejected with a visual warning.

### 1.0.0.1

## Changelog
- Fixed memory leak when dynamically adding domains.  
- Improved handling of nested dynamic requests (initiator check).  
- Added domain normalization and validation (removal of protocol, invalid chars).  
- Limited dynamic domains stored in PAC script to 300 entries.  

### 1.0
- Initial release.

## License

MIT License

## About
Sergei Pauli 2025
