module.exports = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.jsx?$': [
            'babel-jest',
            {
                presets: [
                    ['@babel/preset-env', { targets: { node: 'current' } }],
                ],
                plugins: ['@babel/plugin-transform-modules-commonjs'],
            },
        ],
    },
    moduleNameMapper: {
        '\\.(css|less|scss)$': '<rootDir>/test/__mocks__/styleMock.js',
    },
};

