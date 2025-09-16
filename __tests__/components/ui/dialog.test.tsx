import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from '@/components/ui/dialog';

// Mock Radix UI Dialog components
const mockOnOpenChange = jest.fn();

const DialogContext = React.createContext<{ isOpen: boolean; handleOpenChange: (open: boolean) => void } | null>(null);
const useDialog = () => {
  const context = React.useContext(DialogContext);
  return context || { isOpen: false, handleOpenChange: () => {} };
};

jest.mock('@radix-ui/react-dialog', () => ({
  Root: React.forwardRef<HTMLDivElement, any>(({ children, onOpenChange, defaultOpen, open, ...props }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen || false);
    const isOpen = open !== undefined ? open : internalOpen;

    React.useEffect(() => {
      if (onOpenChange) {
        mockOnOpenChange(onOpenChange);
      }
    }, [onOpenChange]);

    const handleOpenChange = (newOpen: boolean) => {
      if (open === undefined) {
        setInternalOpen(newOpen);
      }
      if (onOpenChange) {
        onOpenChange(newOpen);
      }
    };

    const contextValue = { isOpen, handleOpenChange };

    return (
      <DialogContext.Provider value={contextValue}>
        <div ref={ref} data-testid="dialog-root" data-open={isOpen} {...props}>
          {children}
        </div>
      </DialogContext.Provider>
    );
  }),
  
  Trigger: React.forwardRef<HTMLButtonElement, any>(({ children, onClick, ...props }, ref) => {
    const { handleOpenChange } = useDialog();
    
    const handleClick = (e: React.MouseEvent) => {
      handleOpenChange(true);
      if (onClick) onClick(e);
    };

    return (
      <button ref={ref} data-testid="dialog-trigger" onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }),
  
  Portal: React.forwardRef<HTMLDivElement, any>(({ children, ...props }, ref) => {
    const { isOpen } = useDialog();
    
    if (!isOpen) return null;
    
    return (
      <div ref={ref} data-testid="dialog-portal" {...props}>
        {children}
      </div>
    );
  }),
  
  Overlay: React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => (
    <div ref={ref} data-testid="dialog-overlay" className={className} {...props} />
  )),
  
  Content: React.forwardRef<HTMLDivElement, any>(({ children, className, ...props }, ref) => (
    <div ref={ref} data-testid="dialog-content" className={className} role="dialog" {...props}>
      {children}
    </div>
  )),
  
  Close: React.forwardRef<HTMLButtonElement, any>(({ children, className, onClick, ...props }, ref) => {
    const { handleOpenChange } = useDialog();
    
    const handleClick = (e: React.MouseEvent) => {
      handleOpenChange(false);
      if (onClick) onClick(e);
    };

    return (
      <button
        ref={ref}
        data-testid="dialog-close"
        className={className}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }),
  
  Title: React.forwardRef<HTMLHeadingElement, any>(({ children, className, ...props }, ref) => (
    <h2 ref={ref} data-testid="dialog-title" className={className} {...props}>
      {children}
    </h2>
  )),
  
  Description: React.forwardRef<HTMLParagraphElement, any>(({ children, className, ...props }, ref) => (
    <p ref={ref} data-testid="dialog-description" className={className} {...props}>
      {children}
    </p>
  )),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  XIcon: () => <svg data-testid="x-icon">X</svg>,
}));

const MockTrigger = () => null;
const MockPortal = () => null;

