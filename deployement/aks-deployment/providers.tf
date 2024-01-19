terraform {
  required_version = ">=1.0"

  required_providers {
    azapi = {
      source  = "azure/azapi"
      version = "~>1.5"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~>3.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "0.9.1"
    }
  }

  backend "azurerm" {
      resource_group_name  = "rg-rtw-tfstate"
      storage_account_name = "rtwtfstate18005"
      container_name       = "rtw-tfstate"
      key                  = "terraform.tfstate"
  }

}

provider "azurerm" {
  features {}
}