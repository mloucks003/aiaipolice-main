import React from 'react';
import {render} from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('renders correctly', () => {
    const {getByText} = render(<App />);
    expect(getByText('Officer Radio App')).toBeTruthy();
    expect(getByText('Setup Complete')).toBeTruthy();
  });
});
