# Contributing to Makima

First off, thank you for considering contributing to Makima! It's people like you that will Makima great.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to [report@raj.how].

## How to Contribute

### Reporting Bugs

1. Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/makima-ai/makima/issues).
2. If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/makima-ai/makima/issues/new). Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

1. Open a new issue with a clear title and detailed description of the proposed enhancement.
2. Include any relevant code examples or documentation updates that would be necessary for the enhancement.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes.
4. Make sure your code lints.
5. Issue that pull request!

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) (v1.1.34 or later)
- Docker
- Git

### Installation

1. Clone the repository:

```bash
   git clone https://github.com/makima-ai/makima.git
   cd makima
```

2. Install dependencies:

```shellscript
bun install
```

3. Set up your environment:

1. Copy `.env.example` to `.env` and fill in your configuration details:

```shellscript
cp .env.example .env
```

2. Open `.env` in your favorite text editor and update the necessary values.

3. Start the development PostgreSQL server:

```shellscript
docker compose -f dev-docker-compose.yml up -d
```

5. Update the database schema:

```shellscript
bunx drizzle-kit push
```

### Running the Server

Start the server with:

```shellscript
bun run index.ts
```

### Running Tests

To run the test suite:

```shellscript
bun test
```

## Coding Standards

- We use ESLint for linting. Make sure your code passes all linting checks.
- Write clear, readable, and well-documented code.
- Follow the existing code style and patterns in the project.

## Commit Guidelines

- Use clear and meaningful commit messages.
- For commit message format, we follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- Use feature branches for your work, with the format: `feature/your-feature-name` or `fix/your-fix-name`.

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md or relevant documentation with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3. Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/).
4. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

## Community

Join our [Discord server](https://discord.gg/example) to chat with other contributors and get help.

If you have any questions or need further clarification, feel free to reach out to the maintainers or open an issue for discussion.

Thank you for your contributions to Makima!
