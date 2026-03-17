/* eslint-env jest */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve({username: 'test', password: 'test'})),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));

// Mock Audio Recorder Player
jest.mock('react-native-audio-recorder-player', () => {
  return jest.fn().mockImplementation(() => ({
    startRecorder: jest.fn(() => Promise.resolve('file://path')),
    stopRecorder: jest.fn(() => Promise.resolve('file://path')),
    startPlayer: jest.fn(() => Promise.resolve('file://path')),
    stopPlayer: jest.fn(() => Promise.resolve('file://path')),
    addRecordBackListener: jest.fn(),
    addPlayBackListener: jest.fn(),
    removeRecordBackListener: jest.fn(),
    removePlayBackListener: jest.fn(),
  }));
});
