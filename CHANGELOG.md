# Changelog

## 2.0.0

- Add support for Zod Mini
- Remove dotenv and dotenv-expand peer dependencies
- Made the `envPath` parameter optional. If not provided, no file is read, and only `process.env` is validated
- Improve how field `.meta` is logged (`title`, `description`, and `example` supported)
- Improve how `schema` is validated and field types are allowed/disallowed
- Refactor the codebase to improve readability and maintainability
- Update README with new instructions and examples
- Updated tests to cover new functionality and edge cases

## 1.0.1

- Update eslint to v9, apply new linting rules, and bump several dev dependencies

## 1.0.0

- Update the tests to reflect new zod v4 error message
- Update methodology of passing description data into a schema
- Update method for pulling descriptions off of schema fields
- Remove some @ts-expect-error comments that were no longer necessary
- Update check for types allowed. (`_def` has been moved here)

## < 1.0.0

Please see the [commit history](https://github.com/noahtigner/validate-env-vars/commits/main/)
