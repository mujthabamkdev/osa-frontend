import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, { provide: Router, useValue: spy }],
    });

    service = TestBed.inject(AuthService);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store token with expiration time on login', (done) => {
    const mockResponse = {
      token: 'mock-jwt-token',
      user: {
        id: 1,
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'student',
      },
    };

    spyOn(service['http'], 'post').and.returnValue(of(mockResponse));

    service.login('test@example.com', 'password').subscribe(() => {
      const storedToken = localStorage.getItem('authToken');
      expect(storedToken).toBeTruthy();

      const tokenData = JSON.parse(storedToken!);
      expect(tokenData.token).toBe('mock-jwt-token');
      expect(tokenData.expiresAt).toBeGreaterThan(Date.now());
      expect(tokenData.expiresAt).toBeLessThanOrEqual(Date.now() + 30 * 60 * 1000 + 1000); // 30 min + 1s tolerance

      done();
    });
  });

  it('should detect expired tokens', () => {
    // Set an expired token
    const expiredTokenData = {
      token: 'expired-token',
      expiresAt: Date.now() - 1000, // 1 second ago
    };
    localStorage.setItem('authToken', JSON.stringify(expiredTokenData));

    // Reload service to trigger loadStoredAuthData
    const newService = new AuthService(service['http'], routerSpy);
    expect(newService.isTokenExpired()).toBe(true);
    expect(newService.getToken()).toBe(null);
  });

  it('should detect valid tokens', () => {
    // Set a valid token
    const validTokenData = {
      token: 'valid-token',
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes from now
    };
    localStorage.setItem('authToken', JSON.stringify(validTokenData));

    // Reload service to trigger loadStoredAuthData
    const newService = new AuthService(service['http'], routerSpy);
    expect(newService.isTokenExpired()).toBe(false);
    expect(newService.getToken()).toBe('valid-token');
  });

  it('should clear stored data on logout', () => {
    // Set some data
    const tokenData = {
      token: 'test-token',
      expiresAt: Date.now() + 30 * 60 * 1000,
    };
    localStorage.setItem('authToken', JSON.stringify(tokenData));
    localStorage.setItem('authUser', JSON.stringify({ id: 1, role: 'student' }));

    service.logout();

    expect(localStorage.getItem('authToken')).toBe(null);
    expect(localStorage.getItem('authUser')).toBe(null);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
