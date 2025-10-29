# Etheryte NFT Marketplace

A modern, full-featured NFT marketplace built with Next.js, TypeScript, and PostgreSQL. Features include user authentication, NFT trading, auctions, collections, and a comprehensive admin panel.

## 🚀 Features

### Core Features
- **User Authentication**: Secure JWT-based authentication with role management
- **NFT Management**: Create, list, buy, and sell NFTs
- **Auction System**: Time-based auctions with real-time bidding
- **Collections**: Organize NFTs into curated collections
- **Wallet Integration**: Deposit and withdrawal functionality
- **Transaction History**: Complete transaction tracking and history

### Admin Features
- **Admin Dashboard**: Comprehensive system monitoring and analytics
- **User Management**: User administration with bulk operations
- **Transaction Monitoring**: Real-time transaction oversight
- **System Logs**: Detailed logging and debugging tools
- **Settings Management**: Platform configuration and customization

### Technical Features
- **Responsive Design**: Mobile-first responsive UI
- **Performance Optimized**: Image optimization, caching, and bundle splitting
- **SEO Friendly**: Sitemap generation and meta tag optimization
- **Security**: Rate limiting, CSRF protection, and secure headers
- **Monitoring**: Health checks and error tracking

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Deployment**: Vercel (optimized)
- **Icons**: Heroicons

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd etheryte
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file and configure your variables:
```bash
cp .env.example .env.local
```

Configure the following required environment variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/etheryte_db"
DIRECT_URL="postgresql://username:password@localhost:5432/etheryte_db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-here"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Admin Account
ADMIN_EMAIL="admin@etheryte.com"
ADMIN_PASSWORD="secure-admin-password"
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database (optional)
npm run db:seed
```

### 5. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**:
   - Fork this repository
   - Connect your GitHub account to Vercel
   - Import the project

2. **Environment Variables**:
   Configure the following in Vercel dashboard:
   ```env
   DATABASE_URL=your_production_database_url
   DIRECT_URL=your_production_database_url
   JWT_SECRET=your_production_jwt_secret
   NEXTAUTH_SECRET=your_production_nextauth_secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD=secure_admin_password
   ```

3. **Database Migration**:
   ```bash
   npm run db:migrate
   ```

4. **Deploy**:
   Vercel will automatically deploy on every push to main branch.

### Manual Deployment

1. **Build the Application**:
   ```bash
   npm run build
   ```

2. **Start Production Server**:
   ```bash
   npm start
   ```

## 📁 Project Structure

```
etheryte/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   └── dashboard/        # Dashboard-specific components
│   ├── lib/                  # Utility libraries
│   └── middleware.ts         # Next.js middleware
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
├── .env.example             # Environment variables template
├── vercel.json              # Vercel configuration
├── next.config.js           # Next.js configuration
└── tailwind.config.js       # Tailwind CSS configuration
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

## 🔐 Authentication & Authorization

### User Roles
- **USER**: Standard user with basic marketplace access
- **ADMIN**: Full administrative access to all features

### Protected Routes
- `/dashboard/*` - Requires authentication
- `/dashboard/admin/*` - Requires admin role
- `/api/admin/*` - Admin API endpoints

### API Authentication
Include JWT token in requests:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

## 📊 Admin Panel

Access the admin panel at `/dashboard/admin` with admin credentials.

### Features:
- **Dashboard**: System overview and analytics
- **User Management**: User administration and bulk operations
- **Transaction Monitoring**: Real-time transaction oversight
- **System Logs**: Detailed application logs
- **Settings**: Platform configuration

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CSRF protection
- Secure HTTP headers
- Input validation and sanitization
- SQL injection prevention with Prisma

## 🚀 Performance Optimizations

- Image optimization with Next.js Image component
- Bundle splitting and code optimization
- Static generation for public pages
- Caching strategies for API responses
- Lazy loading for components
- Optimized database queries

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Verify DATABASE_URL is correct
   - Ensure PostgreSQL is running
   - Check network connectivity

2. **Authentication Issues**:
   - Verify JWT_SECRET is set
   - Check token expiration
   - Clear browser cookies/localStorage

3. **Build Errors**:
   - Run `npm run db:generate`
   - Clear `.next` folder and rebuild
   - Check for TypeScript errors

### Health Check
Visit `/api/health` to check system status and database connectivity.

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### NFT Endpoints
- `GET /api/nfts` - List NFTs
- `POST /api/nfts` - Create NFT
- `GET /api/nfts/[id]` - Get NFT details
- `PUT /api/nfts/[id]` - Update NFT
- `DELETE /api/nfts/[id]` - Delete NFT

### Transaction Endpoints
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/[id]` - Get transaction details

### Admin Endpoints
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/[id]` - Update user
- `GET /api/admin/logs` - System logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

Built with ❤️ using Next.js and modern web technologies.