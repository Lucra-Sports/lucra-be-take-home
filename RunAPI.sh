# POST /games - Create a new Minesweeper game
# Request body: { rows: number (2-50), columns: number (2-50), mineCount?: number }
# Returns: Game object with id, status, dimensions, and generated cells with mine positions
# Curl switches:
#   -X POST    : Specifies the HTTP method (POST for creating resources)
#   -H         : Sets a request header (Content-Type tells server we're sending JSON)
#   -d         : Sends the provided data as the request body
curl -X POST http://localhost:3000/games -H "Content-Type: application/json" -d '{"rows": 5, "columns": 5, "mineCount": 3}'


# GET /games - Retrieve all existing games
# Returns: Array of Game objects (id, status, rows, columns - without cells for performance)
curl -X GET http://localhost:3000/games


# GET /games/:id - Retrieve a specific game by UUID
# Returns: Full Game object with all cells, or 404 if not found
curl -X GET http://localhost:3000/games/1
