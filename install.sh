#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")

pushd .

cd "$SCRIPT_DIR"

sudo apt-get install -y jq nodejs npm nginx
sudo npm install -g @vue/cli @vue/cli-service@latest
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
nvm install 20
cd backend
npm install
cd ../pilot-portal
npm install
npm run build

popd
