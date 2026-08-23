jest.mock('../src/hooks/useHealthFlags', () => ({
  useHealthFlags: () => ([
    { code: 'DM', label: 'Diabetes', description: 'High-sugar preparations get flagged' },
    { code: 'OW', label: 'Overweight / Obesity', description: 'Calorie-dense dishes get a caution' },
    { code: 'LI', label: 'Lactose intolerance', description: 'Dairy — milk, ghee, curd — gets flagged' },
    { code: 'SD', label: 'Sedentary lifestyle', description: 'Rich fat/sugar dishes get portion notes' },
  ]),
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HealthProfileSheet } from '../src/components/shared/HealthProfileSheet';

test('seeds the grid from codes and saves the edited selection', () => {
  const onSave = jest.fn();
  const onClose = jest.fn();
  const { getByText, getByLabelText } = render(
    <HealthProfileSheet visible codes={['OW']} onSave={onSave} onClose={onClose} />,
  );

  expect(getByText('Diabetes')).toBeTruthy();       // grid rendered from flags

  fireEvent.press(getByLabelText('Diabetes'));                 // add DM
  fireEvent.press(getByLabelText('Overweight / Obesity'));     // remove seeded OW
  fireEvent.press(getByText('Save profile'));

  expect(onSave).toHaveBeenCalledTimes(1);
  const saved: string[] = onSave.mock.calls[0][0];
  expect(saved).toContain('DM');
  expect(saved).not.toContain('OW');
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('the X cancels without saving', () => {
  const onSave = jest.fn();
  const onClose = jest.fn();
  const { getByLabelText } = render(
    <HealthProfileSheet visible codes={[]} onSave={onSave} onClose={onClose} />,
  );

  fireEvent.press(getByLabelText('Close'));

  expect(onClose).toHaveBeenCalledTimes(1);
  expect(onSave).not.toHaveBeenCalled();
});
