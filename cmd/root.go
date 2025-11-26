package cmd

import (
	"github.com/spf13/cobra"
)

var (
	dbPath string

	rootCmd = &cobra.Command{
		Use:   "covduck",
		Short: "Coverage Duck - A coverage analysis tool powered by DuckDB",
		Long: `Coverage Duck ingests code coverage data and provides a web interface
to explore which tests cover which lines of code.`,
	}
)

func Execute() error {
	return rootCmd.Execute()
}

func init() {
	rootCmd.PersistentFlags().StringVarP(&dbPath, "db", "d", "coverage.duckdb", "Path to DuckDB database")
}
