#!/bin/bash

# TODO:
# - change token here provided by github: https://github.com/msi-se/reveal-the-world/settings/actions/runners/new?arch=x64&os=linux
# - copy and run this script as sudo in the home directory of azureuser
GITHUB_TOKEN=<token given by github>

# Install jq
echo "Installing jq..."
sudo apt-get update
sudo apt-get install -y jq

# Install Azure CLI (az)
echo "Installing Azure CLI..."
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Install Helm
echo "Installing Helm..."
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod +x get_helm.sh
./get_helm.sh
rm get_helm.sh

# Install Terraform
echo "Installing Terraform..."
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install -y terraform

# Install kubectl
echo "Installing kubectl..."
sudo apt-get install -y kubectl

# Install pip + python packages
echo "Installing pip..."
sudo apt-get install -y python3-pip
pip install pynacl

# Install docker
sudo apt install -y docker.io
sudo usermod -aG docker azureuser

echo "Installation complete!"

# Runner installation
echo "Turning this VM into a runner..."
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
echo "29fc8cf2dab4c195bb147384e7e2c94cfd4d4022c793b346a6175435265aa278  actions-runner-linux-x64-2.311.0.tar.gz" | shasum -a 256 -c
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
./config.sh --url https://github.com/msi-se/reveal-the-world --token $GITHUB_TOKEN

# Add runner script as a systemd service
SERVICE_NAME="runner"
DESCRIPTION="Github runner"
EXECUTABLE_PATH="/home/azureuser/actions-runner/run.sh"

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
sudo touch $SERVICE_FILE
echo "[Unit]" | sudo tee -a $SERVICE_FILE
echo "Description=$DESCRIPTION" | sudo tee -a $SERVICE_FILE
echo "After=network.target" | sudo tee -a $SERVICE_FILE
echo "" | sudo tee -a $SERVICE_FILE
echo "[Service]" | sudo tee -a $SERVICE_FILE
echo "ExecStart=$EXECUTABLE_PATH" | sudo tee -a $SERVICE_FILE
echo "Restart=always" | sudo tee -a $SERVICE_FILE
echo "User=azureuser" | sudo tee -a $SERVICE_FILE
echo "Group=azureuser" | sudo tee -a $SERVICE_FILE
echo "" | sudo tee -a $SERVICE_FILE
echo "[Install]" | sudo tee -a $SERVICE_FILE
echo "WantedBy=default.target" | sudo tee -a $SERVICE_FILE

# Reload systemd to pick up the new service
systemctl daemon-reload

# Enable and start the service
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME






