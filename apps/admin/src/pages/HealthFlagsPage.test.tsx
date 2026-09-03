import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HealthFlagsPage } from './HealthFlagsPage';

afterEach(cleanup);

it('renders a card for each condition code', () => {
  render(<MemoryRouter><HealthFlagsPage /></MemoryRouter>);
  for (const code of ['diabetes', 'pregnancy', 'nut-allergy', 'infant-8m']) {
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

it('lets the admin toggle a condition off (enabled → false)', () => {
  render(<MemoryRouter><HealthFlagsPage /></MemoryRouter>);
  const toggle = screen.getByLabelText('diabetes shown to users') as HTMLInputElement;
  expect(toggle.checked).toBe(true);
  fireEvent.click(toggle);
  expect((screen.getByLabelText('diabetes shown to users') as HTMLInputElement).checked).toBe(false);
});
