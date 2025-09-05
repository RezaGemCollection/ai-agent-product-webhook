# Gem Collection Webhook Service

A webhook service for your gem collection data that integrates with Dialogflow CX. This service provides an API endpoint that can be called by Dialogflow CX to fetch gem product information based on stone type.

## Features

- **Webhook Endpoint**: `/webhook` - Main endpoint for Dialogflow CX integration
- **Health Check**: `/` - Service status and product count
- **Stone Types**: `/stone-types` - Get all available stone types
- **Product Search**: `/products/:stoneType` - Get products by stone type
- **Rich Content**: Returns formatted responses with images and product details for Dialogflow CX

## Project Structure

```
├── server.js              # Main Express.js server
├── package.json           # Node.js dependencies and scripts
├── product_details.json   # Your gem collection data
├── railway.json          # Railway deployment configuration
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **Test the endpoints**:
   - Health check: `GET http://localhost:3000/`
   - Stone types: `GET http://localhost:3000/stone-types`
   - Products by type: `GET http://localhost:3000/products/tourmaline`
   - Webhook: `POST http://localhost:3000/webhook`

## Railway Deployment

### Method 1: Railway CLI (Recommended)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize Railway project**:
   ```bash
   railway init
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

### Method 2: GitHub Integration

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Railway**:
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect the Node.js project and deploy

### Method 3: Direct Upload

1. **Create a new project on Railway**:
   - Go to [Railway.app](https://railway.app)
   - Click "New Project"
   - Select "Empty Project"

2. **Upload your files**:
   - Use Railway's file upload feature
   - Or connect via Railway CLI and run `railway up`

## Webhook Integration with Dialogflow CX

### 1. Get your Railway URL

After deployment, Railway will provide you with a URL like:
```
https://your-project-name.railway.app
```

### 2. Configure Dialogflow CX

1. **Open your Dialogflow CX agent**
2. **Go to Manage > Webhooks**
3. **Create a new webhook** with your Railway URL:
   ```
   https://your-project-name.railway.app/webhook
   ```

### 3. Set up Intent with Webhook

1. **Create or edit an intent** (e.g., "Find Gem Products")
2. **Add a parameter**:
   - Parameter name: `stone_name`
   - Entity type: `@sys.any` or create a custom entity
3. **Enable webhook fulfillment** for this intent
4. **Test with phrases like**:
   - "Show me tourmaline products"
   - "I want to see moonstone beads"
   - "Find selenite products"

### 4. Expected Request Format

Dialogflow CX will send requests in this format:
```json
{
  "sessionInfo": {
    "parameters": {
      "stone_name": "tourmaline"
    }
  }
}
```

### 5. Response Format

The webhook returns rich content for Dialogflow CX:
```json
{
  "fulfillment_response": {
    "messages": [
      {
        "payload": {
          "richContent": [
            [
              {
                "type": "image",
                "rawUrl": "https://cdn.shopify.com/...",
                "accessibilityText": "Black Tourmaline Beads"
              },
              {
                "type": "info",
                "title": "Black Tourmaline Beads - Polished Round Beads",
                "subtitle": "Available sizes: 10 mm, 12 mm, 14 mm, 4 mm, 6 mm, 8 mm",
                "actionLink": "https://pctez9-jr.myshopify.com/products/..."
              }
            ]
          ]
        }
      }
    ]
  }
}
```

## Testing Your Webhook

### Using curl:
```bash
curl -X POST https://your-project-name.railway.app/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "sessionInfo": {
      "parameters": {
        "stone_name": "tourmaline"
      }
    }
  }'
```

### Using Postman:
1. Set method to POST
2. URL: `https://your-project-name.railway.app/webhook`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
   ```json
   {
     "sessionInfo": {
       "parameters": {
         "stone_name": "tourmaline"
       }
     }
   }
   ```

## Environment Variables

Railway will automatically set the `PORT` environment variable. The service will use port 3000 locally and the Railway-assigned port in production.

## Monitoring and Logs

- **Railway Dashboard**: View logs and metrics in your Railway project dashboard
- **Health Check**: Visit `https://your-project-name.railway.app/` to verify the service is running
- **Stone Types**: Visit `https://your-project-name.railway.app/stone-types` to see all available stone types

## Troubleshooting

### Common Issues:

1. **"No products found"**: Check if the stone name matches exactly (case-insensitive)
2. **Webhook not responding**: Verify the URL in Dialogflow CX includes `/webhook`
3. **Deployment fails**: Ensure all files are committed and pushed to your repository

### Debug Endpoints:

- `GET /` - Service status and product count
- `GET /stone-types` - List all available stone types
- `GET /products/:stoneType` - Get products for a specific stone type

## Support

If you encounter any issues:
1. Check the Railway logs in your project dashboard
2. Test the endpoints directly using the URLs above
3. Verify your Dialogflow CX webhook configuration
