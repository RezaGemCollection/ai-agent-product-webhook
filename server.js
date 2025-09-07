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

    // Build cards for each product (proper CX format with fallbacks)
    const richContent = [
      ...matched.map(p => ({
        type: "info",
        title: p.title || "Gem Product",
        subtitle: `Available sizes: ${p.sizes ? p.sizes.join(", ") : "Various sizes"}`,
        actionLink: p.product_url || "https://rezagemcollection.ca",
        rawUrl: p.main_image || "https://via.placeholder.com/300x300?text=Gem+Image",
        accessibilityText: p.title || "Gem product image"
      }))
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
              text: [`Here are the products for ${stoneType} (${matched.length} found):`]
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
