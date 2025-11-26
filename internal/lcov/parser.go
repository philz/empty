package lcov

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Coverage represents parsed coverage data
type Coverage struct {
	Files map[string]*FileData
}

// FileData represents coverage data for a single file
type FileData struct {
	Path  string
	Lines map[int]int // line number -> hit count
}

// ParseFile parses an LCOV format coverage file
func ParseFile(path string) (*Coverage, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	coverage := &Coverage{
		Files: make(map[string]*FileData),
	}

	scanner := bufio.NewScanner(file)
	var currentFile *FileData

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		// Split on first colon
		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			continue
		}

		key := parts[0]
		value := parts[1]

		switch key {
		case "TN":
			// Test name - we ignore this as we track the input name separately

		case "SF":
			// Source file
			currentFile = &FileData{
				Path:  value,
				Lines: make(map[int]int),
			}
			coverage.Files[value] = currentFile

		case "DA":
			// Line coverage: line_number,hit_count
			if currentFile == nil {
				continue
			}
			lineParts := strings.Split(value, ",")
			if len(lineParts) != 2 {
				continue
			}
			lineNum, err := strconv.Atoi(lineParts[0])
			if err != nil {
				continue
			}
			hitCount, err := strconv.Atoi(lineParts[1])
			if err != nil {
				continue
			}
			currentFile.Lines[lineNum] = hitCount

		case "end_of_record":
			currentFile = nil
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file: %w", err)
	}

	return coverage, nil
}
