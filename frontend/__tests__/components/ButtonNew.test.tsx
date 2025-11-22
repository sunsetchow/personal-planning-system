import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ButtonNew } from '@/components/ui/button-new';

describe('ButtonNew Component', () => {
  it('should render with children text', () => {
    render(<ButtonNew>Click me</ButtonNew>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should apply primary variant by default', () => {
    render(<ButtonNew>Primary</ButtonNew>);
    const button = screen.getByText('Primary');
    expect(button).toHaveClass('bg-indigo-600');
  });

  it('should apply secondary variant correctly', () => {
    render(<ButtonNew variant="secondary">Secondary</ButtonNew>);
    const button = screen.getByText('Secondary');
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('border');
  });

  it('should apply danger variant correctly', () => {
    render(<ButtonNew variant="danger">Delete</ButtonNew>);
    const button = screen.getByText('Delete');
    expect(button).toHaveClass('bg-red-600');
  });

  it('should apply ghost variant correctly', () => {
    render(<ButtonNew variant="ghost">Ghost</ButtonNew>);
    const button = screen.getByText('Ghost');
    expect(button).toHaveClass('text-gray-600');
  });

  it('should apply small size', () => {
    render(<ButtonNew size="sm">Small</ButtonNew>);
    const button = screen.getByText('Small');
    expect(button).toHaveClass('text-xs');
  });

  it('should apply large size', () => {
    render(<ButtonNew size="lg">Large</ButtonNew>);
    const button = screen.getByText('Large');
    expect(button).toHaveClass('text-base');
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<ButtonNew onClick={handleClick}>Click me</ButtonNew>);
    const button = screen.getByText('Click me');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const handleClick = jest.fn();
    render(<ButtonNew disabled onClick={handleClick}>Disabled</ButtonNew>);
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(<ButtonNew isLoading>Loading</ButtonNew>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    render(<ButtonNew className="custom-class">Custom</ButtonNew>);
    const button = screen.getByText('Custom');
    expect(button).toHaveClass('custom-class');
  });

  it('should pass through other button props', () => {
    render(<ButtonNew type="submit">Submit</ButtonNew>);
    const button = screen.getByText('Submit');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
