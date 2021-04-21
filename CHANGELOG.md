# CHANGELOG

## 1.10.1(2021/04/21)

- fix(farrow-schema): fix typo, rename formater to formatter

## 1.10.0(2021/04/21)

- refactor(farrow-schema): refactor formater, remove transformer
- feat(farrow-schema): support DateType

## 1.9.2(2021/04/08)

- fix(create-farrow-app): farrow build first to ensure the right api.src was replaced before client build)

## 1.9.1(2021/04/08)

- fix: the `apiClient.build` of `farrow` replace the wrong content([#66](https://github.com/Lucifier129/farrow/pull/66))

## 1.9.0(2021/04/08)

- feat: `farrow-schema`: add `omit/pick`, add `Tuple`, refactor `validator`, refactor `schema`

- feat: `farrow`: support `apiClient.build` to replace the production url for `generated files`([#65](https://github.com/Lucifier129/farrow/pull/65))

- feat: `farrow-next`: support `PageOptions.Providers` for injecting Provider values
