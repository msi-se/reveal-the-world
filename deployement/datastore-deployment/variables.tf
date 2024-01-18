# Global
variable "resource_group_location" {
  type        = string
  default     = "westus3"
  description = "Location of the resource group."
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

