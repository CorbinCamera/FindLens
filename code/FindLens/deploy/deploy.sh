#!/bin/bash
set -e

echo "=== FindLens Deploy Script ==="
echo "This script sets up FindLens on Ubuntu (ARM64/x86_64)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="/opt/findlens"

# Install Node.js LTS
echo "[1/4] Installing Node.js LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "Node.js version: $(node --version)"

# Copy application
echo "[2/4] Copying application to ${APP_DIR}..."
sudo mkdir -p "${APP_DIR}"
sudo cp -r "${SCRIPT_DIR}/.." "${APP_DIR}/code"

# Install dependencies and build
echo "[3/4] Building application..."
cd "${APP_DIR}/code/FindLens"
npm install --production=false
npm run build

# Install systemd service
echo "[4/4] Installing systemd service..."
sudo cp "${SCRIPT_DIR}/findlens.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable findlens
sudo systemctl restart findlens

echo ""
echo "=== Deploy complete! ==="
echo "FindLens is running at http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "Useful commands:"
echo "  sudo systemctl status findlens"
echo "  sudo systemctl restart findlens"
echo "  sudo journalctl -u findlens -f"