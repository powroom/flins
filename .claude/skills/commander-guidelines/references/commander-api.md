# Commander.js API Reference

Comprehensive API documentation for Commander.js, organized by topic with code examples.

## Table of Contents

- [Installation and Setup](#installation-and-setup)
- [Options](#options)
  - [Common Option Types](#common-option-types)
  - [Default Option Value](#default-option-value)
  - [Other Option Types](#other-option-types)
  - [Required Option](#required-option)
  - [Variadic Option](#variadic-option)
  - [Version Option](#version-option)
  - [More Configuration](#more-configuration)
  - [Custom Option Processing](#custom-option-processing)
- [Commands](#commands)
  - [Command Arguments](#command-arguments)
  - [Action Handler](#action-handler)
  - [Stand-alone Executable Commands](#stand-alone-executable-commands)
  - [Life Cycle Hooks](#life-cycle-hooks)
- [Automated Help](#automated-help)
  - [Custom Help](#custom-help)
  - [Display Help After Errors](#display-help-after-errors)
  - [Display Help from Code](#display-help-from-code)
  - [Help Configuration](#help-configuration)
- [Parsing Configuration](#parsing-configuration)
- [TypeScript Support](#typescript-support)
- [Error Handling](#error-handling)

---

## Installation and Setup

### Installation

```bash
npm install commander
```

### Declaring Program Variable

For quick programs, use the global `program` object:

```js
// CommonJS (.cjs)
const { program } = require('commander');
```

For larger programs or unit testing, create a local Command object:

```js
// CommonJS (.cjs)
const { Command } = require('commander');
const program = new Command();
```

```js
// ECMAScript (.mjs)
import { Command } from 'commander';
const program = new Command();
```

```ts
// TypeScript (.ts)
import { Command } from 'commander';
const program = new Command();
```

---

## Options

Options are defined with the `.option()` method. Each option can have a short flag (single character) and a long name, separated by a comma or space or vertical bar (`|`).

```js
program
  .option('-p, --port <number>', 'server port number')
  .option('--trace', 'add extra debugging output')
  .option('--ws, --workspace <name>', 'use a custom workspace');
```

### Common Option Types

#### Boolean Options

```js
program.option('-d, --debug', 'output extra debugging');
```

#### Value Options

```js
program.option('-s, --separator <char>', 'separator character');
```

Multi-word options are camel-cased: `--template-engine` becomes `program.opts().templateEngine`.

#### Option-Argument Separation

```sh
serve -p 80      # space separated
serve -p80       # combined with short option
serve --port 80  # space separated with long option
serve --port=80  # combined with long option using =
```

#### End of Options

Use `--` to indicate the end of options:

```sh
my-cli -- --some-argument
```

### Default Option Value

```js
program
  .option('-c, --cheese <type>', 'add the specified type of cheese', 'blue');

program.parse();

console.log(`cheese: ${program.opts().cheese}`);
// Output: cheese: blue (if not specified)
```

### Other Option Types

#### Negatable Boolean Options

Define a boolean option with a leading `no-` to set the value to false when used:

```js
program
  .option('--no-sauce', 'Remove sauce')
  .option('--cheese <flavour>', 'cheese flavour', 'mozzarella')
  .option('--no-cheese', 'plain with no cheese')
  .parse();

const options = program.opts();
const sauceStr = options.sauce ? 'sauce' : 'no sauce';
const cheeseStr = (options.cheese === false) ? 'no cheese' : `${options.cheese} cheese`;
console.log(`You ordered a pizza with ${sauceStr} and ${cheeseStr}`);
```

#### Boolean or Value Options

```js
program
  .option('-c, --cheese [type]', 'Add cheese with optional type');

program.parse(process.argv);

const options = program.opts();
if (options.cheese === undefined) console.log('no cheese');
else if (options.cheese === true) console.log('add cheese');
else console.log(`add cheese type ${options.cheese}`);
```

### Required Option

```js
program
  .requiredOption('-c, --cheese <type>', 'pizza must have cheese');

program.parse();
// Error if not specified: "required option '-c, --cheese <type>' not specified"
```

### Variadic Option

```js
program
  .option('-n, --number <numbers...>', 'specify numbers')
  .option('-l, --letter [letters...]', 'specify letters');

program.parse();

console.log('Options: ', program.opts());
// Output: { number: ['1', '2', '3'], letter: ['a', 'b', 'c'] }
```

### Version Option

```js
program.version('0.0.1');
```

```js
program.version('0.0.1', '-v, --vers', 'output the current version');
```

### More Configuration

Use the `Option` class for advanced configuration:

```js
program
  .addOption(new Option('-s, --secret').hideHelp())
  .addOption(new Option('-t, --timeout <delay>', 'timeout in seconds').default(60, 'one minute'))
  .addOption(new Option('-d, --drink <size>', 'drink size').choices(['small', 'medium', 'large']))
  .addOption(new Option('-p, --port <number>', 'port number').env('PORT'))
  .addOption(new Option('--donate [amount]', 'optional donation in dollars').preset('20').argParser(parseFloat))
  .addOption(new Option('--disable-server', 'disables the server').conflicts('port'))
  .addOption(new Option('--free-drink', 'small drink included free ').implies({ drink: 'small' }));
```

#### Option Methods

- `.default(value, description)` - Set default value
- `.choices([...])` - Restrict to specific values
- `.env(name)` - Read value from environment variable
- `.preset(value)` - Set preset value for optional option
- `.argParser(fn)` - Custom parser function
- `.conflicts(...)` - Conflict with other options
- `.implies({...})` - Imply other options
- `.hideHelp()` - Hide from help output
- `.makeOptionMandatory()` - Make option required

### Custom Option Processing

```js
function myParseInt(value, dummyPrevious) {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError('Not a number.');
  }
  return parsedValue;
}

function increaseVerbosity(dummyValue, previous) {
  return previous + 1;
}

function collect(value, previous) {
  return previous.concat([value]);
}

function commaSeparatedList(value, dummyPrevious) {
  return value.split(',');
}

program
  .option('-f, --float <number>', 'float argument', parseFloat)
  .option('-i, --integer <number>', 'integer argument', myParseInt)
  .option('-v, --verbose', 'verbosity that can be increased', increaseVerbosity, 0)
  .option('-c, --collect <value>', 'repeatable value', collect, [])
  .option('-l, --list <items>', 'comma separated list', commaSeparatedList);
```

---

## Commands

You can specify (sub)commands using `.command()` or `.addCommand()`.

### Action Handler Commands

```js
program
  .command('clone <source> [destination]')
  .description('clone a repository into a newly created directory')
  .action((source, destination) => {
    console.log('clone command called');
  });
```

### Stand-alone Executable Commands

```js
program
  .command('start <service>', 'start named service')
  .command('stop [service]', 'stop named service, or all if no name supplied');
```

### Configuration Options

```js
program
  .command('install', 'install packages', { hidden: true })
  .command('update', 'update packages', { isDefault: true });
```

### Aliases

```js
program
  .command('list')
  .alias('ls')
  .description('list items');
```

### Command Arguments

#### In Command Definition

```js
program
  .command('clone <source> [destination]')
  .description('clone a repository');
```

#### Using `.argument()`

```js
program
  .version('0.1.0')
  .argument('<username>', 'user to login')
  .argument('[password]', 'password for user, if required', 'no password given')
  .action((username, password) => {
    console.log('username:', username);
    console.log('password:', password);
  });
```

#### Variadic Arguments

```js
program
  .version('0.1.0')
  .command('rmdir')
  .argument('<dirs...>')
  .action(function (dirs) {
    dirs.forEach((dir) => {
      console.log('rmdir %s', dir);
    });
  });
```

#### Multiple Arguments

```js
program
  .arguments('<username> <password>');
```

#### Custom Argument Processing

```js
program
  .command('add')
  .argument('<first>', 'integer argument', myParseInt)
  .argument('[second]', 'integer argument', myParseInt, 1000)
  .action((first, second) => {
    console.log(`${first} + ${second} = ${first + second}`);
  });
```

### Action Handler

The action handler receives parameters for each command-argument, plus options and the command object:

```js
program
  .argument('<name>')
  .option('-t, --title <honorific>', 'title to use before name')
  .option('-d, --debug', 'display some debugging')
  .action((name, options, command) => {
    if (options.debug) {
      console.error('Called %s with options %o', command.name(), options);
    }
    const title = options.title ? `${options.title} ` : '';
    console.log(`Thank-you ${title}${name}`);
  });
```

#### Async Action Handlers

```js
async function run() { /* code goes here */ }

async function main() {
  program
    .command('run')
    .action(run);
  await program.parseAsync(process.argv);
}
```

### Life Cycle Hooks

```js
program
  .option('-t, --trace', 'display trace statements for commands')
  .hook('preAction', (thisCommand, actionCommand) => {
    if (thisCommand.opts().trace) {
      console.log(`About to call action handler for subcommand: ${actionCommand.name()}`);
      console.log('arguments: %O', actionCommand.args);
      console.log('options: %o', actionCommand.opts());
    }
  });
```

#### Supported Events

| Event Name | When Hook Called | Callback Parameters |
|------------|------------------|---------------------|
| `preAction`, `postAction` | Before/after action handler for this command and its nested subcommands | `(thisCommand, actionCommand)` |
| `preSubcommand` | Before parsing direct subcommand | `(thisCommand, subcommand)` |

---

## Automated Help

The help information is auto-generated based on the information commander already knows about your program.

### Custom Help

```js
program
  .option('-f, --foo', 'enable some foo');

program.addHelpText('after', `

Example call:
  $ custom-help --help`);
```

#### Help Positions

- `beforeAll`: Global banner or header
- `before`: Extra information before built-in help
- `after`: Extra information after built-in help
- `afterAll`: Global footer (epilog)

### Display Help After Errors

```js
program.showHelpAfterError();
// or
program.showHelpAfterError('(add --help for additional information)');
```

#### Disable Suggestions

```js
program.showSuggestionAfterError(false);
```

### Display Help from Code

- `.help()` - Display help and exit
- `.outputHelp()` - Output help without exiting
- `.helpInformation()` - Get help as string

### Help Configuration

#### Name

```js
program.name('pizza');
const pm = new Command('pm');
```

#### Usage

```js
program
  .name("my-command")
  .usage("[global options] command");
```

#### Description and Summary

```js
program
  .command("duplicate")
  .summary("make a copy")
  .description(`Make a copy of the current project.
This may require additional disk space.
  `);
```

#### Help Option

```js
program
  .helpOption('-e, --HELP', 'read more information');
```

#### Help Command

```js
program.helpCommand('assist [command]', 'show assistance');
```

#### Help Groups

```js
program
  .optionsGroup('Advanced Options:')
  .commandsGroup('Subcommands:');
```

#### More Configuration

```js
program.configureHelp({
  sortSubcommands: true,
  sortOptions: true,
  showGlobalOptions: true,
});
```

---

## Parsing Configuration

### Positional Options

```js
program.enablePositionalOptions();
```

With positional options, `-b` is a program option in the first line and a subcommand option in the second:

```sh
program -b subcommand
program subcommand -b
```

### Pass Through Options

```js
program.passThroughOptions();
```

With pass through options, `--port=80` is a program option in the first line and passed through as a command-argument in the second:

```sh
program --port=80 arg
program arg --port=80
```

### Unknown Options

```js
program.allowUnknownOption();
```

### Excess Arguments

```js
program.allowExcessArguments();
```

### Legacy Options as Properties

```js
program
  .storeOptionsAsProperties()
  .option('-d, --debug')
  .action((commandAndOptions) => {
    if (commandAndOptions.debug) {
      console.error(`Called ${commandAndOptions.name()}`);
    }
  });
```

---

## TypeScript Support

### Extra Typings

```js
import { Command } from '@commander-js/extra-typings';
const program = new Command();
```

### ts-node with Stand-alone Executables

```sh
node -r ts-node/register pm.ts
```

---

## Error Handling

### Display Error

```js
program.error('Password must be longer than four characters');
program.error('Custom processing has failed', { exitCode: 2, code: 'my.custom.error' });
```

### Override Exit and Output Handling

```js
program.exitOverride();

try {
  program.parse(process.argv);
} catch (err) {
  // custom processing...
}
```

### Configure Output

```js
function errorColor(str) {
  // Add ANSI escape codes to display text in red.
  return `\x1b[31m${str}\x1b[0m`;
}

program
  .configureOutput({
    writeOut: (str) => process.stdout.write(`[OUT] ${str}`),
    writeErr: (str) => process.stdout.write(`[ERR] ${str}`),
    outputError: (str, write) => write(errorColor(str))
  });
```

---

## Additional Methods

### Parse Methods

```js
program.parse(); // parse process.argv
program.parse(process.argv); // parse specific arguments
program.parse(['--port', '80'], { from: 'user' }); // just user arguments
```

Use `.parseAsync()` for async action handlers.

### Option Value Methods

- `.opts()` - Returns merged local and global option values
- `.optsWithGlobals()` - Returns merged local and global option values
- `.getOptionValue()` - Get single option value
- `.setOptionValue()` - Set single option value
- `.getOptionValueSource()` - Get option value source
- `.setOptionValueWithSource()` - Set option value with source

### Command Methods

- `.name()` - Set command name
- `.description()` - Set command description
- `.summary()` - Set command summary
- `.usage()` - Set usage string
- `.version()` - Set version
- `.alias()` - Add command alias
- `.addCommand()` - Add subcommand
- `.addOption()` - Add option
- `.addArgument()` - Add argument
- `.addHelpText()` - Add help text
- `.helpOption()` - Configure help option
- `.helpCommand()` - Configure help command
- `.configureHelp()` - Configure help system
- `.configureOutput()` - Configure output
- `.exitOverride()` - Override exit handling
- `.showHelpAfterError()` - Show help after errors
- `.showSuggestionAfterError()` - Show suggestions after errors
- `.allowUnknownOption()` - Allow unknown options
- `.allowExcessArguments()` - Allow excess arguments
- `.enablePositionalOptions()` - Enable positional options
- `.passThroughOptions()` - Enable pass-through options
- `.storeOptionsAsProperties()` - Store options as properties
- `.hook()` - Add life cycle hook
- `.on()` - Add event listener

### Factory Functions

```js
const { createCommand } = require('commander');
const program = createCommand();
```

---

## Node Options

### Harmony Option

```js
// Use #! /usr/bin/env node --harmony in subcommand scripts
// Or use: node --harmony examples/pm publish
```

### Debugging Stand-alone Executables

```js
// Use node --inspect for debugging
// VSCode: Set "autoAttachChildProcesses": true in launch.json
```

### npm run-script

```sh
npm run-script <command> [-- <args>]
```

---

## Support

- Current version requires Node.js v20+
- Main forum: [GitHub Issues](https://github.com/tj/commander.js/issues)
- Commander for enterprise: [Tidelift Subscription](https://tidelift.com/subscription/pkg/npm-commander)
