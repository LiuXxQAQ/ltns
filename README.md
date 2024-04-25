# ltns
> A personal CLI inspired by [vite-create](https://github.com/vitejs/vite/tree/main/packages/create-vite)

## Start

Install
```bash
$ npm install ltns -g
or
$ pnpm add ltns -g
```

How to use
```
Usage: ltns [project name] [options]

Options:
  -t, --template  Specify a template that you want.
                                      [string] [choices: "ts", "vue", "angular"]
  -h, --help      Show a help message for ltns.                        [boolean]
  -v, --version   Outputs ltns version.                                [boolean]

Examples:
  ltns                          Basic usage.
  ltns MyProject                Specify a project name.
  ltns MyProject -template vue  Specify a template.
  ltns MyProject -t vue         Use alias.
```

Template presets include:
- `TypeScript (TypeScript Starter)` use Antfu [starter-ts](https://github.com/antfu/starter-ts)
- `Vue (Vite + Vue + Typescipt)`
- `Angular (Angular 17 starter)`

## License

[MIT](LICENSE).
