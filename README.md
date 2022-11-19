# DMX
_Note: Must be run using 32-bit node because of FTD2XX.dll_

Electron application to use Enttec DMX USB interface devices to control DMX fixtures.

## Development Resources
- [Enttec product page](https://www.enttec.com/product/lighting-communication-protocols/dmx512/open-dmx-usb/)
- [FTD DLL References](https://ftdichip.com/software-examples/code-examples/csharp-examples/)

## Setup
1. Create a user environment variable `DMX_USB_QUEUE_DIRECTORY` that points to `%USERPROFILE%\AppData\Local\dmx\queue`. This is where the DmxUsb C# console app will pick up files to set the DMX channel values.
2. Run the DmxUsb C# console app.