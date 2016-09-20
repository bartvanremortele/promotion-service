# promotion.create

This method is used to create a Promotion.

# Arguments

This method has the URL https://server/services/catalog/v1/promotion.create and
follows the [MicroBase API calling conventions](../calling-conventions.html).

Argument | Required | Type | Example | Description
---------|----------|------|---------|------------
token           | yes | Token       | Bearer xxxxx... | Authentication token.

# Response

Returns a Promotion object:

```javascript
{
    "ok": true,
    "promotion": {
       "id" : "HJ4g4fACrH"
   }
}
```

# Errors

Expected errors that this method could return. Some errors return additional data.

Error | Data | Description
------|------|------------


# Example

```bash
curl --request POST \
  --url http://localhost:3000/services/catalog/v1/promotion.create \
  --header 'authorization: Bearer xxxxx...' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{"sku": "0006", "title": "Product 001 title", 
           "description": "Product 001 description", "price": 100.00}'
```

# Events

A Promotion creation fires a `CREATE` event in the `PROMOTIONS` channel.

## Payload

Property | Description
---------|------------
new  | The new Promotion created
data | The request data used to crate the Promotion
