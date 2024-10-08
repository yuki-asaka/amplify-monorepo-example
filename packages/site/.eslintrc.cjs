module.exports = {
    root: true,
    env: {es2022: true},
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended',],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: [],
    rules: {
        'indent': ['error', 2], // 他のカスタムルールをここに追加
    },
}
