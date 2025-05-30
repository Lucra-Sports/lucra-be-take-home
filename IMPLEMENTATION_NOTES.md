## Folder Structure

Module-based vs Type-based.  I'm comfortable with either.  Module-based is considered more common while type-based is considered legacy.  Keeping all files related to a module together is easy to reason about.  On the flip side, it's nice having all controllers in one place as that's often a starting point when tracking down logic.  I chose module-based.  

I don't like to abstract too soon.  I'd rather allow the application growth to dictate when it's time to abstract.  An exception to this was moving create-game dto to its own file.  I left most of the game files directly under the games folder, rather than creating folders under games for controllers, services, etc.  As the application grows it may make sense to separate files into folders.  Right now there aren't many files for games and the filename itself tells us what it is.  

## Performance

I used performance.now to see how long functions took and keep performance top of mind.  Given more time we can look for ways to improve performance.  However the biggest bottlenecks will be over the network.  Monitoring should be in place to track baseline performance and surface anomalies within and between systems.  

## Automated Tests

Baseline the working functionality as code is changed over time. Added e2e for games. Expand test suite as time allows.

## More Time / Resources

If I had more time I'd wire up the frontend and allow the ability to place wagers on various aspects of the game. Trade-offs are generally value statements.  I would also refactor to remove the circular import reference between games and cells, look for other anti-patterns, better data validation and error handling/logging/notification, etc.




