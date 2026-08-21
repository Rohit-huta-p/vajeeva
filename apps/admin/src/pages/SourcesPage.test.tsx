import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SourcesPage } from './SourcesPage';

afterEach(cleanup);

it('renders the sources table with header columns and rows', () => {
  render(<MemoryRouter><SourcesPage /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Sources' })).toBeInTheDocument();
  for (const col of ['Name', 'Type', 'Recipes', 'Actions']) {
    expect(screen.getByText(col)).toBeInTheDocument();
  }
  expect(screen.getByText('Samayamulu')).toBeInTheDocument();
});

it('renders the + New Source button', () => {
  render(<MemoryRouter><SourcesPage /></MemoryRouter>);
  expect(screen.getByRole('button', { name: /new source/i })).toBeInTheDocument();
});

it('opens the New Source modal on button click and closes on Cancel', () => {
  render(<MemoryRouter><SourcesPage /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /new source/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('New Source')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('opens the modal pre-filled when Edit is clicked', () => {
  render(<MemoryRouter><SourcesPage /></MemoryRouter>);
  fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
  expect(screen.getByText('Edit Source')).toBeInTheDocument();
  expect(screen.getByLabelText('Name')).toHaveValue('Samayamulu');
});
