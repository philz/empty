package web

const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coverage Duck 🦆</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: #1e1e1e;
            color: #d4d4d4;
        }

        header {
            background: #2d2d30;
            padding: 15px 20px;
            border-bottom: 1px solid #3e3e42;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        h1 {
            font-size: 20px;
            font-weight: 600;
        }

        .container {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        .sidebar {
            width: 300px;
            background: #252526;
            border-right: 1px solid #3e3e42;
            overflow-y: auto;
            padding: 10px;
        }

        .main {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .file-header {
            background: #2d2d30;
            padding: 10px 20px;
            border-bottom: 1px solid #3e3e42;
            font-size: 14px;
        }

        .coverage-view {
            flex: 1;
            overflow-y: auto;
            background: #1e1e1e;
        }

        .tree-node {
            padding: 5px;
            cursor: pointer;
            user-select: none;
        }

        .tree-node:hover {
            background: #2a2d2e;
        }

        .tree-folder {
            font-weight: 500;
        }

        .tree-file {
            padding-left: 20px;
            color: #9cdcfe;
        }

        .tree-file:hover {
            background: #2a2d2e;
        }

        .tree-children {
            margin-left: 15px;
        }

        .line {
            display: flex;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 20px;
            border-bottom: 1px solid #2d2d30;
        }

        .line-number {
            min-width: 60px;
            padding: 2px 10px;
            text-align: right;
            background: #1e1e1e;
            color: #858585;
            border-right: 1px solid #3e3e42;
            user-select: none;
        }

        .line-content {
            flex: 1;
            padding: 2px 10px;
            white-space: pre;
            overflow-x: auto;
        }

        .line-covered {
            background: rgba(0, 128, 0, 0.2);
        }

        .line-covered .line-number {
            background: rgba(0, 128, 0, 0.3);
            color: #4ec9b0;
        }

        .line-uncovered {
            background: rgba(128, 0, 0, 0.15);
        }

        .coverage-info {
            display: inline-block;
            margin-left: 10px;
            padding: 2px 8px;
            background: #3e3e42;
            border-radius: 3px;
            font-size: 12px;
            color: #cccccc;
        }

        .coverage-primary {
            color: #4ec9b0;
            font-weight: 500;
        }

        .coverage-others {
            color: #858585;
        }

        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #858585;
            font-size: 16px;
        }

        .loading {
            text-align: center;
            padding: 20px;
            color: #858585;
        }

        .tree-toggle {
            display: inline-block;
            width: 16px;
            cursor: pointer;
        }

        .tree-collapsed > .tree-children {
            display: none;
        }
    </style>
</head>
<body>
    <header>
        <h1>🦆 Coverage Duck</h1>
    </header>

    <div class="container">
        <div class="sidebar">
            <div id="file-tree"></div>
        </div>
        <div class="main">
            <div class="file-header" id="file-header">
                Select a file to view coverage
            </div>
            <div class="coverage-view" id="coverage-view">
                <div class="empty-state">
                    Select a file from the tree to view its coverage
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentFile = null;

        async function loadFileTree() {
            const response = await fetch('/api/files');
            const tree = await response.json();
            renderTree(tree, document.getElementById('file-tree'));
        }

        function renderTree(nodes, container) {
            nodes.forEach(node => {
                const div = document.createElement('div');
                div.className = 'tree-node';

                if (node.is_file) {
                    div.className += ' tree-file';
                    div.textContent = node.name;
                    div.onclick = () => loadFile(node.path);
                } else {
                    div.className += ' tree-folder';
                    const toggle = document.createElement('span');
                    toggle.className = 'tree-toggle';
                    toggle.textContent = '▼ ';
                    div.appendChild(toggle);
                    div.appendChild(document.createTextNode(node.name));

                    if (node.children && node.children.length > 0) {
                        const childContainer = document.createElement('div');
                        childContainer.className = 'tree-children';
                        div.appendChild(childContainer);
                        renderTree(node.children, childContainer);

                        toggle.onclick = (e) => {
                            e.stopPropagation();
                            div.classList.toggle('tree-collapsed');
                            toggle.textContent = div.classList.contains('tree-collapsed') ? '▶ ' : '▼ ';
                        };
                    }
                }

                container.appendChild(div);
            });
        }

        async function loadFile(path) {
            currentFile = path;
            document.getElementById('file-header').textContent = path;
            document.getElementById('coverage-view').innerHTML = '<div class="loading">Loading...</div>';

            try {
                const response = await fetch('/api/coverage?file=' + encodeURIComponent(path));
                const data = await response.json();
                renderCoverage(data);
            } catch (error) {
                document.getElementById('coverage-view').innerHTML =
                    '<div class="empty-state">Error loading file: ' + error.message + '</div>';
            }
        }

        function renderCoverage(data) {
            const container = document.getElementById('coverage-view');
            container.innerHTML = '';

            data.lines.forEach(line => {
                const lineDiv = document.createElement('div');
                lineDiv.className = 'line';

                if (line.covered) {
                    lineDiv.className += ' line-covered';
                }

                const lineNum = document.createElement('div');
                lineNum.className = 'line-number';
                lineNum.textContent = line.number;

                const content = document.createElement('div');
                content.className = 'line-content';
                content.textContent = line.content || ' ';

                // Add coverage info
                if (line.covered && line.primary_input) {
                    const info = document.createElement('span');
                    info.className = 'coverage-info';

                    const primary = document.createElement('span');
                    primary.className = 'coverage-primary';
                    primary.textContent = line.primary_input;
                    info.appendChild(primary);

                    if (line.other_count > 0) {
                        const others = document.createElement('span');
                        others.className = 'coverage-others';
                        others.textContent = ' and ' + line.other_count + ' other' + (line.other_count > 1 ? 's' : '');
                        info.appendChild(others);
                    }

                    content.appendChild(info);
                }

                lineDiv.appendChild(lineNum);
                lineDiv.appendChild(content);
                container.appendChild(lineDiv);
            });
        }

        // Load file tree on page load
        loadFileTree();
    </script>
</body>
</html>
`
