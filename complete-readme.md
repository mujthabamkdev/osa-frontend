# OnlineShariaAcademy Frontend - Angular 20 + Signals

Complete production-ready Angular 20 frontend application with standalone components and signal-based state management for the OnlineShariaAcademy FastAPI backend.

## 🚀 Features

### ✨ Angular 20 with Modern Architecture

- **Standalone Components**: No modules, pure standalone architecture
- **Signal-based State Management**: Latest Angular signals for reactive state
- **New Control Flow**: Using @if, @for, @switch syntax
- **Functional Guards**: Modern functional route guards
- **Functional Interceptors**: HTTP interceptors with inject()
- **Modern Dependency Injection**: Using inject() function

### 🔐 Authentication & Security

- JWT-based authentication with automatic token management
- Role-based access control (Admin, Teacher, Student, Parent)
- Route guards with signal-based auth state
- HTTP interceptors for token attachment and refresh
- Secure token storage and management

### 👥 User Roles & Dashboards

- **Admin**: Complete system management, user oversight, analytics
- **Teacher**: Course creation, student management, teaching tools
- **Student**: Course enrollment, progress tracking, learning dashboard
- **Parent**: Children's progress monitoring, academic reports

### 🎨 Modern UI/UX

- Bootstrap 5.3.2 with custom design system
- Inter font family for modern typography
- Dark/light theme with system preference detection
- Responsive design for all devices
- Smooth animations and micro-interactions
- Loading states and error handling
- Toast notifications system

### 🏗️ Production-Ready Architecture

- Lazy loading with route-based code splitting
- HTTP interceptors for loading, error handling, and auth
- Global notification system
- Theme service with localStorage persistence
- Comprehensive error boundaries
- TypeScript strict mode
- ESLint and Prettier configuration

## 📁 Project Structure

```
src/
├── app/
│   ├── core/                          # Core functionality
│   │   ├── guards/                    # Route guards (auth, role, guest)
│   │   ├── interceptors/              # HTTP interceptors
│   │   ├── services/                  # Core services
│   │   │   ├── auth.service.ts        # Authentication with signals
│   │   │   ├── api.service.ts         # API client with loading states
│   │   │   ├── loading.service.ts     # Global loading management
│   │   │   ├── notification.service.ts # Toast notifications
│   │   │   └── theme.service.ts       # Dark/light theme
│   │   └── models/                    # TypeScript interfaces
│   ├── features/                      # Feature modules
│   │   ├── auth/                      # Authentication
│   │   │   ├── login/                 # Login component
│   │   │   └── register/              # Registration component
│   │   ├── admin/                     # Admin features
│   │   │   └── dashboard/             # Admin dashboard
│   │   ├── teacher/                   # Teacher features
│   │   │   └── dashboard/             # Teacher dashboard
│   │   ├── student/                   # Student features
│   │   │   └── dashboard/             # Student dashboard
│   │   └── parent/                    # Parent features
│   │       └── dashboard/             # Parent dashboard
│   ├── shared/                        # Shared components
│   │   └── components/                # Reusable components
│   ├── app.component.ts               # Root component with signals
│   ├── app.config.ts                  # Application configuration
│   ├── app.routes.ts                  # Route configuration
│   └── main.ts                        # Bootstrap application
├── environments/                      # Environment configurations
├── assets/                           # Static assets
└── styles.css                       # Global styles with design system
```

## 🛠️ Technology Stack

- **Angular**: 20.0.0 (latest)
- **TypeScript**: 5.6.0
- **Bootstrap**: 5.3.2
- **Bootstrap Icons**: 1.11.3
- **RxJS**: 7.8.0
- **Build**: Angular CLI 20

## 🚦 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Angular CLI 20+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd osa-frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build:prod
```

### Environment Configuration

Update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:8000/api/v1", // Your FastAPI backend URL
  appName: "OnlineShariaAcademy",
  version: "1.0.0",
};
```

## 🔑 Key Angular 20 Features Used

### Signal-based State Management

```typescript
// Services use signals for reactive state
private readonly currentUser = signal<User | null>(null);
private readonly isLoading = signal(false);
private readonly error = signal<string | null>(null);

// Computed signals for derived state
readonly isAuthenticated = computed(() => !!this.currentUser());
readonly userRole = computed(() => this.currentUser()?.role || null);
```

### New Control Flow Syntax

```typescript
// Using @if, @for, @switch in templates
@if (authService.loading()) {
  <div class="spinner-border"></div>
} @else {
  @for (user of users(); track user.id) {
    <div class="user-card">{{ user.email }}</div>
  }
}
```

### Functional Guards

```typescript
export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(["/auth/login"]);
    return false;
  }
};
```

### Modern Dependency Injection

```typescript
// Using inject() function instead of constructor injection
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly credentials = signal<LoginRequest>({ email: "", password: "" });
}
```

## 🎯 Core Features Implementation

### Authentication Flow

1. **Login**: Email/password → JWT token → User role detection → Role-based routing
2. **Registration**: User data validation → Account creation → Success notification
3. **Route Protection**: Guards check authentication and roles before navigation
4. **Token Management**: Automatic attachment, refresh, and cleanup

### Dashboard Features

- **Admin**: System stats, user management, course oversight
- **Teacher**: Course creation, student progress, teaching analytics
- **Student**: Learning progress, course enrollment, study tracking
- **Parent**: Children's progress, academic reports, communication

### UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Theme**: System preference detection with manual toggle
- **Loading States**: Skeleton screens and spinners during API calls
- **Error Handling**: User-friendly error messages with retry options
- **Notifications**: Toast notifications for success/error feedback
- **Form Validation**: Real-time validation with helpful error messages

## 🔧 Development Scripts

```bash
# Development
npm start                 # Start dev server
npm run watch            # Build and watch for changes

# Building
npm run build            # Build for development
npm run build:prod       # Build for production

# Quality
npm run lint             # Run ESLint
npm test                 # Run unit tests
```

## 🚀 Production Deployment

### Build Optimization

```bash
npm run build:prod
```

The production build includes:

- Tree shaking and dead code elimination
- Bundle size optimization with lazy loading
- Service worker for offline capability
- Source map generation (configurable)
- CSS and JS minification

### Docker Deployment

```dockerfile
FROM nginx:alpine
COPY dist/osa-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables

For production deployment:

```bash
export API_URL=https://api.yourdomai n.com/api/v1
export NODE_ENV=production
```

## 🔒 Security Features

- **XSS Protection**: Angular sanitization and CSP headers
- **CSRF Protection**: Token-based request validation
- **JWT Security**: Secure token storage and automatic refresh
- **Input Validation**: Client-side and server-side validation
- **Route Guards**: Role-based access control
- **HTTP-only Cookies**: Option for secure token storage

## 📊 Performance Features

- **Lazy Loading**: Route-based code splitting reduces initial bundle size
- **OnPush Strategy**: Optimized change detection with signals
- **Image Optimization**: Lazy loading and responsive images
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Service Workers**: Offline capability and caching
- **CDN Integration**: Static asset optimization

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run e2e

# Coverage report
npm run test:coverage
```

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Email: support@onlineshariaacademy.com
- Documentation: [Link to docs]
- Issues: [GitHub Issues]

---

**Built with ❤️ using Angular 20, Signals, and modern web technologies**
