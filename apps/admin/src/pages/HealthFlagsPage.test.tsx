import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HealthFlagsPage } from './HealthFlagsPage';

afterEach(cleanup);

it('renders a card for each condition code', () => {
  render(<MemoryRouter><HealthFlagsPage /></MemoryRouter>);
  for (const code of ['DIABETES', 'PREGNANT', 'NUT_ALLERGY', 'INFANT_8M']) {
    expect(screen.getByText(code)).toBeInTheDocument();
  }
});

it('has a Save all button', () => {
  render(<MemoryRouter><HealthFlagsPage /></MemoryRouter>);
  expect(screen.getByRole('button', { name: /save all/i })).toBeInTheDocument();
});

it('lets the admin edit a display label', () => {
  render(<MemoryRouter><HealthFlagsPage /></MemoryRouter>);
  const input = screen.getByDisplayValue('Diabetes');
  fireEvent.change(input, { target: { value: 'Diabetes (Type 2)' } });
  expect(screen.getByDisplayValue('Diabetes (Type 2)')).toBeInTheDocument();
});
