# 🗃️ Database ERD (Entity Relationship Diagram)

> Auto-generated from Mongoose model schemas

```mermaid
erDiagram
  Brand {
    ObjectId _id "PK"
    String name "PK"
    ObjectId ownerId
    String plan
    String name
    Number outletLimit
    Date createdAt
    Date updatedAt
  }

  Measurement {
    ObjectId _id "PK"
    String name "PK"
    String measurementType "PK"
    String unit "PK"
    String baseUnit "PK"
    Number conversionFactor
    Boolean isDecimalAllowed
    Boolean isActive
    Boolean isDelete
    Date createdAt
    Date updatedAt
  }

  Addon {
    ObjectId _id "PK"
    String name "PK"
    Number price "PK"
    String sapCode
    String dietary
    Boolean available
    ObjectId brandId "PK"
    ObjectId outletId "PK"
    String name "PK"
    Array items
    Boolean isActive
    Boolean isDelete
    Date createdAt
    Date updatedAt
  }

  Category {
    ObjectId _id "PK"
    ObjectId brandId "PK"
    ObjectId outletId "PK"
    String name "PK"
    String onlineName
    String logo
    Boolean isActive
    Boolean isDelete
    Date createdAt
    Date updatedAt
  }

  MenuItemAddon {
    ObjectId _id "PK"
    ObjectId brandId "PK"
    ObjectId outletId "PK"
    ObjectId menuItemId "PK"
    ObjectId addonId "PK"
    ObjectId menuItemVariantId
    ObjectId allowedItemIds
    Boolean isSingleSelect
    Number min
    Number max
    Boolean isActive
    Boolean isDelete
    Date createdAt
    Date updatedAt
  }

  MenuItemVariant {
    ObjectId _id "PK"
    ObjectId measurementId "PK"
    Number basePrice "PK"
    Number costPrice
    Number baseValue
    Number minValue
    Number maxValue
    Number stepValue
    Date createdAt
    Date updatedAt
  }

  MenuItem {
    ObjectId _id "PK"
    ObjectId measurementId "PK"
    Number basePrice "PK"
    Number costPrice
    Number baseValue
    Number minValue
    Number maxValue
    Number stepValue
    Date createdAt
    Date updatedAt
  }

  Variation {
    ObjectId _id "PK"
    ObjectId brandId "PK"
    ObjectId outletId "PK"
    String name "PK"
    String department "PK"
    Boolean isActive
    Boolean isDelete
    Date createdAt
    Date updatedAt
  }

  Outlet {
    ObjectId _id "PK"
    ObjectId brandId "PK"
    String basicInfo "PK"
    String name "PK"
    String logo
    String outletType "PK"
    String contact "PK"
    String email "PK"
    String phone "PK"
    String country "PK"
    String state "PK"
    String city "PK"
    String address "PK"
    String settings
    String gstNo
    String currency
    Number CGST
    Number SGST
    Date createdAt
    Date updatedAt
  }

  Table {
    ObjectId _id "PK"
    ObjectId brandId "PK"
    ObjectId outletId "PK"
    ObjectId zoneId
    String name "PK"
    Number capacity
    String status
    Boolean isActive
    Boolean isDelete
    Date createdAt
    Date updatedAt
  }

  User {
    ObjectId _id "PK"
    String name "PK"
    String username "PK"
    String email
    String password "PK"
    String role "PK"
    ObjectId brandId
    Boolean isActive
    Number salary
    Boolean isDelete
    Date createdAt
    Date updatedAt
  }

  Zone {
    ObjectId _id "PK"
    ObjectId brandId "PK"
    ObjectId outletId "PK"
    String name "PK"
    Boolean isActive
    Boolean isDelete
    Date createdAt
    Date updatedAt
  }

  Addon }o--|| Brand : "brandId"
  Addon }o--|| Outlet : "outletId"
  Category }o--|| Brand : "brandId"
  Category }o--|| Outlet : "outletId"
  MenuItemAddon }o--|| Brand : "brandId"
  MenuItemAddon }o--|| Outlet : "outletId"
  MenuItemAddon }o--|| MenuItem : "menuItemId"
  MenuItemAddon }o--|| Addon : "addonId"
  MenuItemAddon }o--|| MenuItemVariant : "menuItemVariantId"
  MenuItemVariant }o--|| Measurement : "measurementId"
  MenuItem }o--|| Measurement : "measurementId"
  Variation }o--|| Brand : "brandId"
  Variation }o--|| Outlet : "outletId"
  Outlet }o--|| Brand : "brandId"
  Table }o--|| Brand : "brandId"
  Table }o--|| Outlet : "outletId"
  Table }o--|| Zone : "zoneId"
  User }o--|| Brand : "brandId"
  Zone }o--|| Brand : "brandId"
  Zone }o--|| Outlet : "outletId"
```

---

## 📋 Collections Summary

| Collection | Fields Count | References |
|------------|-------------|------------|
| **Brand** | 8 | - |
| **Measurement** | 11 | - |
| **Addon** | 14 | brandId → Brand, outletId → Outlet |
| **Category** | 10 | brandId → Brand, outletId → Outlet |
| **MenuItemAddon** | 14 | brandId → Brand, outletId → Outlet, menuItemId → MenuItem, addonId → Addon, menuItemVariantId → MenuItemVariant |
| **MenuItemVariant** | 10 | measurementId → Measurement |
| **MenuItem** | 10 | measurementId → Measurement |
| **Variation** | 9 | brandId → Brand, outletId → Outlet |
| **Outlet** | 20 | brandId → Brand |
| **Table** | 11 | brandId → Brand, outletId → Outlet, zoneId → Zone |
| **User** | 12 | brandId → Brand |
| **Zone** | 8 | brandId → Brand, outletId → Outlet |