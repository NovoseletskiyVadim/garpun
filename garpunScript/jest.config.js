module.exports = {
    globals: {
        'ts-jest': {
            tsconfig: './tsconfig.test.json',
        },
    },
    roots: ['<rootDir>/src/'],
    transform: {
        '.(js|ts)': 'ts-jest',
    },
    testRegex: '(/__tests?__/.*|\\.test)\\.(ts|js)$',
    moduleFileExtensions: ['ts', 'js'],
    testEnvironment: 'node',
    modulePathIgnorePatterns: ['__mocks__'],
    moduleNameMapper: {
        '@main(.*)$': '<rootDir>/src/$1',
        '@components(.*)$': '<rootDir>/src/components/$1',
        '@models(.*)$': '<rootDir>/src/models/$1',
        '@process(.*)$': '<rootDir>/src/process/$1',
        '@helpers(.*)$': '<rootDir>/src/helpers/$1',
        '@resources(.*)$': '<rootDir>/src/resources/$1',
        '@mixins(.*)$': '<rootDir>/src/mixins/$1',
    },
};
