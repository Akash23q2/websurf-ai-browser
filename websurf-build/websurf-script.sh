#!/bin/bash

set -e

echo -e "\033[0;36mWebSurf MCP Launcher\033[0m"
echo "===================="
echo ""

NODE_VERSION="v22.11.0"
NODE_BASE_URL="https://nodejs.org/dist/$NODE_VERSION"
NODE_DIR=".node-portable"
LAUNCHER_SCRIPT="main-launcher.js"

# Detect OS and architecture
OS=$(uname -s)
ARCH=$(uname -m)

case "$OS" in
    Linux*)
        case "$ARCH" in
            x86_64) NODE_ARCHIVE="node-$NODE_VERSION-linux-x64.tar.gz" ;;
            aarch64|arm64) NODE_ARCHIVE="node-$NODE_VERSION-linux-arm64.tar.gz" ;;
            *) echo -e "\033[0;31mERROR: Unsupported architecture: $ARCH\033[0m"; exit 1 ;;
        esac
        ;;
    Darwin*)
        case "$ARCH" in
            x86_64) NODE_ARCHIVE="node-$NODE_VERSION-darwin-x64.tar.gz" ;;
            arm64) NODE_ARCHIVE="node-$NODE_VERSION-darwin-arm64.tar.gz" ;;
            *) echo -e "\033[0;31mERROR: Unsupported architecture: $ARCH\033[0m"; exit 1 ;;
        esac
        ;;
    *)
        echo -e "\033[0;31mERROR: Unsupported OS: $OS\033[0m"
        exit 1
        ;;
esac

NODE_EXE="$NODE_DIR/bin/node"

# Check if main-launcher.js exists
if [ ! -f "$LAUNCHER_SCRIPT" ]; then
    echo -e "\033[0;31mERROR: $LAUNCHER_SCRIPT not found\033[0m"
    echo -e "\033[0;33mCurrent directory: $PWD\033[0m"
    exit 1
fi

# Check for system Node
SYSTEM_NODE=""
if command -v node &> /dev/null; then
    NODE_VER=$(node --version 2>/dev/null || echo "")
    if [ -n "$NODE_VER" ]; then
        echo -e "\033[0;32m>> Found system Node.js: $NODE_VER\033[0m"
        NODE_PATH=$(command -v node)
        echo -e "\033[0;90m   Path: $NODE_PATH\033[0m"
        echo ""
        SYSTEM_NODE="node"
    fi
fi

# Check for portable Node
if [ -z "$SYSTEM_NODE" ] && [ -f "$NODE_EXE" ]; then
    echo -e "\033[0;32m>> Found portable Node.js: $NODE_EXE\033[0m"
    echo ""
    NODE_TO_USE="$NODE_EXE"
fi

# Use system Node if available
if [ -n "$SYSTEM_NODE" ]; then
    NODE_TO_USE="$SYSTEM_NODE"
fi

# Download portable Node if not found
if [ -z "$NODE_TO_USE" ]; then
    echo -e "\033[0;33mWARNING: Node.js not found. Downloading portable version...\033[0m"
    echo "   Version: $NODE_VERSION"
    echo "   Architecture: $ARCH"
    echo "   This is a one-time download (~30MB)"
    echo ""
    
    TEMP_ARCHIVE="node-temp.tar.gz"
    
    echo -n "Downloading... "
    if command -v curl &> /dev/null; then
        curl -sL "$NODE_BASE_URL/$NODE_ARCHIVE" -o "$TEMP_ARCHIVE"
    elif command -v wget &> /dev/null; then
        wget -q "$NODE_BASE_URL/$NODE_ARCHIVE" -O "$TEMP_ARCHIVE"
    else
        echo -e "\033[0;31mERROR: Neither curl nor wget found\033[0m"
        echo "Please install curl or wget, or install Node.js manually from: https://nodejs.org/"
        exit 1
    fi
    echo -e "\033[0;32mDone!\033[0m"
    
    echo -n "Extracting... "
    mkdir -p "$NODE_DIR"
    tar -xzf "$TEMP_ARCHIVE" -C "$NODE_DIR" --strip-components=1
    rm -f "$TEMP_ARCHIVE"
    echo -e "\033[0;32mDone!\033[0m"
    
    echo -e "\033[0;32m>> Node.js installed to: $NODE_DIR\033[0m"
    echo ""
    
    NODE_TO_USE="$NODE_EXE"
fi

# Create desktop shortcut (Linux only with .desktop file)
if [ "$OS" = "Linux" ]; then
    echo -e "\033[0;36mCreating launcher shortcut...\033[0m"
    
    DESKTOP_FILE="$HOME/.local/share/applications/websurf.desktop"
    SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
    
    mkdir -p "$HOME/.local/share/applications"
    
    cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=WebSurf MCP
Comment=WebSurf MCP Launcher
Exec=bash "$SCRIPT_PATH"
Path=$(pwd)
Terminal=true
Categories=Development;
EOF
    
    if [ -f "websurf.ico" ] || [ -f "websurf.png" ]; then
        ICON_PATH="$(pwd)/websurf.png"
        [ -f "websurf.ico" ] && ICON_PATH="$(pwd)/websurf.ico"
        echo "Icon=$ICON_PATH" >> "$DESKTOP_FILE"
        echo -e "\033[0;32m>> Applied icon\033[0m"
    fi
    
    chmod +x "$DESKTOP_FILE"
    echo -e "\033[0;32m>> Desktop shortcut created: $DESKTOP_FILE\033[0m"
    echo ""
fi

# Run main-launcher.js
echo -e "\033[0;36mStarting WebSurf MCP...\033[0m"
echo ""

"$NODE_TO_USE" "$LAUNCHER_SCRIPT"