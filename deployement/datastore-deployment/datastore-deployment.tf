resource "azurerm_resource_group" "rgdata" {
  location = var.resource_group_location
  name     = "rg-rtw-data-store"
}

# Azure container registry
resource "azurerm_container_registry" "cr1" {
  name                = "rtwcr1"
  resource_group_name = azurerm_resource_group.rgdata.name
  location            = azurerm_resource_group.rgdata.location
  sku                 = "Standard"
}

# Cosmos DB
resource "random_pet" "azurerm_cosmosdb_account_name" {
  prefix = "cosmos"
}

resource "azurerm_cosmosdb_account" "cosmos" {
  name                      = random_pet.azurerm_cosmosdb_account_name.id
  location                  = var.resource_group_location
  resource_group_name       = azurerm_resource_group.rgdata.name
  offer_type                = "Standard"
  kind                      = "MongoDB"
  enable_automatic_failover = true

  capabilities {
    name = "EnableAggregationPipeline"
  }

  capabilities {
    name = "mongoEnableDocLevelTTL"
  }

  capabilities {
    name = "MongoDBv3.4"
  }

  capabilities {
    name = "EnableMongo"
  }

  geo_location {
    location          = azurerm_resource_group.rgdata.location
    failover_priority = 0
  }
  consistency_policy {
    consistency_level       = "BoundedStaleness"
    max_interval_in_seconds = 300
    max_staleness_prefix    = 100000
  }
  depends_on = [
    azurerm_resource_group.rgdata
  ]
}

resource "azurerm_cosmosdb_mongo_database" "reveal-the-world" {
  name                = "reveal-the-world"
  resource_group_name = azurerm_resource_group.rgdata.name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  throughput          = 400
}

# Posgresql
resource "azurerm_postgresql_server" "postgresql" {
  name                = "rtw-fusionauth-postgresql"
  location            = azurerm_resource_group.rgdata.location
  resource_group_name = azurerm_resource_group.rgdata.name

  administrator_login          = "psqladmin"
  administrator_login_password = "Pa$$w0rd"

  sku_name   = "GP_Gen5_4"
  version    = "11"
  storage_mb = 640000

  backup_retention_days        = 7
  geo_redundant_backup_enabled = true
  auto_grow_enabled            = true

  public_network_access_enabled    = false
  ssl_enforcement_enabled          = false
}