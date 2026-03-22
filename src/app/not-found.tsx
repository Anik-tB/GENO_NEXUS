import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="pageShell" style={{ padding: "6rem 0" }}>
      <section
        className="cardSurface"
        style={{
          margin: "0 auto",
          maxWidth: "760px",
          padding: "2rem",
          textAlign: "center"
        }}
      >
        <p className="eyebrow" style={{ margin: "0 auto 1rem" }}>
          Route not found
        </p>
        <h1 style={{ margin: "0 0 0.75rem", color: "var(--gn-text-primary)", fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>
          This GenoNexus page does not exist.
        </h1>
        <p
          style={{
            margin: "0 auto 1.5rem",
            maxWidth: "42rem",
            color: "var(--gn-text-secondary)",
            lineHeight: 1.8
          }}
        >
          Return to the landing page or sign in to continue with the current workspace flow.
        </p>
        <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link className="buttonPrimary" href="/">
            Go to landing page
          </Link>
          <Link className="buttonSecondary" href="/login">
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
