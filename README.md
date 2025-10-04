This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### 1. Set Up API Keys

This app requires several API keys:

#### Finnhub API Key (Required)
For real-time stock data via WebSocket.

1. Visit [https://finnhub.io/register](https://finnhub.io/register) and create a free account
2. Copy your API key from the dashboard
3. Create a `.env.local` file in the root directory
4. Add the environment variables:
   ```
   FINNHUB_API_KEY=your_finnhub_api_key_here
   NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_api_key_here
   ```

#### OpenAI API Key (Required)
For the AI trading assistant.

1. Get your API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
   ```

#### Linkup API Key (Optional)
For web search capabilities in the AI assistant.

1. Get your API key from [https://www.linkup.so/](https://www.linkup.so/)
2. Add to `.env.local`:
   ```
   LINKUP_API_KEY=your_linkup_api_key_here
   ```
   
**Note:** The app uses WebSocket connections for real-time data streaming instead of polling, which is more efficient and recommended by Finnhub. You control when to start/stop streaming with the toggle button in the UI. When you switch symbols, the WebSocket automatically unsubscribes from the old symbol and subscribes to the new one without disconnecting.

### 2. Run the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

### 📊 Real-time & Historical Data
- Live streaming market data via WebSocket
- Historical data analysis from Yahoo Finance
- Support for stocks and cryptocurrency pairs
- Dynamic symbol switching

### 📈 Technical Indicators
- Multiple technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, VWAP, ATR, Stochastic)
- Real-time indicator calculations
- Customizable indicator parameters
- Visual overlay on price charts

### 🤖 AI Trading Assistant
- Natural language interface for chart analysis
- Automatic indicator management
- Market trend analysis
- **Web search integration** - Search for trading resources, market news, and educational content
- **Useful Sources panel** - Save and organize helpful websites and articles

### 🎯 User Interface
- Modern, responsive design with Material UI
- Dark/light theme support
- Interactive charts powered by TradingView Lightweight Charts
- Real-time price updates with visual feedback
- Organized dashboard with multiple panels
- **Beautiful icons** - Enhanced with Lucide React icons throughout the interface
  - Semantic icons for all metrics and indicators
  - Professional, modern design language
  - Improved visual hierarchy and scannability

## Using the AI Assistant

The AI trading assistant can help you with:
- Adding/removing technical indicators (e.g., "Add a 20-period SMA")
- Analyzing market trends (e.g., "What's the current trend?")
- Answering questions about indicators
- **Searching for trading resources** (e.g., "Search for RSI indicator tutorials")
- **Saving useful sources** - The assistant can save helpful websites to the "Useful Sources" panel for easy reference

Example commands:
- "Add RSI indicator"
- "What does MACD tell us about this stock?"
- "Search for technical analysis guides"
- "Find news about [symbol]"

## Icon System

This project uses **Lucide React** icons for a modern, professional appearance. Icons are used throughout the interface to enhance:
- Visual hierarchy and navigation
- Quick recognition of metrics and indicators
- User feedback for different states
- Overall aesthetic and user experience

For detailed information about the icon system, see:
- **[ICON_ENHANCEMENTS.md](./ICON_ENHANCEMENTS.md)** - Complete guide to icon implementations
- **[ICONS_QUICK_REFERENCE.md](./ICONS_QUICK_REFERENCE.md)** - Quick reference for developers