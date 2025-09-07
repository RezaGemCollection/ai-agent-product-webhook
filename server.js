const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

// Load your JSON data (keep this file private)
const products = JSON.parse(fs.readFileSync("product_details.json"));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Gem Collection Webhook Service", 
    status: "running",
    totalProducts: products.length 
  });
});

// Webhook endpoint for Dialogflow CX
app.post("/webhook", (req, res) => {
  try {
    // Log request for debugging
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    // Check webhook tag for Dialogflow CX
    const tag = req.body.fulfillmentInfo?.tag;
    
    if (tag !== "product_lookup") {
      return res.json({
        fulfillment_response: {
          messages: [{ text: { text: ["Webhook tag mismatch."] } }]
        }
      });
    }

    // Get the stone name typed by user
    const stoneType = req.body.sessionInfo?.parameters?.gemstone?.toLowerCase();

    if (!stoneType) {
      return res.json({
        fulfillment_response: {
          messages: [{ text: { text: ["Please provide a stone name."] } }]
        }
      });
    }

    // Filter products with flexible matching (exact match first, then partial)
    let matched = products.filter(p => p.stone_type.toLowerCase() === stoneType);
    
    // If no exact match, try partial matching
    if (matched.length === 0) {
      matched = products.filter(p => 
        p.stone_type.toLowerCase().includes(stoneType) ||
        stoneType.includes(p.stone_type.toLowerCase())
      );
    }

    if (matched.length === 0) {
      return res.json({
        fulfillment_response: {
          messages: [{ text: { text: [`No products found for ${stoneType}. Try searching for: tourmaline, moonstone, selenite, or agate.`] } }]
        }
      });
    }

    // Determine how many products to show
    let maxProducts;
    if (matched.length === 1) {
      maxProducts = 1;
    } else {
      maxProducts = Math.min(5, Math.max(2, matched.length));
    }
    
    const displayedProducts = matched.slice(0, maxProducts);
    
    // Build carousel items for displayed products
    const carouselItems = displayedProducts.map(p => ({
      title: p.title || "Gem Product",
      subtitle: `Available sizes: ${p.sizes ? p.sizes.join(", ") : "Various sizes"}`,
      imageUri: p.main_image || "https://via.placeholder.com/300x300/ffffff/cccccc?text=Reza+Gem+Collection",
      actionLink: p.product_url || "https://rezagemcollection.ca",
      accessibilityText: p.title || "Gem Product"
    }));
    
    // Add "View all" item to carousel if there are more products
    if (matched.length > maxProducts) {
      const collectionUrl = `https://rezagemcollection.ca/collections/${stoneType}-gemstone-beads`;
      carouselItems.push({
        title: "View all products",
        subtitle: `See ${matched.length - maxProducts} more ${stoneType} products`,
        imageUri: "https://via.placeholder.com/300x300/ffffff/cccccc?text=View+All+Products",
        actionLink: collectionUrl,
        accessibilityText: "View all products"
      });
    }
    
    // Build carousel format for Messenger compatibility
    const richContent = [
      {
        type: "carousel",
        items: carouselItems
      }
    ];

    res.json({
      sessionInfo: {
        parameters: {
          gemstone: stoneType
        }
      },
      fulfillment_response: {
        messages: [
          {
            text: {
              text: [`Here are ${displayedProducts.length} ${stoneType} products${matched.length > maxProducts ? ` (showing first ${maxProducts} of ${matched.length} total)` : ''}:`]
            }
          },
          {
            payload: {
              richContent: richContent
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({
      fulfillment_response: {
        messages: [{ text: { text: ["Sorry, there was an error processing your request."] } }]
      }
    });
  }
});

// Additional endpoint to get all stone types (useful for testing)
app.get("/stone-types", (req, res) => {
  const stoneTypes = [...new Set(products.map(p => p.stone_type))].sort();
  res.json({ stoneTypes });
});

// Get products by stone type (useful for testing)
app.get("/products/:stoneType", (req, res) => {
  const stoneType = req.params.stoneType.toLowerCase();
  const matched = products.filter(p => p.stone_type.toLowerCase() === stoneType);
  res.json({ products: matched, count: matched.length });
});

// Fuzzy search endpoint for testing flexible matching
app.get("/search/:query", (req, res) => {
  const query = req.params.query.toLowerCase();
  
  // Exact match first
  let exactMatches = products.filter(p => p.stone_type.toLowerCase() === query);
  
  // Partial matches
  let partialMatches = products.filter(p => 
    p.stone_type.toLowerCase().includes(query) ||
    query.includes(p.stone_type.toLowerCase()) ||
    p.title.toLowerCase().includes(query)
  );
  
  // Remove duplicates
  const allMatches = [...new Set([...exactMatches, ...partialMatches])];
  
  res.json({
    query: query,
    exactMatches: exactMatches.length,
    partialMatches: partialMatches.length,
    totalMatches: allMatches.length,
    results: allMatches.slice(0, 10).map(p => ({
      title: p.title,
      stone_type: p.stone_type,
      product_url: p.product_url
    }))
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook running on port ${PORT}`);
  console.log(`Total products loaded: ${products.length}`);
});
