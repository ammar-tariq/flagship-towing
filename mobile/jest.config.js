module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^@Assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@Components/(.*)$': '<rootDir>/src/components/$1',
    '^@Utils/(.*)$': '<rootDir>/src/lib/$1',
    '^@Lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@Hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@Types/(.*)$': '<rootDir>/src/types/$1',
    '^@Api/(.*)$': '<rootDir>/src/api/$1',
    '^@Store/(.*)$': '<rootDir>/src/store/$1',
    '^@Screens/(.*)$': '<rootDir>/src/screens/$1',
  },
};
