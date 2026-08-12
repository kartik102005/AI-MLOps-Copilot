import React, { useState, useMemo } from 'react'
import {
  IconFolder,
  IconFolderOpen,
  IconCode,
  IconChevronRight,
  IconChevronDown,
  IconSearch,
  IconCopy,
  IconCheckCircle,
} from '../ui/Icons'

export interface TreeNode {
  name: string
  path: string
  isFolder: boolean
  children: TreeNode[]
}

// Convert flat array of file paths into a nested VS Code-style tree
export function buildFileTree(paths: string[]): TreeNode[] {
  const rootNodes: TreeNode[] = []

  for (const rawPath of paths) {
    const parts = rawPath.split('/')
    let currentLevel = rootNodes
    let currentPath = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part) continue
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const isFolder = i < parts.length - 1

      let existingNode = currentLevel.find((n) => n.name === part)

      if (!existingNode) {
        const newNode: TreeNode = {
          name: part,
          path: currentPath,
          isFolder,
          children: [],
        }
        currentLevel.push(newNode)
        existingNode = newNode
      }

      currentLevel = existingNode.children
    }
  }

  // Recursive sort: Folders first (alphabetically), then Files (alphabetically)
  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1
      if (!a.isFolder && b.isFolder) return 1
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })

    for (const node of nodes) {
      if (node.isFolder && node.children.length > 0) {
        sortNodes(node.children)
      }
    }
    return nodes
  }

  return sortNodes(rootNodes)
}

