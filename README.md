<h1 align="center">validate-env-vars</h1>

<div align="center">

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/noahtigner/validate-env-vars/blob/HEAD/LICENSE)
[![latest](https://img.shields.io/npm/v/@noahtigner/validate-env-vars/latest.svg)](https://www.npmjs.com/package/@noahtigner/validate-env-vars)
[![last commit](https://img.shields.io/github/last-commit/noahtigner/validate-env-vars.svg)](https://github.com/noahtigner/validate-env-vars/)
[![npm downloads](https://img.shields.io/npm/dm/@noahtigner/validate-env-vars.svg)](https://www.npmjs.com/package/@noahtigner/validate-env-vars) \
[![Code Quality](https://github.com/noahtigner/validate-env-vars/actions/workflows/quality.yml/badge.svg)](https://github.com/noahtigner/validate-env-vars/actions/workflows/quality.yml)
[![CodeQL](https://github.com/noahtigner/validate-env-vars/actions/workflows/codeql.yml/badge.svg)](https://github.com/noahtigner/validate-env-vars/actions/workflows/codeql.yml)

</div>

<p align="center">
    A lightweight utility to check an .env file for the presence and validity of environment variables, as specified via a template file or the command line
</p>

## Installation

Using npm:

```bash
npm install @noahtigner/validate-env-vars --save-dev
```

## Usage

Check your .env file against every required variable in your template file:

```bash
validate-env-vars --template .env.template
```

Check your .env file against a list of required variables:

```bash
validate-env-vars --list VAR1,VAR2,VAR3
```

Check a specific .env file:

```bash
validate-env-vars --env .env.local --template .env.template
```

## Arguments

| Argument                            | Description                                                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `-t <file>`<br/>`--template <file>` | Path to template file to check against. Optional variables can be specified with `# optional` suffix.<br/>Either `--template` or `--list` must be specified. |
| `-l <vars>`<br/>`--list <vars>`     | Comma-separated list of required variables to check for.<br/>Either `--template` or `--list` must be specified.                                              |
| `-e <file>`<br/>`--env <file>`      | Path to .env file to check. Defaults to `.env` in current directory.                                                                                         |
