Radiodan Discovery extensions
===

This Chrome Extension listens for Radiodan services on the local network (found by the Discovery Helper Chrome App) and allows them to be controlled.

Remote control
---
Clicking on the ![](shared/icon.png) icon in the browser toolbar will bring up a list of remote controllable devices on the local network. Selecting a device from the list will open a new tab containing a remote control interface for that device. From here you can play, pause and search music stored on the device.

Content script
---
Web page authors can indicate that they have playable streams by adding the `mediascape-playable-stream` attribute to a DOM element within their pages. When clicked, that DOM element will display a list of available devices on the local network. Selecting a device from the list will start the stream playing on the remote device.