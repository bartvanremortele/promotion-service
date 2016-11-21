# Examples

## Rules and discounts

### Product Promotions

#### 1 - Bundle

ie: Buy A, B, and C for €50

_Resolved as fixed price product A plus free products B and C_

```json
{
  "if": {
    "all": [
      {"product": {
        "id": "pA",
        "quantity": 1
      }},
      {"product": {
        "id": "pB",
        "quantity": 1
      }},
      {"product": {
        "id": "pC",
        "quantity": 1
      }}
    ]
  },
  "then": {
    "all": [
      {"product": {
        "id": "pA",
        "quantity": 1,
        "discount": {
          "rate": 50,
          "isFixedPrice": true
        }
      }},
      {"product": {
        "id": "pB",
        "quantity": 1,
        "discount": {
          "rate": 100,
          "isPercentage": true
        }
      }},
      {"product": {
        "id": "pC",
        "quantity": 1,
        "discount": {
          "rate": 100,
          "isPercentage": true
        }
      }}
    ]
  }
}
```

#### 2 - Buy X get Y free

ie: Buy one get one free.

```json
{
  "if": {
    "category": {
      "id": "c1",
      "quantity": 2
    }
  },
  "then": {
    "category": {
      "id": "c1",
      "quantity": 1,
      "discount": {
        "rate": 100,
        "isPercentage": true
      }
    }
  }
}
```

#### 3 - Fixed price

ie: All shirts €5 each.

```json
{
  "if": {
    "category": {
      "id": "shirts-cat",
      "quantity": 1
    }
  },
  "then": {
    "category": {
      "id": "shirts-cat",
      "quantity": 1,
      "discount": {
        "rate": 5,
        "isFixedPrice": true
      }
    }
  }
}
```

#### 4 - Multi-buy

ie: Buy any 3 shirts for €50.

_Resolved as 1 fixed price shirt plus two free shirts_

```json
{
  "if": {
    "category": {
      "id": "shirts-cat",
      "quantity": 3
    }
  },
  "then": {
    "all": [
      {"category": {
        "id": "shirts-cat",
        "quantity": 1,
        "discount": {
          "rate": 50,
          "isFixedPrice": true
        }
      }},
      {"category": {
        "id": "shirts-cat",
        "quantity": 2,
        "discount": {
          "rate": 100,
          "isPercentage": true
        }
      }}
    ]
  }
}
```

#### 5 - Stepped multi-buy

N/A

#### 6 - Perfect partner

ie: Buy a game for €10 with each games console.

```json
{
  "if": {
    "category": {
     "id": "consoles-cat",
     "quantity": 1
    }
  },
  "then": {
    "category": {
     "id": "games-cat",
     "quantity": 1,
     "discount": {
       "rate": 10,
       "isFixedPrice": true
     }
    }
  }
}
```

#### 7 - One-to-one perfect partner bundle

Buy this game and the selected partner accessory together for €25.00.

_Resolved as fixed price game plus free accesory_

```json
{
  "if": {
    "all": [
      {"product": {
        "id": "p001",
        "quantity": 1
      }},
      {"category": {
        "id": "accessories-cat",
        "quantity": 1
      }}
    ]
  },
  "then": {
    "all": [
      {"product": {
        "id": "p001",
        "quantity": 1,
        "discount": {
          "rate": 25,
          "isFixedPrice": true
        }
      }},
      {"category": {
        "id": "accessories-cat",
        "quantity": 1,
        "discount": {
          "rate": 100,
          "isPercentage": true
        }
      }}
    ]
  }
}
```

#### 8 - Perfect partner bundle

ie: Buy a games console and 3 accessories for €200.

_Resolved as fixed price game plus free accesories_

```json
{
  "if": {
    "all": [
      {"product": {
        "id": "p001",
        "quantity": 1
      }},
      {"category": {
        "id": "accessories-cat",
        "quantity": 3
      }}
    ]
  },
  "then": {
    "all": [
      {"product": {
        "id": "p001",
        "quantity": 1,
        "discount": {
          "rate": 200,
          "isFixedPrice": true
        }
      }},
      {"category": {
        "id": "accessories-cat",
        "quantity": 3,
        "discount": {
          "rate": 100,
          "isPercentage": true
        }
      }}
    ]
  }
}
```

#### 9 - Percentage discount

ie: 20% off all cameras.

```json
{
  "if": {
   "category": {
     "id": "cameras-cat",
     "quantity": 1
   }
  },
  "then": {
   "category": {
     "id": "cameras-cat",
     "quantity": 1,
     "discount": {
       "rate": 20,
       "isPercentaje": true
     }
   }
  }
}
```

### Order Promotions

#### 1 - Order threshold fixed discount

ie: Spend over €50 to receive a €3 discount.

N/A

#### 2 - Order threshold perfect partner

ie: Spend over €50 to get any shirt (up to 99) for €5.

```json
{
  "if": {
    "subtotal": 50,
    "category": {
      "id": "shirts-cat",
      "quantity": 1
    }
  },
  "then": {
    "category": {
      "id": "shirts-cat",
      "quantity": 99,
      "discount": {
        "rate": 5,
        "isFixedPrice": true
      }
    }
  }
}
```

#### 3 - Order threshold free gift

ie: Spend over €50 to receive a free t-shirt.

```json
{
  "if": {
    "subtotal": 50,
    "category": {
      "id": "shirts-cat",
      "quantity": 1
    }
  },
  "then": {
    "category": {
      "id": "shirts-cat",
      "quantity": 1,
      "discount": {
        "rate": 100,
        "isPercentaje": true
      }
    }
  }
}
```

