#!/bin/bash

# TODO(before):
# - connect to az CLI with az login before running this script

# TODO (after):
# - retrieve $UAMI_CLIENT_ID and change AZURE_CLIENT_ID value in Github
# - retrieve the private key 
# - connect to the VM ssh -i ./path/to/key.pem $USERNAME@$RUNNER_IP_ADDRESS
# - apply the setup-runner.sh script 

# TERRAFORM FILES ON AZURE STORAGE
RESOURCE_GROUP_NAME=rg-rtw-tfstate
STORAGE_ACCOUNT_NAME=rtwtfstate18005
CONTAINER_NAME=rtw-tfstate
LOCATION=westus3

# Create resource group
az group create --name $RESOURCE_GROUP_NAME --location $LOCATION

# Create storage account
az storage account create --resource-group $RESOURCE_GROUP_NAME --name $STORAGE_ACCOUNT_NAME --sku Standard_LRS --encryption-services blob

# Create blob container
az storage container create --name $CONTAINER_NAME --account-name $STORAGE_ACCOUNT_NAME

# USER MANAGED IDENTITY AND GITHUB RUNNER VM
RESOURCE_GROUP_NAME=rg-rtw-UAMI
VM_NAME=rg-rtw-github-action
VM_IMAGE="20_04-lts-gen2"
USERNAME=azureuser 
UAMI_NAME=UAMI1

# Create resource group
az group create --name $RESOURCE_GROUP_NAME --location $LOCATION

# Create user assigned managed indentity
az identity create -g $RESOURCE_GROUP_NAME -n $UAMI_NAME
export UAMI_CLIENT_ID=$(az identity show --resource-group $RESOURCE_GROUP_NAME --name $UAMI_NAME --query clientId --output tsv)
UAMI_OBJECT_ID=$(az identity list --resource-group $RESOURCE_GROUP_NAME --query "[?name=='${UAMI_NAME}'].{principalId:principalId}" --output tsv)

# Get Azure Sub. ID
AZURE_SUB_ID=$(az account list --query "[].{id:id}" --output tsv)

# Get the Contributor role id
ROLE_ID=$(az role definition list --name "Contributor" --query "[].{name:name}" --output tsv)

# Assign the user assigned managed identity to the azure account
az role assignment create --assignee $UAMI_OBJECT_ID \
    --role $ROLE_ID \
    --scope "/subscriptions/${AZURE_SUB_ID}"

# Create the VM for the runner
az vm create \
  --resource-group $RESOURCE_GROUP_NAME \
  --name $VM_NAME \
  --image $VM_IMAGE \
  --admin-username $USERNAME \
  --generate-ssh-keys \
  --public-ip-sku Standard

export RUNNER_IP_ADDRESS=$(az vm show --show-details --resource-group $RESOURCE_GROUP_NAME --name $VM_NAME --query publicIps --output tsv)
export USERNAME=$USERNAME

# Assign the user assigned managed indentity to the VM
az vm identity assign -g $RESOURCE_GROUP_NAME -n $VM_NAME --identities $UAMI_NAME