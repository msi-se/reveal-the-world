output "resource_group_name_data_store" {
  value = azurerm_resource_group.rgdata.name
}

# Cosmos DB
output "connection_string" {
  value = azurerm_cosmosdb_account.cosmos.connection_strings[0]
  sensitive = true
}

# Posgres
output "posgresql_fqdn" {
  value = azurerm_postgresql_flexible_server.posgresql.fqdn
}
