#!/usr/bin/env bun

import { stripe, PRICING_PLANS } from '~/lib/stripe';

async function setupStripeProducts() {
  console.log('Setting up Stripe products and prices...');

  try {
    for (const plan of PRICING_PLANS) {
      if (plan.id === 'free') {
        console.log(`Skipping ${plan.name} plan (free)`);
        continue;
      }

      console.log(`Creating product for ${plan.name} plan...`);

      // Create or get existing product
      let product;
      try {
        const products = await stripe.products.list({
          limit: 100,
        });
        
        // Find existing product by metadata
        const existingProduct = products.data.find(p => p.metadata?.plan_id === plan.id);
        
        if (existingProduct) {
          product = existingProduct;
          console.log(`Found existing product: ${product.name}`);
        } else {
          product = await stripe.products.create({
            name: `Wolkenlauf ${plan.name} Plan`,
            description: `${plan.credits} credits per month for cloud VM usage`,
            metadata: {
              plan_id: plan.id,
              credits: plan.credits.toString(),
            },
          });
          console.log(`Created product: ${product.name}`);
        }
      } catch (error) {
        console.error(`Error creating product for ${plan.name}:`, error);
        continue;
      }

      // Create price
      try {
        const prices = await stripe.prices.list({
          product: product.id,
          lookup_keys: [plan.stripePriceId],
        });

        if (prices.data.length > 0) {
          console.log(`Found existing price for ${plan.name}: ${prices.data[0]!.id}`);
        } else {
          const price = await stripe.prices.create({
            product: product.id,
            unit_amount: plan.price * 100, // Convert to cents
            currency: 'eur',
            recurring: {
              interval: 'month',
            },
            lookup_key: plan.stripePriceId,
            metadata: {
              plan_id: plan.id,
              credits: plan.credits.toString(),
            },
          });
          console.log(`Created price for ${plan.name}: ${price.id}`);
        }
      } catch (error) {
        console.error(`Error creating price for ${plan.name}:`, error);
      }
    }

    // Create credit top-up product
    console.log('Creating credit top-up product...');
    try {
      let topupProduct;
      const products = await stripe.products.list({
        limit: 100,
      });
      
      // Find existing top-up product by metadata
      const existingTopupProduct = products.data.find(p => p.metadata?.product_type === 'credit-topup');
      
      if (existingTopupProduct) {
        topupProduct = existingTopupProduct;
        console.log(`Found existing top-up product: ${topupProduct.name}`);
      } else {
        topupProduct = await stripe.products.create({
          name: 'Wolkenlauf Credit Top-up',
          description: 'Buy additional credits for your Wolkenlauf account',
          metadata: {
            product_type: 'credit-topup',
          },
        });
        console.log(`Created top-up product: ${topupProduct.name}`);
      }

      // Create dynamic price for credit top-ups (we'll handle the amount dynamically)
      const prices = await stripe.prices.list({
        product: topupProduct.id,
        lookup_keys: ['price_credit_topup'],
      });

      if (prices.data.length > 0) {
        console.log(`Found existing top-up price: ${prices.data[0]!.id}`);
      } else {
        const price = await stripe.prices.create({
          product: topupProduct.id,
          unit_amount: 1, // 1 cent per credit
          currency: 'eur',
          lookup_key: 'price_credit_topup',
          metadata: {
            type: 'credit-topup',
          },
        });
        console.log(`Created top-up price: ${price.id}`);
      }
    } catch (error) {
      console.error('Error creating credit top-up product:', error);
    }

    console.log('\nStripe setup completed!');
    console.log('Products and prices are ready for use.');

  } catch (error) {
    console.error('Failed to setup Stripe products:', error);
    process.exit(1);
  }
}

// if (import.meta.main) {
//   await setupStripeProducts();
// }