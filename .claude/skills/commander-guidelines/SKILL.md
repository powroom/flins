---
name: commander-guidelines
description: Comprehensive guide for building Node.js command-line interfaces using Commander.js. Use when creating CLI tools with options, commands, subcommands, arguments, and help system customization.
---

# Commander.js Guidelines

## Overview

This skill provides guidance for building Node.js command-line interfaces using Commander.js. It covers common patterns for defining options, commands, arguments, and customizing the help system.

## Quick Start

### Installation

```bash
npm install commander
```

### Basic Program

```js
const { program } = require('commander');

program
  .option('-p, --port <number>', 'server port number')
  .option('-d, --debug', 'output extra debugging')
  .argument('<input>', 'input file to process')
  .action((input, options) => {
    console.log(`Processing ${input} on port ${options.port}`);
    if (options.debug) console.log('Debug mode enabled');
  });

program.parse();
```

### Multi-Command Program

```js
const { Command } = require('commander');
const program = new Command();

program
  .name('my-cli')
  .description('CLI tool for managing tasks')
  .version('1.0.0');

program.command('add')
  .description('Add a new task')
  .argument('<task>', 'task description')
  .action((task) => {
    console.log(`Added task: ${task}`);
  });

program.command('list')
  .description('List all tasks')
  .action(() => {
    console.log('Listing tasks...');
  });

program.parse();
```

## Common Patterns

### Options

#### Boolean Options

```js
program.option('-d, --debug', 'enable debug mode');
// Usage: my-cli --debug
```

#### Value Options

```js
program.option('-p, --port <number>', 'server port');
// Usage: my-cli --port 8080
```

#### Required Options

```js
program.requiredOption('-k, --key <api-key>', 'API key is required');
// Usage: my-cli --key abc123
```

#### Variadic Options

```js
program.option('-f, --files <files...>', 'files to process');
// Usage: my-cli --file file1.txt file2.txt file3.txt
```

#### Negatable Options

```js
program.option('--no-cache', 'disable caching');
// Usage: my-cli --no-cache
```

#### Default Values

```js
program.option('-p, --port <number>', 'server port', 3000);
// Default: 3000 if not specified
```

#### Custom Processing

```js
function parsePort(value) {
  const port = parseInt(value, 10);
  if (isNaN(port)) {
    throw new commander.InvalidArgumentError('Not a number.');
  }
  return port;
}

program.option('-p, --port <number>', 'server port', parsePort);
```

### Commands and Subcommands

#### Action Handler Commands

```js
program.command('clone <source> [destination]')
  .description('clone a repository')
  .action((source, destination) => {
    console.log(`Cloning ${source} to ${destination}`);
  });
```

#### Stand-alone Executable Commands

```js
program.command('install [package-names...]', 'install one or more packages');
program.command('search [query]', 'search with optional query');
```

### Arguments

#### Required Arguments

```js
program.argument('<username>', 'user to login');
```

#### Optional Arguments

```js
program.argument('[password]', 'password for user', 'no password given');
```

#### Variadic Arguments

```js
program.argument('<files...>', 'files to process');
```

#### Multiple Arguments

```js
program.arguments('<username> <password>');
```

### Help System

#### Custom Help Text

```js
program.addHelpText('after', `

Example call:
  $ my-cli --help`);
```

#### Custom Help Option

```js
program.helpOption('-e, --HELP', 'read more information');
```

#### Show Help After Error

```js
program.showHelpAfterError();
// or
program.showHelpAfterError('(add --help for additional information)');
```

### Life Cycle Hooks

```js
program
  .option('-t, --trace', 'display trace statements')
  .hook('preAction', (thisCommand, actionCommand) => {
    if (thisCommand.opts().trace) {
      console.log(`About to call: ${actionCommand.name()}`);
    }
  });
```

## Advanced Features

### Parsing Configuration

```js
// Only look for program options before subcommands
program.enablePositionalOptions();

// Pass options through to another program
program.passThroughOptions();

// Allow unknown options
program.allowUnknownOption();

// Allow excess arguments
program.allowExcessArguments();
```

### Error Handling

```js
// Display custom error
program.error('Password must be longer than four characters');

// Override exit handling
program.exitOverride();

try {
  program.parse(process.argv);
} catch (err) {
  // custom processing
}
```

### TypeScript Support

```js
import { Command } from '@commander-js/extra-typings';
const program = new Command();
```

## Detailed API Reference

For comprehensive API documentation including all options, commands, arguments, help system customization, and advanced features, see the detailed API reference:

**[references/commander-api.md](references/commander-api.md)**

This reference includes:
- Complete option types and configuration
- Command and subcommand patterns
- Argument handling (required, optional, variadic)
- Help system customization
- Life cycle hooks
- TypeScript support
- Advanced parsing configuration
- Error handling patterns
- And more

## Resources

### references/
This skill includes detailed API documentation:

- **commander-api.md** - Comprehensive API reference extracted from Commander.js documentation, organized by topic with code examples for each feature.
