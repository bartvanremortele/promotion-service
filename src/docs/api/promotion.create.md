# promotion.create

This method is used to create a Promotion.

# Arguments

This method has the URL https://server/services/promotion/v1/promotion.create and
follows the [MicroBase API calling conventions](../calling-conventions.html).

Argument | Required | Type | Example | Description
---------|----------|------|---------|------------
token    | yes | Token   | Bearer xxxxx... | Authentication token.
title    | yes | String  | 3 at 10€ Promotion | Promotion title.
class    | yes | String  | default | Implementation class. 'default' is the one provided by microbase.
active   | yes | Boolean | true | Active or disabled.
priority | yes | Number  | 100 | Priority number to evaluate the promotions.
if       | yes | JSON    | { category: { id:'By-4rrmsN', quantity: 3, lowestPrice: true } } | DSL os the Promotion rules  
then     | yes | JSON    | { category: {id: 'By-4rrmsN', 'quantity': 3, discount: {rate: 10, isFixedPrice: true } } } | DSL of the Promotion consequences.

## The "if" and "then" fields

The "if" and "then" fields are part of a DSL (Domain Specification Language) based on JSON.

## The "if" field

The `if` field determines if the Promotion will be fired or not. It contains one (and only one) of this objects:

* `category`
* `product`
* `all`
* `any`

### The "category" rule

The `category` rule defines a Category and the quantity of products that needs to be present in the Cart to fire the promotion.

Field | Required | Type | Example | Description
------|----------|------|---------|------------
id          | yes | String  | By-4rrmsN | The Category ID.
quantity    | yes | Number  | 3         | The needed quantity.
threshold   | no  | Number  | 0.3       | Number betweem 0 and 1 to determine the how close is this item to fire a promotion. Default: `(promotionQuantity - 1) / promotionQuantity`.
lowestPrice | no  | Boolean | true      | If several products present on the cart belongs to this category, select the one with the lowest price.

```json
{
  "category" : {
    "id" : "By-4rrmsN", 
    "quantity" : 3, 
    "lowestPrice" : true
  }
}
```

### The "product" rule

The `product` rule defines a Product and the quantity of the Product that needs to be present in the Cart to fire the promotion.

Field | Required | Type | Example | Description
------|----------|------|---------|------------
id        | yes | String  | By-4rrmsN | The Category ID.
quantity  | yes | Number  | 3         | The needed quantity.
threshold | no  | Number  | 0.3       | Number betweem 0 and 1 to determine the how close is this item to fire a promotion. Default: `(promotionQuantity - 1) / promotionQuantity`.

```json
{
  "product" : {
      "id" : "SksexGRPn4", 
      "quantity" : 2, 
      "threshold" : 0.3
  }
}
```

### The "all" rule

The `all` rule is an array of any number of this rules: 

* `category`
* `product`
* `all`
* `any`

All the rules in the array must be fullfilled to fire the promotion.

```json
{
  "all" : [
    {
      "product" : {
        "id" : "SksexGRPn4", 
        "quantity" : 3, 
        "threshold" : 0.3
      }
    }, 
    {
      "category" : {
        "id" : "By-4rrmsN", 
        "quantity" : 2, 
        "lowestPrice" : true
      }
    }
  ]
}
```

### The "any" rule

The `any` rule is an array of any number of this rules: 

* `category`
* `product`
* `all`
* `any`

If any of the rules in the array is fullfilled the promotion is fired.

```json
{
  "any" : [
    {
      "product" : {
        "id" : "SksexGRPn4", 
        "quantity" : 3
      }
    }, 
    {
      "product" : {
        "id" : "aNser15F", 
        "quantity" : 2
      }
    }
  ]
}
```

## The "then" field

The `then` field determines the discounts to be applied once it's fired (the `if` are `true`). It contains one (and only one) of this objects:

* `category`
* `product`
* `all`
* `any`

### The "category" rule

The `category` rule defines a Category and the quantity of products in that Category that will be discounted.

Field | Required | Type | Example | Description
------|----------|------|---------|------------
id        | yes | String  | By-4rrmsN | The Category ID.
quantity  | yes | Number  | 1 | The quantity of products to be discounted.
discount  | yes | JSON    | { rate: 10, isPercentage: true } | The discount to be applied

### The `discount` object

