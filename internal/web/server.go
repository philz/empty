package web

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"covduck/internal/db"
)

type Server struct {
	db   *db.DB
	port int
}

func NewServer(database *db.DB, port int) *Server {
	return &Server{
		db:   database,
		port: port,
	}
}

func (s *Server) Start() error {
	http.HandleFunc("/", s.handleIndex)
	http.HandleFunc("/api/files", s.handleFileTree)
	http.HandleFunc("/api/coverage", s.handleFileCoverage)

	addr := fmt.Sprintf(":%d", s.port)
	return http.ListenAndServe(addr, nil)
}

func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(indexHTML))
}

func (s *Server) handleFileTree(w http.ResponseWriter, r *http.Request) {
	files, err := s.db.GetFileTree()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Build a tree structure
	tree := buildTree(files)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tree)
}

func (s *Server) handleFileCoverage(w http.ResponseWriter, r *http.Request) {
	filePath := r.URL.Query().Get("file")
	if filePath == "" {
		http.Error(w, "file parameter required", http.StatusBadRequest)
		return
	}

	// Get source content
	content, err := s.db.GetSourceFile(filePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get coverage data
	coverage, err := s.db.GetFileCoverage(filePath)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Split content into lines
	lines := strings.Split(content, "\n")

	// Build response
	type LineInfo struct {
		Number       int    `json:"number"`
		Content      string `json:"content"`
		Covered      bool   `json:"covered"`
		HitCount     int    `json:"hit_count"`
		PrimaryInput string `json:"primary_input,omitempty"`
		OtherCount   int    `json:"other_count,omitempty"`
	}

	response := struct {
		File  string     `json:"file"`
		Lines []LineInfo `json:"lines"`
	}{
		File:  filePath,
		Lines: make([]LineInfo, len(lines)),
	}

	for i, line := range lines {
		lineNum := i + 1
		info := LineInfo{
			Number:  lineNum,
			Content: line,
		}

		if cov, ok := coverage[lineNum]; ok && len(cov.Inputs) > 0 {
			info.Covered = true
			info.HitCount = cov.HitCount
			// The first input is the most unique (least other coverage)
			info.PrimaryInput = cov.Inputs[0].Name
			if len(cov.Inputs) > 1 {
				info.OtherCount = len(cov.Inputs) - 1
			}
		}

		response.Lines[i] = info
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// TreeNode represents a node in the file tree
type TreeNode struct {
	Name     string      `json:"name"`
	Path     string      `json:"path,omitempty"`
	IsFile   bool        `json:"is_file"`
	Children []TreeNode  `json:"children,omitempty"`
}

func buildTree(files []string) []TreeNode {
	root := &TreeNode{Name: "", Children: []TreeNode{}}

	for _, file := range files {
		parts := strings.Split(file, "/")
		current := root

		for i, part := range parts {
			isFile := i == len(parts)-1

			// Find or create child
			var child *TreeNode
			for j := range current.Children {
				if current.Children[j].Name == part {
					child = &current.Children[j]
					break
				}
			}

			if child == nil {
				newNode := TreeNode{
					Name:     part,
					IsFile:   isFile,
					Children: []TreeNode{},
				}
				if isFile {
					newNode.Path = file
				}
				current.Children = append(current.Children, newNode)
				child = &current.Children[len(current.Children)-1]
			}

			current = child
		}
	}

	return root.Children
}
