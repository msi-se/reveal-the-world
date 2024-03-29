# Global
variable "resource_group_location" {
  type        = string
  default     = "westus3"
  description = "Location of the resource group."
}

# K8S cluster
variable "aks_resource_group_name_prefix" {
  type        = string
  default     = "rg-rtw"
  description = "Name of the AKS resource group"
}

variable "node_count" {
  type        = number
  description = "The initial quantity of nodes for the node pool."
  default     = 1
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