#### 4 - Order threshold free voucher

ie: Get a free €5 voucher when you spend over €150.00.

N/A

#### 5 - Order threshold change delivery mode

ie: Spend over €10 to get free shipping

N/A

## Full Example

Given this promotion:

```json
{ 
  "id":   "ryUGgm44", 
  "title":   "Promotion 03", 
  "class":   "default", 
  "active":   true, 
  "priority":   100, 
  "if":   {
    "category":   {
      "id":   "By-4rrmsN", 
      "quantity":   3, 
      "lowestPrice":   true
    }
  }, 
  "then":   {
    "category":   {
      "id":   "By-4rrmsN", 
      "quantity":   3, 
      "discount":   {
        "rate":   10, 
        "isFixedPrice":   true
      }
    }
  }
}
```

and this cart:

```json
{ 
  "id":   "HyvYROObg", 
  "items":   [
    {
      "id":   "HkgWytObl", 
      "productId":   "By2ZWfAPnV", 
      "quantity":   1, 
      "price":   577.65, 
      "title":   "001004721736835 - Frigorífico combi Samsung RB31FEJNCSS/EF No Frost (Samsung)"
    }, 
    {
      "id":   "BJmzJtdbe", 
      "productId":   "HyTWWMRw34", 
      "quantity":   2, 
      "price":   321.47, 
      "title":   "001004721727941 - Frigorífico combi Saivod CT1830DNF No Frost (Saivod)"
    }, 
    {
      "id":   "ryqjio_Ze", 
      "productId":   "rkQMWG0P2V", 
      "quantity":   2, 
      "price":   469.00, 
      "title":   "001004721744961 - Frigorífico combi Fagor FFK6778A No Frost (Fagor)"
    }
  ]
}
```

the promotion engine will output:

```json
{
  "ok": true,
  "almostFulfilledPromos": [
  {
    "id": "ryUGgm44",
    "data": [
    {
      "collectedQuantity": 2,
      "promoQuantity": 3,
      "threshold": 0.6666666666666666,
      "value": 0.6666666666666666,
      "type": "CATEGORY",
      "code": "By-4rrmsN",
      "items": [
      {
        "itemId": "ryqjio_Ze",
        "quantityToUse": 1
      },
      {
        "itemId": "HkgWytObl",
        "quantityToUse": 1
      }
      ]
    }
    ]
  }
  ],
  "itemDiscounts": [
  {
    "id": "BJmzJtdbe",
    "discounts": [
    {
      "promotionId": "ryUGgm44",
      "promotionTitle": "Promotion 03",
      "quantity": 2,
      "price": 321.47,
      "discount": 311.47
    }
    ]
  },
  {
    "id": "ryqjio_Ze",
    "discounts": [
    {
      "promotionId": "ryUGgm44",
      "promotionTitle": "Promotion 03",
      "quantity": 1,
      "price": 469,
      "discount": 459
    }
    ]
  }
  ]
}
```

and the final cart will look:

```json
{
  "id": "HyvYROObg",
  "promotions": {
    "ok": true,
    "almostFulfilledPromos": [
      {
        "id": "ryUGgm44",
        "data": [
          {
            "items": [
              {
                "quantityToUse": 1,
                "itemId": "ryqjio_Ze"
              },
              {
                "quantityToUse": 1,
                "itemId": "HkgWytObl"
              }
            ],
            "code": "By-4rrmsN",
            "type": "CATEGORY",
            "value": 0.6666666666666666,
            "threshold": 0.6666666666666666,
            "promoQuantity": 3,
            "collectedQuantity": 2
          }
        ]
      }
    ]
  },
  "items": [
    {
      "id": "HkgWytObl",
      "productId": "By2ZWfAPnV",
      "quantity": 1,
      "price": 577.65,
      "title": "001004721736835 - Frigorífico combi Samsung RB31FEJNCSS/EF No Frost (Samsung)",
      "discounts": [],
      "taxes": [
        {
          "taxDetail": "IVA 21%",
          "tax": 121.3065,
          "beforeTax": 577.65
        }
      ]
    },
    {
      "id": "BJmzJtdbe",
      "productId": "HyTWWMRw34",
      "quantity": 2,
      "price": 321.47,
      "title": "001004721727941 - Frigorífico combi Saivod CT1830DNF No Frost (Saivod)",
      "discounts": [
        {
          "promotionId": "ryUGgm44",
          "promotionTitle": "Promotion 03",
          "quantity": 2,
          "discount": 311.47
        }
      ],
      "taxes": [
        {
          "taxDetail": "IVA 21%",
          "tax": 4.2,
          "beforeTax": 20
        }
      ]
    },
    {
      "id": "ryqjio_Ze",
      "productId": "rkQMWG0P2V",
      "quantity": 2,
      "price": 469,
      "title": "001004721744961 - Frigorífico combi Fagor FFK6778A No Frost (Fagor)",
      "discounts": [
        {
          "promotionId": "ryUGgm44",
          "promotionTitle": "Promotion 03",
          "quantity": 1,
          "discount": 459
        }
      ],
      "taxes": [
        {
          "taxDetail": "IVA 21%",
          "tax": 100.59,
          "beforeTax": 479
        }
      ]
    }
  ],
  "taxes": {
    "beforeTax": 1076.65,
    "tax": 226.1,
    "ok": true
  }
}
```