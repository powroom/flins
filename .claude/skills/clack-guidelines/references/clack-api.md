# Clack API Reference

Comprehensive API documentation for Clack, organized by prompt type with code examples.

## Table of Contents

- [Installation and Setup](#installation-and-setup)
- [Text Input Prompts](#text-input-prompts)
  - [text()](#text)
  - [password()](#password)
- [Selection Prompts](#selection-prompts)
  - [select()](#select)
  - [multiselect()](#multiselect)
  - [groupMultiselect()](#groupmultiselect)
- [Autocomplete Prompts](#autocomplete-prompts)
  - [autocomplete()](#autocomplete)
  - [autocompleteMultiselect()](#autocompletemultiselect)
- [Confirmation Prompts](#confirmation-prompts)
  - [confirm()](#confirm)
- [Path Selection](#path-selection)
  - [path()](#path)
- [Key-Based Selection](#key-based-selection)
  - [selectKey()](#selectkey)
- [Progress and Loading Indicators](#progress-and-loading-indicators)
  - [progress()](#progress)
  - [spinner()](#spinner)
  - [taskLog()](#tasklog)
- [Streaming Output](#streaming-output)
  - [stream()](#stream)
- [Logging and Messages](#logging-and-messages)
  - [log()](#log)
- [Grouped Prompts](#grouped-prompts)
  - [group()](#group)
  - [tasks()](#tasks)
- [UI Framework](#ui-framework)
  - [intro()](#intro)
  - [outro()](#outro)
  - [note()](#note)
  - [cancel()](#cancel)
- [Utilities](#utilities)
  - [isCancel()](#iscancel)
  - [block()](#block)
  - [updateSettings()](#updatesettings)
- [Core Primitives (@clack/core)](#core-primitives-clackcore)
  - [TextPrompt](#textprompt)
  - [Event System](#event-system)
- [TypeScript Support](#typescript-support)

---

## Installation and Setup

### Installation

```bash
npm install @clack/prompts
```

### Basic Usage

```javascript
import * as p from "@clack/prompts";

const result = await p.text({
  message: "Enter your name",
});

console.log(result);
```

### ES Module vs CommonJS

```javascript
// ES Module (.mjs or .js with "type": "module")
import { text } from "@clack/prompts";

// CommonJS (.cjs or .js)
const { text } = require("@clack/prompts");
```

---

## Text Input Prompts

### text()

Single-line text input with validation, placeholders, and default values.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `message` | `string` | Prompt message displayed to user | Required |
| `placeholder` | `string` | Placeholder text shown when input is empty | `""` |
| `initialValue` | `string` | Initial value for the input | `""` |
| `defaultValue` | `string` | Default value if user submits empty | `""` |
| `validate` | `(value: string) => string \| undefined` | Validation function | `undefined` |
| `required` | `boolean` | Whether input is required | `false` |

#### Example

```javascript
import { text } from "@clack/prompts";

const name = await text({
  message: "What is your name?",
  placeholder: "John Doe",
  initialValue: "Jane",
  validate: (value) => {
    if (!value) return "Name is required";
    if (value.length < 2) return "Name must be at least 2 characters";
  },
});
```

#### Return Value

Returns `string` on success, or `Symbol` (cancel symbol) if user cancels.

---

### password()

Secure password input with masking.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `message` | `string` | Prompt message displayed to user | Required |
| `mask` | `string` | Character to display for each character typed | `"•"` |
| `placeholder` | `string` | Placeholder text shown when input is empty | `""` |
| `initialValue` | `string` | Initial value for the input | `""` |
| `validate` | `(value: string) => string \| undefined` | Validation function | `undefined` |

#### Example

```javascript
import { password } from "@clack/prompts";

const userPassword = await password({
  message: "Provide a password",
  mask: "•",
  validate: (value) => {
    if (!value) return "Please enter a password.";
    if (value.length < 8) return "Password should have at least 8 characters.";
    if (!/[A-Z]/.test(value)) return "Password must contain uppercase letters.";
  },
});
```

#### Return Value

Returns `string` on success, or `Symbol` (cancel symbol) if user cancels.

---

## Selection Prompts

### select()

Single selection from a scrollable list.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `message` | `string` | Prompt message displayed to user | Required |
| `options` | `Option[]` | Array of options to select from | Required |
| `initialValue` | `string` | Initial selected value | First option |
| `maxItems` | `number` | Maximum items to display before scrolling | `10` |

#### Option Type

```typescript
interface Option {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}
```

#### Example

```javascript
import { select } from "@clack/prompts";

const projectType = await select({
  message: "Pick a project type",
  initialValue: "ts",
  maxItems: 5,
  options: [
    { value: "ts", label: "TypeScript" },
    { value: "js", label: "JavaScript" },
    { value: "rust", label: "Rust", hint: "High performance" },
    { value: "go", label: "Go" },
    { value: "python", label: "Python" },
    { value: "coffee", label: "CoffeeScript", hint: "oh no", disabled: true },
  ],
});
```

#### Return Value

Returns the `value` of the selected option on success, or `Symbol` (cancel symbol) if user cancels.

---

### multiselect()

Select multiple options from a list.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `message` | `string` | Prompt message displayed to user | Required |
| `options` | `Option[]` | Array of options to select from | Required |
| `initialValues` | `string[]` | Array of initially selected values | `[]` |
| `required` | `boolean` | Whether at least one option must be selected | `false` |
| `maxItems` | `number` | Maximum items to display before scrolling | `10` |

#### Example

```javascript
import { multiselect } from "@clack/prompts";

const tools = await multiselect({
  message: "Select additional tools",
  initialValues: ["prettier", "eslint"],
  required: true,
  options: [
    { value: "prettier", label: "Prettier", hint: "recommended" },
    { value: "eslint", label: "ESLint", hint: "recommended" },
    { value: "stylelint", label: "Stylelint" },
    { value: "gh-action", label: "GitHub Action" },
  ],
});
```

#### Return Value

Returns `string[]` (array of selected values) on success, or `Symbol` (cancel symbol) if user cancels.

---

### groupMultiselect()

Multi-select with grouped options and group-level selection.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `message` | `string` | Prompt message displayed to user | Required |
| `options` | `Record<string, Option[]>` | Object with group names as keys | Required |
| `required` | `boolean` | Whether at least one option must be selected | `false` |
| `selectableGroups` | `boolean` | Whether groups can be selected as a whole | `false` |

#### Example

```javascript
import { groupMultiselect } from "@clack/prompts";

const packages = await groupMultiselect({
  message: "Select packages to publish",
  required: true,
  selectableGroups: true,
  options: {
    "Core Packages": [
      { value: "@myorg/core", label: "Core" },
      { value: "@myorg/utils", label: "Utils" },
    ],
    "UI Packages": [
      { value: "@myorg/ui", label: "UI Components" },
      { value: "@myorg/theme", label: "Theme System" },
    ],
    "Build Tools": [{ value: "@myorg/build", label: "Build System" }],
  },
});
```

#### Return Value

Returns `string[]` (array of selected values) on success, or `Symbol` (cancel symbol) if user cancels.

---

## Autocomplete Prompts

### autocomplete()

Type-ahead search with real-time filtering for single selection.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `message` | `string` | Prompt message displayed to user | Required |
| `options` | `Option[]` | Array of options to select from | Required |
| `placeholder` | `string` | Placeholder text shown in input | `""` |
| `initialValue` | `string` | Initial selected value | First option |
| `initialUserInput` | `string` | Initial user input to filter with | `""` |
| `maxItems` | `number` | Maximum items to display | `10` |
| `required` | `boolean` | Whether selection is required | `false` |

#### Example

```javascript
import { autocomplete } from "@clack/prompts";

const country = await autocomplete({
  message: "Select a country",
  options: [
    { value: "us", label: "United States", hint: "NA" },
    { value: "ca", label: "Canada", hint: "NA" },
    { value: "uk", label: "United Kingdom", hint: "EU" },
    { value: "fr", label: "France", hint: "EU" },
    { value: "de", label: "Germany", hint: "EU" },
    { value: "jp", label: "Japan", hint: "AS" },
    { value: "cn", label: "China", hint: "AS" },
  ],
  placeholder: "Type to search countries...",
  maxItems: 8,
  initialValue: "us",
  initialUserInput: "United",
});
```

#### Return Value

Returns the `value` of the selected option on success, or `Symbol` (cancel symbol) if user cancels.

---

### autocompleteMultiselect()

Type-ahead search with multi-selection in a unified interface.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `message` | `string` | Prompt message displayed to user | Required |
| `options` | `Option[]` | Array of options to select from | Required |
| `placeholder` | `string` | Placeholder text shown in input | `""` |
| `initialValues` | `string[]` | Array of initially selected values | `[]` |
| `initialUserInput` | `string` | Initial user input to filter with | `""` |
| `maxItems` | `number` | Maximum items to display | `10` |
| `required` | `boolean` | Whether at least one option must be selected | `false` |

#### Example

```javascript
import { autocompleteMultiselect } from "@clack/prompts";

const frameworks = await autocompleteMultiselect({
  message: "Select frameworks (type to filter)",
  options: [
    { value: "react", label: "React", hint: "Frontend/UI" },
    { value: "vue", label: "Vue.js", hint: "Frontend/UI" },
    { value: "angular", label: "Angular", hint: "Frontend/UI" },
    { value: "svelte", label: "Svelte", hint: "Frontend/UI" },
    { value: "nextjs", label: "Next.js", hint: "React Framework" },
    { value: "nuxt", label: "Nuxt.js", hint: "Vue Framework" },
    { value: "express", label: "Express", hint: "Node.js Backend" },
    { value: "nestjs", label: "NestJS", hint: "Node.js Backend" },
  ],
  placeholder: "Type to filter...",
  maxItems: 8,
  initialValues: ["react", "nextjs"],
  required: true,
});
```

#### Return Value

Returns `string[]` (array of selected values) on success, or `Symbol` (cancel symbol) if user cancels.

---

## Confirmation Prompts

### confirm()

Binary yes/no choice with customizable labels.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `message` | `string` | Prompt message displayed to user | Required |
| `active` | `string` | Label for "yes" option | `"Yes"` |
| `inactive` | `string` | Label for "no" option | `"No"` |
| `initialValue` | `boolean` | Initial selected value | `false` |

#### Example

```javascript
import { confirm } from "@clack/prompts";

const shouldInstallDeps = await confirm({
  message: "Install dependencies?",
  active: "Yes, please",
  inactive: "No, skip",
  initialValue: false,
});
```

#### Return Value

Returns `boolean` (`true` for yes, `false` for no) on success, or `Symbol` (cancel symbol) if user cancels.

---

## Path Selection

### path()

File system path selection with intelligent autocomplete.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `message` | `string` | Prompt message displayed to user | Required |
| `initialValue` | `string` | Initial path value | `"./"` |
| `root` | `string` | Root directory for navigation | `process.cwd()` |
| `directory` | `boolean` | Only allow directory selection | `false` |
| `validate` | `(value: string) => string \| undefined` | Validation function | `undefined` |

#### Example

```javascript
import { path } from "@clack/prompts";
import { existsSync } from "node:fs";

const filePath = await path({
  message: "Select a file to process",
  initialValue: "./src",
  root: process.cwd(),
  directory: false,
  validate: (value) => {
    if (!value) return "Please select a path";
    if (!existsSync(value)) return "Path does not exist";
  },
});
```

#### Return Value

Returns `string` (selected path) on success, or `Symbol` (cancel symbol) if user cancels.

---

## Key-Based Selection

### selectKey()

Quick single-key selection for fast user interaction.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `message` | `string` | Prompt message displayed to user | Required |
| `options` | `Option[]` | Array of options to select from | Required |

#### Option Type

```typescript
interface Option {
  value: string;  // Single character key
  label: string;
}
```

#### Example

```javascript
import { selectKey } from "@clack/prompts";

const action = await selectKey({
  message: "What would you like to do?",
  options: [
    { value: "c", label: "Create new project" },
    { value: "i", label: "Install dependencies" },
    { value: "b", label: "Build project" },
    { value: "q", label: "Quit" },
  ],
});

// User presses 'c', 'i', 'b', or 'q' for instant selection
console.log(`Action: ${action}`);
```

#### Return Value

Returns the `value` (single character) of the selected option on success, or `Symbol` (cancel symbol) if user cancels.

---

## Progress and Loading Indicators

### progress()

Visual progress indicator with multiple styles for long-running operations.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `style` | `"light" \| "heavy" \| "block"` | Visual style of the progress bar | `"light"` |
| `max` | `number` | Maximum value for progress | `100` |
| `size` | `number` | Width in characters | `40` |
| `indicator` | `"spinner" \| "timer"` | Type of indicator to show | `"spinner"` |

#### Methods

- `start(message: string)` - Start the progress bar
- `advance(step: number)` - Advance progress by step
- `message(message: string)` - Update the message
- `stop(message: string)` - Stop with success message
- `error(message: string)` - Stop with error message
- `cancel(message: string)` - Cancel the operation

#### Example

```javascript
import { progress } from "@clack/prompts";
import { setTimeout } from "node:timers/promises";

const downloadProgress = progress({
  style: "block",
  max: 100,
  size: 40,
});

downloadProgress.start("Downloading packages");

for (let i = 0; i < 100; i += 10) {
  await setTimeout(500);
  downloadProgress.advance(10);
  downloadProgress.message(`Downloaded ${i + 10}%`);
}

downloadProgress.stop("Download complete!");

// Progress bar with timer
const buildProgress = progress({
  style: "heavy",
  max: 50,
  size: 30,
  indicator: "timer",
});

buildProgress.start("Building project");
// ... perform build tasks ...
buildProgress.advance(50);
buildProgress.stop("Build complete");
// Output: "Build complete [1m 23s]"
```

#### Return Value

Returns an object with the methods listed above.

---

### spinner()

Display progress for long-running operations with dynamic messages.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `indicator` | `"spinner" \| "timer"` | Type of indicator to show | `"spinner"` |

#### Methods

- `start(message: string)` - Start the spinner
- `message(message: string)` - Update the message
- `stop(message: string)` - Stop with success message
- `error(message: string)` - Stop with error message
- `cancel(message: string)` - Cancel the operation
- `clear()` - Clear spinner without message

#### Example

```javascript
import { spinner } from "@clack/prompts";
import { setTimeout } from "node:timers/promises";

const s = spinner();

s.start("Installing packages via pnpm");
await setTimeout(2000);

s.message("Downloading dependencies");
await setTimeout(1500);

s.message("Building packages");
await setTimeout(1000);

s.stop("Installation complete!");

// Handle errors
// s.error('Installation failed!');

// Cancel operation
// s.cancel('Installation cancelled');

// Clear spinner without message
// s.clear();
```

#### Return Value

Returns an object with the methods listed above.

---

### taskLog()

Display streaming output that clears on success and persists on error.

#### Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `title` | `string` | Title of the task | Required |
| `limit` | `number` | Show last N lines only | `10` |
| `retainLog` | `boolean` | Keep full log history | `true` |
| `spacing` | `number` | Line spacing | `1` |

#### Methods

- `message(message: string, options?: { raw: boolean })` - Add a message
- `success(message: string)` - Mark as successful
- `error(message: string, options?: { showLog: boolean })` - Mark as failed
- `group(title: string)` - Create a grouped log

#### Example

```javascript
import { taskLog } from "@clack/prompts";
import { spawn } from "node:child_process";

const log = taskLog({
  title: "Running npm install",
  limit: 10,
  retainLog: true,
  spacing: 1,
});

// Stream command output
const npmInstall = spawn("npm", ["install"]);

npmInstall.stdout.on("data", (data) => {
  log.message(data.toString(), { raw: true });
});

npmInstall.stderr.on("data", (data) => {
  log.message(data.toString(), { raw: true });
});

npmInstall.on("close", (code) => {
  if (code === 0) {
    log.success("Installation complete!");
  } else {
    log.error("Installation failed!", { showLog: true });
  }
});

// Group messages under headers
const group = log.group("Dependencies");
group.message("Installing react...");
group.message("Installing vue...");
group.success("All dependencies installed");
```

#### Return Value

Returns an object with the methods listed above.

---

## Streaming Output

### stream()

Stream dynamic content from async iterables, perfect for AI responses.

#### Methods

- `step(asyncIterable)` - Stream content from async iterable
- `info(asyncIterable)` - Stream info content

#### Example

```javascript
import { stream } from "@clack/prompts";
import { setTimeout } from "node:timers/promises";

// Streaming from async generator
await stream.step(
  (async function* () {
    const words = "Building your application with modern tools and best practices".split(" ");
    for (const word of words) {
      yield word;
      yield " ";
      await setTimeout(100);
    }
  })(),
);

// Streaming AI response
async function* callAI(prompt) {
  const response = await fetch("https://api.example.com/generate", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}

await stream.info(callAI("Explain TypeScript benefits"));
```

#### Return Value

Returns a Promise that resolves when streaming is complete.

---

## Logging and Messages

### log()

Display formatted status messages with different severity levels.

#### Methods

- `info(message: string)` - Informational message
- `step(message: string)` - Step message
- `success(message: string)` - Success message
- `warn(message: string)` - Warning message
- `error(message: string)` - Error message
- `message(message: string, options?: { symbol: string })` - Custom message

#### Example

```javascript
import { log } from "@clack/prompts";
import color from "picocolors";

log.info("Starting build process...");
log.step("Compiling TypeScript");
log.success("Build completed successfully!");
log.warn("Some dependencies are outdated");
log.error("Failed to connect to database");

// Custom symbol
log.message("Custom message", {
  symbol: color.cyan("→"),
});
```

---

## Grouped Prompts

### group()

Execute multiple prompts in sequence with shared state.

#### Parameters

1. `prompts: Record<string, (context: { results: Record<string, any> }) => Promise<any>>` - Object of prompt functions
2. `options?: { onCancel: () => void }` - Configuration options

#### Example

```javascript
import * as p from "@clack/prompts";
import color from "picocolors";

p.intro(color.bgCyan(color.black(" create-app ")));

const project = await p.group(
  {
    path: () =>
      p.text({
        message: "Where should we create your project?",
        placeholder: "./sparkling-solid",
        validate: (value) => {
          if (!value) return "Please enter a path.";
          if (value[0] !== ".") return "Please enter a relative path.";
        },
      }),

    type: ({ results }) =>
      p.select({
        message: `Pick a project type within "${results.path}"`,
        initialValue: "ts",
        options: [
          { value: "ts", label: "TypeScript" },
          { value: "js", label: "JavaScript" },
          { value: "rust", label: "Rust" },
        ],
      }),

    tools: () =>
      p.multiselect({
        message: "Select additional tools",
        options: [
          { value: "prettier", label: "Prettier", hint: "recommended" },
          { value: "eslint", label: "ESLint", hint: "recommended" },
        ],
      }),

    install: () =>
      p.confirm({
        message: "Install dependencies?",
        initialValue: true,
      }),
  },
  {
    onCancel: () => {
      p.cancel("Operation cancelled.");
      process.exit(0);
    },
  },
);

console.log(project.path, project.type, project.tools, project.install);
// All results available in typed object
```

#### Return Value

Returns an object with all prompt results keyed by their names.

---

### tasks()

Run multiple tasks with automatic spinner management and progress tracking.

#### Parameters

1. `tasks: Task[]` - Array of task objects

#### Task Type

```typescript
interface Task {
  title: string;
  task: (message: (msg: string) => void) => Promise<string | void>;
  enabled?: boolean;
}
```

#### Example

```javascript
import * as p from "@clack/prompts";
import { setTimeout } from "node:timers/promises";

await p.tasks([
  {
    title: "Installing dependencies",
    task: async (message) => {
      message("Downloading packages");
      await setTimeout(1000);
      message("Building native modules");
      await setTimeout(500);
      return "Installed 127 packages";
    },
  },
  {
    title: "Running linter",
    task: async () => {
      // Run linter
      return "No issues found";
    },
    enabled: process.env.SKIP_TESTS !== "true",
  },
]);
```

#### Return Value

Returns a Promise that resolves when all tasks are complete.

---

## UI Framework

### intro()

Display a header at the start of the CLI session.

#### Parameters

1. `message: string` - The header message

#### Example

```javascript
import { intro } from "@clack/prompts";
import color from "picocolors";

intro(color.bgCyan(color.black(" my-cli-tool v2.0.0 ")));
```

---

### outro()

Display a footer at the end of the CLI session.

#### Parameters

1. `message: string` - The footer message

#### Example

```javascript
import { outro } from "@clack/prompts";
import color from "picocolors";

outro(
  `Problems? ${color.underline(color.cyan("https://github.com/myorg/myproject/issues"))}`,
);
```

---

### note()

Display a formatted note with a title.

#### Parameters

1. `message: string` - The note content
2. `title: string` - The note title

#### Example

```javascript
import { note } from "@clack/prompts";

note("cd my-project\nnpm install\nnpm run dev", "Next steps");
```

---

### cancel()

Display a cancellation message and exit.

#### Parameters

1. `message: string` - The cancellation message

#### Example

```javascript
import { cancel } from "@clack/prompts";

cancel("Operation cancelled.");
process.exit(0);
```

---

## Utilities

### isCancel()

Check if a value is the cancel symbol.

#### Parameters

1. `value: any` - The value to check

#### Example

```javascript
import { text, isCancel, cancel } from "@clack/prompts";

const name = await text({ message: "Enter your name" });

if (isCancel(name)) {
  cancel("Operation cancelled.");
  process.exit(0);
}

console.log(`Hello, ${name}!`);
```

#### Return Value

Returns `boolean` indicating if the value is the cancel symbol.

---

### block()

Prevent input in non-TTY environments (like CI).

#### Example

```javascript
import { block } from "@clack/prompts";

// block() utility prevents input in non-TTY environments
const unblock = block();
// Perform operations
unblock();
```

#### Return Value

Returns an `unblock` function to restore normal behavior.

---

### updateSettings()

Configure global settings for all prompts.

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `aliases` | `Record<string, string>` | Key bindings for navigation |

#### Example

```javascript
import { updateSettings } from "@clack/prompts";

// Enable WASD navigation
updateSettings({
  aliases: {
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  },
});

// Now prompts support WASD in addition to arrow keys
// Default includes vim keys (k, j, h, l) and escape for cancel
```

---

## Core Primitives (@clack/core)

The `@clack/core` package provides low-level, unstyled primitives for maximum customization.

### TextPrompt

Base class for text input prompts.

#### Options

```javascript
import { TextPrompt } from "@clack/core";
import color from "picocolors";

const customPrompt = new TextPrompt({
  validate: (value) => (value.length < 3 ? "Too short!" : undefined),
  render() {
    const title = `>>> ${color.bold("Enter your name")}:`;
    const input = this.valueWithCursor || color.dim("(empty)");

    switch (this.state) {
      case "error":
        return `${title}\n${color.red(input)}\n${color.red(this.error)}`;
      case "submit":
        return `${title} ${color.green(this.value)}`;
      case "cancel":
        return `${title} ${color.strikethrough(this.value)}`;
      default:
        return `${title}\n${color.cyan(input)}`;
    }
  },
});

const result = await customPrompt.prompt();
console.log(`Result: ${result}`);
```

#### Properties

- `this.value` - Current input value
- `this.valueWithCursor` - Value with cursor indicator
- `this.state` - Current state: "active", "error", "submit", "cancel"
- `this.error` - Current error message

#### Methods

- `prompt()` - Start the prompt and return a Promise

---

### Event System

Subscribe to prompt events for advanced interactions.

#### Example

```javascript
import { TextPrompt } from "@clack/core";

const prompt = new TextPrompt({
  render() {
    return `Input: ${this.valueWithCursor}`;
  },
});

// Listen to events
prompt.on("value", (value) => {
  console.log(`Current value: ${value}`);
});

prompt.on("submit", () => {
  console.log("User submitted the form");
});

prompt.on("cancel", () => {
  console.log("User cancelled");
});

const result = await prompt.prompt();
```

#### Supported Events

| Event | When Called | Parameters |
|-------|-------------|------------|
| `value` | When input value changes | `(value: string)` |
| `submit` | When user submits | `()` |
| `cancel` | When user cancels | `()` |

---

## TypeScript Support

Clack provides full TypeScript support out of the box.

### Type Safety

```typescript
import { text, select, autocomplete } from "@clack/prompts";

// All prompts are fully typed
const name = await text({
  message: "Enter your name",
});

const framework = await select({
  message: "Choose framework",
  options: [
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
  ],
});

const country = await autocomplete({
  message: "Select country",
  options: [
    { value: "us", label: "United States" },
    { value: "ca", label: "Canada" },
  ],
});
```

### Type Guards

```typescript
import { isCancel } from "@clack/prompts";

const result = await text({ message: "Enter value" });

if (isCancel(result)) {
  // TypeScript knows result is the cancel symbol
  console.log("User cancelled");
} else {
  // TypeScript knows result is string
  console.log(`Value: ${result}`);
}
```

---

## Non-Interactive Mode

Clack automatically detects non-TTY environments (like CI) and uses defaults.

### Default Values

```javascript
import { text, confirm, select } from "@clack/prompts";

// In CI, these will use their default values
const name = await text({
  message: "Project name?",
  defaultValue: "default-project",
});

const useTS = await confirm({
  message: "Use TypeScript?",
  initialValue: true,
});

const framework = await select({
  message: "Choose framework",
  initialValue: "react",
  options: [
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
  ],
});
```

### Blocking Input

```javascript
import { block } from "@clack/prompts";

// Prevent input in non-TTY environments
const unblock = block();
// Perform operations
unblock();
```

---

## Error Handling

### Validation Errors

```javascript
import { text } from "@clack/prompts";

const password = await text({
  message: "Enter password",
  validate: (value) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(value)) return "Password must contain uppercase letter";
  },
});
```

### Cancellation Handling

```javascript
import * as p from "@clack/prompts";

async function setupProject() {
  try {
    const responses = await p.group({
      name: () =>
        p.text({
          message: "Project name?",
          validate: (v) => {
            if (!v) return "Required";
          },
        }),

      confirm: ({ results }) =>
        p.confirm({
          message: `Create "${results.name}"?`,
        }),
    });

    // Check if any step was cancelled
    if (p.isCancel(responses.name) || p.isCancel(responses.confirm)) {
      p.cancel("Setup cancelled");
      return;
    }

    if (!responses.confirm) {
      p.outro("Setup aborted");
      return;
    }

    // Proceed with setup
    p.outro("Project created!");
  } catch (error) {
    p.log.error(`Setup failed: ${error.message}`);
    process.exit(1);
  }
}

setupProject();
```

---

## Performance Considerations

### Diff-Based Rendering

Clack uses intelligent diff-based rendering for performance. Only changed parts of the terminal output are redrawn, minimizing flicker and CPU usage.

### Streaming Support

The streaming API is designed for real-time output from LLMs, shell commands, or any async iterable, with automatic text wrapping and formatting.

### Minimal Dependencies

Clack has minimal external dependencies:
- `picocolors` - ANSI color formatting
- `sisteransi` - ANSI escape sequences

---

## Resources

### Official Documentation

- [Clack GitHub Repository](https://github.com/natemoo-re/clack)
- [npm Package](https://www.npmjs.com/package/@clack/prompts)

### Related Packages

- `@clack/core` - Low-level primitives for custom prompts
- `picocolors` - ANSI color formatting
- `sisteransi` - ANSI escape sequences

### Community

- GitHub Issues - Report bugs and request features
- Discussions - Ask questions and share ideas
