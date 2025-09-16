import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

// Mock Radix UI Avatar components
const mockOnLoadingStatusChange = jest.fn();

jest.mock('@radix-ui/react-avatar', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )),
  Image: React.forwardRef<HTMLImageElement, any>(({ src, alt, className, onLoadingStatusChange, ...props }, ref) => {
    const [loaded, setLoaded] = React.useState(false);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
      if (onLoadingStatusChange) {
        mockOnLoadingStatusChange(onLoadingStatusChange);
      }
    }, [onLoadingStatusChange]);

    if (src === 'error-image.jpg') {
      React.useEffect(() => {
        if (onLoadingStatusChange && !error) {
          setError(true);
          onLoadingStatusChange('error');
        }
      }, [onLoadingStatusChange, error]);
      
      if (error) return null;
    }

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        data-testid="avatar-image"
        onLoad={() => {
          setLoaded(true);
          if (onLoadingStatusChange) {
            onLoadingStatusChange('loaded');
          }
        }}
        onError={() => {
          setError(true);
          if (onLoadingStatusChange) {
            onLoadingStatusChange('error');
          }
        }}
        {...props}
      />
    );
  }),
  Fallback: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div ref={ref} className={className} data-testid="avatar-fallback" {...props}>
      {children}
    </div>
  )),
}));