describe('Dialog Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnOpenChange.mockClear();
  });

  describe('Dialog (Root)', () => {
    it('should render with default props', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
        </Dialog>
      );
      
      const dialog = screen.getByTestId('dialog-root');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('data-slot', 'dialog');
    });

    it('should handle controlled open state', () => {
      const onOpenChange = jest.fn();
      
      render(
        <Dialog open={true} onOpenChange={onOpenChange}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      
      const dialog = screen.getByTestId('dialog-root');
      expect(dialog).toHaveAttribute('data-open', 'true');
    });

    it('should handle uncontrolled open state', () => {
      render(
        <Dialog defaultOpen={false}>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      
      const dialog = screen.getByTestId('dialog-root');
      expect(dialog).toHaveAttribute('data-open', 'false');
    });

    it('should spread additional props', () => {
      render(
        <Dialog id="custom-dialog" data-custom="test">
          <DialogTrigger>Open</DialogTrigger>
        </Dialog>
      );
      
      const dialog = screen.getByTestId('dialog-root');
      expect(dialog).toHaveAttribute('id', 'custom-dialog');
      expect(dialog).toHaveAttribute('data-custom', 'test');
    });
  });

  describe('DialogTrigger', () => {
    it('should render with default props', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
        </Dialog>
      );
      
      const trigger = screen.getByTestId('dialog-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('data-slot', 'dialog-trigger');
      expect(trigger).toHaveTextContent('Open Dialog');
    });

    it('should render as button by default', () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
        </Dialog>
      );
      
      const trigger = screen.getByTestId('dialog-trigger');
      expect(trigger.tagName).toBe('BUTTON');
    });

    it('should handle click events', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>Dialog Content</DialogContent>
        </Dialog>
      );
      
      const trigger = screen.getByTestId('dialog-trigger');
      
      await user.click(trigger);
      
      // Dialog should open
      const dialog = screen.getByTestId('dialog-root');
      expect(dialog).toHaveAttribute('data-open', 'true');
    });

    it('should spread additional props', () => {
      render(
        <Dialog>
          <DialogTrigger 
            className="custom-trigger"
            id="trigger-button"
            aria-label="Open dialog"
          >
            Open
          </DialogTrigger>
        </Dialog>
      );
      
      const trigger = screen.getByTestId('dialog-trigger');
      expect(trigger).toHaveClass('custom-trigger');
      expect(trigger).toHaveAttribute('id', 'trigger-button');
      expect(trigger).toHaveAttribute('aria-label', 'Open dialog');
    });
  });

  describe('DialogContent', () => {
    it('should render with default props', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      );
      
      const content = screen.getByTestId('dialog-content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveAttribute('data-slot', 'dialog-content');
      expect(content).toHaveTextContent('Dialog content');
    });

    it('should have correct default classes', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      
      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass(
        'bg-background',
        'fixed',
        'top-[50%]',
        'left-[50%]',
        'z-50',
        'grid',
        'w-full',
        'translate-x-[-50%]',
        'translate-y-[-50%]',
        'gap-4',
        'rounded-lg',
        'border',
        'p-6',
        'shadow-lg'
      );
    });

    it('should apply custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent className="custom-content">Content</DialogContent>
        </Dialog>
      );
      
      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass('custom-content');
    });

    it('should render close button by default', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      
      const closeButton = screen.getByTestId('dialog-close');
      const xIcon = screen.getByTestId('x-icon');
      
      expect(closeButton).toBeInTheDocument();
      expect(xIcon).toBeInTheDocument();
      expect(closeButton).toContainElement(xIcon);
    });

    it('should hide close button when showCloseButton is false', () => {
      render(
        <Dialog open={true}>
          <DialogContent showCloseButton={false}>Content</DialogContent>
        </Dialog>
      );
      
      expect(screen.queryByTestId('dialog-close')).not.toBeInTheDocument();
    });

    it('should render with portal and overlay', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      
      const portal = screen.getByTestId('dialog-portal');
      const overlay = screen.getByTestId('dialog-overlay');
      const content = screen.getByTestId('dialog-content');
      
      expect(portal).toBeInTheDocument();
      expect(overlay).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });

    it('should have dialog role for accessibility', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      
      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveAttribute('role', 'dialog');
    });

    it('should spread additional props', () => {
      render(
        <Dialog open={true}>
          <DialogContent
            id="dialog-content"
            aria-labelledby="dialog-title"
            data-custom="test"
          >
            Content
          </DialogContent>
        </Dialog>
      );
      
      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveAttribute('id', 'dialog-content');
      expect(content).toHaveAttribute('aria-labelledby', 'dialog-title');
      expect(content).toHaveAttribute('data-custom', 'test');
    });
  });

  describe('DialogOverlay', () => {
    it('should render with default props', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      
      const overlay = screen.getByTestId('dialog-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveAttribute('data-slot', 'dialog-overlay');
    });

    it('should have correct default classes', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      
      const overlay = screen.getByTestId('dialog-overlay');
      expect(overlay).toHaveClass(
        'fixed',
        'inset-0',
        'z-50',
        'bg-black/50'
      );
    });

    it('should apply custom className', () => {
      render(
        <DialogOverlay className="custom-overlay" />
      );
      
      const overlay = screen.getByTestId('dialog-overlay');
      expect(overlay).toHaveClass('custom-overlay');
    });
  });

  describe('DialogHeader', () => {
    it('should render with default props', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <p>Header content</p>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
      
      const header = document.querySelector('[data-slot="dialog-header"]');
      expect(header).toBeInTheDocument();
      expect(header).toHaveAttribute('data-slot', 'dialog-header');
      expect(header).toHaveTextContent('Header content');
    });

    it('should have correct default classes', () => {
      render(
        <DialogHeader>Header</DialogHeader>
      );
      
      const header = document.querySelector('[data-slot="dialog-header"]');
      expect(header).toHaveClass(
        'flex',
        'flex-col',
        'gap-2',
        'text-center',
        'sm:text-left'
      );
    });

    it('should apply custom className', () => {
      render(
        <DialogHeader className="custom-header">Header</DialogHeader>
      );
      
      const header = document.querySelector('[data-slot="dialog-header"]');
      expect(header).toHaveClass('custom-header');
    });

    it('should render as div by default', () => {
      render(<DialogHeader>Header</DialogHeader>);
      
      const header = document.querySelector('[data-slot="dialog-header"]');
      expect(header.tagName).toBe('DIV');
    });

    it('should spread additional props', () => {
      render(
        <DialogHeader id="dialog-header" role="banner">
          Header
        </DialogHeader>
      );
      
      const header = document.querySelector('[data-slot="dialog-header"]');
      expect(header).toHaveAttribute('id', 'dialog-header');
      expect(header).toHaveAttribute('role', 'banner');
    });
  });

  describe('DialogTitle', () => {
    it('should render with default props', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );
      
      const title = screen.getByTestId('dialog-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveAttribute('data-slot', 'dialog-title');
      expect(title).toHaveTextContent('Dialog Title');
    });

    it('should have correct default classes', () => {
      render(<DialogTitle>Title</DialogTitle>);
      
      const title = screen.getByTestId('dialog-title');
      expect(title).toHaveClass(
        'text-lg',
        'leading-none',
        'font-semibold'
      );
    });

    it('should apply custom className', () => {
      render(<DialogTitle className="custom-title">Title</DialogTitle>);
      
      const title = screen.getByTestId('dialog-title');
      expect(title).toHaveClass('custom-title');
    });

    it('should render as h2 by default', () => {
      render(<DialogTitle>Title</DialogTitle>);
      
      const title = screen.getByTestId('dialog-title');
      expect(title.tagName).toBe('H2');
    });

    it('should spread additional props', () => {
      render(
        <DialogTitle id="title" role="heading" aria-level={1}>
          Title
        </DialogTitle>
      );
      
      const title = screen.getByTestId('dialog-title');
      expect(title).toHaveAttribute('id', 'title');
      expect(title).toHaveAttribute('role', 'heading');
      expect(title).toHaveAttribute('aria-level', '1');
    });
  });

  describe('DialogDescription', () => {
    it('should render with default props', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      
      const description = screen.getByTestId('dialog-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveAttribute('data-slot', 'dialog-description');
      expect(description).toHaveTextContent('Dialog description');
    });

    it('should have correct default classes', () => {
      render(<DialogDescription>Description</DialogDescription>);
      
      const description = screen.getByTestId('dialog-description');
      expect(description).toHaveClass(
        'text-muted-foreground',
        'text-sm'
      );
    });

    it('should apply custom className', () => {
      render(
        <DialogDescription className="custom-description">
          Description
        </DialogDescription>
      );
      
      const description = screen.getByTestId('dialog-description');
      expect(description).toHaveClass('custom-description');
    });

    it('should render as p by default', () => {
      render(<DialogDescription>Description</DialogDescription>);
      
      const description = screen.getByTestId('dialog-description');
      expect(description.tagName).toBe('P');
    });

    it('should spread additional props', () => {
      render(
        <DialogDescription id="description" role="doc-subtitle">
          Description
        </DialogDescription>
      );
      
      const description = screen.getByTestId('dialog-description');
      expect(description).toHaveAttribute('id', 'description');
      expect(description).toHaveAttribute('role', 'doc-subtitle');
    });
  });

  describe('DialogFooter', () => {
    it('should render with default props', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter>
              <button>Cancel</button>
              <button>Save</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      
      const footer = document.querySelector('[data-slot="dialog-footer"]');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveAttribute('data-slot', 'dialog-footer');
    });

    it('should have correct default classes', () => {
      render(<DialogFooter>Footer</DialogFooter>);
      
      const footer = document.querySelector('[data-slot="dialog-footer"]');
      expect(footer).toHaveClass(
        'flex',
        'flex-col-reverse',
        'gap-2',
        'sm:flex-row',
        'sm:justify-end'
      );
    });

    it('should apply custom className', () => {
      render(<DialogFooter className="custom-footer">Footer</DialogFooter>);
      
      const footer = document.querySelector('[data-slot="dialog-footer"]');
      expect(footer).toHaveClass('custom-footer');
    });

    it('should render as div by default', () => {
      render(<DialogFooter>Footer</DialogFooter>);
      
      const footer = document.querySelector('[data-slot="dialog-footer"]');
      expect(footer.tagName).toBe('DIV');
    });

    it('should spread additional props', () => {
      render(
        <DialogFooter id="dialog-footer" role="contentinfo">
          Footer
        </DialogFooter>
      );
      
      const footer = document.querySelector('[data-slot="dialog-footer"]');
      expect(footer).toHaveAttribute('id', 'dialog-footer');
      expect(footer).toHaveAttribute('role', 'contentinfo');
    });
  });

  describe('DialogClose', () => {
    it('should render with default props', () => {
      render(<DialogClose>Close</DialogClose>);
      
      const close = screen.getByTestId('dialog-close');
      expect(close).toBeInTheDocument();
      expect(close).toHaveAttribute('data-slot', 'dialog-close');
      expect(close).toHaveTextContent('Close');
    });

    it('should render as button by default', () => {
      render(<DialogClose>Close</DialogClose>);
      
      const close = screen.getByTestId('dialog-close');
      expect(close.tagName).toBe('BUTTON');
    });

    it('should handle click events', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      
      render(<DialogClose onClick={onClick}>Close</DialogClose>);
      
      const close = screen.getByTestId('dialog-close');
      
      await user.click(close);
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should apply custom className', () => {
      render(<DialogClose className="custom-close">Close</DialogClose>);
      
      const close = screen.getByTestId('dialog-close');
      expect(close).toHaveClass('custom-close');
    });

    it('should spread additional props', () => {
      render(
        <DialogClose 
          id="close-button"
          aria-label="Close dialog"
          disabled
        >
          Close
        </DialogClose>
      );
      
      const close = screen.getByTestId('dialog-close');
      expect(close).toHaveAttribute('id', 'close-button');
      expect(close).toHaveAttribute('aria-label', 'Close dialog');
      expect(close).toBeDisabled();
    });
  });

  describe('Complete Dialog Examples', () => {
    it('should render basic dialog', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>Dialog description</DialogDescription>
            </DialogHeader>
            <div>Dialog body content</div>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <button>Save</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      
      const trigger = screen.getByTestId('dialog-trigger');
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent('Open Dialog');
    });

    it('should handle dialog open/close cycle', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogClose>Close</DialogClose>
          </DialogContent>
        </Dialog>
      );
      
      // Initially closed
      let dialog = screen.getByTestId('dialog-root');
      expect(dialog).toHaveAttribute('data-open', 'false');
      
      // Open dialog
      const trigger = screen.getByTestId('dialog-trigger');
      await user.click(trigger);
      
      dialog = screen.getByTestId('dialog-root');
      expect(dialog).toHaveAttribute('data-open', 'true');
      
      // Content should be visible
      const title = screen.getByTestId('dialog-title');
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Test Dialog');
    });

    it('should render confirmation dialog', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this item? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <button>Delete</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      
      const title = screen.getByTestId('dialog-title');
      const description = screen.getByTestId('dialog-description');
      const cancelButton = screen.getByText('Cancel');
      const deleteButton = screen.getByText('Delete');
      
      expect(title).toHaveTextContent('Confirm Delete');
      expect(description).toHaveTextContent('Are you sure you want to delete this item?');
      expect(cancelButton).toHaveTextContent('Cancel');
      expect(deleteButton).toBeInTheDocument();
    });

    it('should render form dialog', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form>
              <div>
                <label htmlFor="name">Name</label>
                <input id="name" placeholder="Enter your name" />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input id="email" placeholder="Enter your email" />
              </div>
            </form>
            <DialogFooter>
              <DialogClose>Cancel</DialogClose>
              <button type="submit">Save changes</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      
      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const saveButton = screen.getByText('Save changes');
      
      expect(nameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should support proper ARIA attributes', () => {
      render(
        <Dialog open={true}>
          <DialogContent 
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
          >
            <DialogTitle id="dialog-title">Accessible Dialog</DialogTitle>
            <DialogDescription id="dialog-description">
              This dialog is properly accessible
            </DialogDescription>
          </DialogContent>
        </Dialog>
      );
      
      const content = screen.getByTestId('dialog-content');
      const title = screen.getByTestId('dialog-title');
      const description = screen.getByTestId('dialog-description');
      
      expect(content).toHaveAttribute('aria-labelledby', 'dialog-title');
      expect(content).toHaveAttribute('aria-describedby', 'dialog-description');
      expect(title).toHaveAttribute('id', 'dialog-title');
      expect(description).toHaveAttribute('id', 'dialog-description');
    });

    it('should have screen reader friendly close button', () => {
      render(
        <Dialog open={true}>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );
      
      const closeButton = screen.getByTestId('dialog-close');
      const srText = screen.getByText('Close');
      
      expect(closeButton).toBeInTheDocument();
      expect(srText).toHaveClass('sr-only');
    });

    it('should support custom close button aria-label', () => {
      render(
        <DialogClose aria-label="Close settings dialog">
          ×
        </DialogClose>
      );
      
      const closeButton = screen.getByTestId('dialog-close');
      expect(closeButton).toHaveAttribute('aria-label', 'Close settings dialog');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <input placeholder="First input" />
            <input placeholder="Second input" />
            <DialogClose>Close</DialogClose>
          </DialogContent>
        </Dialog>
      );
      
      // Tab to trigger
      const trigger = screen.getByTestId('dialog-trigger');
      await user.tab();
      expect(trigger).toHaveFocus();
      
      // Enter should open dialog
      await user.keyboard('{Enter}');
      
      const dialog = screen.getByTestId('dialog-root');
      expect(dialog).toHaveAttribute('data-open', 'true');
    });
  });

  describe('Custom Styling', () => {
    it('should support custom content sizes', () => {
      render(
        <Dialog open={true}>
          <DialogContent className="max-w-4xl">
            Large dialog content
          </DialogContent>
        </Dialog>
      );
      
      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass('max-w-4xl');
    });

    it('should support custom overlay styling', () => {
      render(
        <DialogOverlay className="bg-red-500/30" />
      );
      
      const overlay = screen.getByTestId('dialog-overlay');
      expect(overlay).toHaveClass('bg-red-500/30');
    });

    it('should support fullscreen dialog', () => {
      render(
        <Dialog open={true}>
          <DialogContent className="h-screen w-screen max-w-none">
            Fullscreen content
          </DialogContent>
        </Dialog>
      );
      
      const content = screen.getByTestId('dialog-content');
      expect(content).toHaveClass('h-screen', 'w-screen', 'max-w-none');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing title gracefully', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription>Dialog without title</DialogDescription>
          </DialogContent>
        </Dialog>
      );
      
      const description = screen.getByTestId('dialog-description');
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent('Dialog without title');
    });

    it('should handle empty content', () => {
      render(
        <Dialog open={true}>
          <DialogContent />
        </Dialog>
      );
      
      const content = screen.getByTestId('dialog-content');
      expect(content).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(
        <Dialog>
          <DialogTrigger disabled>Open</DialogTrigger>
        </Dialog>
      );
      
      const trigger = screen.getByTestId('dialog-trigger');
      expect(trigger).toBeDisabled();
    });
  });

  describe('Integration', () => {
    it('should work with external state management', () => {
      const TestComponent = () => {
        const [open, setOpen] = React.useState(false);
        
        return (
          <div>
            <button onClick={() => setOpen(true)} data-testid="external-trigger">
              External Open
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogTitle>External State Dialog</DialogTitle>
                <DialogClose>Close</DialogClose>
              </DialogContent>
            </Dialog>
          </div>
        );
      };
      
      render(<TestComponent />);
      
      const externalTrigger = screen.getByTestId('external-trigger');
      fireEvent.click(externalTrigger);
      
      const dialog = screen.getByTestId('dialog-root');
      expect(dialog).toHaveAttribute('data-open', 'true');
    });

    it('should support nested dialogs', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Parent Dialog</DialogTitle>
            <Dialog>
              <DialogTrigger>Open Child</DialogTrigger>
              <DialogContent>
                <DialogTitle>Child Dialog</DialogTitle>
              </DialogContent>
            </Dialog>
          </DialogContent>
        </Dialog>
      );
      
      const parentTitle = screen.getByText('Parent Dialog');
      const childTrigger = screen.getByText('Open Child');
      
      expect(parentTitle).toBeInTheDocument();
      expect(childTrigger).toBeInTheDocument();
    });
  });
});