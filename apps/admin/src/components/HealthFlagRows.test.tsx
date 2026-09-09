import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { HealthFlagRows } from './HealthFlagRows';

afterEach(cleanup);

const CONDITIONS = [
  { code: 'diabetes', label: 'Diabetes' },
  { code: 'obesity',  label: 'Obesity' },
];

it('renders the three severity pills', () => {
  render(<HealthFlagRows value={[]} onChange={() => {}} conditions={CONDITIONS} />);
  expect(screen.getByRole('button', { name: /Safe/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Indication/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Caution/ })).toBeInTheDocument();
});

it('tapping a pill opens a condition multi-select and assigns on click', () => {
  const onChange = vi.fn();
  render(<HealthFlagRows value={[]} onChange={onChange} conditions={CONDITIONS} />);
  fireEvent.click(screen.getByRole('button', { name: /Caution/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Diabetes' }));
  expect(onChange).toHaveBeenCalledWith([{ condition: 'diabetes', severity: 'caution' }]);
});

it('a condition lives in exactly one severity — reassigning moves it', () => {
  const onChange = vi.fn();
  render(
    <HealthFlagRows
      value={[{ condition: 'diabetes', severity: 'safe' }]}
      onChange={onChange}
      conditions={CONDITIONS}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Caution/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Diabetes' }));
  // moved, not duplicated: still a single entry, now caution
  expect(onChange).toHaveBeenCalledWith([{ condition: 'diabetes', severity: 'caution' }]);
});

it('clicking an already-assigned condition in its own pill removes it', () => {
  const onChange = vi.fn();
  render(
    <HealthFlagRows
      value={[{ condition: 'obesity', severity: 'caution' }]}
      onChange={onChange}
      conditions={CONDITIONS}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Caution/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Obesity' }));
  expect(onChange).toHaveBeenCalledWith([]);
});
