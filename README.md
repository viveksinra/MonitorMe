# 🕵️‍♂️ LAN-Based PC Monitoring System

A discreet, internal monitoring tool for viewing team PC screens and audio in real-time over a local network. It is built entirely on free and open-source technologies, ensuring no licensing costs.

## 📄 Overview

This project provides a supervisor with the ability to monitor team members' computer screens and listen to their system audio without being detected. The system is designed to operate exclusively within a local area network (LAN), ensuring that all monitored data remains within the organization's private network.

After a one-time installation and consent process on the team member's PC, the agent application runs silently in the background. The supervisor can initiate monitoring sessions at any time from a central viewer application. The system also includes a feature for automatically capturing screenshots at regular intervals.

## ✨ Core Features

-   **Live Screen & Audio Streaming**: View a team member's screen and hear their computer's audio output in real-time with low latency.
-   **Automatic Screenshot Capture**: The agent automatically takes screenshots every 30 minutes (configurable) and sends them to the supervisor's PC.
-   **Stealth Operation**: The agent application runs completely hidden from the user. There are no tray icons, notifications, or pop-ups indicating that a monitoring session is active.
-   **LAN-Based Communication**: All communication occurs over the local network. No internet connection is required, and no data is sent to external servers.
-   **Centralized Viewer**: A single application on the supervisor's PC to view all connected team members, initiate sessions, and browse captured screenshots.

## 🛠️ System Architecture

The system consists of two main components:

1.  **Agent Application (Client)**: Installed on each team member's PC. It runs as a background service, capturing the screen and audio and waiting for a connection from the Viewer.
2.  **Viewer Application (Host)**: Installed on the supervisor's PC. It discovers all active agents on the network and allows the supervisor to initiate a monitoring session with any of them.

### Technical Deep Dive & Technology Stack

This project leverages a stack of free and open-source technologies to deliver its features.

| Component                 | Technology                                                                                                                              | Description                                                                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Application Framework** | [**Electron.js**](https://www.electronjs.org/)                                                                                          | A framework for creating native applications with web technologies like JavaScript, HTML, and CSS. It allows for cross-platform support (Windows, macOS, Linux).         |
| **Screen & Audio Capture**  | `desktopCapturer`, `navigator.mediaDevices.getUserMedia`                                                                                | Built-in Electron and Web APIs used to capture video and audio streams directly from the desktop environment and system audio output.                                    |
| **Real-time Streaming**   | [**WebRTC**](https://webrtc.org/) with `simple-peer`                                                                                      | Enables peer-to-peer, low-latency streaming of video and audio directly between the Agent and the Viewer. All streams are encrypted using DTLS-SRTP.                       |
| **Screenshot Mechanism**  | `desktopCapturer` + `node-cron`                                                                                                         | The `desktopCapturer` API is used to capture a frame of the screen, which is then saved as an image. `node-cron` is used to schedule this capture at regular intervals.     |
| **Network Discovery**     | [**mDNS/Bonjour**](https://en.wikipedia.org/wiki/Multicast_DNS) with `bonjour-service`                                                    | Allows the Viewer application to automatically discover Agent applications on the same network without requiring a central server or manual IP address configuration.      |
| **Signaling & Data Transfer** | [**WebSocket**](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) with the `ws` library                                | Used for the initial WebRTC handshake (signaling) between the Agent and Viewer. Also used for transferring screenshot images securely over the local network (WSS). |
| **Storage**               | **Local Filesystem** / [**SQLite**](https://www.sqlite.org/index.html)                                                                    | Screenshots and activity logs are stored directly on the supervisor's hard drive. SQLite can be used for efficient querying and management of screenshot metadata.     |
| **User Interface**        | [**React.js**](https://reactjs.org/) or [**Vue.js**](https://vuejs.org/)                                                                  | A modern JavaScript library for building a fast and responsive user interface within the Electron application for the Viewer.                                            |

### Data Flow

1.  **Startup**: The Agent application starts automatically on system boot and announces its presence on the network using mDNS.
2.  **Discovery**: The Viewer application discovers the Agent via mDNS and adds it to a list of available PCs.
3.  **Session Initiation**: The supervisor selects a PC in the Viewer. The Viewer sends a WebRTC offer to the Agent via a WebSocket connection to begin the signaling process.
4.  **Streaming**: The Agent accepts the offer, and a direct, encrypted WebRTC peer-to-peer connection is established. The Agent begins streaming its screen and audio to the Viewer.
5.  **Screenshots**: In the background, a cron job on the Agent captures a screenshot every 30 minutes and sends it to the Viewer over a secure WebSocket connection.

## 🔒 Security & Privacy

-   **One-Time Consent**: The system requires a one-time, explicit consent from the user during the installation of the Agent application.
-   **End-to-End Encryption**: All live streaming data is encrypted using DTLS-SRTP, which is a standard part of WebRTC. Screenshot transfers are secured using the WebSocket Secure (WSS) protocol.
-   **No Cloud Dependency**: The system is entirely self-hosted and operates only within the local network, ensuring maximum data privacy.

## 💻 System Requirements

-   **Operating System**:
    -   **Agent**: Windows 10/11 (Primary). Can be extended to macOS and Linux.
    -   **Viewer**: Windows 10/11.
-   **Network**: All PCs must be connected to the same LAN/Wi-Fi network.

## 🚀 Future Enhancements

-   Support for monitoring multiple screens simultaneously.
-   A web-based dashboard for viewing screenshots.
-   Basic activity reports (application usage, idle time, etc.).
"# MonitorMe" 
