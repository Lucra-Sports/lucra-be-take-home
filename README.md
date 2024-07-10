# Lucra Backend Take Home Test

## Your Challenge

We want you to build a brand new backend service to support the classic game [Minesweeper](https://en.wikipedia.org/wiki/Minesweeper_(video_game)) (Google provides a [free to play option here](https://www.google.com/search?q=minesweeper+online+free) if you've never played it).

We've setup this repository with a ready-made [NestJS](https://nestjs.com/) app that inlcudes a docker-compose file for a local Postgres database and TypeORM to interact with said database.

## What We're Looking For

- Fork this repo in your own GitHub account and make it public when you're finished
- Add the necessary database tables to support your vision (the synchronize flag in the TypeORM config will automatically create these tables for you)
- Add endpoints to do the following:
  - Create a new game
  - Get the details of any game
  - Update any square with the following actions:
    - Reveal
    - Flag
- Include write up in `IMPLEMENTATION_NOTES.md` file at root of the project describing what/why/how of your implementation

The instructions and requirements are intentionally vague. We want you to build your vision of the applicaiton with whatever structure, validation, testing, etc. you desire so we can get a sense of your technical chops and implementation style.

## Getting started

We have provided a few convenience scripts to get you up and running fast

### Running the application

1. Once you've cloned your forked repo to your computer run `yarn install`
2. To start the application you can use `yarn start:dev`. This will "watch" your changes to aid in fast developement interation. It will also start the docker container and volume for the database.

### Database scripts

- You can use `yarn db:start` and `yarn db:stop` to bring up or down the database.
- You can also completely reset your database with `yarn db:reset`
