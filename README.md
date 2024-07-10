# Lucra Backend Take-Home Test

## Your Challenge

We want you to build a brand new backend service to support the classic game [Minesweeper](<https://en.wikipedia.org/wiki/Minesweeper_(video_game)>) (Google provides a [free to play option here](https://www.google.com/search?q=minesweeper+online+free) if you've never played it).

We've setup this repository with a ready-made [NestJS](https://nestjs.com/) app that inlcudes a docker-compose file for a local Postgres database and TypeORM to interact with said database.

## What We're Looking For

### High level

We're not looking to be overly prescriptive in your approach. Things like validation, testing, optimizations are completely up to you.

### Specifics

- Clone/Fork this repo to get started
- Add endpoints to do the following:
  - Create a new game via `POST /games`
    - User's should be able to specify the grid size via `rows` and `columns` inputs
    - This should create:
      - A new item in the `games` table
      - All the `game_cells` requested by the user (note: a random amount of cells need to be mines)
      - EXTRA CREDIT: Implement the logic to populate `game_cells.bombsInVicinity`
  - Get a list of games via `GET /games`
    - Inputs, validation, and response design is up to you
- Include a write up in `IMPLEMENTATION_NOTES.md` file at root of the project describing the what/why/how of your implementation. We want to know why you used certain libraries/techniques as well as what trade-offs you made etc.

## Getting started

We have provided a few convenient scripts to get you up and running fast

### Running the application

1. Once you've cloned your forked repo to your computer run `yarn install`
2. To start the application you can use `yarn start:dev`. This will "watch" your changes to aid in fast developement interation. It will also start the docker container and create/up the database volume.

### Database scripts

- You can use `yarn db:start` and `yarn db:stop` to bring up or down the database.
- You can also completely reset your database with `yarn db:reset` (helpful while implementing your data model changes)
