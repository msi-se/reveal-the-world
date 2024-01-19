output "resource_group_name_data_store" {
  value = azurerm_resource_group.rgdata.name
}
# ACR
output "acr_token" {
  value = azurerm_container_registry_token_password.rtwcr1-token-password.password1[0].value
  sensitive = true
}
output "acr_id" {
  value = azurerm_container_registry.cr1.id
  sensitive = true
}

# Cosmos DB
output "cosmos_connection_string" {
  value = azurerm_cosmosdb_account.cosmos.connection_strings[0]
  sensitive = true
}

# Posgres
output "posgresql_fqdn" {
  value = azurerm_postgresql_flexible_server.posgresql.fqdn
}
output "posgresql_admin_username" {
  value = azurerm_postgresql_flexible_server.posgresql.administrator_login
  sensitive = true
}
output "posgresql_admin_password" {
  value = azurerm_postgresql_flexible_server.posgresql.administrator_password
  sensitive = true
}