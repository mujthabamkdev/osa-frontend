# 🎨 Online Sharia Academy Frontend

Modern Angular 20 standalone application with signal-based state management for the Online Sharia Academy platform, featuring role-based dashboards and interactive learning interfaces.

## 🚀 Features

### ✨ Angular 20 Modern Architecture

- **Standalone Components**: Pure standalone architecture without NgModules
- **Signal-based State Management**: Latest Angular signals for reactive programming
- **New Control Flow Syntax**: Using `@if`, `@for`, `@switch` directives
- **Functional Guards**: Modern functional route guards with `inject()`
- **Functional Interceptors**: HTTP interceptors using dependency injection
- **Modern Dependency Injection**: Using `inject()` function throughout

### 🔐 Authentication & Security

- JWT-based authentication with automatic token refresh
- Role-based access control (Admin, Teacher, Student, Parent)
- Route guards with signal-based authentication state
- HTTP interceptors for token management and error handling
- Secure token storage with automatic cleanup

### 👥 Role-Based Dashboards

#### **Admin Dashboard**

- System overview and analytics
- User management and oversight
- Course management and monitoring
- System statistics and reports

#### **Teacher Dashboard**

- Course creation and management
- Student progress monitoring
- Teaching tools and resources
- Class management features

#### **Student Dashboard**

- Course enrollment and browsing
- Progress tracking with visual indicators
- Personal notes system
- Available courses discovery
- Learning statistics and analytics

#### **Parent Dashboard**

- Children's progress monitoring
- Academic reports and insights
- Student performance tracking
- Communication with teachers

### 🎨 Modern UI/UX Design

- **Bootstrap 5.3.2**: Latest Bootstrap with custom theming
- **Inter Font Family**: Modern, readable typography
- **Dark/Light Theme**: System preference detection with manual toggle
- **Responsive Design**: Mobile-first approach for all devices
- **Smooth Animations**: Micro-interactions and transitions
- **Loading States**: Visual feedback for all async operations
- **Toast Notifications**: Global notification system

### 🏗️ Production-Ready Features

- **Lazy Loading**: Route-based code splitting for optimal performance
- **HTTP Interceptors**: Global loading, error handling, and authentication
- **Global Services**: Notification, theme, and loading management
- **Error Boundaries**: Comprehensive error handling and user feedback
- **TypeScript Strict Mode**: Type-safe development experience
- **ESLint & Prettier**: Code quality and formatting standards

## 🛠️ Technology Stack

- **Angular**: 20.0.0 (latest version)
- **TypeScript**: 5.6.0
- **RxJS**: 7.8.0 (reactive programming)
- **Bootstrap**: 5.3.2 (CSS framework)
- **Bootstrap Icons**: 1.11.3 (icon library)
- **Angular CLI**: 20.0.0 (build tools)
- **Signals API**: Reactive state management

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                          # Core functionality
│   │   ├── guards/                    # Route guards
│   │   │   ├── auth.guard.ts          # Authentication guard
│   │   │   ├── role.guard.ts          # Role-based access guard
│   │   │   ├── guest.guard.ts         # Guest-only routes guard
│   │   │   └── guards.ts              # Guard utilities
│   │   ├── interceptors/              # HTTP interceptors
│   │   │   ├── auth.interceptor.ts    # Token management
│   │   │   ├── error.interceptor.ts   # Error handling
│   │   │   └── loading.interceptor.ts # Loading states
│   │   ├── services/                  # Core services
│   │   │   ├── api.service.ts         # API client with error handling
│   │   │   ├── auth.service.ts        # Authentication with signals
│   │   │   ├── loading.service.ts     # Global loading management
│   │   │   ├── notification.service.ts # Toast notifications
│   │   │   └── theme.service.ts       # Theme management
│   │   └── models/                    # TypeScript interfaces
│   │       ├── auth.models.ts         # Authentication models
│   │       ├── user.models.ts         # User-related models
│   │       ├── course.models.ts       # Course models
│   │       ├── dashboard.models.ts    # Dashboard data models
│   │       └── enrollment.models.ts   # Enrollment models
│   ├── features/                      # Feature modules
│   │   ├── auth/                      # Authentication features
│   │   │   ├── login/                 # Login component
│   │   │   └── register/              # Registration component
│   │   ├── admin/                     # Admin features
│   │   │   ├── dashboard/             # Admin dashboard
│   │   │   ├── users/                 # User management
│   │   │   └── courses/               # Course management
│   │   ├── teacher/                   # Teacher features
│   │   │   ├── dashboard/             # Teacher dashboard
│   │   │   └── courses/               # Course management
│   │   ├── student/                   # Student features
│   │   │   ├── dashboard/             # Student dashboard
│   │   │   └── courses/               # Course browsing
│   │   └── parent/                    # Parent features
│   │       └── dashboard/             # Parent dashboard
│   ├── shared/                        # Shared components
│   │   ├── components/                # Reusable components
│   │   │   ├── base.component.ts      # Base component
│   │   │   ├── not-found/             # 404 component
│   │   │   └── unauthorized/          # 401 component
│   │   └── unauthorized/              # Unauthorized page
│   ├── app.component.ts               # Root component
│   ├── app.config.ts                  # Application configuration
│   ├── app.routes.ts                  # Route configuration
│   └── main.ts                        # Application bootstrap
├── environments/                      # Environment configurations
│   ├── environment.ts                 # Development config
│   └── environment.prod.ts            # Production config
├── assets/                           # Static assets
├── styles.css                        # Global styles
└── index.html                        # Main HTML template
```

## 🚦 Quick Start

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (comes with Node.js)
- **Angular CLI**: 20.0.0 or higher

### Installation

1. **Navigate to frontend directory:**

   ```bash
   cd osa-frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**

   ```bash
   npm start
   ```

