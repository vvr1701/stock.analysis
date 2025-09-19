# Overview

Stock Consultant is a modern web application designed to provide AI-powered investment advice for stock portfolios. The application fetches real-time stock market data from Yahoo Finance, analyzes user portfolios, and generates plain-English investment recommendations for beginners. The platform focuses on simplicity and accessibility, making stock analysis approachable for novice investors while providing comprehensive insights into portfolio performance and diversification.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Full-Stack Architecture
The application follows a modern full-stack architecture with a clear separation between client and server components. The client is built using React with TypeScript, while the server uses Express.js with Node.js. The application is structured as a monorepo with shared TypeScript schemas and utilities.

## Frontend Architecture
The client-side application is built with React 18 and TypeScript, utilizing Vite as the build tool for fast development and optimized production builds. The UI is constructed using shadcn/ui components built on top of Radix UI primitives, providing accessible and customizable components. Styling is handled through Tailwind CSS with a custom design system supporting both light and dark themes.

State management is implemented using React Query (TanStack Query) for server state management, providing automatic caching, background updates, and optimistic updates. Local state is managed through custom React hooks, with a portfolio management hook handling stock additions, removals, and quantity updates.

The application features a responsive design optimized for both desktop and mobile devices, with a dashboard-centric layout showcasing portfolio analysis, real-time charts, market overview, and AI-generated investment advice.

## Backend Architecture
The server is built using Express.js with TypeScript, providing a RESTful API for client-server communication. The architecture implements a storage abstraction layer with an in-memory storage implementation for development, designed to be easily replaceable with database implementations.

API endpoints include portfolio management, real-time stock data fetching, portfolio analysis, market overview data, and usage tracking. The server integrates with Yahoo Finance API for live stock data, eliminating the need for API keys while providing comprehensive market information.

## Database Design
The application uses Drizzle ORM with PostgreSQL for data persistence. The database schema includes tables for portfolios, stock data, portfolio analyses, and usage tracking. Portfolio stocks are stored as JSON arrays within portfolio records, allowing flexible stock quantity management.

The schema supports real-time stock data caching, historical portfolio analyses for tracking performance over time, and detailed usage metrics for billing integration.

## Real-Time Data Integration
Stock data is fetched from Yahoo Finance using the yahoo-finance2 library, providing access to current prices, daily changes, moving averages, sector information, and intraday data. The system implements intelligent caching to minimize API calls while ensuring data freshness.

Market overview data includes major indices (NSE, BSE) with real-time updates, providing users with broader market context for their investment decisions.

## AI Advisory System
The application features a rule-based advice engine that generates investment recommendations based on stock performance metrics, portfolio composition, and market trends. Advice categories include BUY (undervalued/trending up), SELL (overvalued/trending down), HOLD (stable trend), and DIVERSIFY (portfolio concentration warnings).

Each recommendation includes confidence levels and plain-English explanations suitable for beginner investors.

## Authentication & Authorization
Currently implemented with session-based authentication preparation, with infrastructure ready for user management and portfolio isolation. The system is designed to support multiple users with individual portfolio management.

# External Dependencies

## Primary APIs
- **Yahoo Finance**: Real-time stock data, market information, and historical prices via yahoo-finance2 library
- **Flexprice API**: Usage tracking and billing integration (simulated implementation ready for production deployment)

## Frontend Libraries
- **React 18**: Core UI framework with TypeScript support
- **Vite**: Build tool and development server with hot module replacement
- **TanStack React Query**: Server state management and caching
- **shadcn/ui & Radix UI**: Component library providing accessible, customizable UI components
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Recharts**: Data visualization library for portfolio and stock charts
- **Wouter**: Lightweight client-side routing
- **React Hook Form**: Form management with validation

## Backend Libraries
- **Express.js**: Web framework for API development
- **Drizzle ORM**: Type-safe database ORM with PostgreSQL support
- **Neon Database**: PostgreSQL hosting service integration
- **yahoo-finance2**: Yahoo Finance API client for stock data
- **Zod**: Runtime type validation and schema definition

## Development Tools
- **TypeScript**: Static typing for enhanced development experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer
- **Replit Plugins**: Development environment integration for Replit platform

## Database
- **PostgreSQL**: Primary database with Neon hosting
- **Drizzle Kit**: Database migration and schema management tools

The application is architected for scalability with clear separation of concerns, type safety throughout the stack, and efficient data management strategies. The modular design allows for easy feature additions and external service integrations.