"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./PhyloTree.module.css";

interface TreeNode {
  id: string;
  label: string;
  type: "species" | "mutation";
  color: string;
  time: number;
  children: TreeNode[];
  expanded?: boolean;
  info: string;
}

function TreeNodeView({ node, depth, timeline, onToggle, onSelect, selected }: {
  node: TreeNode; depth: number; timeline: number;
  onToggle: (id: string) => void; onSelect: (node: TreeNode) => void; selected: string | null;
}) {
  if (node.time > timeline) return null;
  return (
    <div className={styles.nodeWrapper} style={{ paddingLeft: `${depth * 28}px` }}>
      <div
        className={`${styles.node} ${selected === node.id ? styles.nodeSelected : ""}`}
        onClick={() => { onSelect(node); if (node.children?.length) onToggle(node.id); }}
      >
        {node.children?.length > 0 && <span className={`${styles.toggle} ${node.expanded ? styles.toggleOpen : ""}`}>▶</span>}
        <span className={styles.nodeIcon} style={{ background: node.color + "33", border: `1px solid ${node.color}66`, color: node.color }}>
          {node.type === "mutation" ? "⚡" : "🧬"}
        </span>
        <span className={styles.nodeLabel} style={{ color: node.type === "mutation" ? node.color : "var(--gn-text-primary)" }}>{node.label}</span>
        <span className={styles.nodeTime}>{node.time}%</span>
      </div>
      {node.expanded && node.children?.map((child) => (
        <TreeNodeView key={child.id} node={child} depth={depth + 1} timeline={timeline} onToggle={onToggle} onSelect={onSelect} selected={selected} />
      ))}
    </div>
  );
}

function toggleNode(tree: TreeNode, id: string): TreeNode {
  if (tree.id === id) return { ...tree, expanded: !tree.expanded };
  return { ...tree, children: tree.children ? tree.children.map((c) => toggleNode(c, id)) : [] };
}

function buildTreeFromMutations(
  mutations: Array<{ position: number; reference: string; query: string; severity: string; sub: string }>,
  fileName: string,
  matchPct: number
): TreeNode {
  const pathogenic = mutations.filter((m) => m.severity === "pathogenic");
  const uncertain  = mutations.filter((m) => m.severity === "uncertain");
  const benign     = mutations.filter((m) => m.severity === "benign");

  // Build children nodes from top mutations (max 5 per category)
  const toNode = (m: typeof mutations[0], idx: number, baseTime: number): TreeNode => ({
    id: `mut-${m.position}-${idx}`,
    label: `${m.sub} @ pos ${m.position}`,
    type: "mutation",
    color: m.severity === "pathogenic" ? "var(--gn-danger)" : m.severity === "uncertain" ? "var(--gn-warning)" : "var(--gn-success)",
    time: Math.min(99, baseTime + idx * 3),
    children: [],
    expanded: false,
    info: `${m.severity === "pathogenic" ? "High-impact" : m.severity === "uncertain" ? "Moderate-impact" : "Low-impact"} substitution ${m.sub} detected at genomic position ${m.position}. This ${m.severity === "pathogenic" ? "transversion" : "transition"} contributes to the variant's divergence from the reference sequence.`,
  });

  const pathNodes = pathogenic.slice(0, 5).map((m, i) => toNode(m, i, 55));
  const uncertNodes = uncertain.slice(0, 4).map((m, i) => toNode(m, i, 70));
  const benignNodes = benign.slice(0, 4).map((m, i) => toNode(m, i, 82));

  return {
    id: "root",
    label: "NC_045512.2 — Reference Genome",
    type: "species",
    color: "var(--gn-blue)",
    time: 0,
    expanded: true,
    info: "NCBI reference sequence used as the alignment baseline for evolutionary distance calculation.",
    children: [
      {
        id: "patient-branch",
        label: `${fileName} (${matchPct}% match)`,
        type: "species",
        color: "var(--gn-primary)",
        time: 40,
        expanded: true,
        info: `Your uploaded sequence diverges from the reference by ${(100 - matchPct).toFixed(1)}%. ${mutations.length} variant positions were identified: ${pathogenic.length} pathogenic, ${uncertain.length} uncertain, ${benign.length} benign.`,
        children: [
          ...(pathNodes.length ? [{
            id: "pathogenic-cluster",
            label: `Pathogenic Variants (${pathogenic.length})`,
            type: "mutation" as const,
            color: "var(--gn-danger)",
            time: 50,
            expanded: false,
            info: `${pathogenic.length} high-impact transversions detected. These substitution types (A>T, T>A, G>C, C>A) are associated with protein structure disruption and elevated disease risk.`,
            children: pathNodes,
          }] : []),
          ...(uncertNodes.length ? [{
            id: "uncertain-cluster",
            label: `Uncertain Variants (${uncertain.length})`,
            type: "mutation" as const,
            color: "var(--gn-warning)",
            time: 65,
            expanded: false,
            info: `${uncertain.length} variants of uncertain significance. Additional functional studies may be needed to classify these.`,
            children: uncertNodes,
          }] : []),
          ...(benignNodes.length ? [{
            id: "benign-cluster",
            label: `Benign Variants (${benign.length})`,
            type: "mutation" as const,
            color: "var(--gn-success)",
            time: 80,
            expanded: false,
            info: `${benign.length} benign transitions detected. These purine-purine or pyrimidine-pyrimidine substitutions are generally considered low-impact.`,
            children: benignNodes,
          }] : []),
        ],
      },
    ],
  };
}

