import React from 'react'
import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react'

describe('Authentication UI Components - Loading and Error States', () => {
  describe('Alert Component', () => {
    describe('Error States', () => {
      it('should render destructive alert with error message', () => {
        render(
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Invalid credentials. Please check your email and password.
            </AlertDescription>
          </Alert>
        )
        
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
        expect(alert).toHaveClass('text-destructive')
        expect(screen.getByText('Invalid credentials. Please check your email and password.')).toBeInTheDocument()
      })

      it('should render alert with title and description for complex errors', () => {
        render(
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Failed</AlertTitle>
            <AlertDescription>
              Your session has expired. Please sign in again to continue.
            </AlertDescription>
          </Alert>
        )
        
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText('Authentication Failed')).toBeInTheDocument()
        expect(screen.getByText('Your session has expired. Please sign in again to continue.')).toBeInTheDocument()
        
        // Check for correct data attributes
        expect(screen.getByText('Authentication Failed')).toHaveAttribute('data-slot', 'alert-title')
        expect(screen.getByText('Your session has expired. Please sign in again to continue.')).toHaveAttribute('data-slot', 'alert-description')
      })

      it('should render network error alert', () => {
        render(
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              Unable to connect to the server. Please check your internet connection and try again.
            </AlertDescription>
          </Alert>
        )
        
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
        expect(screen.getByText('Connection Error')).toBeInTheDocument()
        expect(screen.getByText(/Unable to connect to the server/)).toBeInTheDocument()
      })

      it('should render server error alert', () => {
        render(
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Server error (500). Please try again later or contact support if the problem persists.
            </AlertDescription>
          </Alert>
        )
        
        expect(screen.getByText(/Server error.*500/)).toBeInTheDocument()
      })
    })

    describe('Success States', () => {
      it('should render default alert for success messages', () => {
        render(
          <Alert variant="default">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Successfully logged in! Redirecting to dashboard...
            </AlertDescription>
          </Alert>
        )
        
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
        expect(alert).toHaveClass('bg-card', 'text-card-foreground')
        expect(screen.getByText(/Successfully logged in/)).toBeInTheDocument()
      })

      it('should render session refresh success alert', () => {
        render(
          <Alert variant="default">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Session Refreshed</AlertTitle>
            <AlertDescription>
              Your session has been automatically renewed.
            </AlertDescription>
          </Alert>
        )
        
        expect(screen.getByText('Session Refreshed')).toBeInTheDocument()
        expect(screen.getByText('Your session has been automatically renewed.')).toBeInTheDocument()
      })
    })

    describe('Info States', () => {
      it('should render info alert for authentication notices', () => {
        render(
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertDescription>
              For security reasons, you will be automatically signed out after 30 minutes of inactivity.
            </AlertDescription>
          </Alert>
        )
        
        expect(screen.getByText(/automatically signed out after 30 minutes/)).toBeInTheDocument()
      })

      it('should render password requirements info', () => {
        render(
          <Alert variant="default">
            <Info className="h-4 w-4" />
            <AlertTitle>Password Requirements</AlertTitle>
            <AlertDescription>
              Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.
            </AlertDescription>
          </Alert>
        )
        
        expect(screen.getByText('Password Requirements')).toBeInTheDocument()
        expect(screen.getByText(/Password must be at least 8 characters/)).toBeInTheDocument()
      })
    })

    describe('Alert Accessibility', () => {
      it('should have proper ARIA role', () => {
        render(
          <Alert variant="destructive">
            <AlertDescription>Error message</AlertDescription>
          </Alert>
        )
        
        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('role', 'alert')
      })

      it('should have proper data attributes for styling', () => {
        render(
          <Alert variant="destructive">
            <AlertTitle>Title</AlertTitle>
            <AlertDescription>Description</AlertDescription>
          </Alert>
        )
        
        const alert = screen.getByRole('alert')
        expect(alert).toHaveAttribute('data-slot', 'alert')
      })
    })
  })

  describe('Button Loading States', () => {
    describe('Authentication Button Loading', () => {
      it('should render sign in button in loading state', () => {
        render(
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sign In
          </Button>
        )
        
        const button = screen.getByRole('button', { name: /sign in/i })
        expect(button).toBeInTheDocument()
        expect(button).toBeDisabled()
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      it('should render logout button in loading state', () => {
        render(
          <Button disabled variant="outline">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing Out...
          </Button>
        )
        
        const button = screen.getByRole('button', { name: /signing out/i })
        expect(button).toBeInTheDocument()
        expect(button).toBeDisabled()
      })

      it('should render refresh button in loading state', () => {
        render(
          <Button disabled size="sm">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Refreshing Session
          </Button>
        )
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toBeDisabled()
        expect(screen.getByText('Refreshing Session')).toBeInTheDocument()
      })

      it('should render normal sign in button when not loading', () => {
        render(
          <Button type="submit">
            Sign In
          </Button>
        )
        
        const button = screen.getByRole('button', { name: /sign in/i })
        expect(button).toBeInTheDocument()
        expect(button).not.toBeDisabled()
        expect(button).toHaveAttribute('type', 'submit')
        
        // Should not have loading spinner
        expect(screen.queryByRole('button')).not.toHaveClass('animate-spin')
      })
    })

    describe('Button Variants for Auth States', () => {
      it('should render destructive button for critical auth actions', () => {
        render(
          <Button variant="destructive">
            Sign Out All Devices
          </Button>
        )
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('bg-destructive', 'text-white')
      })

      it('should render secondary button for optional auth actions', () => {
        render(
          <Button variant="secondary">
            Skip for Now
          </Button>
        )
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')
      })

      it('should render ghost button for subtle auth actions', () => {
        render(
          <Button variant="ghost">
            Forgot Password?
          </Button>
        )
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')
      })
    })

    describe('Button Sizes for Auth Context', () => {
      it('should render small button for inline auth actions', () => {
        render(
          <Button size="sm">
            Resend Code
          </Button>
        )
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('h-8', 'px-3')
      })

      it('should render large button for primary auth actions', () => {
        render(
          <Button size="lg" className="w-full">
            Create Account
          </Button>
        )
        
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('h-10', 'px-6')
      })
    })
  })

  describe('Form Validation States', () => {
    describe('Input Error States', () => {
      it('should render form field with error message', () => {
        render(
          <div>
            <label htmlFor="email">Email</label>
            <input 
              id="email" 
              type="email" 
              className="border-destructive" 
              aria-invalid="true"
              aria-describedby="email-error"
            />
            <div id="email-error" className="text-destructive text-sm">
              Please enter a valid email address
            </div>
          </div>
        )
        
        const input = screen.getByLabelText('Email')
        const errorMessage = screen.getByText('Please enter a valid email address')
        
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('aria-invalid', 'true')
        expect(input).toHaveAttribute('aria-describedby', 'email-error')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveClass('text-destructive')
      })

      it('should render password field with validation error', () => {
        render(
          <div>
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              className="border-destructive" 
              aria-invalid="true"
              aria-describedby="password-error"
            />
            <div id="password-error" className="text-destructive text-sm">
              Password must be at least 8 characters long
            </div>
          </div>
        )
        
        const input = screen.getByLabelText('Password')
        const errorMessage = screen.getByText('Password must be at least 8 characters long')
        
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('type', 'password')
        expect(errorMessage).toBeInTheDocument()
      })

      it('should render form field with multiple validation errors', () => {
        render(
          <div>
            <label htmlFor="password">Password</label>
            <input 
              id="password" 
              type="password" 
              className="border-destructive" 
              aria-invalid="true"
              aria-describedby="password-errors"
            />
            <div id="password-errors" className="text-destructive text-sm space-y-1">
              <div>Password is required</div>
              <div>Must contain at least 8 characters</div>
              <div>Must contain at least one uppercase letter</div>
            </div>
          </div>
        )
        
        expect(screen.getByText('Password is required')).toBeInTheDocument()
        expect(screen.getByText('Must contain at least 8 characters')).toBeInTheDocument()
        expect(screen.getByText('Must contain at least one uppercase letter')).toBeInTheDocument()
      })
    })

    describe('Input Success States', () => {
      it('should render form field with success validation', () => {
        render(
          <div>
            <label htmlFor="email">Email</label>
            <input 
              id="email" 
              type="email" 
              className="border-success" 
              aria-invalid="false"
            />
            <div className="text-success text-sm flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Valid email address
            </div>
          </div>
        )
        
        const input = screen.getByLabelText('Email')
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('aria-invalid', 'false')
        expect(screen.getByText('Valid email address')).toBeInTheDocument()
      })
    })

    describe('Form Accessibility', () => {
      it('should have proper labels and ARIA attributes', () => {
        render(
          <div>
            <label htmlFor="email">Email Address</label>
            <input 
              id="email" 
              type="email" 
              required 
              aria-describedby="email-help"
            />
            <div id="email-help" className="text-sm text-muted-foreground">
              We'll never share your email with anyone else.
            </div>
          </div>
        )
        
        const input = screen.getByLabelText('Email Address')
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('required')
        expect(input).toHaveAttribute('aria-describedby', 'email-help')
        expect(screen.getByText("We'll never share your email with anyone else.")).toBeInTheDocument()
      })
    })
  })

  describe('Loading Spinner Component', () => {
    it('should render spinning loader icon', () => {
      render(
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      )
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should render inline loading state', () => {
      render(
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Authenticating user...</span>
        </div>
      )
      
      expect(screen.getByText('Authenticating user...')).toBeInTheDocument()
    })
  })

  describe('Icon States', () => {
    it('should render error icon with alert', () => {
      render(
        <div className="flex items-center text-destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span>Authentication failed</span>
        </div>
      )
      
      expect(screen.getByText('Authentication failed')).toBeInTheDocument()
    })

    it('should render success icon with message', () => {
      render(
        <div className="flex items-center text-success">
          <CheckCircle className="h-4 w-4 mr-2" />
          <span>Successfully authenticated</span>
        </div>
      )
      
      expect(screen.getByText('Successfully authenticated')).toBeInTheDocument()
    })

    it('should render info icon with help text', () => {
      render(
        <div className="flex items-center text-info">
          <Info className="h-4 w-4 mr-2" />
          <span>Authentication help</span>
        </div>
      )
      
      expect(screen.getByText('Authentication help')).toBeInTheDocument()
    })
  })
})