Field | Required | Type | Example | Description
------|----------|------|---------|------------
rate         | yes | Number  | 10   | The number to use in the discount.
isPercentage | no  | Boolean | true | The rate is a percentaje number, ie: 10%
isFixedPrice | no  | Boolean | true | The rate is the final price of the product, ie: 10€

_If none of `isPercentage` or `isFixedPrice` are present, the rate is an ammount to discount, ie: -10€_

```json
{
  "category" : {
    "id" : "By-4rrmsN", 
    "quantity" : 1, 
    "discount" : {
      "rate" : 10, 
      "isPercentage" : true
    }
  }
}

```

### The "product" rule

The `product` rule defines a Product and the quantity of this Product that will be discounted.

Field | Required | Type | Example | Description
------|----------|------|---------|------------
id        | yes | String  | SksexGRPn4 | The Product ID.
quantity  | yes | Number  | 1 | The quantity of products to be discounted.
discount  | yes | JSON    | { rate: 10, isPercentage: true } | The discount to be applied

### The `discount` object

Field | Required | Type | Example | Description
------|----------|------|---------|------------
rate         | yes | Number  | 10   | The number to use in the discount.
isPercentage | no  | Boolean | true | The rate is a percentaje number, ie: 10%
isFixedPrice | no  | Boolean | true | The rate is the final price of the product, ie: 10€

_If none of `isPercentage` or `isFixedPrice` are present, the rate is an ammount to discount, ie: -10€_

```json
{
  "product" : {
    "id" : "SksexGRPn4", 
    "quantity" : 1, 
    "discount" : {
      "rate" : 10, 
      "isPercentage" : true
    }
  }
}

```

### The "all" rule

The `all` rule is an array of any number of this rules: 

* `category`
* `product`
* `all`
* `any`

All the rules in the array will applied as discounts.

```json
{
  "all" : [
    {
      "product" : {
        "id" : "SksexGRPn4", 
        "quantity" : 1, 
        "discount" : {
          "rate" : 10, 
          "isPercentage" : true
        }
      }
    }, 
    {
      "category" : {
        "id" : "By-4rrmsN", 
        "quantity" : 1, 
        "discount" : {
          "rate" : 10, 
          "isPercentage" : true
        }
      }
    }
  ]
}
```

### The "any" rule

The `any` rule is an array of any number of this rules: 

* `category`
* `product`
* `all`
* `any`

Only the first of the rules will be appiad as discount.

```json
{
  "any" : [
    {
      "product" : {
        "id" : "SksexGRPn4", 
        "quantity" : 1, 
        "discount" : {
          "rate" : 10, 
          "isPercentage" : true
        }
      }
    }, 
    {
      "product" : {
        "id" : "aNser15F", 
        "quantity" : 1, 
        "discount" : {
          "rate" : 10, 
          "isPercentage" : true
        }
      }
    }
  ]
}
```

# Response

Returns a Promotion object:

```json
{
  "ok": true,
  "promotion":  { 
    "id" : "ryUGgm44", 
    "title" : "3 at 10€ Promotion", 
    "class" : "default", 
    "active" : false, 
    "priority" : 100, 
    "if" : {
      "category" : {
        "id" : "By-4rrmsN", 
        "quantity" : 3, 
        "lowestPrice" : true
      }
    }, 
    "then" : {
      "category" : {
        "id" : "By-4rrmsN", 
        "quantity" : 3, 
        "discount" : {
          "rate" : 10, 
          "isFixedPrice" : true
        }
      }
    }
  }
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
  --url http://localhost:3000/services/promotion/v1/promotion.create \
  --header 'authorization: Bearer xxxxx...' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{ "ok": true, \
            "promotion":  { \ 
              "id" : "ryUGgm44", \ 
              "title" : "3 at 10€ Promotion", \ 
              "class" : "default", \ 
              "active" : false, \
              "priority" : 100, \
              "if" : { "category" : { "id" : "By-4rrmsN", "quantity" : 3, "lowestPrice" : true } }, \ 
              "then" : { "category" : { "id" : "By-4rrmsN", "quantity" : 3, "discount" : { "rate" : 10, "isFixedPrice" : true } } } \
          } }'
```

# Events

A Promotion creation fires a `CREATE` event in the `PROMOTIONS` channel.

## Payload

Property | Description
---------|------------
new  | The new Promotion created
data | The request data used to crate the Promotion
