import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from './DashboardPage';

afterEach(cleanup);

it('renders the total recipes stat card', () => {
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  expect(screen.getByText('Total Recipes')).toBeInTheDocument();
  expect(screen.getByTestId('total-recipes-count')).toBeInTheDocument();
});

it('renders a category bar for each recipe category', () => {
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  expect(screen.getByText('By Category')).toBeInTheDocument();
  for (const cat of ['Solid', 'Liquid', 'Semi-solid']) {
    expect(screen.getByText(cat)).toBeInTheDocument();
  }
});

it('renders the recent edits timeline', () => {
  render(<MemoryRouter><DashboardPage /></MemoryRouter>);
  expect(screen.getByText('Recent Edits')).toBeInTheDocument();
});
