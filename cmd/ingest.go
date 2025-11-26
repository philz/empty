package cmd

import (
	"fmt"
	"os"

	"covduck/internal/db"
	"covduck/internal/lcov"

	"github.com/spf13/cobra"
)

var (
	inputName string

	ingestCmd = &cobra.Command{
		Use:   "ingest [coverage-file]",
		Short: "Ingest a coverage file into the database",
		Long: `Ingest a coverage file (LCOV format) into the DuckDB database.
Also ingests the referenced source files.`,
		Args: cobra.ExactArgs(1),
		RunE: runIngest,
	}
)

func init() {
	rootCmd.AddCommand(ingestCmd)
	ingestCmd.Flags().StringVarP(&inputName, "name", "n", "", "Name for this coverage input (defaults to filename)")
}

func runIngest(cmd *cobra.Command, args []string) error {
	coverageFile := args[0]

	// Default input name to the filename if not provided
	if inputName == "" {
		inputName = coverageFile
	}

	// Initialize database
	database, err := db.Open(dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer database.Close()

	// Create schema if needed
	if err := database.InitSchema(); err != nil {
		return fmt.Errorf("failed to initialize schema: %w", err)
	}

	// Parse LCOV file
	fmt.Printf("Parsing coverage file: %s\n", coverageFile)
	coverage, err := lcov.ParseFile(coverageFile)
	if err != nil {
		return fmt.Errorf("failed to parse coverage file: %w", err)
	}

	// Ingest data
	fmt.Printf("Ingesting coverage data for input: %s\n", inputName)
	if err := database.IngestCoverage(inputName, coverage); err != nil {
		return fmt.Errorf("failed to ingest coverage: %w", err)
	}

	// Ingest source files
	fmt.Printf("Ingesting source files...\n")
	sourceCount := 0
	for filePath := range coverage.Files {
		if _, err := os.Stat(filePath); err == nil {
			content, err := os.ReadFile(filePath)
			if err != nil {
				fmt.Printf("Warning: failed to read source file %s: %v\n", filePath, err)
				continue
			}
			if err := database.IngestSourceFile(filePath, string(content)); err != nil {
				fmt.Printf("Warning: failed to ingest source file %s: %v\n", filePath, err)
				continue
			}
			sourceCount++
		}
	}

	fmt.Printf("Successfully ingested:\n")
	fmt.Printf("  - %d files with coverage data\n", len(coverage.Files))
	fmt.Printf("  - %d source files\n", sourceCount)

	return nil
}
