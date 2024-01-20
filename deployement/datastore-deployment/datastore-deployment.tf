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
resource "azurerm_container_registry_scope_map" "rtwcr1-scope-map-push" {
  name                    = "rtwcr1-scope-map-push"
  container_registry_name = azurerm_container_registry.cr1.name
  resource_group_name     = azurerm_resource_group.rgdata.name
  actions = [
    "repositories/*/content/write",
    "repositories/*/content/read",
    "repositories/*/metadata/write"
  ]
}
resource "azurerm_container_registry_token" "rtwcr1-token" {
  name                    = "rtwcr1-token"
  container_registry_name = azurerm_container_registry.cr1.name
  resource_group_name     = azurerm_resource_group.rgdata.name
  scope_map_id            = azurerm_container_registry_scope_map.rtwcr1-scope-map-push.id
}

resource "azurerm_container_registry_token_password" "rtwcr1-token-password" {
  container_registry_token_id = azurerm_container_registry_token.rtwcr1-token.id
  password1 {}
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

## Heatmap collections
resource "azurerm_cosmosdb_mongo_collection" "pin" {
  name                = "pin"
  resource_group_name = azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_mongo_database.reveal-the-world.name
  index {
    keys   = ["_id"]
    unique = true
  }
}
resource "azurerm_cosmosdb_mongo_collection" "polygon" {
  name                = "polygon"
  resource_group_name = azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_mongo_database.reveal-the-world.name
  index {
    keys   = ["_id"]
    unique = true
  }
}
resource "azurerm_cosmosdb_mongo_collection" "heatRegionState" {
  name                = "heatRegionState"
  resource_group_name = azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_mongo_database.reveal-the-world.name
  index {
    keys   = ["_id"]
    unique = true
  }
  index {
    keys   = ["timestamp"]
  }
}

## Pin collections
# pin and polygon
resource "azurerm_cosmosdb_mongo_collection" "heatRegion" {
  name                = "heatRegion"
  resource_group_name = azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_mongo_database.reveal-the-world.name
  index {
    keys   = ["_id"]
    unique = true
  }
}
resource "azurerm_cosmosdb_mongo_collection" "analytics" {
  name                = "analytics"
  resource_group_name = azurerm_cosmosdb_account.cosmos.resource_group_name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_mongo_database.reveal-the-world.name
  index {
    keys   = ["_id"]
    unique = true
  }
  index {
    keys   = ["timestamp"]
  }
}

# Posgresql
resource "random_password" "postgres_password" {
  length           = 16
  special          = true
  override_special = "!"
}

resource "azurerm_postgresql_flexible_server" "posgresql" {
  name                   = "rtw-fusionauth-psqlserver"
  resource_group_name    = azurerm_resource_group.rgdata.name
  location               = azurerm_resource_group.rgdata.location
  version                = "14"
  administrator_login    = "psqladmin"
  administrator_password = random_password.postgres_password.result
  zone                   = "1"

  storage_mb = 32768
  sku_name   = "B_Standard_B1ms"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow-all-posgresql" {
  name             = "AllowAll"
  server_id        = azurerm_postgresql_flexible_server.posgresql.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"

}