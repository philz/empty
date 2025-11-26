package db

import (
	"encoding/gob"
	"fmt"
	"os"
	"sort"
	"sync"

	"covduck/internal/lcov"
)

// DB represents an in-memory database with file persistence
type DB struct {
	path     string
	mu       sync.RWMutex
	inputs   map[string]int // input name -> id
	nextID   int
	sources  map[string]string           // file path -> content
	coverage map[int]map[string]map[int]int // input_id -> file_path -> line_number -> hit_count
}

type persistedDB struct {
	Inputs   map[string]int
	NextID   int
	Sources  map[string]string
	Coverage map[int]map[string]map[int]int
}

// Open opens or creates a database
func Open(path string) (*DB, error) {
	db := &DB{
		path:     path,
		inputs:   make(map[string]int),
		nextID:   1,
		sources:  make(map[string]string),
		coverage: make(map[int]map[string]map[int]int),
	}

	// Try to load existing data
	if _, err := os.Stat(path); err == nil {
		if err := db.load(); err != nil {
			return nil, fmt.Errorf("failed to load database: %w", err)
		}
	}

	return db, nil
}

// Close closes the database and saves data
func (db *DB) Close() error {
	return db.save()
}

// InitSchema is a no-op for this implementation
func (db *DB) InitSchema() error {
	return nil
}

// IngestCoverage ingests coverage data for a named input
func (db *DB) IngestCoverage(inputName string, coverage *lcov.Coverage) error {
	db.mu.Lock()
	defer db.mu.Unlock()

	// Get or create input ID
	inputID, ok := db.inputs[inputName]
	if !ok {
		inputID = db.nextID
		db.inputs[inputName] = inputID
		db.nextID++
	}

	// Initialize coverage maps if needed
	if db.coverage[inputID] == nil {
		db.coverage[inputID] = make(map[string]map[int]int)
	}

	// Store coverage data
	for filePath, fileData := range coverage.Files {
		if db.coverage[inputID][filePath] == nil {
			db.coverage[inputID][filePath] = make(map[int]int)
		}
		for lineNum, hitCount := range fileData.Lines {
			db.coverage[inputID][filePath][lineNum] = hitCount
		}
	}

	return db.save()
}

// IngestSourceFile stores a source file in the database
func (db *DB) IngestSourceFile(filePath, content string) error {
	db.mu.Lock()
	defer db.mu.Unlock()

	db.sources[filePath] = content
	return db.save()
}

// GetFileTree returns a list of all files in the database
func (db *DB) GetFileTree() ([]string, error) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	files := make([]string, 0, len(db.sources))
	for path := range db.sources {
		files = append(files, path)
	}
	sort.Strings(files)
	return files, nil
}

// LineCoverageInfo contains coverage information for a single line
type LineCoverageInfo struct {
	LineNumber int
	HitCount   int
	Inputs     []InputCoverage
}

// InputCoverage contains information about which input covered a line
type InputCoverage struct {
	Name       string
	HitCount   int
	Uniqueness int // How many other lines this input covers (lower = more unique)
}

// GetFileCoverage returns coverage information for a file
func (db *DB) GetFileCoverage(filePath string) (map[int]LineCoverageInfo, error) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	result := make(map[int]LineCoverageInfo)

	// Calculate uniqueness scores for each input (total lines covered)
	uniqueness := make(map[int]int) // input_id -> total lines covered
	for inputID, files := range db.coverage {
		totalLines := 0
		for _, lines := range files {
			totalLines += len(lines)
		}
		uniqueness[inputID] = totalLines
	}

	// Get input name by ID
	inputNames := make(map[int]string)
	for name, id := range db.inputs {
		inputNames[id] = name
	}

	// Build coverage info for each line
	for inputID, files := range db.coverage {
		if lineCov, ok := files[filePath]; ok {
			for lineNum, hitCount := range lineCov {
				info := result[lineNum]
				info.LineNumber = lineNum
				info.HitCount += hitCount
				info.Inputs = append(info.Inputs, InputCoverage{
					Name:       inputNames[inputID],
					HitCount:   hitCount,
					Uniqueness: uniqueness[inputID],
				})
				result[lineNum] = info
			}
		}
	}

	// Sort inputs by uniqueness (most unique first)
	for lineNum, info := range result {
		sort.Slice(info.Inputs, func(i, j int) bool {
			return info.Inputs[i].Uniqueness < info.Inputs[j].Uniqueness
		})
		result[lineNum] = info
	}

	return result, nil
}

// GetSourceFile returns the content of a source file
func (db *DB) GetSourceFile(filePath string) (string, error) {
	db.mu.RLock()
	defer db.mu.RUnlock()

	content, ok := db.sources[filePath]
	if !ok {
		return "", fmt.Errorf("file not found: %s", filePath)
	}
	return content, nil
}

// save persists the database to disk
func (db *DB) save() error {
	file, err := os.Create(db.path)
	if err != nil {
		return err
	}
	defer file.Close()

	data := persistedDB{
		Inputs:   db.inputs,
		NextID:   db.nextID,
		Sources:  db.sources,
		Coverage: db.coverage,
	}

	encoder := gob.NewEncoder(file)
	return encoder.Encode(data)
}

// load reads the database from disk
func (db *DB) load() error {
	file, err := os.Open(db.path)
	if err != nil {
		return err
	}
	defer file.Close()

	var data persistedDB
	decoder := gob.NewDecoder(file)
	if err := decoder.Decode(&data); err != nil {
		return err
	}

	db.inputs = data.Inputs
	db.nextID = data.NextID
	db.sources = data.Sources
	db.coverage = data.Coverage

	return nil
}
