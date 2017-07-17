# Promotion Service

[![NPM version][npm-image]][npm-url] 
[![Downloads][downloads-image]][npm-url] 
[![Build Status][travis-image]][travis-url] 
[![Coverage Status][coveralls-image]][coveralls-url] 
[![bitHound Overall Score][bithound-overal-image]][bithound-url]
[![bitHound Code][bithound-code-image]][bithound-url]
[![Dependency status][bithound-image]][bithound-url] 
[![Dev Dependency status][bithound-dev-image]][bithound-url] 

[npm-url]:https://npmjs.org/package/microbase
[downloads-image]:http://img.shields.io/npm/dm/microbase.svg
[npm-image]:http://img.shields.io/npm/v/microbase.svg

[travis-url]:https://travis-ci.org/microbaseio/
[travis-image]:http://img.shields.io/travis/microbaseio/micro-promotion-service/develop.svg
[coveralls-url]:https://coveralls.io/r/microbaseio/micro-promotion-service
[coveralls-image]:https://img.shields.io/coveralls/microbaseio/micro-promotion-service/develop.svg

[bithound-url]:https://www.bithound.io/github/microbaseio/micro-promotion-service/develop
[bithound-overal-image]:https://www.bithound.io/github/microbaseio/micro-promotion-service/badges/score.svg
[bithound-image]:https://img.shields.io/bithound/dependencies/github/microbaseio/micro-promotion-service.svg
[bithound-dev-image]:https://img.shields.io/bithound/devDependencies/github/microbaseio/micro-promotion-service.svg
[bithound-code-image]:https://www.bithound.io/github/microbaseio/micro-promotion-service/badges/code.svg

Ecommerce Promotion service, part of the [microbase](http://microbase.io)
ecosystem.

## Overview
Promotions module aims to help companies gain new customers. It consists of //TODO complete introduction

## Promotion Types
Promotions are classified in two main groups: **Product promotions** and **Order promotions**

### Product promotions
Product promotions triggers depend on products from a cart or order.

   | Promotion                   | Description                 | Example
---|-----------------------------|-----------------------------|------------------------------
 1 | Bundle                      | Purchase one of each product from a defined set for a combined total price. | Buy A, B, and C for €50
 2 | Buy X get Y free            | Purchase a certain number of products from within a defined set and add further products from the same set at no additional cost. | Buy one get one free.
 3 | Fixed price                 | Purchase from within a defined set at a fixed unit price.| All shirts €5 each.
 4 | Multi-buy                   | Purchase a certain number of products from within a defined set for a fixed price.| Buy any 3 shirts for €50.
 5 | Stepped multi-buy           | Purchase a number of products from within a defined set, there are multiple tiers of product quantities and fixed prices.| Buy any 3 shirts for €50, 5 for €65, and 7 for €75.
 6 | Perfect partner             | Purchase a certain product from within a defined set and another partner product from a different defined set and pay a fixed price for the partner product.| Buy a game for €10 with each games console.
 7 | One-to-one perfect partner bundle | Purchase a certain product and another defined partner product for a fixed total price. The cart must contain the base product and the partner product to qualify.| Buy this game and the selected partner accessory together for €25.00.
 8 | Perfect partner bundle      | Purchase a certain product along with a specified number of products from within a defined set for a combined total price.| Buy a games console and 3 accessories for €200.
 9 | Percentage discount         | Receive a percentage discount on all products within a defined set. | 20% off all cameras.

### Order promotions
Order promotions triggers depend on the state of the cart or order at any given moment. That is, depends directly on cart attributes.

   | Promotion                   | Description                 | Example
---|-----------------------------|-----------------------------|------------------------------
 1 | Order threshold fixed discount  | A fixed value discount is applied to the order when the threshold order value is exceeded. | Spend over €50 to receive a €3 discount.
 2 | Order threshold perfect partner | Purchase a certain product from within a defined set for a fixed price when the threshold order value is exceeded. | Spend over €50 to get any shirt for €5.
 3 | Order threshold free gift       | A free gift is added to the order when the threshold order value is exceeded. | Spend over €50 to receive a free t-shirt.
 4 | Order threshold free voucher    | A free voucher is given out when the order reaches a certain value. | Get a free €5 voucher when you spend over €150.00.
 5 | Order threshold change delivery mode | A different delivery mode is applied to the order when the threshold order value is exceeded. | Spend over €10 to get free shipping

## Promotion triggers evaluation
Promotions are evaluated against a cart. From this evaluation, promotions can be resolved **to be fired**, or **to be potentially fired**. In this latter case, promotions that fulfill conditions to be triggered only to a certain extent (not completely), but enough to be interesting for a customer to be informed of the possibility of getting the advantages of the promotion if he buys more products to meet all promo conditions. A single product in a cart could be affected by many potentially fired promotions.

Promotions have a certainty factor that represents how close they are to be actually fired, being triggered on certainty == 1. The closer to 1, the closer they are to being fired.

## Promotion priority
Promotions are evaluated in order depending on their priority value. This is important as products can only participate on 1 fired promotion from the set of potential promotions.

# Appendix I: Special promotion types and cases
### Perfect partner cheapest product percent discount
In every case to qualify for the discount twice you need to have a perfect pair, meaning 1 qualifying and 1 partner 1 discount.
2 qualifying and 2 partner 2 discounts.

**Qualifying categories: Men Women - Partner categories: Men Women**

*Case 1*

Cart contains 2 products: 1 men(10$) 1 women(5$) the discount will be taken from the lowest price product of the two, in this case it will be the women's (5$)

*Case 2*

Cart contains 3 products: 1 Men (10$) 1 women(12$) & 1 women (15$) the discount will be taken from the lowest price product of the three, in this case it will be the men (10$)

*Case 3*

Cart contains 4 products: 1Men 20$ 1 Men (10$) 1 women(12$) & 1 women (15$) the discount will be taken from the 2 lowest price products of the 4, in this case it will be the men (10$) & women (12$)

**Qualifying categories: Men - Partner categories: Men**

*Case 1*

Cart contains 2 products: 1 men (5$) & 1 men (10$) the discount will be taken from the lowest price product of the two, in this case it will be the men (5$)

*Case 2*

Cart contains 3 products: 1 Men (10$) 1 men(12$) & 1 men (15$) the discount will be taken from the lowest price product of the three, in this case it will be the men (10$)

*Case 3*

Cart contains 4 products: 1 Men 20$ 1 Men (10$) 1 men(12$) & 1 men (15$) the discount will be taken from the 2 lowest price products of the 4, in this case it will be the men (10$) & men (12$)

**Qualifying categories: Men - Partner categories: Women**

*Case 1*

Cart contains 2 products: 1 men (5$) & 1 women (10$) the discount will be taken from the lowest price women product, in this case it will be the women (10$)

*Case 2*

Cart contains 3 products: 1 men (5$) & 1 women (10$) 1 women (15$) the discount will be taken from the lowest price women product, in this case it will be the women (10$)

*Case 3*

Cart contains 4 products: 1 Men 20$ 1 Men 25$ 1 women(12$) & 1 women (15$) the discount will be taken from the 2 women's product , in this case it will be the women (15$) & women (12$)

### Perfect partner percent discount
The same logic will apply for the perfect partner discount however the discount will come off of the highest price qualifying product.

## Examples

In the [examples page](./Examples.md) there is a compilation of rules and discounts for each of the promotions types mentioned in thei page.