interface TreeNodeItemProps {
  node: TreeNode
  depth: number
  selectedPath: string | null
  onSelectFile: (path: string) => void
  expandedFolders: Record<string, boolean>
  onToggleFolder: (path: string) => void
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  depth,
  selectedPath,
  onSelectFile,
  expandedFolders,
  onToggleFolder,
}) => {
  const isExpanded = Boolean(expandedFolders[node.path])
  const isSelected = selectedPath === node.path

  const getFileIcon = (filename: string) => {
    const f = filename.toLowerCase()
    if (f.endsWith('.py')) return <IconCode className="h-4 w-4 text-emerald-600 shrink-0" />
    if (f.endsWith('.json') || f.endsWith('.toml') || f.endsWith('.yaml') || f.endsWith('.yml'))
      return <IconCode className="h-4 w-4 text-amber-500 shrink-0" />
    if (f.endsWith('.md')) return <IconCode className="h-4 w-4 text-sky-500 shrink-0" />
    if (f.includes('dockerfile')) return <IconCode className="h-4 w-4 text-blue-600 shrink-0" />
    if (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.tsx'))
      return <IconCode className="h-4 w-4 text-indigo-500 shrink-0" />
    return <IconCode className="h-4 w-4 text-text-muted shrink-0" />
  }

  if (node.isFolder) {
    return (
      <div>
        <div
          onClick={() => onToggleFolder(node.path)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className="flex items-center gap-1.5 py-1.5 pr-3 text-xs font-semibold text-text-primary hover:bg-gray-100 rounded-md cursor-pointer select-none transition-colors group"
        >
          <span className="text-text-muted group-hover:text-text-primary transition-transform">
            {isExpanded ? (
              <IconChevronDown className="h-3.5 w-3.5" />
            ) : (
              <IconChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
          {isExpanded ? (
            <IconFolderOpen className="h-4 w-4 text-indeed-blue shrink-0" />
          ) : (
            <IconFolder className="h-4 w-4 text-indeed-blue shrink-0" />
          )}
          <span className="truncate font-bold">{node.name}</span>
          <span className="text-[10px] text-text-muted font-mono ml-auto">
            {node.children.length}
          </span>
        </div>

        {isExpanded && (
          <div className="border-l border-border-light/80 ml-3">
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={() => onSelectFile(node.path)}
      style={{ paddingLeft: `${depth * 14 + 20}px` }}
      className={`flex items-center justify-between py-1.5 pr-3 text-xs font-mono rounded-md cursor-pointer transition-colors ${
        isSelected
          ? 'bg-indeed-blue-light text-indeed-blue font-bold border-l-2 border-indeed-blue'
          : 'text-text-primary hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        {getFileIcon(node.name)}
        <span className="truncate">{node.name}</span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-text-muted px-1.5 py-0.5 rounded bg-gray-200/60 shrink-0">
        {node.name.split('.').pop() || 'file'}
      </span>
    </div>
  )
}

interface FileTreeProps {
  files: string[]
}

export const FileTree: React.FC<FileTreeProps> = ({ files }) => {
  const [filterQuery, setFilterQuery] = useState('')
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Filter files before tree construction
  const filteredFiles = useMemo(() => {
    if (!filterQuery) return files
    return files.filter((f) => f.toLowerCase().includes(filterQuery.toLowerCase()))
  }, [files, filterQuery])

  // Build tree from filtered files
  const treeNodes = useMemo(() => buildFileTree(filteredFiles), [filteredFiles])

  // Default state: Expand top-level folders by default
  const defaultExpanded = useMemo(() => {
    const map: Record<string, boolean> = {}
    for (const node of treeNodes) {
      if (node.isFolder) {
        map[node.path] = true
      }
    }
    return map
  }, [treeNodes])

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(defaultExpanded)

  const handleToggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }))
  }

  const handleExpandAll = () => {
    const map: Record<string, boolean> = {}
    function setAll(nodes: TreeNode[]) {
      for (const n of nodes) {
        if (n.isFolder) {
          map[n.path] = true
          setAll(n.children)
        }
      }
    }
    setAll(treeNodes)
    setExpandedFolders(map)
  }

  const handleCollapseAll = () => {
    setExpandedFolders({})
  }

  const handleCopyPath = () => {
    if (selectedPath) {
      navigator.clipboard.writeText(selectedPath)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="rounded-2xl border border-border-light bg-surface shadow-subtle overflow-hidden">
      {/* VS Code Style Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-light bg-gray-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <IconFolder className="h-4 w-4 text-indeed-blue" />
          <h3 className="text-sm font-bold text-text-primary">VS Code Explorer</h3>
          <span className="badge-pill bg-gray-200 text-text-secondary text-[10px] font-mono">
            {files.length} items
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Filter Search */}
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-2 h-3.5 w-3.5 text-text-muted" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search tree..."
              className="w-36 sm:w-48 rounded-lg border border-border-medium bg-white pl-8 pr-2 py-1 text-xs text-text-primary focus:border-indeed-blue focus:outline-none"
            />
          </div>

          <button
            onClick={handleExpandAll}
            title="Expand All Folders"
            className="rounded-lg border border-border-medium bg-white px-2 py-1 text-[11px] font-bold text-text-secondary hover:text-indeed-blue hover:border-indeed-blue transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            title="Collapse All Folders"
            className="rounded-lg border border-border-medium bg-white px-2 py-1 text-[11px] font-bold text-text-secondary hover:text-indeed-blue hover:border-indeed-blue transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Selected File Bar Footer */}
      {selectedPath && (
        <div className="flex items-center justify-between border-b border-border-light bg-indeed-blue-light/50 px-4 py-2 text-xs font-mono text-indeed-blue">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold">Selected:</span>
            <span className="truncate">{selectedPath}</span>
          </div>
          <button
            onClick={handleCopyPath}
            className="flex items-center gap-1 font-bold text-xs hover:underline cursor-pointer shrink-0 ml-2"
          >
            {copied ? (
              <>
                <IconCheckCircle className="h-3.5 w-3.5 text-success" />
                <span className="text-success">Copied!</span>
              </>
            ) : (
              <>
                <IconCopy className="h-3.5 w-3.5" />
                <span>Copy Path</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Interactive Tree Area */}
      <div className="max-h-[460px] overflow-y-auto p-3 bg-white space-y-0.5 font-mono">
        {treeNodes.length === 0 ? (
          <p className="text-xs text-text-secondary py-8 text-center font-sans">
            No matching files or folders found for "{filterQuery}".
          </p>
        ) : (
          treeNodes.map((node) => (
            <TreeNodeItem
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              onSelectFile={setSelectedPath}
              expandedFolders={expandedFolders}
              onToggleFolder={handleToggleFolder}
            />
          ))
        )}
      </div>
    </div>
  )
}
