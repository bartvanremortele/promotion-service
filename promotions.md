# Promotions

## Pseudocode

```
Loop cart items (item)
  Search applicable promotions for this item/user/date
  Store the applicable promotion in a list (promoList)
    with the associated products
    with the associated completion %
    with the associated messages (for completion % or completed)

Loop the promotions list (promoList) ordered by (priority)
  Apply the promotion to the non already used products
  Mark the products as used
  Store the products messages (for completion % or completed)
```

## Full entity

```javascript
{
  code: 'prom1',
  type: 'BuyXGetYFree',
  status: 'ACTIVE'
  restrictions: {
    utype: 'VIPS',
    ulocation: '???',
    period: {
      from: '2016-01-01'
      until: '2016-12-31',
    }
  },
  messages: {...} // TBD
  if_matches_all/if_matches_any/if_subtotal_gte: [ // One of them
    { productId: 'p1', quantity: 2 },
    { categoryId: 'c1', quantity: 2 },
    { collectionId: 'col1', quantity: 2 },
  ],
  then_discount_one: [
    { productId: 'p1', quantity: 1, discount: { rate: 0, isPercentage: false } }
    { categoryId: 'c1', quantity: 1, discount: { rate: 0, isPercentage: false } }
    { collectionId: 'col1', quantity: 1, discount: { rate: 0, isPercentage: false } }
  ]
}
```

# Examples item level

## 3x2

```javascript
{
  if_matches_all: [
    { productId: 'p1', quantity: 3 }
  ]
  then_discount_one: [
    { productId: 'p1', quantity: 1, discount: { rate: 100, isPercentage: true } }
  ]
}
```

## Buy X and get Y at 25% discount

```javascript
{
  if_matches_all: [
    { productId: 'p1', quantity: 1 }
  ],
  then_discount_one: [
    { productId: 'p2', quantity: 1, discount: { rate: 25, isPercentage: true } },
    { productId: 'p3', quantity: 1, discount: { rate: 25, isPercentage: true } }
  ]
}
```

## Bundle

```javascript
{
  if_matches_all: [
    { productId: 'p1', quantity: 1 },
    { productId: 'p2', quantity: 1 }
  ],
  then_discount_one: [
    { productId: 'p3', quantity: 1, discount: { rate: 10, isPercentage: true } }
  ]
}
```

## Fixed Price

```javascript
{
  if_matches_all: [
    { productId: 'p1', quantity: 1 },
  ],
  then_discount_one: [
    { productId: 'p2', quantity: 1, discount: { rate: 99.99, isPercentage: false } }
  ]
}
```

## Buy X and get Y at 25% discount (Categories)

```javascript
{
  if_matches_any: [
    { categoryId: 'c1', quantity: 5 },
    { categoryId: 'c2', quantity: 5 }
  ],
  then_discount_one: [
    { categoryId: 'c1', quantity: 1, discount: { rate: 25, isPercentage: true } },
    { categoryId: 'c2', quantity: 1, discount: { rate: 25, isPercentage: true } }
  ]
}
```

## Buy X and get Y at 25% discount (Collections)

```javascript
{
  if_matches_all: [
    { productId: 'p1', quantity: 1 }
  ],
  then_discount_one: [
    { collectionId: 'col1', quantity: 1, discount: { rate: 25, isPercentage: true } }
  ]
}
```

# Examples order level

## Order Threshold Fixed Price

```javascript
{
  if_subtotal_gte: 150,
  then_discount_one: [
    { productId: 'p1', quantity: 1, discount: { rate: 99.99, isPercentage: false } }
  ]
}
```

## Order Threshold Free item (Categories)

```javascript
{
  if_subtotal_gte: 150,
  then_discount_one: [
    { categoryId: 'c1', quantity: 1, discount: { rate: 100, isPercentage: true } }
  ]
}
```
