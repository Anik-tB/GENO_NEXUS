"use client";

import styles from "./page.module.css";

const ORG = {
  name: "GenoNexus Organization",
  handle: "@geno-nexus",
  description: "Open-source consortium for AI-driven precision medicine and real-time genomic analysis. Maintained by global health researchers.",
  location: "Boston, MA",
  website: "https://genonexus.ai",
  email: "research@genonexus.ai",
  avatar: "🧬",
};

const STATS = {
  members: 142,
  repositories: 18,
  teams: 6,
};

const REPOSITORIES = [
  { name: "GenoNexus-Core", desc: "Main AI-powered genomics platform for mutation analysis.", lang: "TypeScript", langColor: "#3178c6", stars: 124, forks: 18, private: true, updated: "2 hours ago" },
  { name: "outbreak-forecast-models", desc: "Machine learning models and training datasets for epidemiological forecasting.", lang: "Python", langColor: "#3572A5", stars: 89, forks: 45, private: false, updated: "1 day ago" },
  { name: "pharmacogenomics-db", desc: "Curated database of clinical drug-gene interactions for the CYP450 superfamily.", lang: "Jupyter Notebook", langColor: "#DA5B0B", stars: 210, forks: 12, private: false, updated: "3 days ago" },
  { name: "3d-helix-renderer", desc: "WebGL-based 3D visualization engine for patient chromosome and locus mapping.", lang: "GLSL", langColor: "#563d7c", stars: 56, forks: 4, private: true, updated: "1 week ago" },
  { name: "hl7-fhir-integration", desc: "Export parsers and compliance testing for clinical systems integration.", lang: "Go", langColor: "#00ADD8", stars: 32, forks: 8, private: false, updated: "2 weeks ago" },
];

export default function OrganizationPage() {
  return (
    <div className={styles.container}>
      <header className={styles.orgHeader}>
        <div className={styles.orgAvatar}>{ORG.avatar}</div>
        <div className={styles.orgInfo}>
          <h1 className={styles.orgName}>{ORG.name}</h1>
          <p className={styles.orgHandle}>{ORG.handle}</p>
          <p className={styles.orgDesc}>{ORG.description}</p>
          <div className={styles.orgMeta}>
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> {ORG.location}</span>
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> <a href={ORG.website}>{ORG.website}</a></span>
            <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> <a href={`mailto:${ORG.email}`}>{ORG.email}</a></span>
          </div>
        </div>
        <div className={styles.orgActions}>
          <button className={styles.btnSecondary}>Follow</button>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sideBlock}>
            <h3>People <span className={styles.badge}>{STATS.members}</span></h3>
            <div className={styles.avatarGrid}>
              {Array.from({length: 12}).map((_, i) => (
                 <div key={i} className={styles.miniAvatar} style={{background: `hsl(${i*30}, 60%, 20%)`, borderColor: `hsl(${i*30}, 60%, 40%)`}}></div>
              ))}
            </div>
            <a href="#" className={styles.viewAll}>View all members →</a>
          </div>
          <div className={styles.sideBlock}>
            <h3>Teams <span className={styles.badge}>{STATS.teams}</span></h3>
            <ul className={styles.teamList}>
              <li>@geno-nexus/ml-engineers</li>
              <li>@geno-nexus/clinical-ops</li>
              <li>@geno-nexus/core-maintainers</li>
            </ul>
             <a href="#" className={styles.viewAll}>View all teams →</a>
          </div>
        </aside>

        <main className={styles.main}>
          <div className={styles.toolbar}>
            <input type="text" className={styles.searchInput} placeholder="Find a repository..." />
            <select className={styles.filterSelect}>
              <option>Type</option>
              <option>Public</option>
              <option>Private</option>
            </select>
            <select className={styles.filterSelect}>
               <option>Language</option>
            </select>
            <button className={styles.btnPrimary}>New</button>
          </div>

          <div className={styles.repoList}>
            {REPOSITORIES.map(repo => (
              <div key={repo.name} className={styles.repoCard}>
                 <div className={styles.repoCardTop}>
                   <h3 className={styles.repoCardTitle}>
                     <a href="#">{repo.name}</a>
                     <span className={styles.privacyBadge}>{repo.private ? "Private" : "Public"}</span>
                   </h3>
                   <div className={styles.starBtn}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                     Star
                   </div>
                 </div>
                 <p className={styles.repoCardDesc}>{repo.desc}</p>
                 <div className={styles.repoCardMeta}>
                   <span className={styles.metaItem}>
                     <span className={styles.langDot} style={{background: repo.langColor}}></span> {repo.lang}
                   </span>
                   <span className={styles.metaItem}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> {repo.stars}
                   </span>
                   <span className={styles.metaItem}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"/><path d="M12 12v3"/></svg> {repo.forks}
                   </span>
                   <span className={styles.metaItem}>Updated {repo.updated}</span>
                 </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