export function PhyloTree() {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [timeline, setTimeline] = useState(100);
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileName, setFileName] = useState("Your Sample");

  useEffect(() => {
    fetch("/api/visualization/mutations-raw")
      .then((r) => r.json())
      .then((data) => {
        if (data.mutations && data.mutations.length > 0) {
          setFileName(data.fileName || "Your Sample");
          const built = buildTreeFromMutations(data.mutations, data.fileName || "Your Sample", data.matchPct ?? 0);
          setTree(built);
        } else {
          // Fallback: fetch the pre-built sample tree from the viz service
          return fetch("http://localhost:4500/api/viz/phylo/tree/sample-primate-evolution", {
            headers: { "x-api-key": "genonexus-viz-api-key-change-in-production" },
            signal: AbortSignal.timeout(3000),
          })
            .then((r) => r.json())
            .then((d) => { if (d.success && d.data?.root) setTree(d.data.root); });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback((id: string) => {
    if (tree) setTree((t) => toggleNode(t!, id));
  }, [tree]);

  if (loading) return <div className={styles.wrapper} style={{ alignItems: "center", justifyContent: "center", color: "var(--gn-white)" }}>Building Evolutionary Tree…</div>;
  if (!tree) return <div className={styles.wrapper} style={{ alignItems: "center", justifyContent: "center", color: "var(--gn-danger)" }}>No analysis data. Upload and run analysis first.</div>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.treePanel}>
        <div style={{ padding: "0.5rem 1rem", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", color: "var(--gn-primary)", borderBottom: "1px solid var(--gn-border-light)", textTransform: "uppercase" }}>
          🧬 Phylogenetic Tree — {fileName}
        </div>
        <div className={styles.treeScroll}>
          <TreeNodeView node={tree} depth={0} timeline={timeline} onToggle={handleToggle} onSelect={setSelected} selected={selected?.id ?? null} />
        </div>
      </div>

      <div className={styles.sidePanel}>
        <div className={styles.infoCard}>
          {selected ? (
            <>
              <div className={styles.infoIcon} style={{ background: selected.color + "22", color: selected.color }}>{selected.type === "mutation" ? "⚡" : "🧬"}</div>
              <h3 className={styles.infoTitle}>{selected.label}</h3>
              <p className={styles.infoDesc}>{selected.info}</p>
              <div className={styles.infoRow}><span>Type</span><span style={{ color: selected.color }}>{selected.type === "mutation" ? "Mutation Event" : "Sequence Node"}</span></div>
              <div className={styles.infoRow}><span>Timeline</span><span>{selected.time}% of divergence</span></div>
              <div className={styles.infoRow}><span>Sub-variants</span><span>{selected.children ? selected.children.length : 0}</span></div>
            </>
          ) : (
            <p className={styles.infoPlaceholder}>Click any node to inspect</p>
          )}
        </div>
        <div className={styles.legend}>
          <p className={styles.legendTitle}>Legend</p>
          {[["var(--gn-blue)", "Reference Sequence"], ["var(--gn-primary)", "Your Upload"], ["var(--gn-danger)", "Pathogenic Variant"], ["var(--gn-warning)", "Uncertain Variant"], ["var(--gn-success)", "Benign Variant"]].map(([color, label]) => (
            <div key={label} className={styles.legendItem}><span className={styles.legendDot} style={{ background: color }} />{label}</div>
          ))}
        </div>
      </div>

      <div className={styles.timelineBar}>
        <span className={styles.timelineLabel}>Divergence Timeline</span>
        <div className={styles.sliderWrapper}>
          {[{ pos: 0, label: "Reference" }, { pos: 40, label: "Branching" }, { pos: 65, label: "Variants" }, { pos: 100, label: "All" }].map((e) => (
            <span key={e.pos} className={styles.eraLabel} style={{ left: `${e.pos}%` }}>{e.label}</span>
          ))}
          <input type="range" min={0} max={100} value={timeline} onChange={(e) => setTimeline(Number(e.target.value))} className={styles.slider} />
        </div>
      </div>
    </div>
  );
}