4. **Open browser:**
   Navigate to `http://localhost:4200`

### Build for Production

1. **Build the application:**

   ```bash
   npm run build
   ```

2. **Serve the built files:**
   ```bash
   npx serve dist/osa-frontend/browser
   ```

## ⚙️ Configuration

### Environment Files

**Development (`src/environments/environment.ts`):**

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:8000/api/v1",
};
```

**Production (`src/environments/environment.prod.ts`):**

```typescript
export const environment = {
  production: true,
  apiUrl: "https://your-api-domain.com/api/v1",
};
```

### Theme Configuration

The application supports light and dark themes with automatic system preference detection. Users can manually toggle themes through the UI.

## 🔧 Development

### Code Quality

- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
- **Type Checking**: `npm run build` (includes type checking)

### Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run e2e
```

### Code Generation

```bash
# Generate component
ng generate component features/student/dashboard

# Generate service
ng generate service core/services/api

# Generate guard
ng generate guard core/guards/auth
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect repository to Vercel**
2. **Configure build settings:**

   - Build Command: `npm run build`
   - Output Directory: `dist/osa-frontend/browser`
   - Install Command: `npm install`

3. **Set environment variables:**
   - `API_URL`: Your backend API URL

### Other Platforms

1. **Build for production:**

   ```bash
   npm run build
   ```

2. **Deploy `dist/osa-frontend/browser` folder** to your hosting provider

## 📱 Features Overview

### Authentication Flow

- JWT-based secure authentication
- Automatic token refresh
- Role-based route protection
- Persistent login state

### Dashboard Features

#### Student Dashboard

- **Statistics Cards**: Enrolled courses, completed courses, progress
- **Enrolled Courses**: Interactive course cards with progress bars
- **Available Courses**: Browse and enroll in new courses
- **Notes System**: Personal note-taking with CRUD operations
- **Recent Activity**: Progress tracking and activity feed

#### Teacher Dashboard

- Course management and creation
- Student progress monitoring
- Teaching tools and resources

#### Admin Dashboard

- System-wide analytics and statistics
- User management and oversight
- Course monitoring and management

#### Parent Dashboard

- Children's academic progress tracking
- Performance reports and insights

### UI Components

- **Responsive Design**: Works on all screen sizes
- **Loading States**: Visual feedback for all operations
- **Error Handling**: User-friendly error messages
- **Notifications**: Toast notifications for user feedback
- **Theme Support**: Light/dark mode toggle

## 🤝 Contributing

1. Follow Angular best practices and style guide
2. Use signals for reactive state management
3. Implement proper error handling
4. Write comprehensive TypeScript interfaces
5. Test components and services
6. Update documentation for new features

### Code Style

- Use Angular CLI generated code structure
- Follow TypeScript strict mode
- Use signals for component state
- Implement proper dependency injection
- Write descriptive commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with ❤️ using Angular 20
- Bootstrap for responsive UI components
- Bootstrap Icons for beautiful iconography
- Inter font family for modern typography

---

**Online Sharia Academy Frontend** - Modern Angular application for Islamic education 🕌</content>
<parameter name="oldString">OnlineShariaAcademy Frontend (Angular 20)

Dev: npm i; ng serve; API at environment.ts

Build: npm run build

Deploy: import repo on Vercel; output dir dist/osa-frontend/browser
