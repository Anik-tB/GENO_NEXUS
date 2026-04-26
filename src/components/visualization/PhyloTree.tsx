"use client";

import { useState, useCallback } from "react";
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

const INITIAL_TREE: TreeNode = {
  id: "root",
  label: "Last Common Ancestor",
  type: "species",
  color: "var(--gn-primary)",
  time: 0,
  info: "Ancestral lineage — estimated 65 MYA",
  children: [
    {
      id: "primate",
      label: "Primates",
      type: "species",
      color: "var(--gn-blue)",
      time: 20,
      info: "Order Primates — diverged ~65 MYA",
      expanded: true,
      children: [
        {
          id: "hominid",
          label: "Hominidae",
          type: "species",
          color: "var(--gn-blue)",
          time: 45,
          info: "Great apes — diverged ~15 MYA",
          expanded: true,
          children: [
            {
              id: "human",
              label: "Homo sapiens",
              type: "species",
              color: "var(--gn-primary)",
              time: 80,
              info: "Modern humans — emerged ~300 KYA",
              expanded: true,
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
      id: "rodent",
      label: "Rodentia",
      type: "species",
      color: "var(--gn-accent)",
      time: 30,
      info: "Rodents — largest mammalian order",
      expanded: false,
      children: [
        { id: "mouse", label: "Mus musculus", type: "species", color: "var(--gn-accent)", time: 65, info: "House mouse — model organism", children: [] },
        { id: "rat", label: "Rattus norvegicus", type: "species", color: "var(--gn-accent)", time: 68, info: "Brown rat — common model organism", children: [] },
      ],
    },
  ],
};

function TreeNodeView({ node, depth, timeline, onToggle, onSelect, selected }: {
  node: TreeNode; depth: number; timeline: number;
  onToggle: (id: string) => void; onSelect: (node: TreeNode) => void; selected: string | null;
}) {
  if (node.time > timeline) return null;
  return (
    <div className={styles.nodeWrapper} style={{ paddingLeft: `${depth * 28}px` }}>
      <div
        className={`${styles.node} ${selected === node.id ? styles.nodeSelected : ""}`}
        onClick={() => { onSelect(node); if (node.children.length > 0) onToggle(node.id); }}
      >
        {node.children.length > 0 && <span className={`${styles.toggle} ${node.expanded ? styles.toggleOpen : ""}`}>▶</span>}
        <span className={styles.nodeIcon} style={{ background: node.color + "33", border: `1px solid ${node.color}66`, color: node.color }}>
          {node.type === "mutation" ? "⚡" : "🧬"}
        </span>
        <span className={styles.nodeLabel} style={{ color: node.type === "mutation" ? node.color : "var(--gn-text-primary)" }}>{node.label}</span>
        <span className={styles.nodeTime}>{node.time}%</span>
      </div>
      {node.expanded && node.children.map((child) => (
        <TreeNodeView key={child.id} node={child} depth={depth + 1} timeline={timeline} onToggle={onToggle} onSelect={onSelect} selected={selected} />
      ))}
    </div>
  );
}

function toggleNode(tree: TreeNode, id: string): TreeNode {
  if (tree.id === id) return { ...tree, expanded: !tree.expanded };
  return { ...tree, children: tree.children.map((c) => toggleNode(c, id)) };
}

export function PhyloTree() {
  const [tree, setTree] = useState<TreeNode>(INITIAL_TREE);
  const [timeline, setTimeline] = useState(100);
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const handleToggle = useCallback((id: string) => setTree((t) => toggleNode(t, id)), []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.treePanel}>
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
              <div className={styles.infoRow}><span>Type</span><span style={{ color: selected.color }}>{selected.type === "mutation" ? "Mutation Event" : "Taxonomic Split"}</span></div>
              <div className={styles.infoRow}><span>Timeline</span><span>{selected.time}% of history</span></div>
              <div className={styles.infoRow}><span>Descendants</span><span>{selected.children.length}</span></div>
            </>
          ) : (
            <p className={styles.infoPlaceholder}>Click any node to inspect</p>
          )}
        </div>
        <div className={styles.legend}>
          <p className={styles.legendTitle}>Legend</p>
          {[["var(--gn-blue)", "Species Divergence"], ["var(--gn-danger)", "Pathogenic Mutation"], ["var(--gn-warning)", "Uncertain Variant"]].map(([color, label]) => (
            <div key={label} className={styles.legendItem}><span className={styles.legendDot} style={{ background: color }} />{label}</div>
          ))}
        </div>
      </div>

      <div className={styles.timelineBar}>
        <span className={styles.timelineLabel}>Evolution Timeline</span>
        <div className={styles.sliderWrapper}>
          {[{ pos: 0, label: "65 MYA" }, { pos: 25, label: "45 MYA" }, { pos: 50, label: "25 MYA" }, { pos: 75, label: "6 MYA" }, { pos: 100, label: "Present" }].map((e) => (
            <span key={e.pos} className={styles.eraLabel} style={{ left: `${e.pos}%` }}>{e.label}</span>
          ))}
          <input type="range" min={0} max={100} value={timeline} onChange={(e) => setTimeline(Number(e.target.value))} className={styles.slider} />
        </div>
      </div>
    </div>
  );
}
