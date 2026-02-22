# Temperature Logger - Documentation Index

## Overview

This is a comprehensive documentation index for the Temperature Logger application, a mobile-optimized Next.js application for recording temperature measurements with automatic German timestamp and screenshot upload functionality.

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [API Documentation](#api-documentation)
3. [Core Libraries](#core-libraries)
4. [UI Components](#ui-components)
5. [Type Definitions](#type-definitions)
6. [Configuration](#configuration)
7. [Usage Patterns](#usage-patterns)
8. [Best Practices](#best-practices)
9. [Dependencies](#dependencies)

## Project Architecture

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Vercel Postgres
- **Styling**: TailwindCSS v4
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod validation
- **File Storage**: Linode Object Storage (S3-compatible)
- **PDF Generation**: jsPDF
- **Icons**: Lucide React

### Directory Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── temperature/   # Temperature data endpoints
│   │   ├── pdf/          # PDF generation endpoint
│   │   ├── setup/        # Database setup endpoint
│   │   ├── delete-entry/ # Entry deletion endpoint
│   │   ├── delete-image/ # Image deletion endpoint
│   │   ├── fix-permissions/ # Permission fixing endpoint
│   │   └── debug-images/ # Image debugging endpoint
│   ├── results/          # Results page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── ui/              # Base UI components
│   ├── login-form.tsx   # Login form component
│   ├── temperature-form.tsx # Temperature form component
│   ├── user-profile.tsx  # User profile component
│   └── theme-toggle.tsx # Theme toggle component
├── lib/                 # Utility libraries
│   ├── auth.ts          # Authentication utilities
│   ├── auth-context.tsx # Authentication context
│   ├── db.ts            # Database operations
│   ├── s3.ts            # S3/Linode storage operations
│   ├── pdf.ts           # PDF generation
│   ├── image-processor.ts # Image processing
│   ├── theme-context.tsx # Theme context
│   └── utils.ts         # General utilities
└── types/               # TypeScript type definitions
    ├── temperature.ts   # Temperature-related types
    └── user.ts          # User-related types
```

## API Documentation

### Authentication Endpoints

#### OAuth Authentication
The application now supports multiple authentication methods:

1. **Google OAuth**: Users can sign in with their Google account
2. **Apple Sign In**: Users can sign in with their Apple ID
3. **Email/Name**: Traditional credentials-based authentication

#### OAuth Callbacks
- `/api/auth/callback/google` - Google OAuth callback
- `/api/auth/callback/apple` - Apple Sign In callback

#### POST `/api/auth/login` (Legacy)
Authenticates a user with email and name (legacy method).

**Request Body:**
```typescript
{
  name: string;
  email: string;
}
```

**Response:**
```typescript
{
  id: string;
  name: string;
  email: string;
}
```

#### GET `/api/auth/session`
Retrieves current session information.

**Response:**
```typescript
{
  user?: {
    id: string;
    name: string;
    email: string;
  };
  expires: string;
}
```

#### POST `/api/auth/signout`
Signs out the current user and clears the session.

**Response:**
```typescript
{
  success: boolean;
}
```

### Temperature Endpoints

#### POST `/api/temperature`
Saves temperature measurement data with optional screenshot upload.

**Request Body (FormData):**
- `temperature`: number (required, -50°C to 100°C)
- `date`: string (required, German format DD.MM.YYYY)
- `time`: string (required, German format HH:MM:SS)
- `location`: string (required, one of predefined locations)
- `screenshot`: File (optional)

**Response:**
```typescript
{
  success: boolean;
  record: {
    id: string;
    temperature: number;
    date: string;
    time: string;
    location: string;
    screenshotUrl?: string;
  };
}
```

#### GET `/api/temperature`
Retrieves all temperature records for the authenticated user.

**Response:**
```typescript
{
  success: boolean;
  records: TemperatureRecord[];
}
```

### PDF Generation Endpoint

#### GET `/api/pdf`
Generates and downloads PDF report of temperature logs.

**Query Parameters:**
- `startDate`: string (optional, ISO format)
- `endDate`: string (optional, ISO format)
- `userName`: string (optional)

**Response:** PDF file with application/pdf content type

### Management Endpoints

#### POST/GET `/api/setup`
Initializes or verifies the database table setup and Linode bucket permissions.

#### DELETE `/api/delete-entry`
Deletes a complete temperature record including associated screenshot.

**Request Body:**
```typescript
{
  recordId: string;
}
```

#### DELETE `/api/delete-image`
Deletes only the screenshot from a temperature record.

**Request Body:**
```typescript
{
  recordId: string;
}
```

#### POST `/api/fix-permissions`
Fixes object permissions for a specific file in Linode storage.

**Request Body:**
```typescript
{
  objectKey: string;
}
```

#### GET `/api/debug-images`
Debugs image processing for all screenshots, providing detailed analysis.

## Core Libraries

### Database Operations (`src/lib/db.ts`)

#### Key Functions:
- `createTableIfNotExists()`: Creates users and temperature_records tables
- `insertTemperatureRecord()`: Inserts a new temperature record
- `getTemperatureRecordsByUserId()`: Retrieves records for a specific user
- `createOrGetUser()`: Creates or retrieves a user by email
- `deleteTemperatureRecord()`: Deletes a temperature record
- `getTemperatureStats()`: Retrieves temperature statistics

#### Database Schema:
```sql
users table:
- id (SERIAL PRIMARY KEY)
- name (VARCHAR(100) NOT NULL)
- email (VARCHAR(255) UNIQUE NOT NULL)
- created_at (TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)

temperature_records table:
- id (SERIAL PRIMARY KEY)
- temperature (DECIMAL(5,2) NOT NULL)
- date (VARCHAR(20) NOT NULL)
- time (VARCHAR(20) NOT NULL)
- location (VARCHAR(50) NOT NULL)
- screenshot_url (TEXT)
- user_id (INTEGER REFERENCES users(id))
- created_at (TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)
```

### Storage Operations (`src/lib/s3.ts`)

#### Key Functions:
- `uploadToLinode()`: Uploads files to Linode Object Storage
- `ensureBucketPublicAccess()`: Sets bucket policy for public read access
- `deleteFromLinode()`: Deletes objects from storage
- `fixObjectPermissions()`: Fixes individual object permissions

#### Configuration:
- Endpoint: `https://eu-central-1.linodeobjects.com`
- Region: `eu-central-1`
- Default bucket: `temp-log`

### Image Processing (`src/lib/image-processor.ts`)

#### Key Functions:
- `downloadAndResizeImage()`: Downloads and resizes images with rotation support
- `processImagesBatch()`: Processes multiple images with memory management
- `calculateDimensions()`: Maintains aspect ratio while resizing

#### Features:
- Automatic portrait to landscape rotation
- Memory-efficient batch processing
- Error handling and retry logic
- Size optimization for PDF generation

### PDF Generation (`src/lib/pdf.ts`)

#### Key Functions:
- `generateTemperaturePDF()`: Creates PDF reports with images

#### Features:
- German language support
- Image integration with proper scaling
- Summary statistics
- Date range filtering
- User name inclusion

### Authentication (`src/lib/auth.ts`)

#### Key Functions:
- `getAuthenticatedUser()`: Retrieves user from request headers
- `requireAuthentication()`: Enforces authentication

#### Implementation:
- Cookie-based session management
- Header-based user identification
- Middleware integration

## UI Components

### Form Components

#### TemperatureForm (`src/components/temperature-form.tsx`)
Main form for recording temperature measurements.

**Features:**
- Real-time German timestamp updates
- Temperature input with validation (-50°C to 100°C)
- Location selection (Küche, Gäste WC, Bad Waschbecken, Bad-Badewanne/Dusche)
- Screenshot upload with preview
- PDF report generation
- Mobile-optimized layout

**Props:** None (uses hooks for state management)

#### LoginForm (`src/components/login-form.tsx`)
User authentication form.

**Features:**
- Name and email input
- Loading states
- Error handling
- Mobile-optimized design

**Props:** None (uses auth context)

### Display Components

#### UserProfile (`src/components/user-profile.tsx`)
Displays current user information with logout functionality.

**Features:**
- User name and email display
- Logout button
- Avatar icon

**Props:** None (uses auth context)

#### ThemeToggle (`src/components/theme-toggle.tsx`)
Dark/light theme switcher.

**Features:**
- System theme detection
- Smooth transitions
- Keyboard navigation
- Mobile-friendly toggle

**Props:** None (uses theme context)

### Base UI Components

#### Button (`src/components/ui/button.tsx`)
Reusable button component with multiple variants.

**Variants:**
- `default`: Primary button style
- `destructive`: Danger/destructive actions
- `outline`: Outlined button
- `secondary`: Secondary button
- `ghost`: Minimal button
- `link`: Link-style button

**Sizes:**
- `default`: Standard size
- `sm`: Small button
- `lg`: Large button
- `icon`: Icon-sized button

#### Card (`src/components/ui/card.tsx`)
Card container component with multiple sub-components.

**Components:**
- `Card`: Main container
- `CardHeader`: Header section
- `CardTitle`: Title text
- `CardDescription`: Description text
- `CardContent`: Main content area
- `CardFooter`: Footer section

#### Input (`src/components/ui/input.tsx`)
Standard input field component.

**Features:**
- Consistent styling
- Focus states
- Disabled states
- File input support

#### Select (`src/components/ui/select.tsx`)
Dropdown select component.

**Features:**
- Consistent styling
- Focus states
- Disabled states

#### DropdownMenu (`src/components/ui/dropdown-menu.tsx`)
Radix UI-based dropdown menu component.

**Components:**
- `DropdownMenu`: Root component
- `DropdownMenuTrigger`: Trigger element
- `DropdownMenuContent`: Menu container
- `DropdownMenuItem`: Menu item
- `DropdownMenuSeparator`: Visual separator
- And more Radix UI components

## Type Definitions

### Temperature Types (`src/types/temperature.ts`)

#### Schema Validation:
```typescript
export const temperatureSchema = z.object({
  temperature: z.number().min(-50).max(100),
  date: z.string(),
  time: z.string(),
  location: z.enum([
    'Küche',
    'Gäste WC',
    'Bad Waschbecken',
    'Bad-Badewanne/Dusche',
  ]),
  screenshot: z.instanceof(File).optional(),
});
```

#### Interfaces:
```typescript
export interface TemperatureRecord {
  id: string;
  temperature: number;
  date: string;
  time: string;
  location: string;
  screenshotUrl?: string;
  createdAt: Date;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}
```

### User Types (`src/types/user.ts`)

#### Schema Validation:
```typescript
export const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
});
```

#### Interfaces:
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}
```

## Configuration

### Next.js Configuration (`next.config.ts`)
```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'temp-log.eu-central-1.linodeobjects.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.linodeobjects.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
```

### Tailwind Configuration (`tailwind.config.ts`)
- Custom color scheme with CSS variables
- Dark/light theme support
- Mobile-first responsive design
- Safe area insets for mobile devices

### TypeScript Configuration (`tsconfig.json`)
- Strict mode enabled
- Path aliases (`@/*` → `./src/*`)
- Modern ES2017 target
- Next.js plugin integration

### Environment Variables
```bash
# Linode Object Storage
LINODE_ACCESS_KEY=yourAccessKey
LINODE_SECRET_KEY=yourSecretKey
LINODE_BUCKET_NAME=yourBucketName

# Vercel Postgres Database
POSTGRES_URL=your_postgres_url_here
POSTGRES_PRISMA_URL=your_postgres_prisma_url_here
POSTGRES_URL_NO_SSL=your_postgres_url_no_ssl_here
POSTGRES_URL_NON_POOLING=your_postgres_url_non_pooling_here
POSTGRES_USER=your_postgres_user
POSTGRES_HOST=your_postgres_host
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=your_postgres_database

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here_at_least_32_characters_long

# OAuth Providers - Google
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# OAuth Providers - Apple
APPLE_CLIENT_ID=your_apple_client_id_here
APPLE_CLIENT_SECRET=your_apple_client_secret_here
```

## Usage Patterns

### Authentication Flow

#### OAuth Authentication (Google/Apple)
1. User clicks "Sign in with Google/Apple" button
2. Redirected to OAuth provider's authentication page
3. User authenticates with provider
4. Provider redirects to callback URL with authorization code
5. NextAuth exchanges code for access token and user profile
6. User account created/retrieved in database
7. Session established with JWT token

#### Traditional Authentication (Email/Name)
1. User enters name and email in LoginForm
2. Credentials sent to NextAuth credentials provider
3. Server creates/retrieves user and returns user data
4. Session established with JWT token

#### Session Management
1. JWT token stored in secure HTTP-only cookie
2. Session valid for 30 days with automatic refresh
3. Middleware intercepts API requests and validates session
4. Protected routes require valid authentication

### Temperature Recording Flow
1. User fills temperature form with automatic timestamp
2. Optional screenshot upload with preview
3. Form validation using Zod schema
4. FormData sent to `/api/temperature`
5. Server validates and processes data
6. Screenshot uploaded to Linode if provided
7. Record saved to Vercel Postgres
8. Success response returned to client

### PDF Generation Flow
1. User clicks "PDF Bericht" button
2. Client requests `/api/pdf` with optional parameters
3. Server fetches user's temperature records
4. Images processed and optimized for PDF
5. PDF generated with jsPDF
6. PDF returned as downloadable file

### Image Processing Flow
1. Images downloaded from Linode URLs
2. Portrait images rotated to landscape
3. Images resized to fit PDF dimensions
4. JPEG conversion with quality optimization
5. Memory-efficient batch processing
6. Error handling with retry logic

## Best Practices

### Code Organization
- **Separation of Concerns**: Clear separation between API routes, components, and utilities
- **Type Safety**: Comprehensive TypeScript usage with Zod validation
- **Error Handling**: Consistent error handling throughout the application
- **Mobile-First**: Responsive design optimized for mobile devices

### Performance Optimization
- **Image Processing**: Efficient batch processing with memory management
- **Lazy Loading**: Components loaded only when needed
- **Caching**: Appropriate caching strategies for images and data
- **Bundle Optimization**: Next.js optimizations with Turbopack

### Security
- **Input Validation**: Zod schema validation for all inputs
- **Authentication**: Cookie-based session management
- **API Protection**: Middleware protection for sensitive routes
- **File Upload**: Secure file handling with validation

### Accessibility
- **Semantic HTML**: Proper use of HTML elements
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and descriptions
- **Focus Management**: Proper focus handling

### Error Handling
- **Graceful Degradation**: Fallbacks for failed operations
- **User Feedback**: Clear error messages in German
- **Logging**: Comprehensive error logging
- **Recovery**: Automatic retry mechanisms where appropriate

## Dependencies

### Core Dependencies
- `next`: React framework with App Router
- `react`: UI library
- `typescript`: Type safety
- `@vercel/postgres`: Database connection
- `@aws-sdk/client-s3`: S3-compatible storage

### UI and Styling
- `tailwindcss`: Utility-first CSS framework
- `@radix-ui/react-dropdown-menu`: Accessible dropdown menus
- `lucide-react`: Icon library
- `clsx` & `tailwind-merge`: Conditional styling

### Forms and Validation
- `react-hook-form`: Form management
- `@hookform/resolvers`: Form validation integration
- `zod`: Schema validation

### PDF and Image Processing
- `jspdf`: PDF generation
- `canvas`: Server-side image processing

### Development Tools
- `eslint`: Code linting
- `@tailwindcss/postcss`: PostCSS integration
- `@types/*`: TypeScript definitions

### Deployment
- `vercel.json`: Vercel deployment configuration
- Configuration for PDF generation timeout and memory limits

## Common Issues and Solutions

### Image Upload Issues
- **Problem**: 403 errors on image access
- **Solution**: Ensure Linode bucket has public read policy
- **API**: Use `/api/fix-permissions` to fix individual objects

### Database Connection Issues
- **Problem**: Connection timeouts
- **Solution**: Check Vercel Postgres configuration
- **Fallback**: Application falls back to localStorage for development

### PDF Generation Issues
- **Problem**: Memory errors with large image sets
- **Solution**: Images are processed in batches with memory management
- **Optimization**: Images are resized and compressed before inclusion

### Mobile Display Issues
- **Problem**: Zoom and viewport issues
- **Solution**: Proper viewport meta tags and safe area insets
- **Testing**: Test on actual mobile devices

## Development Guidelines

### Adding New Features
1. Define TypeScript types first
2. Create Zod validation schemas
3. Implement API routes with error handling
4. Build UI components with mobile-first approach
5. Add proper authentication if needed
6. Test on both desktop and mobile

### Code Style
- Use TypeScript strict mode
- Follow React hooks best practices
- Implement proper error boundaries
- Use semantic HTML elements
- Follow accessibility guidelines

### Testing
- Test API endpoints with various inputs
- Verify mobile responsiveness
- Test image processing with different formats
- Validate PDF generation with various data sets
- Test authentication flows

This documentation index provides a comprehensive overview of the Temperature Logger application. For specific implementation details, refer to the individual files and their inline documentation.