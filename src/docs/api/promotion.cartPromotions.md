# promotion.cartPromotions

This method is used to calculate the Cart Promotions.

# Arguments

This method has the URL https://server/services/promotion/v1/promotion.cartPromotions and
follows the [MicroBase API calling conventions](../calling-conventions.html).

Argument | Required | Type | Example | Description
---------|----------|------|---------|------------
cartId | yes | String      | default         | Identifier to be used as a reference.
items  | yes | Object List | -               | The list of entries in the Cart.

## Items

Argument | Required | Type | Example | Description
---------|----------|------|---------|------------
id        | yes | String | HyR1hMmc   | Entry id.
productId | yes | String | By2ZWfAPnV | The Product Id.
quantity  | No  | Number | 1          | The quantity of product in the entry.
price     | yes | Number | 100.00     | The single product price.

# Response

Returns an object with the dicounted items and the "almost fillfilled" promotions:

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
              "itemId": "2",
              "quantityToUse": 2
            }
          ]
        }
      ]
    }
  ],
  "itemDiscounts": [
    {
      "id": "1",
      "discounts": [
        {
          "promotionId": "ryUGgmla",
          "promotionTitle": "Promotion 01",
          "quantity": 1,
          "price": 10,
          "discount": 1
        }
      ]
    },
    {
      "id": "2",
      "discounts": [
        {
          "promotionId": "ryUGgmla",
          "promotionTitle": "Promotion 01",
          "quantity": 1,
          "price": 20,
          "discount": 2
        }
      ]
    }
  ]
}
```

# Errors

Expected errors that this method could return. Some errors return additional data.

Error | Data | Description
------|------|------------
validation_error | The data causing the error | Some validation error

# Example

```bash
curl --request POST \
  --url http://localhost:3000/services/promotion/v1/promotion.cartPromotions \
  --header 'authorization: Bearer xxxxx...' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
      "cartId": 'H19PRsec', \
        "items": \
         [ { "id": "HJyElmm9", \
             "productId": 'By2ZWfAPnV', \
             "quantity": 1, \
             "price": 100.00 } ] \
      }'
```
