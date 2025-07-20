import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Badge from '../../components/Badge';

describe('Badge Component', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default props correctly', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800'); // primary variant
    expect(badge).toHaveClass('text-sm', 'px-2.5', 'py-0.5'); // md size
    expect(badge).toHaveClass('rounded'); // not rounded-full by default
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-green-100', 'text-green-800');

    rerender(<Badge variant="danger">Danger</Badge>);
    expect(screen.getByText('Danger')).toHaveClass('bg-red-100', 'text-red-800');

    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('text-xs', 'px-2', 'py-0.5');

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText('Large')).toHaveClass('text-base', 'px-3', 'py-1');
  });

  it('applies rounded prop correctly', () => {
    render(<Badge rounded>Rounded Badge</Badge>);
    expect(screen.getByText('Rounded Badge')).toHaveClass('rounded-full');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('handles click events when onClick is provided', () => {
    const mockClick = jest.fn();
    render(<Badge onClick={mockClick}>Clickable</Badge>);
    
    const badge = screen.getByText('Clickable');
    expect(badge).toHaveClass('cursor-pointer', 'hover:opacity-80');
    
    fireEvent.click(badge);
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('does not add cursor styles when onClick is not provided', () => {
    render(<Badge>Not Clickable</Badge>);
    const badge = screen.getByText('Not Clickable');
    
    expect(badge).not.toHaveClass('cursor-pointer');
    expect(badge).not.toHaveClass('hover:opacity-80');
  });

  it('renders as a span element', () => {
    render(<Badge>Span Badge</Badge>);
    const badge = screen.getByText('Span Badge');
    expect(badge.tagName).toBe('SPAN');
  });

  it('applies all base classes', () => {
    render(<Badge>Base Classes</Badge>);
    const badge = screen.getByText('Base Classes');
    expect(badge).toHaveClass('inline-flex', 'items-center', 'font-medium');
  });

  it('passes through additional props', () => {
    render(<Badge data-testid="test-badge" aria-label="Test Badge">Test</Badge>);
    const badge = screen.getByTestId('test-badge');
    expect(badge).toHaveAttribute('aria-label', 'Test Badge');
  });
});