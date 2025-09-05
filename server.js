const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

// Load your JSON data
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
    // Get the stone name typed by user
    const stoneType = req.body.sessionInfo?.parameters?.stone_name?.toLowerCase();

    if (!stoneType) {
      return res.json({
        fulfillment_response: {
          messages: [{ text: { text: ["Please provide a stone name."] } }]
        }
      });
    }

    // Filter products by stone_type
    const matched = products.filter(p => p.stone_type.toLowerCase() === stoneType);

    if (matched.length === 0) {
      return res.json({
        fulfillment_response: {
          messages: [{ text: { text: [`No products found for ${stoneType}.`] } }]
        }
      });
    }

    // Build rich content for Dialogflow CX
    const richContent = matched.map(p => [
      {
        type: "image",
        rawUrl: p.main_image,
        accessibilityText: p.title
      },
      {
        type: "info",
        title: p.title,
        subtitle: `Available sizes: ${p.sizes.join(", ")}`,
        actionLink: p.product_url
      }
    ]);

    res.json({
      fulfillment_response: {
        messages: [
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook running on port ${PORT}`);
  console.log(`Total products loaded: ${products.length}`);
});
