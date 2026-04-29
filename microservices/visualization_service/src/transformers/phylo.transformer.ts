import type { TreeNode, PhyloTreeData, SampleTree } from "../types/index";

/**
 * Parses a Newick-format string into a hierarchical TreeNode structure.
 */
export function newickToHierarchy(newick: string, name?: string): PhyloTreeData {
  const cleaned = newick.trim().replace(/;\s*$/, "");
  let pos = 0;
  let nodeCounter = 0;

  function parseNode(depth: number): TreeNode {
    const children: TreeNode[] = [];
    let label = "";
    let branchLength: number | undefined;

    if (cleaned[pos] === "(") {
      pos++;
      children.push(parseNode(depth + 1));
      while (pos < cleaned.length && cleaned[pos] === ",") {
        pos++;
        children.push(parseNode(depth + 1));
      }
      if (cleaned[pos] === ")") pos++;
    }

    const labelStart = pos;
    while (pos < cleaned.length && !":,)".includes(cleaned[pos])) {
      pos++;
    }
    label = cleaned.slice(labelStart, pos).trim();

    if (pos < cleaned.length && cleaned[pos] === ":") {
      pos++;
      const lenStart = pos;
      while (pos < cleaned.length && !",)".includes(cleaned[pos])) {
        pos++;
      }
      branchLength = parseFloat(cleaned.slice(lenStart, pos));
    }

    nodeCounter++;
    const nodeId = label || `node-${nodeCounter}`;
    const isLeaf = children.length === 0;

    return {
      id: nodeId.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      label: label || (isLeaf ? `Taxon ${nodeCounter}` : `Clade ${nodeCounter}`),
      type: "species",
      color: isLeaf ? "var(--gn-blue)" : "var(--gn-primary)",
      time: Math.min(100, depth * 20 + (branchLength ? branchLength * 100 : 0)),
      info: isLeaf ? `Leaf node — ${label || "unclassified"}` : `Internal node — ${children.length} descendants`,
      branchLength,
      children,
      expanded: depth < 3,
    };
  }

  const root = parseNode(0);

  return {
    treeId: `tree-${Date.now()}`,
    name: name || "Parsed Phylogenetic Tree",
    description: `Parsed from Newick format — ${nodeCounter} total nodes`,
    root,
    totalNodes: nodeCounter,
    maxDepth: getMaxDepth(root),
    format: "newick",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Returns the built-in sample tree matching the frontend's INITIAL_TREE.
 */
export function getDefaultTree(): PhyloTreeData {
  return {
    treeId: "sample-primate-evolution",
    name: "Primate Evolution & Human Mutations",
    description: "Evolutionary lineage from last common ancestor through primates to modern humans, with flagged genomic mutations.",
    root: {
      id: "root",
      label: "Last Common Ancestor",
      type: "species",
      color: "var(--gn-primary)",
      time: 0,
      info: "Ancestral lineage — estimated 65 MYA",
      expanded: true,
      children: [
        {
          id: "primate", label: "Primates", type: "species", color: "var(--gn-blue)", time: 20,
          info: "Order Primates — diverged ~65 MYA", expanded: true,
          children: [
            {
              id: "hominid", label: "Hominidae", type: "species", color: "var(--gn-blue)", time: 45,
              info: "Great apes — diverged ~15 MYA", expanded: true,
              children: [
                {
                  id: "human", label: "Homo sapiens", type: "species", color: "var(--gn-primary)", time: 80,
                  info: "Modern humans — emerged ~300 KYA", expanded: true,
                  children: [
                    { id: "brca2", label: "BRCA2 c.5946delT", type: "mutation", color: "var(--gn-danger)", time: 95, info: "Pathogenic frameshift — BRCA2 gene", children: [] },
                    { id: "tp53", label: "TP53 c.817C>T", type: "mutation", color: "var(--gn-warning)", time: 98, info: "VUS — TP53 tumor suppressor", children: [] },
                  ],
                },
                { id: "chimp", label: "Pan troglodytes", type: "species", color: "var(--gn-blue)", time: 75, info: "Common chimpanzee — diverged ~6 MYA", children: [] },
              ],
            },
            { id: "monkey", label: "Old World Monkeys", type: "species", color: "var(--gn-accent)", time: 55, info: "Cercopithecidae — diverged ~25 MYA", children: [] },
          ],
        },
        {
          id: "rodent", label: "Rodentia", type: "species", color: "var(--gn-accent)", time: 30,
          info: "Rodents — largest mammalian order", expanded: false,
          children: [
            { id: "mouse", label: "Mus musculus", type: "species", color: "var(--gn-accent)", time: 65, info: "House mouse — model organism", children: [] },
            { id: "rat", label: "Rattus norvegicus", type: "species", color: "var(--gn-accent)", time: 68, info: "Brown rat — common model organism", children: [] },
          ],
        },
      ],
    },
    totalNodes: 11,
    maxDepth: 4,
    format: "json",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Returns the list of available sample trees.
 */
export function getSampleTreeList(): SampleTree[] {
  return [
    { id: "sample-primate-evolution", name: "Primate Evolution & Human Mutations", description: "Evolutionary lineage from LCA through primates with pathogenic variants", nodeCount: 11, organism: "Homo sapiens" },
    { id: "sample-coronavirus", name: "SARS-CoV-2 Lineage", description: "Coronavirus variant evolution from Wuhan-Hu-1 to Omicron subvariants", nodeCount: 15, organism: "SARS-CoV-2" },
    { id: "sample-influenza", name: "Influenza A Phylogeny", description: "H1N1 and H3N2 subtype divergence tree", nodeCount: 9, organism: "Influenza A" },
  ];
}

function getMaxDepth(node: TreeNode, depth = 0): number {
  if (node.children.length === 0) return depth;
  return Math.max(...node.children.map((c) => getMaxDepth(c, depth + 1)));
}
