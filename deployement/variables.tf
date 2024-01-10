variable "resource_group_location" {
  type        = string
  default     = "westus3"
  description = "Location of the resource group."
}

variable "resource_group_name_prefix" {
  type        = string
  default     = "rg-rtw"
  description = "Prefix of the resource group name that's combined with a random ID so name is unique in your Azure subscription."
}

# K8S cluster
variable "node_count" {
  type        = number
  description = "The initial quantity of nodes for the node pool."
  default     = 2
}

variable "msi_id" {
  type        = string
  description = "The Managed Service Identity ID. Set this value if you're running this example using Managed Identity as the authentication method."
  default     = null
}

variable "username" {
  type        = string
  description = "The admin username for the new cluster."
  default     = "azureadmin"
}


# Cosmos DB
variable "cosmos_prefix" {
  type        = string
  default     = "rtw-cosmos-db"
  description = "Prefix of the resource name"
}

variable "cosmosdb_account_location" {
  type        = string
  default     = "westus3"
  description = "Cosmos db account location"
}

