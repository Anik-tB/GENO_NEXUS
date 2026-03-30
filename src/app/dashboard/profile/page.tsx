"use client";

import styles from "./page.module.css";

export default function ProfilePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>User Profile</h1>
        <p className={styles.subtitle}>Manage your personal information, credentials, and account activity.</p>
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.icon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <h2 className={styles.cardTitle}>Personal Information</h2>
          </div>
          
          <div className={styles.avatarSection}>
            <div className={styles.avatarLarge}>MA</div>
            <div className={styles.avatarActions}>
              <button className={styles.primaryBtn} style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}>Upload Photo</button>
              <button className={styles.dangerBtn} style={{ marginTop: 0, padding: '0.6rem 1rem', fontSize: '0.85rem' }}>Remove</button>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>First Name</label>
              <input type="text" className={styles.input} defaultValue="Muhammad" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Last Name</label>
              <input type="text" className={styles.input} defaultValue="Ali" />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Clinical Role</label>
            <input type="text" className={styles.input} defaultValue="Lead Geneticist" />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input type="email" className={styles.input} defaultValue="user@genonexus.com" />
          </div>

          <button className={styles.primaryBtn}>Save Changes</button>
        </section>

        <div className={styles.sideGrid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.icon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <h2 className={styles.cardTitle}>Change Password</h2>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Current Password</label>
              <input type="password" className={styles.input} placeholder="Enter current password" />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>New Password</label>
              <input type="password" className={styles.input} placeholder="Create new password" />
            </div>

            <button className={styles.primaryBtn} style={{ marginTop: '0.5rem', width: 'fit-content' }}>
              Update Password
            </button>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.icon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
              <h2 className={styles.cardTitle}>Recent Activity</h2>
            </div>
            
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <span className={styles.activityDot}></span>
                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>Successful Login (IP: 192.168.1.1)</p>
                  <span className={styles.activityTime}>Just now</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <span className={styles.activityDot}></span>
                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>Updated Profile Details</p>
                  <span className={styles.activityTime}>2 hours ago</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
