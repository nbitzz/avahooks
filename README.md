# avahooks

Webhook endpoints to bind to ava for platforms that do not support libravatar / do not have it enabled / etc.
All settings for endpoints are configured in query parameters.

## Endpoints

### `/bluesky`

- `pds` (optional): Bluesky PDS. Include protocol.
- `identifier`: Bluesky handle
- `password`: Bluesky password - create an app password in settings

### `/gravatar`

- `cookie`: Your `gravatar` cookie.
- `email` (optional): Email to set the profile picture for.

### `/misskey`

- `instance`: Link to your Misskey instance. Include protocol.
- `apiKey`: Misskey API key.

