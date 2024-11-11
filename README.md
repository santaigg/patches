# Patches Santai GG Discord Bot

> A Discord bot for the Patches Santai GG community, built with discord.js v14.16.3

## About

The official Discord bot from SantaiGG.

## Setup

1. Clone the repository
2. Install [Bun](https://bun.sh) if you haven't already
3. Run `bun install` to install dependencies
4. Copy `.env.example` to `.env` and fill in the values
5. Run `bun dev` to start the bot in development mode
6. Run `bun build` to build the bot
7. Run `bun start` to start the bot in production mode

## Development Guide

### Adding Slash Commands

1. Create a `.ts` file in `src/commands/slash` with the same name as the command (in the relative subfolder if in a category)

The command will be automatically registered when the bot starts.

### Creating a Command File

Commands are created using TypeScript. Each command file must export the following object:

```ts
import { SlashCommand, SlashCommandConfig } from '@/types/command';

const config: SlashCommandConfig = {
  ...
};

const command: SlashCommand = {
  ...
};

export default { command, config };
```

> [!NOTE]
> You can see all the types definition in `src/types/command.ts`.

#### SlashCommandConfig

The `config` of the command contains all the information about the command that will be loaded.

| Property    | Type             | Required | Description                                                           |
| ----------- | ---------------- | -------- | --------------------------------------------------------------------- |
| name        | `string`         | No       | The name of the command. If not defined, the filename is used instead |
| description | `string`         | Yes      | The description of the command.                                       |
| usage       | `string`         | No       | The usage of the command.                                             |
| category    | `string`         | No       | The category of the command.                                          |
| nsfw        | `boolean`        | No       | Whether this command is NSFW or not (Default: false).                 |
| options     | `Array<Options>` | No       | The list of options for this command. (see [](/#options))             |

> [!IMPORTANT]
> The `fileName` property is automatically added to the config object, DO NOT add it manually.

#### SlashCommand

The `command` object contains the function that will be executed when the command is called.
It also contains the `permissions` for the command. (see [Permissions Guide](https://discordjs.guide/popular-topics/permissions.html#permissions))

#### Options

The list of options for this command.

| Property    | Type             | Required | Description                                               | Valid in Types                |
| ----------- | ---------------- | -------- | --------------------------------------------------------- | ----------------------------- |
| name        | `string`         | Yes      | The name of the option.                                   | All                           |
| description | `string`         | Yes      | The description of the option.                            | All                           |
| type        | `string`         | Yes      | The type of the option. See [Option Types](#option-types) | All                           |
| required    | `boolean`        | No       | Whether this option is required or not (Default: false).  | All                           |
| choices     | `Array<Choices>` | No       | The list of choices for this option.                      | `INTEGER \| NUMBER \| STRING` |
| minValue    | `number`         | No       | The minimum value of the option.                          | `INTEGER \| NUMBER`           |
| maxValue    | `number`         | No       | The maximum value of the option.                          | `INTEGER \| NUMBER`           |

##### Choice Properties

The properties of each choice within the `choices` array.

| Property | Type               | Description                                                                         |
| -------- | ------------------ | ----------------------------------------------------------------------------------- |
| name     | `string`           | The name of the choice.                                                             |
| value    | `string \| number` | The value of the choice (the available value is based on the off the option value). |

#### Option Types

For further information on option types, see the [Discord documentation](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type).

| Type          | Description                      |
| ------------- | -------------------------------- |
| `STRING`      | Represents a string value.       |
| `BOOLEAN`     | Represents a boolean value.      |
| `NUMBER`      | Represents a numeric value.      |
| `INTEGER`     | Represents an integer value.     |
| `ROLE`        | Represents a role.               |
| `USER`        | Represents a user.               |
| `CHANNEL`     | Represents a channel.            |
| `MENTIONABLE` | Represents a mentionable entity. |
| `ATTACHMENT`  | Represents an attachment.        |

### Events

Events are automatically registered when the bot starts. To add an event, create a file in `src/events/<event_source>` with the name of the event and export default the event function.

| Event Source | Description                                   |
| ------------ | --------------------------------------------- |
| `client`     | Events emitted by the client (e.g. ready)     |
| `guild`      | Events emitted by a guild (e.g. interactions) |

See the [DiscordJS documentation](https://old.discordjs.dev/#/docs/discord.js/main/typedef/Events) for a list of events.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.