#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")

pushd .

cd "$SCRIPT_DIR"

sudo apt-get install -y jq nodejs npm nginx
sudo npm install -g @vue/cli @vue/cli-service@latest
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
cd backend
npm install
cd ../pilot-portal
npm install
npm run build

popd
