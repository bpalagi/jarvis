# Arch Linux Support

This document outlines the steps to build and run Jarvis on Arch Linux.

## 1. Prerequisites

Install the following packages using pacman:

```bash
sudo pacman -S nodejs npm git
```

You will also need to install the following libraries for the native dependencies:

```bash
sudo pacman -S libsecret libvips libxcrypt-compat
```

## 2. Building Native Dependencies

The native Node.js modules in this project need to be rebuilt for Arch Linux. 

```bash
npm rebuild
```

## 3. Electron Builder Configuration

Add the following configuration to the `electron-builder.yml` file to enable building for Arch Linux:

```yaml
linux:
  target:
    - target: pacman
      arch:
        - x64
  category: Utility
```

## 4. Build Script

Add the following script to the `scripts` section of the `package.json` file:

```json
"package:linux": "npm run build:all && electron-builder --linux"
```

## 5. Building the Application

To build the application for Arch Linux, run the following command:

```bash
npm run package:linux
```

This will create a `.pacman` package in the `dist` directory.

## 6. Testing

Install the generated `.pacman` package using the following command:

```bash
sudo pacman -U dist/jarvis-0.2.4.pacman
```

Then, launch the application from your application menu or by running `jarvis` in the terminal.
