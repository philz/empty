package cmd

import (
	"fmt"

	"covduck/internal/db"
	"covduck/internal/web"

	"github.com/spf13/cobra"
)

var (
	port int

	webCmd = &cobra.Command{
		Use:   "web",
		Short: "Start the web UI server",
		Long:  `Start a web server to explore coverage data with a file tree and coverage viewer.`,
		RunE:  runWeb,
	}
)

func init() {
	rootCmd.AddCommand(webCmd)
	webCmd.Flags().IntVarP(&port, "port", "p", 8080, "Port to listen on")
}

func runWeb(cmd *cobra.Command, args []string) error {
	// Open database
	database, err := db.Open(dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer database.Close()

	// Start web server
	server := web.NewServer(database, port)
	fmt.Printf("Starting Coverage Duck web UI on http://localhost:%d\n", port)
	return server.Start()
}
