# Temperature Logger

A mobile-optimized Next.js application for recording temperature measurements with automatic German timestamp and screenshot upload functionality.

## Features

- 📱 **Mobile-First Design**: Responsive design, optimized for mobile devices
- 🌡️ **Temperature Recording**: Simple form for recording temperature measurements
- 🕐 **Automatic German Time**: Real-time display of German date and time
- 🗄️ **Database Storage**: Persistent data storage with Vercel Postgres
- 📸 **Screenshot Upload**: Upload and storage of screenshots with Linode Object Storage
- 📄 **PDF Export**: Creation and download of PDF reports of temperature recordings
- 🖼️ **Results Gallery**: Display all temperature recordings with image thumbnails
- 🎠 **Image Slideshow**: Full-screen slideshow with temperature and date overlay
- ⌨️ **Keyboard Navigation**: Navigate slideshow with arrow keys and escape
- 🔒 **Secure API**: Secure file upload processing with proper error handling
- 🎨 **Modern UI**: Clean, accessible interface with TailwindCSS and Radix UI
- ⚡ **Performance**: Optimized with Next.js 14 App Router and TypeScript

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Vercel Postgres
- **Styling**: TailwindCSS v4
- **UI Components**: Radix UI
- **Forms**: React Hook Form + Zod validation
- **File Storage**: Linode Object Storage (S3-compatible)
- **PDF Generation**: jsPDF
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn package manager
- Linode Object Storage account
- Vercel Postgres database (for data persistence)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd temperatur_measurement_log
```

2. Install dependencies:

```bash
yarn install
# or
npm install
```

3. Set up Vercel Postgres:

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Navigate to your project → Storage → Create Database → Postgres
   - Copy the connection details

4. Configure environment variables:

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
```

5. Start the development server:

```bash
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Next.js Image Configuration

The application is configured to load images from Linode Object Storage. If you change the bucket name or use a different storage provider, update the `next.config.ts` file:

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-bucket-name.eu-central-1.linodeobjects.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
```

## Configuration

### Linode Object Storage

The application is pre-configured with Linode Object Storage credentials:

- **Endpoint**: `eu-central-1.linodeobjects.com`
- **Bucket**: `temperature-screenshots`
- **Region**: `eu-central-1`

#### Bucket Permissions Setup

To make uploaded images publicly accessible, you need to configure your Linode bucket permissions:

1. **Via Linode Cloud Manager**:
   - Go to [Linode Cloud Manager](https://cloud.linode.com)
   - Navigate to Object Storage → Buckets
   - Select your bucket (`temperature-screenshots`)
   - Go to Access → Bucket Policy
   - Set the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::temperature-screenshots/*"
    }
  ]
}
```

2. **Automatic Setup**:
   The application will attempt to set this policy automatically when uploading files. If you encounter 403 errors, you may need to set the policy manually as described above.

3. **Alternative: Object-Level Permissions**:
   You can also enable "Object Storage Access" in your Linode account settings to allow public access to individual objects.

### Environment Variables

```env
LINODE_ACCESS_KEY=yourAccessKey
LINODE_SECRET_KEY=yourSecretKey
LINODE_BUCKET_NAME= yourBucketName
NEXT_PUBLIC_APP_URL= yourPublicUrl
```

## Usage

1. **Record Temperature**: Enter temperature value in the form
2. **Automatic Timestamp**: Date and time are automatically set in German format
3. **Add Screenshot**: Tap the upload area to add a screenshot (optional)
4. **Save Recording**: Submit the form to save temperature data
5. **View Results**: Click "View Results" to see all temperature recordings
6. **Browse Gallery**: View temperature recordings with image thumbnails
7. **Open Slideshow**: Click any image thumbnail to open the slideshow
8. **Navigate Slideshow**: Use arrow keys (← →) to navigate, Esc to close
9. **Download PDF**: Use the "PDF Report" button to create and download a PDF of all recordings

## API Endpoints

### POST `/api/temperature`

Save temperature measurement data with optional screenshot upload.

**Request Body (FormData):**

- `temperature`: number (required)
- `date`: string (required)
- `time`: string (required)
- `screenshot`: File (optional)

### GET `/api/temperature`

Retrieve all temperature records from Vercel Postgres database.

### GET `/api/pdf`

Generate and download PDF report of temperature logs.

### POST/GET `/api/setup`

Initialize or verify the database table setup.

## Pages

### `/` - Temperature Logger

Main page for recording temperature measurements with automatic German timestamps and screenshot upload.

### `/results` - Results Gallery

Display all temperature recordings in gallery format with:

- Thumbnail images of screenshots
- Temperature and date information
- Click thumbnails to open slideshow
- Full-screen slideshow with navigation
- Keyboard control (arrow keys, escape)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── pdf/
│   │   └── temperature/
│   ├── results/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   └── temperature-form.tsx
├── lib/
│   ├── pdf.ts
│   ├── s3.ts
│   └── utils.ts
└── types/
    └── temperature.ts
```

## Mobile Optimization

- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Touch-Friendly**: Large tap targets and optimized form controls
- **Safe Areas**: Support for device notches and safe area insets
- **PWA Ready**: Progressive Web App configuration included
- **Performance**: Optimized for mobile networks and devices

## Development

### Scripts

```bash
# Development
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Lint code
yarn lint
```

### Code Quality

- **ESLint**: Configured for Next.js with TypeScript
- **TypeScript**: Strict mode enabled
- **Prettier**: Code formatting (via ESLint)
- **Clean Architecture**: Separation of concerns and reusable components

## Security Features

- **Input Validation**: Zod schemas for type-safe form validation
- **Error Handling**: Comprehensive error handling throughout the app
- **Secure Uploads**: Secure file upload handling with proper validation
- **Environment Variables**: Sensitive data stored securely

## Deployment

The application is ready for deployment on Vercel, Netlify, or any Node.js hosting platform.

### Environment Setup for Production

1. Update environment variables with production values
2. Configure Linode Object Storage bucket for production
3. Set up proper CORS policies if needed
4. Enable HTTPS for secure data transmission

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
