# Eat 🍳

**Track your kitchen inventory and discover recipes you can make with what you have.**

Eat is a smart kitchen management app that helps you:
- 📸 **Scan receipts** with AI to automatically add groceries to your inventory
- 📝 **Track items** with quantities, prices, categories, and units
- 🍽️ **Discover recipes** from 15+ RSS feeds that match your available ingredients
- ⭐ **Save favorites** and filter by source, category, or ingredient matches
- 💬 **Send feedback** directly from the app to help improve the experience

## Features

### Inventory Management
- **AI-Powered Receipt Scanning**: Upload a receipt photo and GPT-4 Vision extracts items and prices automatically
- **Manual Entry**: Add items with custom categories, quantities, units, and prices
- **Smart Categorization**: Automatic categorization into Produce, Dairy, Meat, Bakery, Pantry, Frozen, and Condiments
- **Real-Time Updates**: Edit quantities, categories, and units with instant Supabase sync
- **Visual Stats Dashboard**: Track total items, categories, recent additions, low stock alerts, and total value

### Recipe Discovery
- **15+ Default RSS Feeds**: Bon Appétit, Food Network, Serious Eats, Epicurious, BBC Good Food, and more
- **Smart Matching**: See which recipes you can make based on your inventory
- **Advanced Filtering**: Search, sort, and filter by source, category, or favorites
- **Favorites System**: Save and organize your favorite recipes
- **Random Recipe Generator**: Get inspired with a random recipe suggestion

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **AI**: OpenAI GPT-4 Vision for receipt scanning
- **UI Components**: Shadcn/ui, Lucide React icons

## Getting Started

### Prerequisites
- Node.js 20+
- Supabase account
- OpenAI API key
- Resend API key (optional, for feedback feature)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/fraction12/eat.git
cd eat
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key

# Feedback Feature (optional)
RESEND_API_KEY=your_resend_api_key
FEEDBACK_EMAIL=dushyantgarg3@gmail.com
```

**Note**:
- Get your Resend API key from [https://resend.com](https://resend.com) (free tier: 100 emails/day)
- `FEEDBACK_EMAIL` is where user feedback will be sent (defaults to dushyantgarg3@gmail.com if not set)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The app uses three main Supabase tables:

- **inventory**: Stores user items with quantities (NUMERIC), prices, categories, and units
- **recipe_feeds**: User's RSS feed subscriptions
- **favorite_recipes**: Saved favorite recipes

### Database Migration

If you're setting up a new database, run the migration file to ensure decimal quantities work:

```bash
# In your Supabase SQL editor, run:
supabase-migration-quantity-decimal.sql
```

This changes the `quantity` column from INTEGER to NUMERIC(10,2) to support decimal values like 0.5, 1.25, etc.

## Testing

Run the test suite:
```bash
npm test
```

Run E2E tests:
```bash
npm run test:e2e
```

## Deployment

This app is designed to be deployed on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/fraction12/eat)

## License

MIT

## Author

Created by Dushyant Garg
