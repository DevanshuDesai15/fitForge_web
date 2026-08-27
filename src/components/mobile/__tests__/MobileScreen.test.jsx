import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MobileScreen from '../MobileScreen';

describe('MobileScreen', () => {
  it('includes horizontal padding inside its viewport-width content container', () => {
    render(<MobileScreen title="Dashboard"><div>Content</div></MobileScreen>);

    const contentContainer = screen.getByRole('heading', { name: 'Dashboard' })
      .closest('header')
      .parentElement;

    expect(getComputedStyle(contentContainer).boxSizing).toBe('border-box');
  });
});
