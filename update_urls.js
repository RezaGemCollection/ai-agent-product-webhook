const fs = require('fs');

// Read the product data
const products = JSON.parse(fs.readFileSync('product_details.json', 'utf8'));

// Update URLs from Shopify to your domain
const updatedProducts = products.map(product => {
  if (product.product_url && product.product_url.includes('pctez9-jr.myshopify.com')) {
    // Extract the product handle from the URL
    const urlParts = product.product_url.split('/');
    const productHandle = urlParts[urlParts.length - 1];
    
    // Update to your domain
    product.product_url = `https://rezagemcollection.ca/products/${productHandle}`;
  }
  return product;
});

// Write the updated data back to the file
fs.writeFileSync('product_details.json', JSON.stringify(updatedProducts, null, 2));

console.log(`Updated ${updatedProducts.length} products with new domain URLs`);
console.log('Sample updated URL:', updatedProducts[0].product_url);
