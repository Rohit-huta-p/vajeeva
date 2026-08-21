import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SubRecipesPage } from './SubRecipesPage';

afterEach(cleanup);

it('renders the sub-recipes table with header columns and rows', () => {
  render(<MemoryRouter><SubRecipesPage /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Sub-recipes' })).toBeInTheDocument();
  for (const col of ['Name', 'Used In', 'Actions']) {
    expect(screen.getByText(col)).toBeInTheDocument();
  }
  expect(screen.getByText('Tamarind extract')).toBeInTheDocument();
});

it('renders the + New Sub-recipe button', () => {
  render(<MemoryRouter><SubRecipesPage /></MemoryRouter>);
  expect(screen.getByRole('button', { name: /new sub-recipe/i })).toBeInTheDocument();
});

it('opens the New Sub-recipe modal on button click and closes on Cancel', () => {
  render(<MemoryRouter><SubRecipesPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /new sub-recipe/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('New Sub-recipe')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('opens the modal pre-filled when Edit is clicked', () => {
  render(<MemoryRouter><SubRecipesPage /></MemoryRouter>);
  fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
  expect(screen.getByText('Edit Sub-recipe')).toBeInTheDocument();
  expect(screen.getByLabelText('Name')).toHaveValue('Tamarind extract');
});
