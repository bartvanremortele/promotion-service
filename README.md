# Promotion Service

Ecommerce Promotion service, part of the [microbase](http://microbase.io)
ecosystem.

**Work In Progess!**

## Conditions

Given this promotion:

```json
{
  id: 'P001',
  if: {
    any: [
      {
        and: [
          { product: { id: '0001', quantity: 5, "threshold" : 0.3 } },
          { product: { id: '0002', quantity: 3 } }
        ]
      },
      {
        product: { id: '0003', quantity: 3 }
      }
    ]
  }
}
```

and this cart:

```json
{
  items: [
    { id: '0', '0001': productId1, quantity: 2 },
    { id: '1', '0002': productId2, quantity: 2 },
    { id: '2', '0003': productId3, quantity: 3 }
  ]
}
```

the promotion engine will output:

```json
{
      almostFulfilledPromos: [
        {
          id: 'P001',
          data: [
            {
              any: [
                {
                  and: [
                    {
                      collectedQuantity: 2,
                      promoQuantity: 5,
                      threshold: 0.3,
                      value: 0.4,
                      type: 'PRODUCT',
                      code: '0001',
                      items: [
                        { itemId: '0', quantityToUse: 2 }
                      ]
                    }, {
                      collectedQuantity: 2,
                      promoQuantity: 3,
                      threshold: 0.6666666666666666,
                      value: 0.6666666666666666,
                      type: 'PRODUCT',
                      code: '0002',
                      items: [
                        { itemId: '1', quantityToUse: 2 }
                      ]
                    }],
                  value: 0.5333333333333333
                }],
              value: 0.5333333333333333
            }]
        }
      ],
      fulfilledPromos: [
        {
          id: 'P001',
          items: [
            { itemId: '2', quantityUsed: 3 }
          ]
        }
      ]
    }
```