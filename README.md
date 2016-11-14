# Promotion Service

Ecommerce Promotion service, part of the [microbase](http://microbase.io)
ecosystem.

**Work In Progess!**

## Conditions

Given this promotion:

```json
{ 
  "id" : "ryUGgmla", 
  "title" : "Promotion 01", 
  "class" : "default", 
  "active" : true, 
  "priority" : 100, 
  "if" : {
    "any" : [
      {
        "all" : [
          {
            "product" : {
              "id" : "SksexGRPn4", 
              "quantity" : 5, 
              "threshold" : 0.3
            }
          }, 
          {
            "product" : {
              "id" : "By2ZWfAPnV", 
              "quantity" : 3
            }
          }
        ]
      }, 
      {
        "product" : {
          "id" : "BycbkfRDhV", 
          "quantity" : 3
        }
      }
    ]
  } 
}
```

and this cart:

```json
{
  "items" :[
    {
    	"id": "1",
      "productId": "SksexGRPn4",
      "quantity": "2"
    },
    {
    	"id": "2",
      "productId": "By2ZWfAPnV",
      "quantity": 2
    },
    {
    	"id": "3",
      "productId": "BycbkfRDhV",
      "quantity": 3
    }
  ]
}
```

the promotion engine will output:

```json
{
  "ok": true,
  "fulfilledPromos": [
    {
      "id": "ryUGgmla",
      "items": [
        {
          "itemId": "3",
          "quantityUsed": 3
        }
      ]
    }
  ],
  "almostFulfilledPromos": [
    {
      "id": "ryUGgmla",
      "data": [
        {
          "any": [
            {
              "all": [
                {
                  "collectedQuantity": 2,
                  "promoQuantity": 5,
                  "threshold": 0.3,
                  "value": 0.4,
                  "type": "PRODUCT",
                  "code": "SksexGRPn4",
                  "items": [
                    {
                      "itemId": "1",
                      "quantityToUse": 2
                    }
                  ]
                },
                {
                  "collectedQuantity": 2,
                  "promoQuantity": 3,
                  "threshold": 0.6666666666666666,
                  "value": 0.6666666666666666,
                  "type": "PRODUCT",
                  "code": "By2ZWfAPnV",
                  "items": [
                    {
                      "itemId": "2",
                      "quantityToUse": 2
                    }
                  ]
                }
              ],
              "value": 0.5333333333333333
            }
          ],
          "value": 0.5333333333333333
        }
      ]
    }
  ]
}
```