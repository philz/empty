# Coverage Duck >†

A powerful code coverage analysis tool that shows which tests cover which lines of code. Unlike traditional coverage tools, Coverage Duck tracks and displays which specific test inputs drove coverage for each line, helping you understand test redundancy and identify the most unique tests.

## Features

- **LCOV Format Support**: Uses LCOV as the common denominator for coverage formats
- **Efficient Storage**: Uses an embedded database (easily swappable with DuckDB/SQLite) to store coverage and source files
- **Smart Test Attribution**: Shows which test input covered the least other code (most unique) as the primary test for each line
- **Web UI**: Beautiful, modern web interface with:
  - File tree navigation on the left
  - Source code with coverage highlighting on the right
  - "test_x and N others" display showing which tests covered each line
- **Fast Queries**: All data is queryable for analysis

## Installation

```bash
go build -o covduck
```

## Usage

### Ingest Coverage Data

Ingest one or more LCOV coverage files:

```bash
# Ingest a coverage file
./covduck ingest coverage1.lcov --name test_addition

# Ingest multiple files
./covduck ingest coverage2.lcov --name test_subtraction
./covduck ingest coverage3.lcov --name test_division
```

The `--name` flag specifies the input name (typically the test name). If omitted, the filename is used.

### View Coverage in Web UI

Start the web server:

```bash
./covduck web --port 8080
```

Then open your browser to `http://localhost:8080`

## How It Works

### Uniqueness Scoring

Coverage Duck shows which test input is most "unique" for each line. The uniqueness score is calculated by counting how many total lines each test covers - tests that cover fewer lines overall are considered more unique and are shown first.

For example:
- `test_addition` covers 5 lines total
- `test_subtraction` covers 4 lines total
- `test_division` covers 7 lines total

If line 15 is covered by all three tests, it will display as: **test_subtraction and 2 others**

This helps you identify which test is most specifically targeting that code path.

### Data Model

The tool maintains three main data structures:

1. **Coverage Inputs**: Named test runs (e.g., "test_addition")
2. **Source Files**: The actual source code content
3. **Line Coverage**: Which input covered which line with what hit count

All data is persisted to a database file (default: `coverage.duckdb`) for fast queries.

## Example

Try the included sample:

```bash
# Ingest sample coverage files
./covduck ingest sample/coverage1.lcov --name test_addition
./covduck ingest sample/coverage2.lcov --name test_subtraction
./covduck ingest sample/coverage3.lcov --name test_division

# Start the web UI
./covduck web
```

## Architecture

- **Go**: Fast, compiled binary with no runtime dependencies
- **LCOV Parser**: Parses LCOV format coverage files
- **Embedded Database**: Uses in-memory storage with file persistence (easily swappable with DuckDB or SQLite)
- **Web Server**: Built-in HTTP server with modern UI
- **REST API**: JSON APIs for programmatic access

## API Endpoints

- `GET /api/files` - Get file tree
- `GET /api/coverage?file=<path>` - Get coverage for a file

## Database Options

The current implementation uses an in-memory database with file persistence. To use DuckDB (as originally intended), simply:

1. Update `go.mod` to include `github.com/marcboeker/go-duckdb`
2. Replace `internal/db/db.go` with a DuckDB implementation
3. The interface remains the same!

The same applies for SQLite with `modernc.org/sqlite` or `github.com/mattn/go-sqlite3`.

## Future Enhancements

- Support for other coverage formats (Cobertura, JaCoCo, etc.) converted to LCOV
- Coverage diff between test runs
- Export functionality
- Coverage statistics and reports
- Test redundancy analysis
- Minimum test set calculation

## License

MIT

## Contributing

Contributions welcome! This tool was built to solve the problem of understanding which tests actually matter for each line of code.