describe('Avatar Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnLoadingStatusChange.mockClear();
  });

  describe('Avatar (Root)', () => {
    it('should render with default props', () => {
      render(<Avatar data-testid="avatar" />);
      
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toBeInTheDocument();
    });

    it('should have correct default classes', () => {
      render(<Avatar data-testid="avatar" />);
      
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass(
        'relative',
        'flex',
        'h-10',
        'w-10',
        'shrink-0',
        'overflow-hidden',
        'rounded-full'
      );
    });

    it('should apply custom className', () => {
      render(<Avatar className="custom-avatar" data-testid="avatar" />);
      
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('custom-avatar');
    });

    it('should render as div by default', () => {
      render(<Avatar data-testid="avatar" />);
      
      const avatar = screen.getByTestId('avatar');
      expect(avatar.tagName).toBe('DIV');
    });

    it('should spread additional props', () => {
      render(
        <Avatar 
          data-testid="avatar"
          id="user-avatar"
          role="img"
          aria-label="User profile picture"
        />
      );
      
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('id', 'user-avatar');
      expect(avatar).toHaveAttribute('role', 'img');
      expect(avatar).toHaveAttribute('aria-label', 'User profile picture');
    });

    it('should render children', () => {
      render(
        <Avatar data-testid="avatar">
          <div data-testid="child">Child content</div>
        </Avatar>
      );
      
      const avatar = screen.getByTestId('avatar');
      const child = screen.getByTestId('child');
      
      expect(avatar).toBeInTheDocument();
      expect(child).toBeInTheDocument();
      expect(avatar).toContainElement(child);
    });

    it('should support different sizes via className', () => {
      render(
        <Avatar className="h-16 w-16" data-testid="large-avatar" />
      );
      
      const avatar = screen.getByTestId('large-avatar');
      expect(avatar).toHaveClass('h-16', 'w-16');
    });
  });

  describe('AvatarImage', () => {
    it('should render with default props', () => {
      render(
        <Avatar>
          <AvatarImage src="test.jpg" alt="Test image" />
        </Avatar>
      );
      
      const image = screen.getByTestId('avatar-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'test.jpg');
      expect(image).toHaveAttribute('alt', 'Test image');
    });

    it('should have correct default classes', () => {
      render(
        <Avatar>
          <AvatarImage src="test.jpg" alt="Test image" />
        </Avatar>
      );
      
      const image = screen.getByTestId('avatar-image');
      expect(image).toHaveClass(
        'aspect-square',
        'h-full',
        'w-full'
      );
    });

    it('should apply custom className', () => {
      render(
        <Avatar>
          <AvatarImage 
            src="test.jpg" 
            alt="Test image"
            className="custom-image"
          />
        </Avatar>
      );
      
      const image = screen.getByTestId('avatar-image');
      expect(image).toHaveClass('custom-image');
    });

    it('should render as img element', () => {
      render(
        <Avatar>
          <AvatarImage src="test.jpg" alt="Test image" />
        </Avatar>
      );
      
      const image = screen.getByTestId('avatar-image');
      expect(image.tagName).toBe('IMG');
    });

    it('should handle image loading', async () => {
      const onLoadingStatusChange = jest.fn();
      
      render(
        <Avatar>
          <AvatarImage 
            src="test.jpg" 
            alt="Test image"
            onLoadingStatusChange={onLoadingStatusChange}
          />
        </Avatar>
      );
      
      const image = screen.getByTestId('avatar-image');
      
      // Simulate image load
      fireEvent.load(image);
      
      await waitFor(() => {
        expect(onLoadingStatusChange).toHaveBeenCalledWith('loaded');
      });
    });

    it('should handle image error', async () => {
      const onLoadingStatusChange = jest.fn();
      
      render(
        <Avatar>
          <AvatarImage 
            src="error-image.jpg" 
            alt="Test image"
            onLoadingStatusChange={onLoadingStatusChange}
          />
        </Avatar>
      );
      
      await waitFor(() => {
        expect(onLoadingStatusChange).toHaveBeenCalledWith('error');
      });
    });

    it('should spread additional props', () => {
      render(
        <Avatar>
          <AvatarImage 
            src="test.jpg" 
            alt="Test image"
            loading="lazy"
            crossOrigin="anonymous"
            data-custom="test"
          />
        </Avatar>
      );
      
      const image = screen.getByTestId('avatar-image');
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveAttribute('crossOrigin', 'anonymous');
      expect(image).toHaveAttribute('data-custom', 'test');
    });

    it('should work with different image formats', () => {
      const formats = [
        'test.jpg',
        'test.png',
        'test.gif',
        'test.webp',
        'test.svg'
      ];

      formats.forEach((src, index) => {
        render(
          <Avatar key={src}>
            <AvatarImage 
              src={src} 
              alt={`Test image ${index}`}
              data-testid={`image-${index}`}
            />
          </Avatar>
        );

        const image = screen.getByTestId(`image-${index}`);
        expect(image).toHaveAttribute('src', src);
      });
    });
  });

  describe('AvatarFallback', () => {
    it('should render with default props', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveTextContent('JD');
    });

    it('should have correct default classes', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveClass(
        'flex',
        'h-full',
        'w-full',
        'items-center',
        'justify-center',
        'rounded-full',
        'bg-muted'
      );
    });

    it('should apply custom className', () => {
      render(
        <Avatar>
          <AvatarFallback className="custom-fallback">JD</AvatarFallback>
        </Avatar>
      );
      
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveClass('custom-fallback');
    });

    it('should render as div by default', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback.tagName).toBe('DIV');
    });

    it('should render text content', () => {
      render(
        <Avatar>
          <AvatarFallback>John Doe</AvatarFallback>
        </Avatar>
      );
      
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveTextContent('John Doe');
    });

    it('should render initials', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveTextContent('JD');
    });

    it('should render icons', () => {
      const UserIcon = () => <svg data-testid="user-icon">User</svg>;
      
      render(
        <Avatar>
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </Avatar>
      );
      
      const fallback = screen.getByTestId('avatar-fallback');
      const icon = screen.getByTestId('user-icon');
      
      expect(fallback).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
      expect(fallback).toContainElement(icon);
    });

    it('should spread additional props', () => {
      render(
        <Avatar>
          <AvatarFallback 
            role="img"
            aria-label="Fallback avatar"
            data-custom="test"
          >
            JD
          </AvatarFallback>
        </Avatar>
      );
      
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveAttribute('role', 'img');
      expect(fallback).toHaveAttribute('aria-label', 'Fallback avatar');
      expect(fallback).toHaveAttribute('data-custom', 'test');
    });
  });

  describe('Complete Avatar Examples', () => {
    it('should render avatar with image and fallback', async () => {
      render(
        <Avatar data-testid="complete-avatar">
          <AvatarImage src="user.jpg" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const avatar = screen.getByTestId('complete-avatar');
      const image = screen.getByTestId('avatar-image');
      const fallback = screen.getByTestId('avatar-fallback');
      
      expect(avatar).toBeInTheDocument();
      expect(image).toBeInTheDocument();
      expect(fallback).toBeInTheDocument();
    });

    it('should show fallback when image fails to load', async () => {
      render(
        <Avatar data-testid="fallback-avatar">
          <AvatarImage src="error-image.jpg" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const avatar = screen.getByTestId('fallback-avatar');
      const fallback = screen.getByTestId('avatar-fallback');
      
      expect(avatar).toBeInTheDocument();
      expect(fallback).toBeInTheDocument();
    });

    it('should work without image (fallback only)', () => {
      render(
        <Avatar data-testid="fallback-only-avatar">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const avatar = screen.getByTestId('fallback-only-avatar');
      const fallback = screen.getByTestId('avatar-fallback');
      
      expect(avatar).toBeInTheDocument();
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveTextContent('JD');
    });
  });

  describe('Size Variations', () => {
    const sizes = [
      { name: 'small', classes: 'h-8 w-8' },
      { name: 'default', classes: 'h-10 w-10' },
      { name: 'large', classes: 'h-12 w-12' },
      { name: 'xl', classes: 'h-16 w-16' },
    ];

    sizes.forEach(({ name, classes }) => {
      it(`should render ${name} avatar`, () => {
        render(
          <Avatar className={classes} data-testid={`${name}-avatar`}>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        );
        
        const avatar = screen.getByTestId(`${name}-avatar`);
        const classArray = classes.split(' ');
        
        classArray.forEach(cls => {
          expect(avatar).toHaveClass(cls);
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should support role attribute on root', () => {
      render(
        <Avatar role="img" aria-label="User avatar" data-testid="avatar">
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('role', 'img');
      expect(avatar).toHaveAttribute('aria-label', 'User avatar');
    });

    it('should support alt text on image', () => {
      render(
        <Avatar>
          <AvatarImage src="user.jpg" alt="Profile picture of John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const image = screen.getByTestId('avatar-image');
      expect(image).toHaveAttribute('alt', 'Profile picture of John Doe');
    });

    it('should support aria-label on fallback', () => {
      render(
        <Avatar>
          <AvatarFallback aria-label="Initials for John Doe">
            JD
          </AvatarFallback>
        </Avatar>
      );
      
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveAttribute('aria-label', 'Initials for John Doe');
    });

    it('should be screen reader friendly', () => {
      render(
        <Avatar role="img" aria-label="User profile picture">
          <AvatarImage src="user.jpg" alt="John Doe" />
          <AvatarFallback aria-label="Initials J.D.">JD</AvatarFallback>
        </Avatar>
      );
      
      // Should be accessible by role
      const avatar = screen.getByRole('img', { name: 'User profile picture' });
      expect(avatar).toBeInTheDocument();
    });

    it('should handle missing alt text gracefully', () => {
      render(
        <Avatar>
          <AvatarImage src="user.jpg" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const image = screen.getByTestId('avatar-image');
      expect(image).toBeInTheDocument();
      // Should not throw error even without alt text
    });
  });

  describe('Real-world Usage Examples', () => {
    it('should render user profile avatar', () => {
      const user = {
        name: 'John Doe',
        avatar: 'https://example.com/avatar.jpg',
        initials: 'JD'
      };

      render(
        <Avatar data-testid="profile-avatar">
          <AvatarImage src={user.avatar} alt={`${user.name}'s profile picture`} />
          <AvatarFallback>{user.initials}</AvatarFallback>
        </Avatar>
      );
      
      const avatar = screen.getByTestId('profile-avatar');
      const image = screen.getByTestId('avatar-image');
      const fallback = screen.getByTestId('avatar-fallback');
      
      expect(avatar).toBeInTheDocument();
      expect(image).toHaveAttribute('src', user.avatar);
      expect(image).toHaveAttribute('alt', `${user.name}'s profile picture`);
      expect(fallback).toHaveTextContent(user.initials);
    });

    it('should render avatar list', () => {
      const users = [
        { id: 1, name: 'John Doe', initials: 'JD' },
        { id: 2, name: 'Jane Smith', initials: 'JS' },
        { id: 3, name: 'Bob Johnson', initials: 'BJ' }
      ];

      render(
        <div className="flex -space-x-2" data-testid="avatar-list">
          {users.map((user) => (
            <Avatar key={user.id} className="border-2 border-white">
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      );
      
      const avatarList = screen.getByTestId('avatar-list');
      const fallbacks = screen.getAllByTestId('avatar-fallback');
      
      expect(avatarList).toBeInTheDocument();
      expect(fallbacks).toHaveLength(3);
      expect(fallbacks[0]).toHaveTextContent('JD');
      expect(fallbacks[1]).toHaveTextContent('JS');
      expect(fallbacks[2]).toHaveTextContent('BJ');
    });

    it('should render avatar with status indicator', () => {
      render(
        <div className="relative" data-testid="avatar-with-status">
          <Avatar>
            <AvatarImage src="user.jpg" alt="Online user" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div 
            className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"
            data-testid="status-indicator"
            aria-label="User is online"
          />
        </div>
      );
      
      const container = screen.getByTestId('avatar-with-status');
      const statusIndicator = screen.getByTestId('status-indicator');
      
      expect(container).toBeInTheDocument();
      expect(statusIndicator).toBeInTheDocument();
      expect(statusIndicator).toHaveClass('bg-green-500');
    });

    it('should render different avatar types', () => {
      const avatars = [
        { type: 'user', content: 'JD' },
        { type: 'team', content: 'T' },
        { type: 'bot', content: '🤖' },
        { type: 'guest', content: '?' }
      ];

      render(
        <div data-testid="avatar-types">
          {avatars.map((avatar, index) => (
            <Avatar key={index} data-testid={`${avatar.type}-avatar`}>
              <AvatarFallback>{avatar.content}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      );
      
      const userAvatar = screen.getByTestId('user-avatar');
      const teamAvatar = screen.getByTestId('team-avatar');
      const botAvatar = screen.getByTestId('bot-avatar');
      const guestAvatar = screen.getByTestId('guest-avatar');
      
      expect(userAvatar).toBeInTheDocument();
      expect(teamAvatar).toBeInTheDocument();
      expect(botAvatar).toBeInTheDocument();
      expect(guestAvatar).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined src gracefully', () => {
      render(
        <Avatar>
          <AvatarImage src={undefined} alt="Test" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      // Should not throw error
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toBeInTheDocument();
    });

    it('should handle empty fallback gracefully', () => {
      render(
        <Avatar>
          <AvatarFallback></AvatarFallback>
        </Avatar>
      );
      
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toBeInTheDocument();
      expect(fallback).toBeEmptyDOMElement();
    });

    it('should handle long text in fallback', () => {
      render(
        <Avatar>
          <AvatarFallback>Very Long Name That Should Not Break</AvatarFallback>
        </Avatar>
      );
      
      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveTextContent('Very Long Name That Should Not Break');
    });
  });

  describe('Performance', () => {
    it('should support lazy loading for images', () => {
      render(
        <Avatar>
          <AvatarImage 
            src="user.jpg" 
            alt="User"
            loading="lazy"
          />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const image = screen.getByTestId('avatar-image');
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should support different crossOrigin policies', () => {
      render(
        <Avatar>
          <AvatarImage 
            src="https://external.com/user.jpg" 
            alt="User"
            crossOrigin="anonymous"
          />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      
      const image = screen.getByTestId('avatar-image');
      expect(image).toHaveAttribute('crossOrigin', 'anonymous');
    });
  });
});