# Duin Frontend

The anonymous NFT marketplace built with Next.js and Privy authentication.

## Features

- 🔐 **Privy Authentication**: Email and wallet login support
- 🎨 **Modern UI**: Built with Tailwind CSS
- ⚡ **Next.js 15**: Latest Next.js with App Router
- 🔒 **Embedded Wallets**: Automatic wallet creation for users

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure Privy**:
   - Go to [Privy Dashboard](https://dashboard.privy.io/)
   - Create a new app or use an existing one
   - Copy your App ID
   - Create a `.env.local` file in the root directory:
     ```
     NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
     ```

3. **Run the development server**:
   ```bash
   pnpm dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Authentication

The app supports multiple authentication methods:
- **Email**: Users can sign in with their email address
- **Wallet**: Users can connect their existing crypto wallets
- **Embedded Wallets**: New users get an embedded wallet automatically

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── AuthButton.tsx    # Authentication component
│   ├── globals.css           # Global styles
│   ├── layout.tsx           # Root layout with PrivyProvider
│   └── page.tsx             # Homepage
```

## Technologies Used

- **Next.js 15** - React framework
- **Privy** - Authentication and wallet management
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety